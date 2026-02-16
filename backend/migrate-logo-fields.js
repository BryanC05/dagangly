const mongoose = require('mongoose');
const User = require('./models/User');

// Migration script to add logo fields to existing users
async function migrateLogoFields() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/msmehub';
    await mongoose.connect(mongoUri);
    console.log('Connected to database');
    
    // Find users without logoGenerationCount
    const usersWithoutFields = await User.find({
      $or: [
        { logoGenerationCount: { $exists: false } },
        { logoGenerationCount: null },
        { generatedLogos: { $exists: false } }
      ]
    });
    
    console.log(`Found ${usersWithoutFields.length} users needing migration`);
    
    if (usersWithoutFields.length === 0) {
      console.log('No migration needed');
      return;
    }
    
    // Update users
    for (const user of usersWithoutFields) {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          logoGenerationCount: {
            count: 0,
            lastResetDate: new Date()
          },
          generatedLogos: [],
          businessLogo: null,
          hasCustomLogo: false
        }
      });
      console.log(`Updated: ${user.email}`);
    }
    
    console.log(`Migration complete: ${usersWithoutFields.length} users updated`);
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateLogoFields();
