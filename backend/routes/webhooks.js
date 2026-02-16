const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const webhookService = require('../services/webhookService');
const Workflow = require('../models/Workflow');

// n8n callback endpoint - receives actions from n8n workflows
// This is a public endpoint secured by a shared secret header
router.post('/n8n/callback', async (req, res) => {
    try {
        const { action, data } = req.body;
        const secret = req.headers['x-webhook-secret'];

        // Simple shared secret verification
        const expectedSecret = process.env.WEBHOOK_SECRET || 'msme-webhook-secret-2024';
        if (secret !== expectedSecret) {
            return res.status(401).json({ error: 'Invalid webhook secret' });
        }

        console.log(`📨 n8n callback received: ${action}`);

        if (action === 'update_order_status') {
            const Order = require('../models/Order');
            const order = await Order.findByIdAndUpdate(
                data.orderId,
                { status: data.status },
                { new: true }
            );
            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }
            return res.json({ success: true, order });
        }

        res.json({ success: true, message: 'Callback received' });
    } catch (error) {
        console.error('Webhook callback error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test a webhook URL
router.post('/test', auth, async (req, res) => {
    try {
        const { webhookUrl } = req.body;
        if (!webhookUrl) {
            return res.status(400).json({ error: 'webhookUrl is required' });
        }

        const result = await webhookService.testWebhook(webhookUrl);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
