require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const resetLogoLimit = async () => {
    try {
        const email = process.argv[2];

        if (!email) {
            console.log('Usage: node reset-logo-limit.js <email>');
            console.log('Or to reset ALL users: node reset-logo-limit.js --all');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        if (email === '--all') {
            const result = await User.updateMany(
                {},
                {
                    $set: {
                        'logoGenerationCount.count': 0,
                        'logoGenerationCount.lastResetDate': new Date()
                    }
                }
            );
            console.log(`✅ Reset logo limit for ALL ${result.modifiedCount} users.`);
        } else {
            const user = await User.findOne({ email });
            if (!user) {
                console.log(`❌ User with email ${email} not found.`);
                process.exit(1);
            }

            user.logoGenerationCount = {
                count: 0,
                lastResetDate: new Date()
            };
            await user.save();
            console.log(`✅ Reset logo limit for user: ${user.email}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

resetLogoLimit();
