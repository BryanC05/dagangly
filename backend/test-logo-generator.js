require('dotenv').config();
const { generateLogo } = require('./utils/logoGenerator');
const path = require('path');

async function testLogoGenerator() {
  console.log('🧪 Testing Logo Generator with Bahasa Indonesia Support...\n');
  
  // Show which API will be used
  if (process.env.OPENAI_API_KEY) {
    console.log('🔑 Using OpenAI API');
  } else if (process.env.POLLINATIONS_API_KEY) {
    console.log('🔑 Using Pollinations API');
  } else {
    console.log('ℹ️  No API keys found - will use SVG generator');
  }
  
  // Test prompts in both English and Indonesian
  const testPrompts = [
    'Modern coffee shop logo with blue gradient',
    'Logo kedai kopi modern dengan gradasi biru',
    'Logo restoran nasi goreng minimalis',
    'Tech company logo with green color'
  ];
  
  for (const testPrompt of testPrompts) {
    console.log(`\n📝 Prompt: "${testPrompt}"`);
    const outputPath = path.join(__dirname, 'uploads', 'logos', `test-${Date.now()}.png`);
    
    try {
      const result = await Promise.race([
        generateLogo(testPrompt, outputPath),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 60s')), 60000))
      ]);
      console.log('✅ Generated:', result);
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  }
  
  console.log('\n✨ Test complete!');
  process.exit(0);
}

testLogoGenerator();
