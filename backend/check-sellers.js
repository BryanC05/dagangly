const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkSellers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const sellers = await User.find({ isSeller: true });
        console.log(`Found ${sellers.length} sellers.`);

        sellers.forEach(s => {
            console.log(`\nSeller: ${s.name} (${s.email})`);
            console.log(`  Verified: ${s.isVerified}`);
            console.log(`  Location:`, s.location);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSellers();
