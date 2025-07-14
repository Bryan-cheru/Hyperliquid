// HyperLiquid signature utilities

// Msgpack encoding functions for action hashing (browser-compatible)
function encodeFloat(value: number): Uint8Array {
  const buffer = new ArrayBuffer(9);
  const view = new DataView(buffer);
  view.setUint8(0, 0xcb);
  view.setFloat64(1, value, false); // big-endian
  return new Uint8Array(buffer);
}

function encodeInt(value: number): Uint8Array {
  if (value >= 0 && value <= 127) {
    return new Uint8Array([value]);
  } else if (value >= -32 && value < 0) {
    return new Uint8Array([0xe0 + (32 + value)]);
  } else if (value >= 0 && value <= 255) {
    return new Uint8Array([0xcc, value]);
  } else if (value >= 0 && value <= 65535) {
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint8(0, 0xcd);
    view.setUint16(1, value, false); // big-endian
    return new Uint8Array(buffer);
  } else if (value >= 0 && value <= 4294967295) {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, 0xce);
    view.setUint32(1, value, false); // big-endian
    return new Uint8Array(buffer);
  } else {
    const buffer = new ArrayBuffer(9);
    const view = new DataView(buffer);
    view.setUint8(0, 0xcf);
    view.setBigUint64(1, BigInt(value), false); // big-endian
    return new Uint8Array(buffer);
  }
}

function encodeString(value: string): Uint8Array {
  const utf8Encoder = new TextEncoder();
  const utf8Bytes = utf8Encoder.encode(value);
  const length = utf8Bytes.length;
  
  if (length <= 31) {
    const result = new Uint8Array(1 + length);
    result[0] = 0xa0 + length;
    result.set(utf8Bytes, 1);
    return result;
  } else if (length <= 255) {
    const result = new Uint8Array(2 + length);
    result[0] = 0xd9;
    result[1] = length;
    result.set(utf8Bytes, 2);
    return result;
  } else if (length <= 65535) {
    const result = new Uint8Array(3 + length);
    const view = new DataView(result.buffer);
    view.setUint8(0, 0xda);
    view.setUint16(1, length, false); // big-endian
    result.set(utf8Bytes, 3);
    return result;
  } else {
    const result = new Uint8Array(5 + length);
    const view = new DataView(result.buffer);
    view.setUint8(0, 0xdb);
    view.setUint32(1, length, false); // big-endian
    result.set(utf8Bytes, 5);
    return result;
  }
}

function encodeBool(value: boolean): Uint8Array {
  return new Uint8Array([value ? 0xc3 : 0xc2]);
}

function encodeArray(array: unknown[]): Uint8Array {
  const length = array.length;
  let header: Uint8Array;
  
  if (length <= 15) {
    header = new Uint8Array([0x90 + length]);
  } else if (length <= 65535) {
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint8(0, 0xdc);
    view.setUint16(1, length, false); // big-endian
    header = new Uint8Array(buffer);
  } else {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, 0xdd);
    view.setUint32(1, length, false); // big-endian
    header = new Uint8Array(buffer);
  }
  
  const encodedItems = array.map(item => encodeValue(item));
  return concatenateUint8Arrays([header, ...encodedItems]);
}

function encodeMap(obj: Record<string, unknown>): Uint8Array {
  const keys = Object.keys(obj).sort();
  const length = keys.length;
  let header: Uint8Array;
  
  if (length <= 15) {
    header = new Uint8Array([0x80 + length]);
  } else if (length <= 65535) {
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint8(0, 0xde);
    view.setUint16(1, length, false); // big-endian
    header = new Uint8Array(buffer);
  } else {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, 0xdf);
    view.setUint32(1, length, false); // big-endian
    header = new Uint8Array(buffer);
  }
  
  const encodedPairs: Uint8Array[] = [];
  for (const key of keys) {
    encodedPairs.push(encodeString(key));
    encodedPairs.push(encodeValue(obj[key]));
  }
  
  return concatenateUint8Arrays([header, ...encodedPairs]);
}

// Helper function to concatenate Uint8Arrays
function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function encodeValue(value: unknown): Uint8Array {
  if (value === null) {
    return new Uint8Array([0xc0]);
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
  } else if (typeof value === 'object' && value !== null) {
    return encodeMap(value as Record<string, unknown>);
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }
}

async function msgpackHash(action: unknown, vaultAddress?: string, nonce?: number): Promise<string> {
  const { ethers } = await import('ethers');
  
  // Use msgpack-lite for exact Python compatibility
  interface MsgPackLite {
    encode(obj: unknown): Uint8Array;
  }
  
  let msgpack: MsgPackLite;
  try {
    // Import msgpack-lite (exact Python msgpack compatibility)
    msgpack = await import('msgpack-lite');
  } catch {
    throw new Error('msgpack-lite is required for HyperLiquid signing. Please run: npm install msgpack-lite');
  }
  
  // Encode action using msgpack (exactly like Python msgpack.packb)
  const actionBytes = msgpack.encode(action);
  
  // Add nonce (8 bytes, big-endian) - matches Python SDK - browser compatible
  const nonceArray = new Uint8Array(8);
  const nonceView = new DataView(nonceArray.buffer);
  nonceView.setBigUint64(0, BigInt(nonce || Date.now()), false); // false = big-endian
  
  // Add vault address handling - matches Python SDK action_hash function - browser compatible
  let vaultBytes: Uint8Array;
  if (!vaultAddress) {
    // None case: add single 0x00 byte
    vaultBytes = new Uint8Array([0x00]);
  } else {
    // Some case: add 0x01 + address bytes
    const addressBytes = ethers.getBytes(vaultAddress);
    vaultBytes = new Uint8Array(1 + addressBytes.length);
    vaultBytes[0] = 0x01;
    vaultBytes.set(addressBytes, 1);
  }
  
  // expires_after is None in our case, so no additional bytes needed
  
  // Combine all data exactly like Python SDK - browser compatible
  const totalLength = actionBytes.length + nonceArray.length + vaultBytes.length;
  const combinedData = new Uint8Array(totalLength);
  
  let offset = 0;
  combinedData.set(actionBytes, offset);
  offset += actionBytes.length;
  combinedData.set(nonceArray, offset);
  offset += nonceArray.length;
  combinedData.set(vaultBytes, offset);
  
  // Calculate keccak256 hash
  return ethers.keccak256(combinedData);
}

/**
 * Signs an order action for HyperLiquid using agent wallet
 */
export async function signOrderAction(action: unknown, nonce: number, privateKey: string, vaultAddress?: string): Promise<{ r: string; s: string; v: number }> {
  try {
    // Import ethers for signing
    const { ethers } = await import('ethers');
    
    // Ensure private key format
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(cleanPrivateKey);
    
    console.log('� Agent wallet signing with:', wallet.address);
    console.log('🏛️ Vault address:', vaultAddress || 'none');
    
    // Create msgpack-based action hash exactly like HyperLiquid Python SDK
    const actionHash = await msgpackHash(action, vaultAddress, nonce);
    console.log('🔍 Msgpack action hash:', actionHash);
    
    // Create phantom agent exactly like HyperLiquid Python SDK
    const phantomAgent = {
      source: 'a', // 'a' for mainnet, 'b' for testnet 
      connectionId: actionHash // Direct action hash, not a secondary hash
    };
    
    console.log('🔍 Phantom agent:', phantomAgent);
    
    // EIP-712 domain for HyperLiquid
    const domain = {
      chainId: 1337,
      name: 'Exchange',
      verifyingContract: '0x0000000000000000000000000000000000000000',
      version: '1'
    };

    // EIP-712 types for HyperLiquid Agent
    const types = {
      Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' }
      ]
    };
    
    console.log('🔍 Signing with EIP-712...');
    
    // Sign using EIP-712 typed data (HyperLiquid's expected format)
    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    console.log('✅ Order signed successfully');
    console.log('🔍 Signature components:', {
      r: splitSig.r,
      s: splitSig.s,
      v: splitSig.v
    });
    
    // Verify the signature recovery using EIP-712
    const recovered = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('🔍 Signature verification:', {
      signerWallet: wallet.address,
      recoveredWallet: recovered,
      signaturesMatch: wallet.address.toLowerCase() === recovered.toLowerCase()
    });
    
    if (wallet.address.toLowerCase() !== recovered.toLowerCase()) {
      console.error('❌ Signature verification failed - addresses do not match!');
    }
    
    return {
      r: splitSig.r,
      s: splitSig.s,
      v: splitSig.v
    };
  } catch (error) {
    console.error('❌ Error signing order action:', error);
    throw new Error('Failed to sign order action: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Creates action hash using msgpack encoding like HyperLiquid Python SDK
 */
/**
 * Verifies that a private key corresponds to the expected wallet address
 */
export async function verifyPrivateKeyToAddress(privateKey: string, expectedAddress: string): Promise<{ isValid: boolean; actualAddress: string; error?: string }> {
  try {
    const { ethers } = await import('ethers');
    
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const wallet = new ethers.Wallet(cleanPrivateKey);
    
    const actualAddress = wallet.address;
    const expectedClean = expectedAddress.toLowerCase();
    const actualClean = actualAddress.toLowerCase();
    
    return {
      isValid: expectedClean === actualClean,
      actualAddress: actualAddress,
      error: expectedClean !== actualClean ? `Expected ${expectedAddress} but private key derives ${actualAddress}` : undefined
    };
  } catch (error) {
    return {
      isValid: false,
      actualAddress: '',
      error: `Failed to verify private key: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Approves the current wallet as an API wallet on HyperLiquid
 * This needs to be done before the wallet can be used for trading
 */
export async function approveApiWallet(privateKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const { ethers } = await import('ethers');
    
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const masterWallet = new ethers.Wallet(cleanPrivateKey);
    
    console.log('🔗 Approving API wallet for master account:', masterWallet.address);
    
    // For simplicity, we'll approve the master wallet as its own API wallet
    // In production, you might want to use a separate API wallet
    const approveAction = {
      type: "approveAgent",
      agent: masterWallet.address // Master account approves itself as an agent
    };
    
    console.log('📋 Approving agent action:', approveAction);
    
    const nonce = Date.now();
    
    // Sign the approve action with the master wallet
    const signature = await signOrderAction(approveAction, nonce, privateKey);
    
    const payload = {
      action: approveAction,
      nonce,
      signature
    };
    
    console.log('📋 Sending API wallet approval to HyperLiquid...');
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('📥 Raw API wallet approval response:', response.status, responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { error: responseText };
    }
    
    console.log('📥 API wallet approval response:', result);
    
    if (response.ok && result.status === "ok") {
      return {
        success: true,
        message: "API wallet approved successfully"
      };
    } else {
      return {
        success: false,
        message: `Failed to approve API wallet: ${result.response || result.error || responseText}`
      };
    }
    
  } catch (error) {
    console.error('❌ Error approving API wallet:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Create a valid-looking signature for testing (fallback)
export function createValidSignature(): { r: string; s: string; v: number } {
  console.warn('⚠️ Using fallback signature - this should not be used in production');
  const timestamp = Date.now();
  const r = "0x" + timestamp.toString(16).padStart(64, '0');
  const s = "0x" + (timestamp + 1000).toString(16).padStart(64, '0');
  
  return {
    r,
    s,
    v: 27
  };
}
