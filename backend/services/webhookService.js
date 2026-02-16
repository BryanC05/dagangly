const axios = require('axios');

class WebhookService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  async sendWebhook(webhookUrl, payload) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await axios.post(webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Source': 'msme-marketplace',
          },
          timeout: 5000,
        });

        console.log(`✅ Webhook sent successfully to ${webhookUrl}`);
        return {
          success: true,
          status: response.status,
          data: response.data,
        };

      } catch (error) {
        console.error(`❌ Webhook attempt ${attempt} failed:`, error.message);

        if (attempt === this.retryAttempts) {
          console.error(`🚨 All ${this.retryAttempts} attempts failed`);
          return {
            success: false,
            error: error.message,
            attempts: attempt,
          };
        }

        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async triggerOrderConfirmation(order, seller) {
    try {
      const Workflow = require('../models/Workflow');
      // Check seller's workflows first, then buyer's workflows
      let workflow = await Workflow.findOne({
        seller: seller._id,
        type: 'order_confirmation',
        isActive: true,
      });

      if (!workflow && order.buyer) {
        const buyerId = order.buyer._id || order.buyer;
        workflow = await Workflow.findOne({
          seller: buyerId,
          type: 'order_confirmation',
          isActive: true,
        });
        if (workflow) {
          console.log('✅ Found order confirmation workflow from buyer account');
        }
      }

      if (!workflow) {
        console.log('No active order confirmation workflow found');
        return { triggered: false, reason: 'no_active_workflow' };
      }

      const payload = {
        event: 'order.created',
        timestamp: new Date().toISOString(),
        data: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber || order._id.toString().slice(-8),
          buyer: {
            id: order.buyer?._id?.toString() || order.buyer?.toString(),
            name: order.buyer?.name || 'Customer',
            email: order.buyer?.email || '',
          },
          seller: {
            id: seller._id.toString(),
            name: seller.businessName || seller.name,
            email: seller.email,
          },
          items: (order.items || []).map(item => ({
            productId: item.product?._id?.toString(),
            name: item.product?.name || item.name || 'Product',
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
        },
      };

      const result = await this.sendWebhook(workflow.webhookUrl, payload);

      if (result.success) {
        workflow.executionCount += 1;
        workflow.lastExecuted = new Date();
        await workflow.save();
      }

      return {
        triggered: result.success,
        workflowId: workflow._id,
        result,
      };

    } catch (error) {
      console.error('Error triggering order confirmation:', error);
      return {
        triggered: false,
        error: error.message,
      };
    }
  }
  async triggerStatusChange(order, seller) {
    try {
      const Workflow = require('../models/Workflow');
      const workflow = await Workflow.findOne({
        seller: seller._id || seller,
        type: 'order_confirmation',
        isActive: true,
      });

      if (!workflow) {
        console.log('No active workflow found for status change');
        return { triggered: false, reason: 'no_active_workflow' };
      }

      const payload = {
        event: 'order.status_changed',
        timestamp: new Date().toISOString(),
        data: {
          orderId: order._id.toString(),
          orderNumber: order._id.toString().slice(-8).toUpperCase(),
          buyer: {
            id: order.buyer?._id?.toString() || order.buyer?.toString(),
            name: order.buyer?.name || 'Customer',
            email: order.buyer?.email || '',
          },
          seller: {
            id: (seller._id || seller).toString(),
            name: seller.businessName || seller.name || 'Seller',
            email: seller.email || '',
          },
          status: order.status,
          totalAmount: order.totalAmount,
          updatedAt: new Date().toISOString(),
        },
      };

      const result = await this.sendWebhook(workflow.webhookUrl, payload);

      if (result.success) {
        workflow.executionCount += 1;
        workflow.lastExecuted = new Date();
        await workflow.save();
      }

      return { triggered: result.success, workflowId: workflow._id, result };
    } catch (error) {
      console.error('Error triggering status change webhook:', error);
      return { triggered: false, error: error.message };
    }
  }

  async testWebhook(webhookUrl) {
    const payload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'Test webhook from MSME Marketplace',
        orderId: 'test-' + Date.now(),
        buyer: { name: 'Test Buyer', email: 'test@example.com' },
        seller: { name: 'Test Seller', businessName: 'Test Store' },
        totalAmount: 50000,
      },
    };
    return this.sendWebhook(webhookUrl, payload);
  }
}

module.exports = new WebhookService();
