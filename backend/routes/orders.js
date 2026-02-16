const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ChatRoom = require('../models/ChatRoom');
const { auth } = require('../middleware/auth');
const webhookService = require('../services/webhookService');
const router = express.Router();

const VALID_PAYMENT_METHODS = ['cash', 'qris', 'ewallet', 'bank_transfer', 'credit_card'];
const VALID_EWALLET_PROVIDERS = ['gopay', 'ovo', 'dana', 'linkaja', 'shopeepay'];

router.post('/', auth, async (req, res) => {
  try {
    const { products, deliveryAddress, notes, paymentMethod, paymentDetails = {} } = req.body;

    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        message: 'Invalid or missing payment method. Valid options: cash, qris, ewallet, bank_transfer, credit_card'
      });
    }

    if (paymentMethod === 'ewallet' && paymentDetails.ewalletProvider) {
      if (!VALID_EWALLET_PROVIDERS.includes(paymentDetails.ewalletProvider)) {
        return res.status(400).json({
          message: 'Invalid e-wallet provider. Valid options: gopay, ovo, dana, linkaja, shopeepay'
        });
      }
    }

    let totalAmount = 0;
    const orderProducts = [];
    let sellerId = null;

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      if (!sellerId) {
        sellerId = product.seller;
      } else if (sellerId.toString() !== product.seller.toString()) {
        return res.status(400).json({ message: 'Cannot order from multiple sellers at once' });
      }

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;

      product.stock -= item.quantity;
      await product.save();
    }

    const orderData = {
      buyer: req.user._id,
      seller: sellerId,
      products: orderProducts,
      totalAmount,
      paymentMethod,
      paymentDetails: {
        ewalletProvider: paymentDetails.ewalletProvider || null,
        ewalletPhone: paymentDetails.ewalletPhone || null,
        bankName: paymentDetails.bankName || null,
        accountNumber: paymentDetails.accountNumber || null,
        accountHolder: paymentDetails.accountHolder || null
      },
      deliveryAddress: {
        ...deliveryAddress,
        coordinates: deliveryAddress.coordinates || [0, 0]
      },
      notes
    };

    const order = new Order(orderData);

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('products.product')
      .populate('seller', 'name businessName phone email')
      .populate('buyer', 'name phone email');

    // Fire webhook for order confirmation (non-blocking)
    webhookService.triggerOrderConfirmation(populatedOrder, populatedOrder.seller)
      .catch(err => console.error('Webhook trigger error:', err.message));

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-orders', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Get orders where user is either buyer or seller
    // Use string comparison to ensure proper matching
    const orders = await Order.find({
      $or: [
        { seller: req.user._id },
        { buyer: req.user._id }
      ]
    })
      .populate('products.product', 'name images')
      .populate('buyer', 'name phone')
      .populate('seller', 'businessName phone')
      .sort({ createdAt: -1 });

    // Double-check filtering on the server side to ensure data isolation
    const filteredOrders = orders.filter(order => {
      const orderBuyerId = order.buyer?._id?.toString() || order.buyer?.toString();
      const orderSellerId = order.seller?._id?.toString() || order.seller?.toString();
      return orderBuyerId === userId || orderSellerId === userId;
    });

    console.log(`📦 Fetching orders for user ${req.user.email} (${userId}): Found ${filteredOrders.length}`);
    if (filteredOrders.length > 0) {
      console.log(`   Latest Status: ${filteredOrders[0].status} (ID: ${filteredOrders[0]._id})`);
    }

    res.json(filteredOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { buyer: req.user._id },
        { seller: req.user._id }
      ]
    })
      .populate('products.product', 'name images price')
      .populate('buyer', 'name phone email profileImage')
      .populate('seller', 'businessName name phone email profileImage');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    // Only the seller of this specific order can update its status
    const order = await Order.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or you are not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    console.log(`✅ Status updated for Order ${order._id} to "${status}" by Seller ${req.user.email}`);

    // Populate for webhook data
    const populated = await Order.findById(order._id)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name businessName email');

    // Fire webhook for status change (non-blocking)
    webhookService.triggerStatusChange(populated, populated.seller)
      .catch(err => console.error('Status webhook error:', err.message));

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/payment', auth, async (req, res) => {
  try {
    const { paymentStatus, paymentDetails } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { buyer: req.user._id },
        { seller: req.user._id }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isSeller = order.seller.toString() === req.user._id.toString();

    // Only sellers can mark payment as completed
    if (paymentStatus) {
      if (paymentStatus === 'completed' && !isSeller) {
        return res.status(403).json({ message: 'Only sellers can mark payment as completed' });
      }

      // Buyers can only mark as 'pending' or 'processing', not 'completed'
      if (isBuyer && paymentStatus === 'completed') {
        return res.status(403).json({ message: 'Buyers cannot mark payment as completed' });
      }

      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'completed') {
        order.paymentDetails.paidAt = new Date();
      }
    }

    if (paymentDetails) {
      // Buyers can add payment proof and details
      if (isBuyer) {
        if (paymentDetails.qrisUrl) order.paymentDetails.qrisUrl = paymentDetails.qrisUrl;
        if (paymentDetails.qrisCode) order.paymentDetails.qrisCode = paymentDetails.qrisCode;
        if (paymentDetails.transferProof) order.paymentDetails.transferProof = paymentDetails.transferProof;
        if (paymentDetails.transactionId) order.paymentDetails.transactionId = paymentDetails.transactionId;
        if (paymentDetails.ewalletProvider) order.paymentDetails.ewalletProvider = paymentDetails.ewalletProvider;
        if (paymentDetails.ewalletPhone) order.paymentDetails.ewalletPhone = paymentDetails.ewalletPhone;
        if (paymentDetails.bankName) order.paymentDetails.bankName = paymentDetails.bankName;
        if (paymentDetails.accountNumber) order.paymentDetails.accountNumber = paymentDetails.accountNumber;
        if (paymentDetails.accountHolder) order.paymentDetails.accountHolder = paymentDetails.accountHolder;
      }

      // Sellers can update cash received for cash payments
      if (isSeller && order.paymentMethod === 'cash') {
        if (paymentDetails.cashReceived !== undefined) {
          order.paymentDetails.cashReceived = paymentDetails.cashReceived;
          order.paymentDetails.cashChange = paymentDetails.cashReceived - order.totalAmount;
        }
      }
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('products.product', 'name images')
      .populate('buyer', 'name phone')
      .populate('seller', 'businessName phone');

    res.json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/chat-room', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { buyer: req.user._id },
        { seller: req.user._id }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let chatRoom = await ChatRoom.findOne({ order: req.params.id });

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        order: req.params.id,
        buyer: order.buyer,
        seller: order.seller
      });
      await chatRoom.save();
    }

    const populatedRoom = await ChatRoom.findById(chatRoom._id)
      .populate('order', 'status totalAmount')
      .populate('buyer', 'name profileImage')
      .populate('seller', 'businessName name profileImage')
      .populate('lastMessage');

    res.json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get product tracking data for sellers - shows which products are bought, by whom, and where
router.get('/seller/product-tracking', auth, async (req, res) => {
  try {
    const sellerId = req.user._id.toString();
    console.log(`Fetching tracking data for seller: ${sellerId}`);

    // Get all orders where this user is the seller
    const orders = await Order.find({ seller: req.user._id })
      .populate('products.product', 'name images category price')
      .populate('buyer', 'name phone email profileImage')
      .sort({ createdAt: -1 });

    console.log(`Found ${orders.length} orders for seller ${sellerId}`);

    // Group orders by product
    const productMap = new Map();

    orders.forEach(order => {
      if (!order.products || order.products.length === 0) {
        console.log(`Order ${order._id} has no products`);
        return;
      }

      order.products.forEach(item => {
        // Skip if product was deleted or not populated
        if (!item.product) {
          console.log(`Product not found for order item in order ${order._id}`);
          return;
        }

        const productId = item.product._id.toString();

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product: item.product,
            totalSold: 0,
            totalRevenue: 0,
            orders: []
          });
        }

        const productData = productMap.get(productId);
        productData.totalSold += item.quantity;
        productData.totalRevenue += item.price * item.quantity;

        productData.orders.push({
          orderId: order._id,
          orderNumber: order._id.toString().slice(-8).toUpperCase(),
          quantity: item.quantity,
          price: item.price,
          totalAmount: item.price * item.quantity,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          buyer: {
            name: order.buyer?.name || 'Unknown',
            phone: order.buyer?.phone || '',
            email: order.buyer?.email || '',
            profileImage: order.buyer?.profileImage || null
          },
          deliveryAddress: order.deliveryAddress,
          notes: order.notes
        });
      });
    });

    // Convert map to array and sort by total revenue
    const trackingData = Array.from(productMap.values()).sort((a, b) =>
      b.totalRevenue - a.totalRevenue
    );

    console.log(`Returning ${trackingData.length} products with tracking data`);
    res.json(trackingData);
  } catch (error) {
    console.error('Error in product tracking:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
