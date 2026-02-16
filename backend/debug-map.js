const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/msme_marketplace';

async function debugUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Find the user who was active previously
        const email = 'becejob@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User ${email} not found.`);
            // Try finding ANY seller if specific user not found
            const anySeller = await User.findOne({ isSeller: true });
            if (anySeller) {
                console.log(`Found another seller: ${anySeller.email}`);
                logUser(anySeller);
            }
        } else {
            logUser(user);
        }

        await mongoose.disconnect();

    } catch (error) {
        console.error('Error:', error);
    }
}

function logUser(user) {
    console.log(`\n--- User Debug: ${user.name} ---`);
    console.log(`ID: ${user._id}`);
    console.log(`Email: ${user.email}`);
    console.log(`isSeller: ${user.isSeller}`);
    console.log(`isVerified: ${user.isVerified} <--- REQUIRED FOR MAP`);
    console.log(`Business Name: ${user.businessName}`);
    console.log(`Location:`, JSON.stringify(user.location, null, 2));

    if (!user.location || !user.location.coordinates || (user.location.coordinates[0] === 0 && user.location.coordinates[1] === 0)) {
        console.log('⚠️  WARNING: Location is invalid or 0,0');
    }

    if (!user.isVerified) {
        console.log('⚠️  WARNING: User is NOT verified. Map only shows verified sellers.');
    }
}

debugUser();
