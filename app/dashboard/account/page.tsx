"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@apollo/client"
import { 
  User,
  Settings,
  Plus,
  X,
  Globe,
  Percent,
  Calendar,
  Users,
  DollarSign,
  Share2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wallet,
  Mail,
  Link,
  Shield,
  Power,
  RefreshCw,
  MoreVertical,
  Search,
  Filter,
  Copy,
  ExternalLink
} from "lucide-react"
import { gql } from "@apollo/client"
import { toast } from 'sonner'
import { getCurrencySymbol } from '@/lib/currency-utils'

const GET_AGENTS = gql`
  query GetAgents {
    getAgents {
      id
      username
      email
      currency
      callbackUrl
      ggrPercentage
      balance
      agentSettings {
        profitShare
      }
      status
      createdAt
    }
  }
`;

const CREATE_AGENT = gql`
  mutation CreateAgent($input: CreateAgentInput!) {
    createAgent(input: $input) {
      success
      agent {
        id
        username
        email
      }
      error
    }
  }
`;

const UPDATE_AGENT_BALANCE = gql`
  mutation UpdateAgentBalance($agentId: ID!, $amount: Float!) {
    updateAgentBalance(agentId: $agentId, amount: $amount)
  }
`;

const TOGGLE_AGENT_STATUS = gql`
  mutation ToggleAgentStatus($agentId: ID!) {
    toggleAgentStatus(agentId: $agentId) {
      id
      status
    }
  }
`;

const GET_BALANCE = gql`
  query GetBalance {
    getBalance
  }
`;

const GET_EXCHANGE_RATES = gql`
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

const GET_CURRENT_USER = gql`
  query Me {
    me {
      id
      currency
    }
  }
`;

const convertCurrency = (amount: number, from: string, to: string, rates: any) => {
  if (from === to) return amount;
  
  // Convert to USD first (divide by source currency rate)
  const amountInUSD = from === 'USD' ? amount : amount / rates[from];
  
  // Then convert from USD to target currency (multiply by target currency rate)
  return to === 'USD' ? amountInUSD : amountInUSD * rates[to];
};

export default function AccountPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [showCallbackModal, setShowCallbackModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    currency: 'USD',
    callbackUrl: '',
    ggrPercentage: 0,
    agentSettings: {
      profitShare: 0
    }
  })

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$", flag: "https://flagcdn.com/w40/us.png" },
    { code: "EUR", name: "Euro", symbol: "€", flag: "https://flagcdn.com/w40/eu.png" },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "https://flagcdn.com/w40/gb.png" },
    { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "https://flagcdn.com/w40/br.png" },
    { code: "AUD", name: "Australian Dollar", symbol: "AU$", flag: "https://flagcdn.com/w40/au.png" },
    { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "https://flagcdn.com/w40/ca.png" },
    { code: "NZD", name: "New Zealand Dollar", symbol: "$", flag: "https://flagcdn.com/w40/nz.png" },
    { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "https://flagcdn.com/w40/tr.png" },
    { code: "TND", name: "Tunisian Dinar", symbol: "DT", flag: "https://flagcdn.com/w40/tn.png" }
  ];

  const { data, loading, refetch } = useQuery(GET_AGENTS)
  const [createAgent] = useMutation(CREATE_AGENT)
  const [updateAgentBalance] = useMutation(UPDATE_AGENT_BALANCE)
  const [toggleAgentStatus] = useMutation(TOGGLE_AGENT_STATUS)
  const { data: balanceData } = useQuery(GET_BALANCE)
  const { data: exchangeRatesData } = useQuery(GET_EXCHANGE_RATES);
  const rates = exchangeRatesData?.exchangeRates;

  const { data: userData } = useQuery(GET_CURRENT_USER);
  const userCurrency = userData?.me?.currency || 'USD';

  // Filter agents based on search term and status
  const filteredAgents = data?.getAgents.filter((agent: any) => {
    const matchesSearch = 
      agent.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' ? true : agent.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data } = await createAgent({
        variables: {
          input: formData
        }
      })

      if (data?.createAgent.success) {
        setShowCreateModal(false)
        refetch()
      }
    } catch (error) {
      console.error('Failed to create agent:', error)
    }
  }

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateAgentBalance({
        variables: {
          agentId: selectedAgent.id,
          amount: parseFloat(amount)
        },
        refetchQueries: [
          { query: GET_AGENTS },
          { query: GET_BALANCE }
        ]
      })
      setShowBalanceModal(false)
      setSelectedAgent(null)
      setAmount('')
    } catch (error) {
      console.error('Failed to update balance:', error)
    }
  }

  const handleToggleStatus = async (agent: any) => {
    try {
      await toggleAgentStatus({
        variables: {
          agentId: agent.id
        }
      })
      refetch()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // API call to update account settings
      // Replace with your actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Account settings updated successfully');
    } catch (error) {
      console.error('Failed to update account settings:', error);
      toast.error('Failed to update account settings');
    }
  };

  const handleCallbackUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({...formData, callbackUrl: url});
    
    // Basic URL validation
    if (url && !url.startsWith('http')) {
      toast.error('Callback URL must start with http:// or https://');
    }
  };

  const handleGgrPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value < 0 || value > 100) {
      toast.error('GGR percentage must be between 0 and 100');
      return;
    }
    setFormData({...formData, ggrPercentage: value});
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const renderTotalBalance = (agents: any[]) => {
    if (!agents || agents.length === 0) return `${getCurrencySymbol(userCurrency)}0.00`;
    
    if (!rates) {
      console.log("Exchange rates not available");
      return `${getCurrencySymbol(userCurrency)}0.00`;
    }

    let totalInUserCurrency = 0;
    
    agents.forEach(agent => {
      if (agent.balance) {
        const amountInUserCurrency = convertCurrency(agent.balance, agent.currency, userCurrency, rates);
        totalInUserCurrency += amountInUserCurrency;
      }
    });

    return `${getCurrencySymbol(userCurrency)}${totalInUserCurrency.toFixed(2)}`;
  };

  return (
    <div className="p-4 sm:p-6 bg-[#F8F9FC]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-[#18B69B]/10 flex items-center justify-center">
            <Users className="h-4.5 w-4.5 text-[#18B69B]" />
          </div>
          <h1 className="text-[#2D3359] text-xl sm:text-2xl font-semibold">Agent Management</h1>
        </div>
        <div className="flex items-center gap-2 text-[#858796]">
          <span className="text-xs sm:text-sm">Manage your agents and their balances</span>
        </div>
      </div>

      {/* Balance Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm text-gray-600">Total Agents</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900">{data?.getAgents.length || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-green-500" />
            </div>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm text-gray-600">Total Balance</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900">
              {renderTotalBalance(data?.getAgents || [])}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
            <Power className="h-4 w-4 text-green-500" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm text-gray-600">Active Agents</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900">
              {data?.getAgents.filter((agent: any) => agent.status === 'active').length || 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
              <Percent className="h-4 w-4 text-orange-500" />
            </div>
            <RefreshCw className="h-4 w-4 text-gray-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs sm:text-sm text-gray-600">Avg. GGR %</p>
            <p className="text-lg sm:text-xl font-semibold text-gray-900">
              {data?.getAgents.length 
                ? (data.getAgents.reduce((sum: number, agent: any) => sum + agent.ggrPercentage, 0) / data.getAgents.length).toFixed(1)
                : '0.0'}%
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#18B69B] focus:ring-2 focus:ring-[#18B69B]/20"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
              className="h-9 pl-9 pr-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#18B69B] focus:ring-2 focus:ring-[#18B69B]/20 appearance-none bg-white w-full sm:w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="h-9 px-3 text-sm text-white bg-[#18B69B] rounded-lg hover:bg-[#18B69B]/90 flex items-center gap-2 transition-all shadow-sm hover:shadow w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add Agent</span>
        </button>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead className="bg-[#18B69B]/5 border-y border-gray-200">
              <tr>
                <th className="text-left whitespace-nowrap px-4 py-3 w-[220px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <User className="h-3.5 w-3.5" />
                    Agent
                  </div>
                </th>
                <th className="text-left whitespace-nowrap px-4 py-3 w-[200px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </div>
                </th>
                <th className="text-left whitespace-nowrap px-4 py-3 w-[100px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <DollarSign className="h-3.5 w-3.5" />
                    Currency
                  </div>
                </th>
                <th className="text-left whitespace-nowrap px-4 py-3 w-[120px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <Wallet className="h-3.5 w-3.5" />
                    Balance
                  </div>
                </th>
                <th className="text-left whitespace-nowrap px-4 py-3 w-[100px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <Percent className="h-3.5 w-3.5" />
                    GGR %
                  </div>
                </th>
                <th className="text-left whitespace-nowrap px-4 py-3 w-[120px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <Share2 className="h-3.5 w-3.5" />
                    Profit Share
                  </div>
                </th>
                <th className="text-left whitespace-nowrap px-4 py-3 w-[120px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <Shield className="h-3.5 w-3.5" />
                    Status
                  </div>
                </th>
                <th className="text-right whitespace-nowrap px-4 py-3 w-[120px]">
                  <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <Settings className="h-3.5 w-3.5" />
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 min-h-[200px]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading agents...
                    </div>
                  </td>
                </tr>
              ) : filteredAgents?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 min-h-[200px]">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-gray-400" />
                      <p>No agents found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAgents?.map((agent: any) => (
                  <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#18B69B]/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-[#18B69B]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{agent.username}</span>
                          <span className="text-xs text-gray-500">ID: {agent.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{agent.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{agent.currency}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getCurrencySymbol(agent.currency)}{agent.balance.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{agent.ggrPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{agent.agentSettings.profitShare}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        agent.status === 'active' 
                          ? 'text-green-700 bg-green-50' 
                          : 'text-red-700 bg-red-50'
                      }`}>
                        • {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-[120px]">
                      <div className="flex items-center justify-end">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedAgent?.id === agent.id) {
                                setSelectedAgent(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const scrollY = window.scrollY || document.documentElement.scrollTop;
                                setSelectedAgent({
                                  ...agent,
                                  dropdownPosition: {
                                    top: rect.bottom + scrollY,
                                    left: rect.right - 160,
                                    width: 160
                                  }
                                });
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {selectedAgent?.id === agent.id && selectedAgent.dropdownPosition && (
                            <div 
                              className="fixed w-40 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                top: `${selectedAgent.dropdownPosition.top}px`,
                                left: `${selectedAgent.dropdownPosition.left}px`,
                                width: `${selectedAgent.dropdownPosition.width}px`
                              }}
                            >
                              <div className="py-1" role="menu">
                                <button
                                  onClick={() => {
                                    setShowBalanceModal(true);
                                    setSelectedAgent(agent);
                                  }}
                                  className="flex w-full items-center px-3 py-2 text-sm text-gray-600 hover:bg-[#18B69B]/10 hover:text-[#18B69B] rounded-md transition-all duration-200 group"
                                  role="menuitem"
                                >
                                  <Wallet className="h-4 w-4 mr-2 text-gray-400 group-hover:text-[#18B69B]" />
                                  Balance
                                </button>
                                <button
                                  onClick={() => {
                                    setShowCallbackModal(true);
                                    setSelectedAgent(agent);
                                  }}
                                  className="flex w-full items-center px-3 py-2 text-sm text-gray-600 hover:bg-[#18B69B]/10 hover:text-[#18B69B] rounded-md transition-all duration-200 group"
                                  role="menuitem"
                                >
                                  <Link className="h-4 w-4 mr-2 text-gray-400 group-hover:text-[#18B69B]" />
                                  Details
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[#e3e6f0]">
              <div>
                <h2 className="text-lg font-semibold text-[#5a5c69]">Create New Agent</h2>
                <p className="text-sm text-[#858796] mt-1">Enter agent details and settings</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-[#858796]" />
              </button>
            </div>
            <form onSubmit={handleCreateAgent} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5a5c69] mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#5a5c69] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5a5c69] mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5a5c69] mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>{currency.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#5a5c69] mb-1">Callback URL</label>
                  <input
                    type="url"
                    value={formData.callbackUrl}
                    onChange={handleCallbackUrlChange}
                    className="w-full px-3 py-2 text-sm border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5a5c69] mb-1">GGR Percentage</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.ggrPercentage}
                    onChange={handleGgrPercentageChange}
                    className="w-full px-3 py-2 text-sm border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5a5c69] mb-1">Profit Share (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.agentSettings.profitShare}
                    onChange={(e) => setFormData({
                      ...formData,
                      agentSettings: {
                        ...formData.agentSettings,
                        profitShare: Number(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 text-sm border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#e3e6f0]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-[#18B69B] rounded hover:bg-[#18B69B]/90 transition-colors"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Update Modal */}
      {showBalanceModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[#e3e6f0]">
              <div>
                <h2 className="text-lg font-semibold text-[#5a5c69]">Update Agent Balance</h2>
                <p className="text-sm text-[#858796] mt-1">
                  Your balance: ${balanceData?.getBalance.toFixed(2) || '0.00'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowBalanceModal(false)
                  setSelectedAgent(null)
                  setAmount('')
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-[#858796]" />
              </button>
            </div>
            <form onSubmit={handleUpdateBalance} className="p-4">
              <div>
                <label className="block text-sm font-medium text-[#5a5c69] mb-1">Amount</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all"
                  placeholder="Enter amount (use negative for withdrawal)"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#e3e6f0]">
                <button
                  type="button"
                  onClick={() => {
                    setShowBalanceModal(false)
                    setSelectedAgent(null)
                    setAmount('')
                  }}
                  className="px-4 py-2 text-sm text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-[#18B69B] rounded hover:bg-[#18B69B]/90 transition-colors"
                >
                  Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Callback URL Modal */}
      {showCallbackModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Callback URL Details</h3>
                <button
                  onClick={() => {
                    setShowCallbackModal(false)
                    setSelectedAgent(null)
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Username
                  </label>
                  <p className="text-sm text-gray-900">{selectedAgent.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Callback URL
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900 flex-1 break-all">{selectedAgent.callbackUrl}</p>
                    <button
                      onClick={() => copyToClipboard(selectedAgent.callbackUrl)}
                      className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <Copy className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowCallbackModal(false)
                    setSelectedAgent(null)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 