const axios = require('axios');
const config = require('../config');

class OxaPay {
  constructor() {
    this.apiKey = process.env.OXAPAY_API_KEY;
    this.baseUrl = 'https://api.oxapay.com';
    this.callbackUrl = process.env.OXAPAY_CALLBACK_URL;
    
    if (!this.apiKey) {
      throw new Error('OXAPAY_API_KEY is not set');
    }
    
    if (!this.callbackUrl) {
      throw new Error('OXAPAY_CALLBACK_URL is not set');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async createWallet(params) {
    try {
      const response = await this.client.post('wallets/create', params);
      return response.data;
    } catch (error) {
      console.error('OxaPay createWallet error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getWallet(walletId) {
    try {
      const response = await this.client.get(`wallets/${walletId}`);
      return response.data;
    } catch (error) {
      console.error('OxaPay getWallet error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getPaymentHistory(params) {
    try {
      const response = await this.client.get('payments/history', { params });
      return response.data;
    } catch (error) {
      console.error('OxaPay getPaymentHistory error:', error.response?.data || error.message);
      throw error;
    }
  }

  async createStaticAddress(params) {
    try {
      // Validate required parameters
      if (!params.currency || !params.network) {
        throw new Error('Currency and network are required');
      }

      // Validate currency is supported
      if (!config.supportedCurrencies.includes(params.currency)) {
        throw new Error(`Unsupported currency: ${params.currency}`);
      }

      // Validate network is supported for the currency
      const supportedNetworks = config.supportedNetworks[params.currency];
      if (!supportedNetworks || !supportedNetworks.includes(params.network)) {
        throw new Error(`Unsupported network ${params.network} for currency ${params.currency}`);
      }

      // Prepare request data
      const requestData = {
        merchant: this.apiKey,
        currency: params.currency,
        network: params.network,
        callbackUrl: this.callbackUrl,
        description: params.description || `${params.currency}/${params.network} deposit address`,
        orderId: params.orderId || `${Date.now()}-${params.currency}-${params.network}`,
        minAmount: params.minAmount
      };

      console.log('Creating static address with params:', {
        ...requestData,
        merchant: '***hidden***'
      });

      const response = await this.client.post('/merchants/request/staticaddress', requestData);
      
      if (!response.data) {
        throw new Error('Empty response from OxaPay');
      }

      if (response.data.result === 100 && response.data.address) {
        return {
          success: true,
          address: response.data.address,
          message: response.data.message
        };
      }
      
      throw new Error(response.data.message || 'Failed to create static address');
    } catch (error) {
      console.error('OxaPay createStaticAddress error:', {
        error: error.message,
        response: error.response?.data,
        params: {
          ...params,
          merchant: '***hidden***'
        }
      });

      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }

  async getSupportedCurrencies() {
    try {
      return {
        currencies: config.supportedCurrencies,
        networks: config.supportedNetworks
      };
    } catch (error) {
      console.error('Error getting supported currencies:', error);
      return {
        currencies: [],
        networks: {}
      };
    }
  }

  async getExchangeRates() {
    try {
      const response = await this.client.get('/merchants/rates', {
        params: { merchant: this.apiKey }
      });
      return response.data;
    } catch (error) {
      console.error('OxaPay getExchangeRates error:', error.response?.data || error.message);
      return { rates: {} };
    }
  }

  async getPrices() {
    try {
      const response = await this.client.post('/merchants/prices', {
        merchant: this.apiKey
      });
      
      if (response.data.result === 100) {
        return response.data.data;
      }
      
      return {};
    } catch (error) {
      console.error('OxaPay getPrices error:', error.response?.data || error.message);
      return {};
    }
  }

  async calculateExchange(fromCurrency, toCurrency, amount) {
    try {
      const response = await this.client.post('/merchants/exchange/calculate', {
        merchant: this.apiKey,
        fromCurrency,
        toCurrency,
        amount
      });
      
      if (response.data.result === 100) {
        return {
          rate: response.data.rate,
          amount: response.data.amount,
          toAmount: response.data.toAmount
        };
      }
      
      throw new Error(response.data.message || 'Failed to calculate exchange');
    } catch (error) {
      console.error('OxaPay calculateExchange error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new OxaPay(); 