const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ForumThread = require('../models/ForumThread');
const ForumReply = require('../models/ForumReply');
const { auth } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/forum';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images and documents are allowed'));
    }
});

// GET /forum - List all threads (paginated)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, search } = req.query;
        const query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const threads = await ForumThread.find(query)
            .populate('author', 'name businessName role')
            .sort({ isPinned: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ForumThread.countDocuments(query);

        res.json({
            threads,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /forum/:id - Get single thread with replies
router.get('/:id', async (req, res) => {
    try {
        const thread = await ForumThread.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewCount: 1 } },
            { new: true }
        ).populate('author', 'name businessName role');

        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        const replies = await ForumReply.find({ thread: req.params.id })
            .populate('author', 'name businessName role')
            .sort({ createdAt: 1 });

        res.json({ thread, replies });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /forum - Create new thread
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
    try {
        const { title, content, category } = req.body;

        const attachments = req.files?.map(file => ({
            url: `/uploads/forum/${file.filename}`,
            filename: file.originalname,
            mimetype: file.mimetype
        })) || [];

        const thread = new ForumThread({
            title,
            content,
            category: category || 'general',
            author: req.user._id,
            attachments
        });

        await thread.save();
        await thread.populate('author', 'name businessName role');

        res.status(201).json(thread);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /forum/:id/reply - Add reply to thread
router.post('/:id/reply', auth, upload.array('attachments', 3), async (req, res) => {
    try {
        const thread = await ForumThread.findById(req.params.id);

        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        if (thread.isLocked) {
            return res.status(403).json({ message: 'This thread is locked' });
        }

        const { content } = req.body;

        const attachments = req.files?.map(file => ({
            url: `/uploads/forum/${file.filename}`,
            filename: file.originalname,
            mimetype: file.mimetype
        })) || [];

        const reply = new ForumReply({
            content,
            author: req.user._id,
            thread: req.params.id,
            attachments
        });

        await reply.save();
        await reply.populate('author', 'name businessName role');

        // Update reply count
        await ForumThread.findByIdAndUpdate(req.params.id, { $inc: { replyCount: 1 } });

        res.status(201).json(reply);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /forum/:id - Edit thread (author only)
router.put('/:id', auth, async (req, res) => {
    try {
        const thread = await ForumThread.findById(req.params.id);

        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        if (thread.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this thread' });
        }

        const { title, content, category } = req.body;

        if (title) thread.title = title;
        if (content) thread.content = content;
        if (category) thread.category = category;

        await thread.save();
        await thread.populate('author', 'name businessName role');

        res.json(thread);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /forum/:id - Delete thread (author only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const thread = await ForumThread.findById(req.params.id);

        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        if (thread.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this thread' });
        }

        // Delete all replies first
        await ForumReply.deleteMany({ thread: req.params.id });
        await thread.deleteOne();

        res.json({ message: 'Thread deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /forum/:id/like - Like/unlike a thread
router.post('/:id/like', auth, async (req, res) => {
    try {
        const thread = await ForumThread.findById(req.params.id);

        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        const userIndex = thread.likes.indexOf(req.user._id);

        if (userIndex > -1) {
            thread.likes.splice(userIndex, 1);
        } else {
            thread.likes.push(req.user._id);
        }

        await thread.save();
        res.json({ likes: thread.likes.length, liked: userIndex === -1 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /forum/reply/:id/like - Like/unlike a reply
router.post('/reply/:id/like', auth, async (req, res) => {
    try {
        const reply = await ForumReply.findById(req.params.id);

        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }

        const userIndex = reply.likes.indexOf(req.user._id);

        if (userIndex > -1) {
            reply.likes.splice(userIndex, 1);
        } else {
            reply.likes.push(req.user._id);
        }

        await reply.save();
        res.json({ likes: reply.likes.length, liked: userIndex === -1 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
