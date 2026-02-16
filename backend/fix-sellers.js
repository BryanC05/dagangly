const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function fixSellers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update coordinates to Bangalore and verify
        const update = {
            isVerified: true,
            'location.coordinates': [77.6271, 12.9279], // Bangalore
            'location.type': 'Point'
        };

        const result = await User.updateMany(
            { role: 'seller' },
            { $set: update }
        );

        console.log(`Updated ${result.modifiedCount} sellers.`);

        // Allow verifying specific fix
        const sellers = await User.find({ role: 'seller' });
        sellers.forEach(s => {
            console.log(`\nSeller: ${s.name} -> Verified: ${s.isVerified}, Coords: [${s.location.coordinates}]`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

fixSellers();
