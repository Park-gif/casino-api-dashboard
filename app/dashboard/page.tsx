"use client"

import { Info, Copy, User, Key, Clock, Loader2, LayoutDashboard, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, BarChart3, RefreshCw, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useQuery } from '@apollo/client'
import { GET_BALANCE_QUERY, GET_BILLING_CYCLE_QUERY } from '@/lib/graphql/auth'
import { GET_API_KEYS } from '@/lib/graphql/api-keys'
import { gql } from "@apollo/client"
import { copyToClipboard } from '@/lib/utils'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { CoinIcon } from '@/components/ui/CoinIcon'
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { getCurrencySymbol } from '@/lib/currency-utils'

// Add query for current user
const GET_CURRENT_USER = gql`
  query Me {
    me {
      id
      currency
    }
  }
`;

// Update deposit addresses query to remove userId
const GET_DEPOSIT_ADDRESSES = gql`
  query GetDepositAddresses {
    getDepositAddresses {
      id
      currency
      network
      address
      isActive
    }
  }
`;

export default function DashboardPage() {
  const [selectedCurrency, setSelectedCurrency] = useState('BTC')
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [openTooltip, setOpenTooltip] = useState<string | null>(null)
  
  const { data: userData } = useQuery(GET_CURRENT_USER);
  const userCurrency = userData?.me?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(userCurrency);
  
  const { data: balanceData, loading: balanceLoading } = useQuery(GET_BALANCE_QUERY, {
    fetchPolicy: 'network-only',
  })

  const { data: billingData, loading: billingLoading } = useQuery(GET_BILLING_CYCLE_QUERY, {
    fetchPolicy: 'network-only',
  })

  const { data: apiKeysData, loading: apiKeysLoading } = useQuery(GET_API_KEYS, {
    fetchPolicy: 'network-only',
  })

  // Update deposit addresses query to remove userId parameter
  const { data: depositAddressData, loading: loadingAddresses } = useQuery(GET_DEPOSIT_ADDRESSES, {
    fetchPolicy: 'network-only'
  });

  // Get selected address
  const selectedAddress = depositAddressData?.getDepositAddresses?.find(
    (addr: any) => addr.currency === selectedCurrency && addr.network === selectedNetwork
  )?.address || "";

  // Get available networks for selected currency
  const availableNetworks = depositAddressData?.getDepositAddresses
    ?.filter((addr: any) => addr.currency === selectedCurrency)
    .map((addr: any) => ({
      value: addr.network,
      label: addr.network,
      icon: <CoinIcon chain={addr.currency} size={16} />
    })) || [];

  // Get unique currencies
  const availableCurrencies = Array.from(new Set(
    depositAddressData?.getDepositAddresses?.map((addr: any) => addr.currency) || []
  )).map((currency) => ({
    value: currency as string,
    label: currency as string,
    icon: <CoinIcon chain={currency as string} size={16} />
  }));

  // Set first available network when currency changes
  useEffect(() => {
    if (availableNetworks.length > 0 && !selectedNetwork) {
      setSelectedNetwork(availableNetworks[0].value);
    }
  }, [selectedCurrency, availableNetworks]);

  const getFormattedCurrencyName = (currency: string, network: string) => {
    return `${currency} (${network})`;
  }

  // Calculate billing cycle percentage
  const billingPercentage = billingData?.getBillingCycle 
    ? (billingData.getBillingCycle.current / billingData.getBillingCycle.limit) * 100 
    : 0

  // Function to handle tooltip clicks
  const handleTooltipClick = (tooltipId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    if (openTooltip === tooltipId) {
      setOpenTooltip(null) // Close if already open
    } else {
      setOpenTooltip(tooltipId) // Open the clicked tooltip
    }
  }

  // Close tooltip when clicking outside
  const handleClickOutside = () => {
    setOpenTooltip(null)
  }

  // Tooltip component for consistent design
  const Tooltip = ({ id, content, position = 'right' }: { id: string, content: string, position?: 'top' | 'right' | 'bottom' | 'left' }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    const getPositionClasses = () => {
      switch (position) {
        case 'top':
          return 'bottom-full left-0 mb-2';
        case 'bottom':
          return 'top-full left-0 mt-2';
        case 'left':
          return 'right-full top-0 -translate-y-1/4 mr-2';
        case 'right':
          return 'left-full top-0 -translate-y-1/4 ml-2';
        default:
          return 'left-full top-0 -translate-y-1/4 ml-2';
      }
    };

    if (!mounted) {
      return (
        <div className="relative inline-block">
          <button className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors duration-200">
            <Info className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="relative inline-block" ref={tooltipRef}>
        <button
          onClick={(e) => handleTooltipClick(id, e)}
          className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors duration-200"
        >
          <Info className="h-4 w-4" />
        </button>
        {openTooltip === id && (
          <div className={`absolute z-50 ${getPositionClasses()}`}>
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 w-64">
              <div className="flex items-start gap-2.5">
                <div className="shrink-0 p-1.5 rounded-full bg-[#18B69B]/10">
                  <Info className="h-3.5 w-3.5 text-[#18B69B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-600 text-[13px] leading-relaxed">
                    {content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6" onClick={handleClickOutside}>
      {/* Deposit Info */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-[#18B69B]" />
          <h2 className="text-[15px] font-medium text-gray-800">Deposit Info</h2>
          <Tooltip 
            id="deposit-info"
            content={`Send cryptocurrency to this address to fund your account. Minimum deposit is ${currencySymbol}10.`}
            position="right"
          />
        </div>
        <div className="bg-white rounded-lg border border-gray-200">
          {loadingAddresses ? (
            <div className="flex items-center justify-center h-[140px]">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : depositAddressData?.getDepositAddresses?.length > 0 ? (
            <div>
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-[#18B69B]/10 flex items-center justify-center">
                      <Wallet className="h-3.5 w-3.5 text-[#18B69B]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <CustomSelect
                        value={selectedCurrency}
                        onChange={(value) => {
                          setSelectedCurrency(value);
                          setSelectedNetwork('');
                        }}
                        options={availableCurrencies}
                        placeholder="Select currency"
                        className="w-[120px]"
                      />
                      <CustomSelect
                        value={selectedNetwork}
                        onChange={setSelectedNetwork}
                        options={availableNetworks}
                        placeholder="Select network"
                        className="w-[150px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Info className="h-3.5 w-3.5" />
                    <span>Send only {getFormattedCurrencyName(selectedCurrency, selectedNetwork)} to this address (min. {currencySymbol}10)</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded border border-gray-100">
                    <code className="flex-1 text-[13px] font-mono text-gray-600 break-all">
                      {selectedAddress}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedAddress, 'Deposit address copied to clipboard!')}
                      className="shrink-0 p-1.5 rounded transition-all text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <p className="text-[12px] text-gray-500">
                    Your deposit will be credited automatically after network confirmation
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[140px]">
              <p className="text-[13px] text-gray-500">No deposit addresses available</p>
            </div>
          )}
        </div>
      </section>

      {/* Statistics */}
      <section>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-[#18B69B]" />
          <h2 className="text-base sm:text-lg font-medium">Statistics</h2>
          <Tooltip 
            id="statistics"
            content="Real-time statistics showing your account balance and billing cycle information."
            position="right"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Balance Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Balance</CardTitle>
              <Tooltip 
                id="balance"
                content="Your current available balance. This includes all deposits and winnings minus withdrawals."
                position="left"
              />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-[#18B69B] text-xl">{currencySymbol}</span>
                {balanceLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#18B69B]" />
                  </div>
                ) : (
                  <span className="text-2xl font-semibold text-gray-900">
                    {currencySymbol}{balanceData?.getBalance.toFixed(2) || '0.00'}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing Cycle Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Current Billing Cycle</CardTitle>
              <Tooltip 
                id="billing-cycle"
                content="Current billing cycle amount. This resets every 3 days."
                position="left"
              />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                {billingLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#18B69B]" />
                  </div>
                ) : (
                  <span className="text-2xl font-semibold text-gray-900">
                    {currencySymbol}{billingData?.getBillingCycle?.current.toFixed(2) || '0.00'}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Billing Cycle Limit Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Billing Cycle Limit Reached (%)</CardTitle>
              <Tooltip 
                id="billing-limit"
                content="Percentage of your billing cycle limit that has been reached."
                position="left"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#18B69B] transition-all duration-500" 
                    style={{ width: `${Math.min(billingPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {billingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#18B69B]" />
                    ) : (
                      `${billingPercentage.toFixed(1)}%`
                    )}
                  </span>
                  <span className="text-gray-500">
                    Limit: {currencySymbol}{billingData?.getBillingCycle?.limit.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User General Info */}
      <section>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <User className="h-4 sm:h-5 w-4 sm:w-5 text-[#18B69B]" />
          <h2 className="text-base sm:text-lg font-medium">User General Info</h2>
          <Tooltip 
            id="user-info"
            content="Overview of your account settings and API key information."
            position="right"
          />
        </div>
        <div className="bg-white rounded-lg divide-y divide-gray-200 border border-gray-200">
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Info className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-medium mb-1">Billing Method: GGR Billing - billed per 3 days (limit)</h3>
                <p className="text-xs sm:text-sm text-gray-600">GGR is billed every 3 days from your account balance, make sure it is sufficient.</p>
              </div>
              <Tooltip 
                id="ggr-info"
                content="GGR (Gross Gaming Revenue) is calculated based on your gaming activity. Ensure your balance covers the billing cycle to avoid service interruption."
                position="left"
              />
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Key className="h-4 sm:h-5 w-4 sm:w-5 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-medium mb-1">
                  {apiKeysLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Amount of API Keys: ${apiKeysData?.getApiKeys?.length || 0}`
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {apiKeysData?.getApiKeys?.length >= 3 
                    ? "You have reached the maximum number of API keys."
                    : "Feel free to ask support additional api keys for your integration."
                  }
                </p>
              </div>
              <Tooltip 
                id="api-keys"
                content="API keys are used to authenticate your requests. Each key can be configured with different permissions and rate limits."
                position="left"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

