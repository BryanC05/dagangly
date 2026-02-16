const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
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
  chatType: {
    type: String,
    enum: ['order', 'direct'],
    default: 'direct'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  unreadCount: {
    buyer: {
      type: Number,
      default: 0
    },
    seller: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

chatRoomSchema.index({ buyer: 1, seller: 1, order: 1 }, { unique: true, partialFilterExpression: { order: { $ne: null } } });
chatRoomSchema.index({ buyer: 1, seller: 1, chatType: 1 }, { unique: true, partialFilterExpression: { chatType: 'direct', order: null } });
chatRoomSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
