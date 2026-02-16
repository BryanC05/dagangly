const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/msme_marketplace';

async function fixUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        const email = 'becejob@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`❌ User ${email} not found.`);
            process.exit(1);
        }

        // UPDATE USER
        user.isSeller = true;
        user.isVerified = true; // Set to true just in case restrictions are put back
        user.businessName = 'Bryan\'s Tech Shop';
        user.businessType = 'small';

        // Set location to Bekasi (center of simulation) so it appears near other items
        // Coordinates: [Longitude, Latitude]
        user.location = {
            type: 'Point',
            coordinates: [106.9896, -6.2383],
            address: 'Jl. Diponegoro No. 15, Bekasi',
            city: 'Bekasi',
            state: 'Jawa Barat',
            pincode: '17111'
        };

        await user.save();

        console.log(`\n✅ User ${user.name} updated successfully!`);
        console.log(`- isSeller: ${user.isSeller}`);
        console.log(`- isVerified: ${user.isVerified}`);
        console.log(`- Location: ${JSON.stringify(user.location)}`);
        console.log(`\nUser should now appear on the map.`);

        await mongoose.disconnect();

    } catch (error) {
        console.error('Error:', error);
    }
}

fixUser();
