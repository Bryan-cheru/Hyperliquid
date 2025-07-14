// HyperLiquid signature utilities

// Msgpack encoding functions for action hashing
function encodeFloat(value: number): Buffer {
  const buffer = Buffer.allocUnsafe(9);
  buffer.writeUInt8(0xcb, 0);
  buffer.writeDoubleBE(value, 1);
  return buffer;
}

function encodeInt(value: number): Buffer {
  if (value >= 0 && value <= 127) {
    return Buffer.from([value]);
  } else if (value >= -32 && value < 0) {
    return Buffer.from([0xe0 + (32 + value)]);
  } else if (value >= 0 && value <= 255) {
    return Buffer.from([0xcc, value]);
  } else if (value >= 0 && value <= 65535) {
    const buffer = Buffer.allocUnsafe(3);
    buffer.writeUInt8(0xcd, 0);
    buffer.writeUInt16BE(value, 1);
    return buffer;
  } else if (value >= 0 && value <= 4294967295) {
    const buffer = Buffer.allocUnsafe(5);
    buffer.writeUInt8(0xce, 0);
    buffer.writeUInt32BE(value, 1);
    return buffer;
  } else {
    const buffer = Buffer.allocUnsafe(9);
    buffer.writeUInt8(0xcf, 0);
    buffer.writeBigUInt64BE(BigInt(value), 1);
    return buffer;
  }
}

function encodeString(value: string): Buffer {
  const utf8Buffer = Buffer.from(value, 'utf8');
  const length = utf8Buffer.length;
  
  if (length <= 31) {
    return Buffer.concat([Buffer.from([0xa0 + length]), utf8Buffer]);
  } else if (length <= 255) {
    return Buffer.concat([Buffer.from([0xd9, length]), utf8Buffer]);
  } else if (length <= 65535) {
    const header = Buffer.allocUnsafe(3);
    header.writeUInt8(0xda, 0);
    header.writeUInt16BE(length, 1);
    return Buffer.concat([header, utf8Buffer]);
  } else {
    const header = Buffer.allocUnsafe(5);
    header.writeUInt8(0xdb, 0);
    header.writeUInt32BE(length, 1);
    return Buffer.concat([header, utf8Buffer]);
  }
}

function encodeBool(value: boolean): Buffer {
  return Buffer.from([value ? 0xc3 : 0xc2]);
}

function encodeArray(array: unknown[]): Buffer {
  const length = array.length;
  let header: Buffer;
  
  if (length <= 15) {
    header = Buffer.from([0x90 + length]);
  } else if (length <= 65535) {
    header = Buffer.allocUnsafe(3);
    header.writeUInt8(0xdc, 0);
    header.writeUInt16BE(length, 1);
  } else {
    header = Buffer.allocUnsafe(5);
    header.writeUInt8(0xdd, 0);
    header.writeUInt32BE(length, 1);
  }
  
  const encodedItems = array.map(item => encodeValue(item));
  return Buffer.concat([header, ...encodedItems]);
}

function encodeMap(obj: Record<string, unknown>): Buffer {
  const keys = Object.keys(obj).sort();
  const length = keys.length;
  let header: Buffer;
  
  if (length <= 15) {
    header = Buffer.from([0x80 + length]);
  } else if (length <= 65535) {
    header = Buffer.allocUnsafe(3);
    header.writeUInt8(0xde, 0);
    header.writeUInt16BE(length, 1);
  } else {
    header = Buffer.allocUnsafe(5);
    header.writeUInt8(0xdf, 0);
    header.writeUInt32BE(length, 1);
  }
  
  const encodedPairs: Buffer[] = [];
  for (const key of keys) {
    encodedPairs.push(encodeString(key));
    encodedPairs.push(encodeValue(obj[key]));
  }
  
  return Buffer.concat([header, ...encodedPairs]);
}

function encodeValue(value: unknown): Buffer {
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
  } else if (typeof value === 'object' && value !== null) {
    return encodeMap(value as Record<string, unknown>);
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }
}

async function msgpackHash(obj: unknown): Promise<string> {
  // Use dynamic import for browser compatibility
  const { ethers } = await import('ethers');
  const encoded = encodeValue(obj);
  return ethers.keccak256(encoded);
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
    
    // Create msgpack-based action hash
    const actionHash = await msgpackHash(action);
    console.log('🔍 Msgpack action hash:', actionHash);
    
    // Create signature data by combining action hash and nonce
    const signatureData = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint64'],
      [actionHash, nonce]
    );
    
    console.log('🔍 Final signature data:', signatureData);
    
    // Sign the data directly (not EIP-712 for agent wallets)
    const signature = await wallet.signMessage(ethers.getBytes(signatureData));
    const splitSig = ethers.Signature.from(signature);
    
    console.log('✅ Order signed successfully');
    console.log('🔍 Signature components:', {
      r: splitSig.r,
      s: splitSig.s,
      v: splitSig.v
    });
    
    // Verify the signature recovery
    const recovered = ethers.verifyMessage(ethers.getBytes(signatureData), signature);
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
