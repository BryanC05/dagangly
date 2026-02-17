const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    variantName: {
      type: String,
      default: null
    },
    selectedOptions: [{
      groupName: String,
      chosen: [String],
      priceAdjust: { type: Number, default: 0 }
    }]
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      type: [Number]
    }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'qris', 'ewallet', 'bank_transfer', 'credit_card'],
    required: true
  },
  paymentDetails: {
    // For QRIS
    qrisUrl: String,
    qrisCode: String,
    // For E-wallet
    ewalletProvider: {
      type: String,
      enum: ['gopay', 'ovo', 'dana', 'linkaja', 'shopeepay', null],
      default: null
    },
    ewalletPhone: String,
    // For Cash
    cashReceived: {
      type: Number,
      default: 0
    },
    cashChange: {
      type: Number,
      default: 0
    },
    // For Bank Transfer
    bankName: String,
    accountNumber: String,
    accountHolder: String,
    transferProof: String,
    // Transaction ID from payment gateway
    transactionId: String,
    paidAt: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);