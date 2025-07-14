import { ethers } from 'ethers';

// Test signature recovery to see what address HyperLiquid might be getting
const testSignatureRecovery = async () => {
    console.log('🔍 Testing signature recovery mismatch...\n');
    
    // Data from the actual order attempt
    const actualSignature = {
        r: "0xb18aa2d4dd34cc7f7dbd1d496f66a7a77a9085df30b58848cd2db12a32f61b0f",
        s: "0x2273fe1ab01e8bcf9fcf908f53afd865dbf995c96e778ca3ad31e141881011db",
        v: 27
    };
    
    const expectedWallet = "0x99B7988987Bb31208804aD2334Faa155249010bf";
    const hyperliquidExpected = "0x3d3711fe14e63381387ac6ebf3292364d4a7381b";
    const actionHash = "0xd78c97d56346ee6de562639a674b30757c9837a972534479eb5934b9018ac7e3";
    
    console.log('📋 Signature components:');
    console.log('  r:', actualSignature.r);
    console.log('  s:', actualSignature.s);
    console.log('  v:', actualSignature.v);
    console.log('  Action hash:', actionHash);
    console.log('');
    
    // Test 1: Direct message recovery (what we're doing)
    try {
        const directRecovered = ethers.utils.recoverAddress(actionHash, {
            r: actualSignature.r,
            s: actualSignature.s,
            v: actualSignature.v
        });
        console.log('✅ Direct message recovery:', directRecovered);
        console.log('   Matches our wallet:', directRecovered.toLowerCase() === expectedWallet.toLowerCase());
    } catch (error) {
        console.log('❌ Direct message recovery failed:', error.message);
    }
    
    // Test 2: EIP-191 prefixed message recovery
    try {
        const prefixedMessage = ethers.utils.hashMessage(ethers.utils.arrayify(actionHash));
        const eip191Recovered = ethers.utils.recoverAddress(prefixedMessage, {
            r: actualSignature.r,
            s: actualSignature.s,
            v: actualSignature.v
        });
        console.log('🔍 EIP-191 prefixed recovery:', eip191Recovered);
        console.log('   Matches HyperLiquid expected:', eip191Recovered.toLowerCase() === hyperliquidExpected.toLowerCase());
    } catch (error) {
        console.log('❌ EIP-191 recovery failed:', error.message);
    }
    
    // Test 3: Different hash interpretations
    console.log('\n🧪 Testing different hash formats...');
    
    // Try with 0x prefix removed
    const hashWithoutPrefix = actionHash.slice(2);
    try {
        const recovered3 = ethers.utils.recoverAddress('0x' + hashWithoutPrefix, {
            r: actualSignature.r,
            s: actualSignature.s,
            v: actualSignature.v
        });
        console.log('🔍 Hash without prefix recovery:', recovered3);
    } catch (error) {
        console.log('❌ Hash without prefix failed:', error.message);
    }
    
    // Test 4: What if we sign the action hash with EIP-191?
    console.log('\n🔧 Testing what signature would produce HyperLiquid\'s expected address...');
    
    // Generate a wallet with the private key we're using
    const privateKey = process.env.PRIVATE_KEY || '0x' + '1'.repeat(64); // placeholder
    const wallet = new ethers.Wallet(privateKey);
    
    console.log('🔑 Our wallet address:', wallet.address);
    
    // Try signing with EIP-191 prefix
    try {
        const eip191Signature = await wallet.signMessage(ethers.utils.arrayify(actionHash));
        const sig = ethers.utils.splitSignature(eip191Signature);
        
        console.log('📝 EIP-191 signature:');
        console.log('  r:', sig.r);
        console.log('  s:', sig.s);
        console.log('  v:', sig.v);
        
        // Verify recovery
        const prefixedHash = ethers.utils.hashMessage(ethers.utils.arrayify(actionHash));
        const recoveredFromEip191 = ethers.utils.recoverAddress(prefixedHash, sig);
        console.log('✅ EIP-191 signature recovers to:', recoveredFromEip191);
        console.log('   Matches our wallet:', recoveredFromEip191.toLowerCase() === wallet.address.toLowerCase());
        
    } catch (error) {
        console.log('❌ EIP-191 signing failed:', error.message);
    }
};

testSignatureRecovery().catch(console.error);
