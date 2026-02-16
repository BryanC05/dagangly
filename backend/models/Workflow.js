const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['order_confirmation', 'inventory_alert', 'welcome_series'],
    required: true,
  },
  n8nWorkflowId: {
    type: String,
  },
  webhookUrl: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  executionCount: {
    type: Number,
    default: 0,
  },
  lastExecuted: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Workflow', workflowSchema);
