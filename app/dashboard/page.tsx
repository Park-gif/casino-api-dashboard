"use client"

import { Info, Copy, User, Key, Clock, Loader2, LayoutDashboard, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, BarChart3, RefreshCw } from "lucide-react"
import { useState } from "react"
import { useQuery } from '@apollo/client'
import { GET_BALANCE_QUERY, GET_BILLING_CYCLE_QUERY } from '@/lib/graphql/auth'
import { GET_API_KEYS } from '@/lib/graphql/api-keys'
import { gql } from "@apollo/client"

// Add query for current user
const GET_CURRENT_USER = gql`
  query Me {
    me {
      id
    }
  }
`;

// Update deposit addresses query to use current user ID
const GET_DEPOSIT_ADDRESSES = gql`
  query GetDepositAddresses($userId: ID!) {
    getDepositAddresses(userId: $userId) {
      id
      chain
      address
      isActive
    }
  }
`;

export default function DashboardPage() {
  const [copied, setCopied] = useState(false)
  const [selectedChain, setSelectedChain] = useState('ETH')
  
  const { data: userData } = useQuery(GET_CURRENT_USER);
  
  const { data: balanceData, loading: balanceLoading } = useQuery(GET_BALANCE_QUERY, {
    fetchPolicy: 'network-only',
  })

  const { data: billingData, loading: billingLoading } = useQuery(GET_BILLING_CYCLE_QUERY, {
    fetchPolicy: 'network-only',
  })

  const { data: apiKeysData, loading: apiKeysLoading } = useQuery(GET_API_KEYS, {
    fetchPolicy: 'network-only',
  })

  // Update deposit addresses query to include userId
  const { data: depositAddressData, loading: loadingAddresses } = useQuery(GET_DEPOSIT_ADDRESSES, {
    variables: { userId: userData?.me?.id },
    skip: !userData?.me?.id,
  });

  // Get selected address
  const selectedAddress = depositAddressData?.getDepositAddresses?.find(
    (addr: any) => addr.chain === selectedChain
  )?.address || "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(selectedAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Calculate billing cycle percentage
  const billingPercentage = billingData?.getBillingCycle 
    ? (billingData.getBillingCycle.current / billingData.getBillingCycle.limit) * 100 
    : 0

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Deposit Info */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-[#18B69B]" />
          <h2 className="text-[15px] font-medium text-gray-800">Deposit Info</h2>
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
                    <div className="relative">
                      <select
                        value={selectedChain}
                        onChange={(e) => setSelectedChain(e.target.value)}
                        className="appearance-none bg-gray-50 text-[13px] font-medium text-gray-700 pl-3 pr-8 py-1.5 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#18B69B] hover:border-gray-300 transition-colors"
                      >
                        {depositAddressData.getDepositAddresses.map((addr: any) => (
                          <option key={addr.id} value={addr.chain}>
                            {addr.chain === 'ETH' ? 'Ethereum (ERC20)' : addr.chain}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[12px] text-gray-500">Active</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <Info className="h-3.5 w-3.5" />
                    <span>Send only {selectedChain} tokens to this address (min. $10)</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded border border-gray-100">
                    <code className="flex-1 text-[13px] font-mono text-gray-600 break-all">
                      {selectedAddress}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className={`shrink-0 p-1.5 rounded transition-all ${
                        copied 
                          ? 'bg-[#18B69B]/10 text-[#18B69B]' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
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
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600">Balance</div>
              <button className="text-gray-400 hover:text-gray-500">
                <svg className="h-3 sm:h-4 w-3 sm:w-4" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="1" fill="currentColor" />
                  <circle cx="12" cy="8" r="1" fill="currentColor" />
                  <circle cx="4" cy="8" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-green-500 text-xl sm:text-2xl font-semibold">$</span>
                {balanceLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#18B69B]" />
                  </div>
                ) : (
                  <span className="text-xl sm:text-2xl font-semibold">
                    {balanceData?.getBalance.toFixed(2) || '0.00'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600">Current Billing Cycle ($)</div>
              <button className="text-gray-400 hover:text-gray-500">
                <svg className="h-3 sm:h-4 w-3 sm:w-4" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="1" fill="currentColor" />
                  <circle cx="12" cy="8" r="1" fill="currentColor" />
                  <circle cx="4" cy="8" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
                {billingLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#18B69B]" />
                  </div>
                ) : (
                  <span className="text-xl sm:text-2xl font-semibold">
                    {billingData?.getBillingCycle?.current.toFixed(2) || '0.00'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600">Billing Cycle Limit Reached (%)</div>
              <button className="text-gray-400 hover:text-gray-500">
                <svg className="h-3 sm:h-4 w-3 sm:w-4" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="1" fill="currentColor" />
                  <circle cx="12" cy="8" r="1" fill="currentColor" />
                  <circle cx="4" cy="8" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
            <div className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#18B69B] transition-all duration-500" 
                      style={{ width: `${Math.min(billingPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">
                      {billingLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#18B69B]" />
                      ) : (
                        `${billingPercentage.toFixed(1)}%`
                      )}
                    </span>
                    <span className="text-gray-500">
                      Limit: ${billingData?.getBillingCycle?.limit.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User General Info */}
      <section>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <User className="h-4 sm:h-5 w-4 sm:w-5 text-[#18B69B]" />
          <h2 className="text-base sm:text-lg font-medium">User General Info</h2>
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
              <button className="text-gray-400 hover:text-gray-500 flex-shrink-0">
                <Info className="h-4 sm:h-5 w-4 sm:w-5" />
              </button>
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
              <button className="text-gray-400 hover:text-gray-500 flex-shrink-0">
                <Info className="h-4 sm:h-5 w-4 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

