require('dotenv').config();

const supportedCurrencies = [
  'BTC', 'ETH', 'USDC', 'TRX', 'BNB', 'DOGE', 'LTC', 
  'XMR', 'USDT', 'TON', 'POL', 'BCH', 'SHIB', 'SOL',
  'NOT', 'DOGS'
];

const supportedNetworks = {
  BTC: ['Bitcoin'],
  ETH: ['ERC20', 'Base'],
  USDC: ['ERC20'],
  TRX: ['TRC20'],
  BNB: ['BEP20'],
  DOGE: ['Dogecoin'],
  LTC: ['Litecoin'],
  XMR: ['Monero'],
  USDT: ['BEP20', 'ERC20', 'TRC20', 'Polygon', 'Ton'],
  TON: ['Ton'],
  POL: ['Polygon'],
  BCH: ['BitcoinCash'],
  SHIB: ['BEP20'],
  SOL: ['Solana'],
  NOT: ['Ton'],
  DOGS: ['Ton']
};

module.exports = {
  supportedCurrencies,
  supportedNetworks
}; 