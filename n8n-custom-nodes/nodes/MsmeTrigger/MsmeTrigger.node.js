const { INodeType } = require('n8n-workflow');

class MsmeTrigger {
  constructor() {
    this.description = {
      displayName: 'MSME Trigger',
      name: 'msmeTrigger',
      icon: 'fa:shopping-cart',
      group: ['trigger'],
      version: 1,
      description: 'Triggers workflows from MSME Marketplace events',
      defaults: {
        name: 'MSME Trigger',
      },
      inputs: [],
      outputs: ['main'],
      credentials: [
        {
          name: 'msmeApi',
          required: false,
        },
      ],
      webhooks: [
        {
          name: 'default',
          httpMethod: 'POST',
          responseMode: 'onReceived',
          path: 'webhook',
        },
      ],
      properties: [
        {
          displayName: 'Event Type',
          name: 'eventType',
          type: 'options',
          options: [
            {
              name: 'Order Created',
              value: 'order.created',
              description: 'When a new order is placed',
            },
            {
              name: 'Order Status Changed',
              value: 'order.status_changed',
              description: 'When order status is updated',
            },
            {
              name: 'Inventory Low',
              value: 'inventory.low',
              description: 'When product stock is low',
            },
          ],
          default: 'order.created',
          description: 'The type of event to listen for',
        },
      ],
    };
  }

  async webhook() {
    const req = this.getRequestObject();
    const eventType = this.getNodeParameter('eventType');
    
    console.log(`Received webhook: ${JSON.stringify(req.body)}`);

    if (req.body.event !== eventType) {
      return { workflowData: [[]] };
    }

    return {
      workflowData: [this.helpers.returnJsonArray([req.body])],
    };
  }
}

module.exports = { MsmeTrigger };
