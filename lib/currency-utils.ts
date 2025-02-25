export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "https://flagcdn.com/w40/us.png" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "https://flagcdn.com/w40/eu.png" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "https://flagcdn.com/w40/gb.png" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "https://flagcdn.com/w40/tr.png" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "https://flagcdn.com/w40/br.png" },
  { code: "AUD", name: "Australian Dollar", symbol: "AU$", flag: "https://flagcdn.com/w40/au.png" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "https://flagcdn.com/w40/ca.png" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$", flag: "https://flagcdn.com/w40/nz.png" },
  { code: "TND", name: "Tunisian Dinar", symbol: "DT", flag: "https://flagcdn.com/w40/tn.png" }
];

export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rates: any): number {
  if (fromCurrency === toCurrency) return amount;
  
  // All rates are USD based, so:
  // 1. If source is not USD, convert to USD first
  // 2. Then convert from USD to target currency
  
  let amountInUSD = fromCurrency === 'USD' ? amount : amount / rates[fromCurrency];
  let finalAmount = toCurrency === 'USD' ? amountInUSD : amountInUSD * rates[toCurrency];
  
  return Number(finalAmount.toFixed(2));
}

export const GET_EXCHANGE_RATES = `
  query GetExchangeRates {
    exchangeRates {
      EUR
      TRY
      GBP
      BRL
      AUD
      CAD
      NZD
      TND
    }
  }
`; 