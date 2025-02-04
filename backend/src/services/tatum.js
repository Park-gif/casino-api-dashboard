const axios = require('axios');
const url = require('url');

const TATUM_API_KEY = 't-67556f45e54d6c36c68f43a9-da31cc61f95e4c24b9eeac24';
const TATUM_API_URL = 'https://api.tatum.io/v3';
const TATUM_V4_URL = 'https://api.tatum.io/v4';

// Custom error class for Tatum API errors
class TatumError extends Error {
  constructor(message, chain, operation) {
    super(message);
    this.name = 'TatumError';
    this.chain = chain;
    this.operation = operation;
    this.isLogged = false;
  }

  log() {
    if (!this.isLogged) {
      console.error(`[Tatum Error] ${this.chain || ''}: ${this.message}`);
      this.isLogged = true;
    }
  }
}

class TatumService {
  constructor() {
    // v3 client
    this.axios = axios.create({
      baseURL: TATUM_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TATUM_API_KEY
      }
    });

    // v4 client
    this.axiosV4 = axios.create({
      baseURL: TATUM_V4_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TATUM_API_KEY
      }
    });

    // Add request interceptor for minimal logging
    this.axios.interceptors.request.use(request => {
      console.log(`[Tatum] ${request.method?.toUpperCase()} ${request.url}`);
      return request;
    });

    this.axiosV4.interceptors.request.use(request => {
      console.log(`[Tatum v4] ${request.method?.toUpperCase()} ${request.url}`);
      return request;
    });

    // Add response interceptor for minimal error logging
    const errorHandler = error => {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      const endpoint = error.config?.url;
      const data = error.response?.data?.data;
      if (data) {
        console.error(`[Tatum API] ${endpoint} failed (${status}): ${message}`, data);
      } else {
        console.error(`[Tatum API] ${endpoint} failed (${status}): ${message}`);
      }
      throw new TatumError(message, null, 'api_call');
    };

    this.axios.interceptors.response.use(response => response, errorHandler);
    this.axiosV4.interceptors.response.use(response => response, errorHandler);
  }

  async createDepositAddress({ chain, userId }) {
    try {
      if (!chain || typeof chain !== 'string') {
        throw new TatumError('Chain parameter must be a string', chain, 'validation');
      }

      chain = chain.toUpperCase();
      console.log(`[Tatum] Creating ${chain} deposit address`);

      let response;
      let address = null;
      let privateKey = null;
      let xpub = null;

      switch (chain) {
        case 'BTC':
          response = await this.axios.get('/bitcoin/wallet');
          xpub = response.data.xpub;
          const btcAddress = await this.axios.get(`/bitcoin/address/${xpub}/0`);
          address = btcAddress.data.address;
          privateKey = response.data.mnemonic;
          break;

        case 'ETH':
        case 'ETH_BASE':
        case 'ETH_OP':
        case 'ETH_ARB':
          response = await this.axios.get('/ethereum/wallet');
          const ethResponse = await this.axios.post('/ethereum/wallet/priv', {
            mnemonic: response.data.mnemonic,
            index: 0
          });
          console.log('ETH response:', ethResponse.data);
          if (!ethResponse.data.key) {
            throw new TatumError('Invalid ETH response format', chain, 'address_creation');
          }
          const ethKey = ethResponse.data.key.replace('0x', '').substring(0, 40);
          address = `0x${ethKey}`;
          privateKey = ethResponse.data.key;
          break;

        case 'MATIC':
        case 'POLYGON':
          response = await this.axios.get('/polygon/wallet');
          const maticResponse = await this.axios.post('/polygon/wallet/priv', {
            mnemonic: response.data.mnemonic,
            index: 0
          });
          if (!maticResponse.data.key) {
            throw new TatumError('Invalid MATIC response format', chain, 'address_creation');
          }
          const maticKey = maticResponse.data.key.replace('0x', '').substring(0, 40);
          address = `0x${maticKey}`;
          privateKey = maticResponse.data.key;
          break;

        case 'SOL':
          response = await this.axios.get('/solana/wallet');
          console.log('SOL response:', response.data);
          if (!response.data.address || !response.data.privateKey) {
            throw new TatumError('Invalid SOL response format', chain, 'address_creation');
          }
          address = response.data.address;
          privateKey = response.data.privateKey;
          break;

        case 'TRON':
          response = await this.axios.get('/tron/wallet');
          const tronResponse = await this.axios.post('/tron/wallet/priv', {
            mnemonic: response.data.mnemonic,
            index: 0
          });
          console.log('TRON response:', tronResponse.data);
          if (!tronResponse.data.key) {
            throw new TatumError('Invalid TRON response format', chain, 'address_creation');
          }
          const tronKey = tronResponse.data.key.replace('0x', '').substring(0, 40);
          address = `T${tronKey}`;
          privateKey = tronResponse.data.key;
          break;

        case 'BSC':
          response = await this.axios.get('/bsc/wallet');
          const bscResponse = await this.axios.post('/bsc/wallet/priv', {
            mnemonic: response.data.mnemonic,
            index: 0
          });
          console.log('BSC response:', bscResponse.data);
          if (!bscResponse.data.key) {
            throw new TatumError('Invalid BSC response format', chain, 'address_creation');
          }
          const bscKey = bscResponse.data.key.replace('0x', '').substring(0, 40);
          address = `0x${bscKey}`;
          privateKey = bscResponse.data.key;
          break;

        case 'LTC':
          response = await this.axios.get('/litecoin/wallet');
          xpub = response.data.xpub;
          const ltcAddress = await this.axios.get(`/litecoin/address/${xpub}/0`);
          address = ltcAddress.data.address;
          privateKey = response.data.mnemonic;
          break;

        case 'BCH':
          response = await this.axios.get('/bcash/wallet');
          xpub = response.data.xpub;
          const bchAddress = await this.axios.get(`/bcash/address/${xpub}/0`);
          address = bchAddress.data.address;
          privateKey = response.data.mnemonic;
          break;

        case 'DOGE':
          response = await this.axios.get('/dogecoin/wallet');
          xpub = response.data.xpub;
          const dogeAddress = await this.axios.get(`/dogecoin/address/${xpub}/0`);
          address = dogeAddress.data.address;
          privateKey = response.data.mnemonic;
          break;

        case 'XRP':
          response = await this.axios.get('/xrp/wallet');
          console.log('XRP response:', response.data);
          if (!response.data.address || !response.data.secret) {
            throw new TatumError('Invalid XRP response format', chain, 'address_creation');
          }
          address = response.data.address;
          privateKey = response.data.secret;
          break;

        case 'CELO':
          response = await this.axios.get('/celo/wallet');
          const celoResponse = await this.axios.post('/celo/wallet/priv', {
            mnemonic: response.data.mnemonic,
            index: 0
          });
          console.log('CELO response:', celoResponse.data);
          if (!celoResponse.data.address && !celoResponse.data.key) {
            throw new TatumError('Invalid CELO response format', chain, 'address_creation');
          }
          address = celoResponse.data.address || `0x${celoResponse.data.key}`;
          privateKey = celoResponse.data.key;
          break;

        case 'AVAX':
          response = await this.axios.get('/avalanche/wallet');
          const avaxResponse = await this.axios.post('/avalanche/wallet/priv', {
            mnemonic: response.data.mnemonic,
            index: 0
          });
          console.log('AVAX response:', avaxResponse.data);
          if (!avaxResponse.data.address && !avaxResponse.data.key) {
            throw new TatumError('Invalid AVAX response format', chain, 'address_creation');
          }
          address = avaxResponse.data.address || `0x${avaxResponse.data.key}`;
          privateKey = avaxResponse.data.key;
          break;

        case 'FTM':
          response = await this.axios.get('/fantom/wallet');
          const ftmResponse = await this.axios.post('/fantom/wallet/priv', {
            mnemonic: response.data.mnemonic,
            index: 0
          });
          console.log('FTM response:', ftmResponse.data);
          if (!ftmResponse.data.address && !ftmResponse.data.key) {
            throw new TatumError('Invalid FTM response format', chain, 'address_creation');
          }
          address = ftmResponse.data.address || `0x${ftmResponse.data.key}`;
          privateKey = ftmResponse.data.key;
          break;

        case 'KLAY':
          response = await this.axios.get('/klaytn/wallet');
          const klayResponse = await this.axios.post('/klaytn/wallet/priv', {
            mnemonic: response.data.mnemonic,
            index: 0
          });
          console.log('KLAY response:', klayResponse.data);
          if (!klayResponse.data.address && !klayResponse.data.key) {
            throw new TatumError('Invalid KLAY response format', chain, 'address_creation');
          }
          address = klayResponse.data.address || `0x${klayResponse.data.key}`;
          privateKey = klayResponse.data.key;
          break;

        case 'ONE':
          response = await this.axios.get('/harmony/wallet');
          const oneResponse = await this.axios.post('/harmony/wallet/priv', {
            mnemonic: response.data.mnemonic,
            index: 0
          });
          console.log('ONE response:', oneResponse.data);
          if (!oneResponse.data.address && !oneResponse.data.key) {
            throw new TatumError('Invalid ONE response format', chain, 'address_creation');
          }
          address = oneResponse.data.address || `0x${oneResponse.data.key}`;
          privateKey = oneResponse.data.key;
          break;

        default:
          throw new TatumError(`Unsupported chain: ${chain}`, chain, 'validation');
      }

      if (!address || !privateKey) {
        throw new TatumError(`Failed to get address or private key for ${chain}`, chain, 'address_creation');
      }

      console.log(`[Tatum] Created ${chain} address:`, { 
        address: String(address), 
        hasPrivateKey: true, 
        hasXpub: !!xpub 
      });

      try {
        // For webhook URL, we need a publicly accessible URL
        // For local development, you can use ngrok to expose localhost
        const webhookUrl = process.env.NODE_ENV === 'production'
          ? 'https://your-production-domain.com/webhooks/deposits'
          : 'https://your-ngrok-url.ngrok.io/webhooks/deposits';

        await this.subscribeToAddress(chain, address, webhookUrl);
      } catch (error) {
        console.warn(`[Tatum Warning] ${chain}: Webhook subscription not available - will need manual monitoring`);
      }

      // Return simple string values
      const result = {
        address: String(address),
        privateKey: String(privateKey)
      };

      if (xpub) {
        result.xpub = String(xpub);
      }

      console.log('Returning address data:', {
        address: result.address,
        hasPrivateKey: true,
        hasXpub: !!result.xpub
      });

      return result;
    } catch (error) {
      if (error instanceof TatumError) {
        error.chain = chain;
        error.log();
      } else {
        const wrappedError = new TatumError(error.message, chain, 'unexpected');
        wrappedError.log();
        throw wrappedError;
      }
      throw error;
    }
  }

  async subscribeToAddress(chain, address, webhookUrl) {
    try {
      // Map chain to v4 chain format
      const chainMapping = {
        'BTC': 'bitcoin-mainnet',
        'ETH': 'ethereum-mainnet',
        'ETH_BASE': 'base-mainnet',
        'ETH_OP': 'optimism-mainnet',
        'ETH_ARB': 'arb-one-mainnet',
        'MATIC': 'polygon-mainnet',
        'POLYGON': 'polygon-mainnet',
        'SOL': 'solana-mainnet',
        'TRON': 'tron-mainnet',
        'BSC': 'bsc-mainnet',
        'LTC': 'litecoin-core-mainnet',
        'BCH': 'bch-mainnet',
        'DOGE': 'doge-mainnet',
        'XRP': 'ripple-mainnet',
        'CELO': 'celo-mainnet',
        'AVAX': 'avax-mainnet',
        'FTM': 'fantom-mainnet',
        'KLAY': 'klaytn-cypress',
        'ONE': 'harmony-mainnet'
      };

      const chainId = chainMapping[chain.toUpperCase()];
      if (!chainId) {
        throw new TatumError(`Unsupported chain for subscription: ${chain}`, chain, 'subscription');
      }

      const payload = {
        type: 'ADDRESS_EVENT',
        attr: {
          address,
          chain: chainId,
          url: webhookUrl
        }
      };

      console.log(`[Tatum] Subscribing to ${chain} address with payload:`, payload);

      const response = await this.axiosV4.post('/subscription', payload);
      console.log(`[Tatum] Subscribed to ${chain} address ${address} with subscription ID: ${response.data.id}`);
      
      return response.data.id;
    } catch (error) {
      if (error instanceof TatumError) {
        error.chain = chain;
        error.log();
      } else {
        const wrappedError = new TatumError(`Failed to subscribe to address: ${error.message}`, chain, 'subscription');
        wrappedError.log();
        throw wrappedError;
      }
      throw error;
    }
  }

  async getBalance(chain, address) {
    try {
      const chainLower = chain.toLowerCase();
      let endpoint;
      
      switch (chainLower) {
        case 'btc':
          endpoint = `/bitcoin/address/balance/${address}`;
          break;
        case 'eth':
          endpoint = `/ethereum/account/balance/${address}`;
          break;
        case 'tron':
          endpoint = `/tron/account/balance/${address}`;
          break;
        case 'bsc':
          endpoint = `/bsc/account/balance/${address}`;
          break;
        default:
          throw new TatumError(`Unsupported chain`, chain, 'balance_check');
      }

      const response = await this.axios.get(endpoint);
      return response.data.balance;
    } catch (error) {
      if (error instanceof TatumError) {
        error.chain = chain;
        error.log();
      } else {
        const wrappedError = new TatumError(`Failed to get balance: ${error.message}`, chain, 'balance_check');
        wrappedError.log();
        throw wrappedError;
      }
      throw error;
    }
  }

  async getTransactionDetails(chain, txId) {
    try {
      const response = await this.axios.get(`/${chain.toLowerCase()}/transaction/${txId}`);
      return {
        hash: response.data.hash,
        amount: response.data.amount,
        confirmations: response.data.confirmations,
        from: response.data.from,
        to: response.data.to
      };
    } catch (error) {
      if (error instanceof TatumError) {
        error.chain = chain;
        error.log();
      } else {
        const wrappedError = new TatumError(`Failed to get transaction details: ${error.message}`, chain, 'transaction');
        wrappedError.log();
        throw wrappedError;
      }
      throw error;
    }
  }
}

const tatumService = new TatumService();

module.exports = { tatumService, TatumError }; 