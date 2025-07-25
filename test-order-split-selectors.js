// Test Order Split Selector Validation
// This script helps verify the correct selectors for order split functionality

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 ORDER SPLIT SELECTOR VALIDATION');
console.log('===================================');

// Read the Market.tsx file to analyze the order split structure
const marketFilePath = path.join(__dirname, 'src', 'components', 'TradingControls', 'Market&Limit', 'Market.tsx');

try {
  const marketContent = fs.readFileSync(marketFilePath, 'utf8');
  
  console.log('📋 Order Split UI Structure Analysis:');
  console.log('');
  
  // Check for order split toggle
  if (marketContent.includes('data-testid="order-split-toggle"')) {
    console.log('✅ Order Split Toggle: data-testid="order-split-toggle" found');
  } else {
    console.log('❌ Order Split Toggle: data-testid not found');
  }
  
  // Check for min/max price inputs
  if (marketContent.includes('Min Price') && marketContent.includes('Max Price')) {
    console.log('✅ Min/Max Price Inputs: Labels found');
    console.log('   - Min Price input: placeholder="Enter Price" (3rd occurrence)');
    console.log('   - Max Price input: placeholder="Enter Price" (4th occurrence)');
  } else {
    console.log('❌ Min/Max Price Inputs: Labels not found');
  }
  
  // Check for split count slider
  if (marketContent.includes('Split Count:') && marketContent.includes('setSplitCount')) {
    console.log('✅ Split Count Slider: Found with setSplitCount handler');
    console.log('   - Selector: [role="slider"] (last occurrence)');
    console.log('   - Range: 2-10 orders');
  } else {
    console.log('❌ Split Count Slider: Not found or incorrectly implemented');
  }
  
  // Check conditional rendering
  if (marketContent.includes('{clickedSplit && (')) {
    console.log('✅ Conditional Rendering: Split controls only show when enabled');
  } else {
    console.log('❌ Conditional Rendering: Split controls may always be visible');
  }
  
  console.log('');
  console.log('🎯 Recommended Test Flow:');
  console.log('1. Click order split toggle: [data-testid="order-split-toggle"]');
  console.log('2. Wait for controls: page.waitForTimeout(500)');
  console.log('3. Set min price: input[placeholder="Enter Price"].nth(2)');
  console.log('4. Set max price: input[placeholder="Enter Price"].nth(3)');
  console.log('5. Adjust slider: [role="slider"].last() + ArrowRight keys');
  console.log('6. Verify: "Split Count: 3" text appears');
  
} catch (error) {
  console.log('❌ Error reading Market.tsx file:', error.message);
}

console.log('');
console.log('🔧 Order Split Integration Points:');
console.log('- Toggle State: clickedSplit (boolean)');
console.log('- Split Count: splitCount (2-10)');
console.log('- Price Range: minPrice, maxPrice (numbers)');
console.log('- Scale Type: value4 (0=Lower, 1=Mid, 2=Upper)');
console.log('');
console.log('✅ Selector validation complete!');
