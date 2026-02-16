const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get count of verified sellers (public, for homepage stats)
router.get('/sellers/count', async (req, res) => {
  try {
    const count = await User.countDocuments({ isSeller: true, isVerified: true });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/nearby-sellers', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    let query = {
      isSeller: true,
      isSeller: true,
      // isVerified: true, // Allow unverified sellers for testing
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: Number(radius)
        }
      }
    };

    const sellers = await User.find(query)
      .select('name businessName rating location businessType profileImage')
      .limit(50);

    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get seller/user details by ID (public)
router.get('/seller/:id', async (req, res) => {
  try {
    const seller = await User.findById(req.params.id)
      .select('name businessName businessType rating location profileImage isVerified isSeller email phone createdAt');

    if (!seller) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(seller);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.role;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save a product
router.post('/saved-products/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);

    // Check if product is already saved
    if (user.savedProducts.includes(productId)) {
      return res.status(400).json({ message: 'Product already saved' });
    }

    user.savedProducts.push(productId);
    await user.save();

    res.json({ message: 'Product saved successfully', savedProducts: user.savedProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unsave a product
router.delete('/saved-products/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);

    // Check if product is saved
    if (!user.savedProducts.includes(productId)) {
      return res.status(400).json({ message: 'Product not in saved list' });
    }

    user.savedProducts = user.savedProducts.filter(id => id.toString() !== productId);
    await user.save();

    res.json({ message: 'Product removed from saved list', savedProducts: user.savedProducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all saved products
router.get('/saved-products', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedProducts',
        populate: {
          path: 'seller',
          select: 'name businessName rating location'
        }
      });

    res.json(user.savedProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if product is saved (for UI state)
router.get('/saved-products/check/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    const isSaved = user.savedProducts.includes(productId);
    res.json({ isSaved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
