const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

// Check environment variables
console.log('\n=== Logo Generator Diagnostics ===\n');

console.log('1. Environment Variables:');
console.log('   - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Not set');
console.log('   - HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? '✓ Set' : '✗ Not set');
console.log('   - LOGO_GENERATION_LIMIT:', process.env.LOGO_GENERATION_LIMIT || '5 (default)');

if (!process.env.OPENAI_API_KEY && !process.env.HUGGINGFACE_API_KEY) {
  console.log('\n⚠️  WARNING: No AI API keys configured!');
  console.log('   The logo generator will only create placeholder images.');
  console.log('   Add OPENAI_API_KEY or HUGGINGFACE_API_KEY to your .env file');
}

// Check uploads directory
console.log('\n2. Directory Check:');
const logosDir = path.join(__dirname, 'uploads', 'logos');
if (fs.existsSync(logosDir)) {
  console.log('   - Logos directory: ✓ Exists');
  try {
    fs.accessSync(logosDir, fs.constants.W_OK);
    console.log('   - Write permission: ✓ OK');
  } catch (err) {
    console.log('   - Write permission: ✗ FAILED');
    console.log('     Error:', err.message);
  }
} else {
  console.log('   - Logos directory: ✗ Missing');
  console.log('   Creating directory...');
  try {
    fs.mkdirSync(logosDir, { recursive: true });
    console.log('   - Created: ✓');
  } catch (err) {
    console.log('   - Creation failed: ✗', err.message);
  }
}

// Connect to database and check users
async function checkUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/msmehub';
    await mongoose.connect(mongoUri);
    console.log('\n3. Database Connection: ✓ Connected');
    
    // Count users with logo fields
    const totalUsers = await User.countDocuments();
    const usersWithLogoCount = await User.countDocuments({ 
      logoGenerationCount: { $exists: true } 
    });
    const usersWithGeneratedLogos = await User.countDocuments({
      generatedLogos: { $exists: true, $ne: [] }
    });
    
    console.log(`\n4. User Statistics:`);
    console.log(`   - Total users: ${totalUsers}`);
    console.log(`   - Users with logo count: ${usersWithLogoCount}`);
    console.log(`   - Users with generated logos: ${usersWithGeneratedLogos}`);
    
    // Check for users without logoGenerationCount (migration needed)
    const usersNeedingMigration = await User.countDocuments({
      $or: [
        { logoGenerationCount: { $exists: false } },
        { logoGenerationCount: null }
      ]
    });
    
    if (usersNeedingMigration > 0) {
      console.log(`\n⚠️  ${usersNeedingMigration} users need logo field migration`);
      console.log('   Run: node migrate-logo-fields.js');
    }
    
    // Show sample of users who hit limit
    const limitedUsers = await User.find({
      'logoGenerationCount.count': { $gte: parseInt(process.env.LOGO_GENERATION_LIMIT) || 5 }
    }).select('email name logoGenerationCount').limit(5);
    
    if (limitedUsers.length > 0) {
      console.log(`\n5. Users at daily limit:`);
      limitedUsers.forEach(user => {
        console.log(`   - ${user.email}: ${user.logoGenerationCount.count} generated`);
      });
    }
    
  } catch (err) {
    console.log('\n3. Database Connection: ✗ Failed');
    console.log('   Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();

console.log('\n=== Common Issues ===');
console.log('1. "Generation failed" - Check API keys');
console.log('2. "Daily limit reached" - User has generated 5 logos today');
console.log('3. "Failed to upload" - Check directory permissions');
console.log('4. No logos appearing - Check browser console for errors');
console.log('\n');
