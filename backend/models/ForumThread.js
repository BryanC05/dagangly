const mongoose = require('mongoose');

const forumThreadSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        maxlength: 10000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'products', 'tips', 'help', 'announcements'],
        default: 'general'
    },
    attachments: [{
        url: String,
        filename: String,
        mimetype: String
    }],
    viewCount: {
        type: Number,
        default: 0
    },
    replyCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for search and sorting
forumThreadSchema.index({ title: 'text', content: 'text' });
forumThreadSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('ForumThread', forumThreadSchema);
