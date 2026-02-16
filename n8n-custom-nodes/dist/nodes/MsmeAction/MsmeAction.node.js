const { INodeType } = require('n8n-workflow');

class MsmeAction {
  constructor() {
    this.description = {
      displayName: 'MSME Action',
      name: 'msmeAction',
      icon: 'fa:cogs',
      group: ['transform'],
      version: 1,
      description: 'Perform actions in MSME Marketplace',
      defaults: {
        name: 'MSME Action',
      },
      inputs: ['main'],
      outputs: ['main'],
      credentials: [
        {
          name: 'msmeApi',
          required: true,
        },
      ],
      properties: [
        {
          displayName: 'Operation',
          name: 'operation',
          type: 'options',
          noDataExpression: true,
          options: [
            {
              name: 'Update Order Status',
              value: 'updateOrderStatus',
              description: 'Update the status of an order',
              action: 'Update order status',
            },
            {
              name: 'Get Order Details',
              value: 'getOrderDetails',
              description: 'Get full order information',
              action: 'Get order details',
            },
          ],
          default: 'updateOrderStatus',
        },
        {
          displayName: 'Order ID',
          name: 'orderId',
          type: 'string',
          default: '={{ $json.data.orderId }}',
          displayOptions: {
            show: {
              operation: ['updateOrderStatus'],
            },
          },
          required: true,
        },
        {
          displayName: 'New Status',
          name: 'newStatus',
          type: 'options',
          displayOptions: {
            show: {
              operation: ['updateOrderStatus'],
            },
          },
          options: [
            { name: 'Pending', value: 'Pending' },
            { name: 'Confirmed', value: 'Confirmed' },
            { name: 'Preparing', value: 'Preparing' },
            { name: 'Ready', value: 'Ready' },
            { name: 'Delivered', value: 'Delivered' },
            { name: 'Confirmation Sent', value: 'confirmation_sent' },
          ],
          default: 'Confirmed',
          required: true,
        },
        {
          displayName: 'Order ID',
          name: 'orderId',
          type: 'string',
          default: '={{ $json.data.orderId }}',
          displayOptions: {
            show: {
              operation: ['getOrderDetails'],
            },
          },
          required: true,
        },
      ],
    };
  }

  async execute() {
    const items = this.getInputData();
    const returnData = [];
    const credentials = await this.getCredentials('msmeApi');
    
    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i);
      
      try {
        let responseData;

        if (operation === 'updateOrderStatus') {
          const orderId = this.getNodeParameter('orderId', i);
          const newStatus = this.getNodeParameter('newStatus', i);

          responseData = await this.helpers.request({
            method: 'PUT',
            url: `${credentials.baseUrl}/api/orders/${orderId}/status`,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: { status: newStatus },
            json: true,
          });

        } else if (operation === 'getOrderDetails') {
          const orderId = this.getNodeParameter('orderId', i);

          responseData = await this.helpers.request({
            method: 'GET',
            url: `${credentials.baseUrl}/api/orders/${orderId}`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            json: true,
          });
        }

        returnData.push({ json: responseData });

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: error.message } });
          continue;
        }
        throw new Error(error.message);
      }
    }

    return [returnData];
  }
}

module.exports = { MsmeAction };
