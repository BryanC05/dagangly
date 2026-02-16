const express = require('express');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/rooms', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyer.toString() !== req.user._id.toString() && 
        order.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Not authorized for this order.' });
    }

    let chatRoom = await ChatRoom.findOne({
      order: orderId,
      buyer: order.buyer,
      seller: order.seller
    });

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        order: orderId,
        buyer: order.buyer,
        seller: order.seller,
        chatType: 'order'
      });
      await chatRoom.save();
    }

    const populatedRoom = await ChatRoom.findById(chatRoom._id)
      .populate('order', 'status totalAmount')
      .populate('buyer', 'name profileImage')
      .populate('seller', 'businessName name profileImage')
      .populate('lastMessage');

    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/rooms/direct', auth, async (req, res) => {
  try {
    const { sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({ message: 'Seller ID is required' });
    }

    // Prevent sellers from messaging themselves
    if (sellerId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    const seller = await User.findOne({ _id: sellerId, isSeller: true });
    if (!seller) {
      return res.status(404).json({ message: 'Store not found' });
    }

    let chatRoom = await ChatRoom.findOne({
      buyer: req.user._id,
      seller: sellerId,
      chatType: 'direct',
      order: null
    });

    if (!chatRoom) {
      chatRoom = new ChatRoom({
        buyer: req.user._id,
        seller: sellerId,
        chatType: 'direct',
        order: null
      });
      await chatRoom.save();
    }

    const populatedRoom = await ChatRoom.findById(chatRoom._id)
      .populate('buyer', 'name profileImage')
      .populate('seller', 'businessName name profileImage')
      .populate('lastMessage');

    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/rooms', auth, async (req, res) => {
  try {
    const { chatType } = req.query;
    // Get all chat rooms where user is either buyer or seller
    let query = {
      $or: [
        { seller: req.user._id },
        { buyer: req.user._id }
      ]
    };

    if (chatType) {
      query = { ...query, chatType };
    }

    const chatRooms = await ChatRoom.find(query)
      .populate('order', 'status totalAmount')
      .populate('buyer', 'name profileImage')
      .populate('seller', 'businessName name profileImage')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name'
        }
      })
      .sort({ updatedAt: -1 });

    const roomsWithUnread = chatRooms.map(room => {
      const roomObj = room.toObject();
      // Determine if user is seller or buyer for this specific room
      const isRoomSeller = room.seller.toString() === req.user._id.toString();
      roomObj.unreadCount = isRoomSeller 
        ? room.unreadCount.seller 
        : room.unreadCount.buyer;
      return roomObj;
    });

    res.json(roomsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/rooms/direct/my-stores', auth, async (req, res) => {
  try {
    // Get all direct chat rooms where user is the buyer
    const chatRooms = await ChatRoom.find({
      buyer: req.user._id,
      chatType: 'direct'
    })
      .populate('seller', 'businessName name profileImage phone location')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name'
        }
      })
      .sort({ updatedAt: -1 });

    const roomsWithUnread = chatRooms.map(room => {
      const roomObj = room.toObject();
      roomObj.unreadCount = room.unreadCount.buyer;
      return roomObj;
    });

    res.json(roomsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/rooms/direct/my-customers', auth, async (req, res) => {
  try {
    // Get all direct chat rooms where user is the seller
    const chatRooms = await ChatRoom.find({
      seller: req.user._id,
      chatType: 'direct'
    })
      .populate('buyer', 'name profileImage phone')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name'
        }
      })
      .sort({ updatedAt: -1 });

    const roomsWithUnread = chatRooms.map(room => {
      const roomObj = room.toObject();
      roomObj.unreadCount = room.unreadCount.seller;
      return roomObj;
    });

    res.json(roomsWithUnread);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.buyer.toString() !== req.user._id.toString() && 
        chatRoom.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Not authorized for this chat.' });
    }

    const messages = await Message.find({ chatRoom: roomId })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    await Message.updateMany(
      { 
        chatRoom: roomId, 
        sender: { $ne: req.user._id },
        isRead: false 
      },
      { isRead: true, readAt: new Date() }
    );

    // Determine if user is seller or buyer for this specific room
    const isRoomSeller = chatRoom.seller.toString() === req.user._id.toString();
    if (isRoomSeller) {
      chatRoom.unreadCount.seller = 0;
    } else {
      chatRoom.unreadCount.buyer = 0;
    }
    await chatRoom.save();

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, messageType = 'text', attachments = [] } = req.body;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.buyer.toString() !== req.user._id.toString() && 
        chatRoom.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Not authorized for this chat.' });
    }

    const message = new Message({
      chatRoom: roomId,
      sender: req.user._id,
      content,
      messageType,
      attachments
    });

    await message.save();

    chatRoom.lastMessage = message._id;
    // Determine if user is seller or buyer for this specific room
    const isRoomSeller = chatRoom.seller.toString() === req.user._id.toString();
    if (isRoomSeller) {
      chatRoom.unreadCount.buyer += 1;
    } else {
      chatRoom.unreadCount.seller += 1;
    }
    await chatRoom.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profileImage');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/messages/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId).populate('chatRoom');
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const chatRoom = message.chatRoom;
    if (chatRoom.buyer.toString() !== req.user._id.toString() && 
        chatRoom.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (message.sender.toString() !== req.user._id.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/rooms/:roomId/unread-count', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    if (chatRoom.buyer.toString() !== req.user._id.toString() && 
        chatRoom.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Determine if user is seller or buyer for this specific room
    const isRoomSeller = chatRoom.seller.toString() === req.user._id.toString();
    const unreadCount = isRoomSeller 
      ? chatRoom.unreadCount.seller 
      : chatRoom.unreadCount.buyer;

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
