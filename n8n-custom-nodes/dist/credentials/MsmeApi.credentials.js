const { ICredentialType } = require('n8n-workflow');

class MsmeApi {
  constructor() {
    this.name = 'msmeApi';
    this.displayName = 'MSME API';
    this.properties = [
      {
        displayName: 'API Base URL',
        name: 'baseUrl',
        type: 'string',
        default: 'http://host.docker.internal:5000',
        placeholder: 'http://localhost:5000',
        description: 'Base URL of your MSME Marketplace API',
      },
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        description: 'API key for authentication',
      },
    ];
  }
}

module.exports = { MsmeApi };
