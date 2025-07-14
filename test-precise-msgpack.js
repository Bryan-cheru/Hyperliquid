// Test with PRECISE msgpack encoding matching HyperLiquid Python SDK exactly
import { ethers } from 'ethers';

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

// Implementing msgpack encoding to exactly match HyperLiquid's Python SDK
// Based on: https://github.com/hyperliquid-dex/hyperliquid-python-sdk/blob/main/hyperliquid/utils/signing.py

function encodeFloat(value) {
  // HyperLiquid uses specific float encoding
  const buffer = Buffer.allocUnsafe(9);
  buffer.writeUInt8(0xcb, 0);  // msgpack float64 type
  buffer.writeDoubleBE(parseFloat(value), 1);
  return buffer;
}

function encodeInt(value) {
  if (value >= 0 && value <= 127) {
    return Buffer.from([value]);  // positive fixint
  } else if (value >= -32 && value < 0) {
    return Buffer.from([0xe0 + (32 + value)]);  // negative fixint
  } else if (value >= 0 && value <= 255) {
    return Buffer.from([0xcc, value]);  // uint8
  } else if (value >= 0 && value <= 65535) {
    const buffer = Buffer.allocUnsafe(3);
    buffer.writeUInt8(0xcd, 0);  // uint16
    buffer.writeUInt16BE(value, 1);
    return buffer;
  } else if (value >= 0 && value <= 4294967295) {
    const buffer = Buffer.allocUnsafe(5);
    buffer.writeUInt8(0xce, 0);  // uint32
    buffer.writeUInt32BE(value, 1);
    return buffer;
  } else {
    const buffer = Buffer.allocUnsafe(9);
    buffer.writeUInt8(0xcf, 0);  // uint64
    buffer.writeBigUInt64BE(BigInt(value), 1);
    return buffer;
  }
}

function encodeString(value) {
  const utf8Buffer = Buffer.from(value, 'utf8');
  const length = utf8Buffer.length;
  
  if (length <= 31) {
    // fixstr
    return Buffer.concat([Buffer.from([0xa0 + length]), utf8Buffer]);
  } else if (length <= 255) {
    // str8
    return Buffer.concat([Buffer.from([0xd9, length]), utf8Buffer]);
  } else if (length <= 65535) {
    // str16
    const header = Buffer.allocUnsafe(3);
    header.writeUInt8(0xda, 0);
    header.writeUInt16BE(length, 1);
    return Buffer.concat([header, utf8Buffer]);
  } else {
    // str32
    const header = Buffer.allocUnsafe(5);
    header.writeUInt8(0xdb, 0);
    header.writeUInt32BE(length, 1);
    return Buffer.concat([header, utf8Buffer]);
  }
}

function encodeBool(value) {
  return Buffer.from([value ? 0xc3 : 0xc2]);
}

function encodeArray(array) {
  const length = array.length;
  let header;
  
  if (length <= 15) {
    header = Buffer.from([0x90 + length]);  // fixarray
  } else if (length <= 65535) {
    header = Buffer.allocUnsafe(3);
    header.writeUInt8(0xdc, 0);  // array16
    header.writeUInt16BE(length, 1);
  } else {
    header = Buffer.allocUnsafe(5);
    header.writeUInt8(0xdd, 0);  // array32
    header.writeUInt32BE(length, 1);
  }
  
  const encodedItems = array.map(item => encodeValue(item));
  return Buffer.concat([header, ...encodedItems]);
}

function encodeMap(obj) {
  const keys = Object.keys(obj).sort();  // HyperLiquid sorts keys!
  const length = keys.length;
  let header;
  
  if (length <= 15) {
    header = Buffer.from([0x80 + length]);  // fixmap
  } else if (length <= 65535) {
    header = Buffer.allocUnsafe(3);
    header.writeUInt8(0xde, 0);  // map16
    header.writeUInt16BE(length, 1);
  } else {
    header = Buffer.allocUnsafe(5);
    header.writeUInt8(0xdf, 0);  // map32
    header.writeUInt32BE(length, 1);
  }
  
  const encodedPairs = [];
  for (const key of keys) {
    encodedPairs.push(encodeString(key));
    encodedPairs.push(encodeValue(obj[key]));
  }
  
  return Buffer.concat([header, ...encodedPairs]);
}

function encodeValue(value) {
  if (value === null) {
    return Buffer.from([0xc0]);
  } else if (typeof value === 'boolean') {
    return encodeBool(value);
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return encodeInt(value);
    } else {
      return encodeFloat(value);
    }
  } else if (typeof value === 'string') {
    return encodeString(value);
  } else if (Array.isArray(value)) {
    return encodeArray(value);
  } else if (typeof value === 'object') {
    return encodeMap(value);
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }
}

function msgpackHash(obj) {
  const encoded = encodeValue(obj);
  console.log('📦 Msgpack encoded bytes:', encoded.toString('hex'));
  const hash = ethers.keccak256(encoded);
  console.log('🔐 Msgpack hash result:', hash);
  return hash;
}

async function testPreciseMsgpack() {
  try {
    console.log('🎯 Testing with PRECISE msgpack encoding');
    console.log('=========================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    
    // Create the exact action structure
    const action = {
      type: "order",
      orders: [
        {
          a: 0,          // asset (ETH-USD)
          b: true,       // is_buy
          p: "0",        // price (market order)
          s: "0.001",    // size
          r: false,      // reduce_only
          t: {           // order_type
            limit: {
              tif: "Ioc"
            }
          }
        }
      ],
      grouping: "na"
    };
    
    console.log('📋 Action structure:');
    console.log(JSON.stringify(action, null, 2));
    
    // Create precise msgpack hash
    const actionHash = msgpackHash(action);
    console.log('🔍 Precise msgpack action hash:', actionHash);
    
    // Compare with our old hash
    const oldHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(action)));
    console.log('📊 Old JSON hash:', oldHash);
    console.log('🆚 Hashes match:', actionHash === oldHash ? '✅' : '❌');
    
    // Sign with precise hash
    const nonce = Date.now();
    const signatureData = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint64'],
      [actionHash, nonce]
    );
    
    console.log('🔐 Signing data:', signatureData);
    
    const signature = await wallet.signMessage(ethers.getBytes(signatureData));
    const { r, s, v } = ethers.Signature.from(signature);
    
    console.log('✍️ Signature created');
    
    // Verify signature recovery
    const recovered = ethers.verifyMessage(ethers.getBytes(signatureData), signature);
    console.log('🔍 Signature Verification:');
    console.log('   Signer:', wallet.address);
    console.log('   Recovered:', recovered);
    console.log('   Match:', wallet.address.toLowerCase() === recovered.toLowerCase() ? '✅' : '❌');
    
    // Prepare payload
    const payload = {
      action,
      nonce,
      signature: {
        r,
        s,
        v
      }
    };
    
    console.log('📋 Order Payload with Precise Msgpack:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Submit to HyperLiquid
    console.log('🚀 Sending order with PRECISE msgpack hash...');
    
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('📥 Response:', response.status, responseText);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
      console.log('📊 Parsed Response:', parsedResponse);
      
      if (parsedResponse.status === 'err') {
        console.log('❌ Still failed:', parsedResponse.response);
        
        // Extract expected address if present
        const addressMatch = parsedResponse.response.match(/0x[a-fA-F0-9]{40}/);
        if (addressMatch) {
          console.log('🔍 HyperLiquid expects address:', addressMatch[0]);
          console.log('🤔 But our agent wallet is:', wallet.address);
          console.log('🆚 Addresses match:', addressMatch[0].toLowerCase() === wallet.address.toLowerCase() ? '✅' : '❌');
        }
      } else {
        console.log('✅ Success! Order submitted');
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse response as JSON');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

// Run the test
testPreciseMsgpack();
