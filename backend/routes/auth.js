const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, isSeller, businessName, businessType, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      isSeller: isSeller || false,
      businessName: isSeller ? businessName : null,
      businessType: isSeller ? businessType : 'none',
      location: {
        coordinates: location?.coordinates || [0, 0],
        address: location?.address,
        city: location?.city,
        state: location?.state,
        pincode: location?.pincode
      }
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, isSeller: user.isSeller },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isSeller: user.isSeller,
        automationEnabled: user.automationEnabled,
        businessName: user.businessName,
        businessType: user.businessType,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, isSeller: user.isSeller },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isSeller: user.isSeller,
        automationEnabled: user.automationEnabled,
        businessName: user.businessName,
        businessType: user.businessType,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, isSeller, businessName, businessType, location, profileImage } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (isSeller !== undefined) user.isSeller = isSeller;
    if (businessName !== undefined) user.businessName = businessName;
    if (businessType) user.businessType = businessType;
    if (location) {
      user.location = {
        ...user.location,
        ...location
      };
    }

    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isSeller: user.isSeller,
        automationEnabled: user.automationEnabled,
        businessName: user.businessName,
        businessType: user.businessType,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
