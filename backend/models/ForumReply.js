const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    thread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumThread',
        required: true
    },
    attachments: [{
        url: String,
        filename: String,
        mimetype: String
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEdited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient thread replies lookup
forumReplySchema.index({ thread: 1, createdAt: 1 });

module.exports = mongoose.model('ForumReply', forumReplySchema);
