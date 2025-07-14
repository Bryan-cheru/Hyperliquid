// Test to debug the agent wallet address verification issue
import { ethers } from 'ethers';

console.log('🧪 Debugging Agent Wallet Address Verification');
console.log('===============================================');

// Test data from your issue description
const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

console.log('📋 Input Data:');
console.log('   Agent Wallet (expected):', AGENT_WALLET_ADDRESS);
console.log('   Private Key:', PRIVATE_KEY);
console.log('');

// Create wallet from private key
const wallet = new ethers.Wallet(PRIVATE_KEY);

console.log('🔍 Wallet Verification:');
console.log('   Derived from private key:', wallet.address);
console.log('   Expected agent address:', AGENT_WALLET_ADDRESS);
console.log('   Addresses match:', wallet.address.toLowerCase() === AGENT_WALLET_ADDRESS.toLowerCase() ? '✅' : '❌');
console.log('');

// If they don't match, this is the source of the issue
if (wallet.address.toLowerCase() !== AGENT_WALLET_ADDRESS.toLowerCase()) {
  console.log('❌ CRITICAL ISSUE FOUND:');
  console.log('   The private key does not correspond to the expected agent wallet address!');
  console.log('');
  console.log('🔧 SOLUTION:');
  console.log('   Option 1: Use the correct private key for', AGENT_WALLET_ADDRESS);
  console.log('   Option 2: Use the correct address for this private key:', wallet.address);
  console.log('');
  console.log('💡 When you say "API wallet address is being changed/modified",');
  console.log('   the issue is that the private key you provided generates a different address');
  console.log('   than the one you expect to use as your agent wallet.');
  console.log('');
} else {
  console.log('✅ Private key and agent wallet address match correctly');
  
  // Test the actual signing to see what address HyperLiquid recovers
  console.log('🔐 Testing EIP-712 signature recovery...');
  
  const testConnectionId = '0x1234567890123456789012345678901234567890123456789012345678901234';
  
  const phantomAgent = {
    source: 'a',
    connectionId: testConnectionId
  };
  
  const domain = {
    chainId: 1337,
    name: 'Exchange',
    verifyingContract: '0x0000000000000000000000000000000000000000',
    version: '1'
  };

  const types = {
    Agent: [
      { name: 'source', type: 'string' },
      { name: 'connectionId', type: 'bytes32' }
    ]
  };
  
  try {
    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const recoveredAddress = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    
    console.log('   Signer address:', wallet.address);
    console.log('   Recovered address:', recoveredAddress);
    console.log('   Recovery match:', wallet.address.toLowerCase() === recoveredAddress.toLowerCase() ? '✅' : '❌');
    
    if (wallet.address.toLowerCase() !== recoveredAddress.toLowerCase()) {
      console.log('❌ EIP-712 signature recovery issue detected!');
    }
  } catch (error) {
    console.error('❌ Error during signature test:', error.message);
  }
}
