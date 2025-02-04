"use client"

import { useState } from "react"
import { useQuery, gql } from "@apollo/client"
import { 
  Search, 
  ChevronDown, 
  Eye,
  ArrowUpDown,
  ChevronRight,
  Filter,
  Copy,
  MoreVertical,
  RefreshCw,
  Download,
  FileText,
  GamepadIcon,
  Hash,
  Layers,
  Shield,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Play,
  Settings,
  Tag
} from "lucide-react"

const GET_GAMES = gql`
  query GetGames($filters: GameFilters, $page: Int, $limit: Int) {
    games(filters: $filters, page: $page, limit: $limit) {
      games {
        id
        name
        provider
        type
        category
        status
        image
        mobile
        new
        has_jackpot
        freerounds_supported
        featurebuy_supported
        createdAt
      }
      totalGames
      totalPages
    }
    gameCategories
  }
`

interface Game {
  id: string
  name: string
  provider: string
  type: string
  category: string
  status: string
  image?: string
  mobile: boolean
  new: boolean
  has_jackpot: boolean
  freerounds_supported: boolean
  featurebuy_supported: boolean
  createdAt: string
}

interface GamesResponse {
  games: Game[]
  totalGames: number
  totalPages: number
}

export default function GamesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedProvider, setSelectedProvider] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const { loading, error, data, refetch } = useQuery(GET_GAMES, {
    variables: {
      filters: {
        search: searchQuery || undefined,
        provider: selectedProvider !== "all" ? selectedProvider : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined
      },
      page: currentPage,
      limit: itemsPerPage
    }
  })

  const gamesData: GamesResponse = data?.games || { games: [], totalGames: 0, totalPages: 0 }
  const categories: string[] = data?.gameCategories || []

  const handleRefresh = () => {
    refetch()
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-[#5a5c69] text-xl sm:text-2xl font-normal tracking-[-0.5px] flex items-center gap-2">
              <GamepadIcon className="h-6 w-6 text-[#18B69B]" />
              Games
              <ChevronRight className="h-5 w-5 text-[#858796]" />
              <span className="text-base text-[#858796] font-light">Management</span>
            </h1>
            <div className="flex items-center gap-2">
              <button className="h-9 px-4 flex items-center gap-2 text-[13px] font-medium text-white bg-[#18B69B] rounded hover:bg-[#18B69B]/90 transition-colors">
                <Play className="h-4 w-4" />
                Launch Game
              </button>
              <button className="h-9 px-4 flex items-center gap-2 text-[13px] font-medium text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg border border-[#e3e6f0] shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-[320px]">
                <input
                  type="text"
                  placeholder="Search by ID, Name, Provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 h-[38px] text-[13px] border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all placeholder:text-[#858796]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858796]" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="h-[38px] px-3 text-[13px] text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all min-w-[140px]"
                >
                  <option value="all">All Providers</option>
                  <option value="tbs2">TBS2</option>
                  <option value="spingate">Spingate</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-[38px] px-3 text-[13px] text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all min-w-[140px]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-[38px] px-3 text-[13px] text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all min-w-[140px]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleRefresh}
                className="h-[38px] w-[38px] flex items-center justify-center text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button className="h-[38px] w-[38px] flex items-center justify-center text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg border border-[#e3e6f0] shadow-sm">
            <div className="flex items-center justify-center h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18B69B]"></div>
                <p className="text-[#858796] text-sm">Loading games...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-lg border border-[#e3e6f0] shadow-sm">
            <div className="flex items-center justify-center h-[400px]">
              <div className="flex flex-col items-center gap-4 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-red-500 font-medium mb-1">Error loading games</p>
                  <p className="text-[#858796] text-sm">{error.message}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  className="h-9 px-4 flex items-center gap-2 text-[13px] font-medium text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg border border-[#e3e6f0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#18B69B]/5 border-y border-[#e3e6f0]">
                    <th className="h-10 px-4 text-left text-[11px] font-semibold text-[#18B69B] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" />
                        ID
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </div>
                    </th>
                    <th className="h-10 px-4 text-left text-[11px] font-semibold text-[#18B69B] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <GamepadIcon className="h-3.5 w-3.5" />
                        Name
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </div>
                    </th>
                    <th className="h-10 px-4 text-left text-[11px] font-semibold text-[#18B69B] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        Provider
                      </div>
                    </th>
                    <th className="h-10 px-4 text-left text-[11px] font-semibold text-[#18B69B] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        Category
                      </div>
                    </th>
                    <th className="h-10 px-4 text-left text-[11px] font-semibold text-[#18B69B] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <GamepadIcon className="h-3.5 w-3.5" />
                        Type
                      </div>
                    </th>
                    <th className="h-10 px-4 text-left text-[11px] font-semibold text-[#18B69B] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        Status
                      </div>
                    </th>
                    <th className="h-10 px-4 text-left text-[11px] font-semibold text-[#18B69B] uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gamesData.games.map((game: Game, index: number) => (
                    <tr 
                      key={game.id} 
                      className={`
                        h-[46px] border-b border-[#e3e6f0] last:border-0
                        hover:bg-[#f8f9fc] transition-colors
                        ${index % 2 === 0 ? 'bg-white' : 'bg-[#fcfcfd]'}
                      `}
                    >
                      <td className="px-4 text-[13px] font-medium text-[#18B69B] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {game.id}
                          <button className="group p-1 hover:bg-[#18B69B]/10 rounded transition-colors">
                            <Copy className="h-3.5 w-3.5 text-[#858796] group-hover:text-[#18B69B] transition-colors" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 text-[13px] text-[#858796] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {game.image ? (
                            <img 
                              src={game.image} 
                              alt={game.name}
                              className="h-7 w-7 rounded object-cover"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded bg-[#18B69B]/10 flex items-center justify-center">
                              <GamepadIcon className="h-3.5 w-3.5 text-[#18B69B]" />
                            </div>
                          )}
                          <span>{game.name}</span>
                          {game.new && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 rounded">New</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 text-[13px] text-[#858796] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-[#858796]" />
                          {game.provider}
                        </div>
                      </td>
                      <td className="px-4 text-[13px] text-[#858796] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5 text-[#858796]" />
                          {game.category || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 text-[13px] text-[#858796] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <GamepadIcon className="h-3.5 w-3.5 text-[#858796]" />
                          {game.type || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center h-[20px] px-2.5 text-[11px] font-medium rounded-full ${
                          game.status === 'active' 
                            ? 'text-[#18B69B] bg-[#18B69B]/10'
                            : 'text-red-700 bg-red-50'
                        }`}>
                          <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                            game.status === 'active'
                              ? 'bg-[#18B69B]'
                              : 'bg-red-500'
                          }`} />
                          {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button className="group p-1.5 hover:bg-[#18B69B]/10 rounded transition-colors">
                            <Play className="h-3.5 w-3.5 text-[#858796] group-hover:text-[#18B69B] transition-colors" />
                          </button>
                          <button className="group p-1.5 hover:bg-[#18B69B]/10 rounded transition-colors">
                            <Eye className="h-3.5 w-3.5 text-[#858796] group-hover:text-[#18B69B] transition-colors" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-[#e3e6f0]">
              <div className="text-[13px] text-[#858796] order-2 sm:order-1">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, gamesData.totalGames)} of {gamesData.totalGames} entries
              </div>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`h-9 px-3 flex items-center gap-1 text-[13px] font-medium rounded
                    ${currentPage === 1
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-[#858796] bg-white border border-[#e3e6f0] hover:bg-gray-50'
                    }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                {Array.from({ length: gamesData.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    const distance = Math.abs(page - currentPage);
                    return distance === 0 || distance === 1 || page === 1 || page === gamesData.totalPages;
                  })
                  .map((page, index, array) => {
                    if (index > 0 && array[index - 1] !== page - 1) {
                      return (
                        <span key={`ellipsis-${page}`} className="text-[#858796]">...</span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`h-9 w-9 flex items-center justify-center text-[13px] font-medium rounded
                          ${currentPage === page
                            ? 'text-white bg-[#18B69B]'
                            : 'text-[#858796] bg-white border border-[#e3e6f0] hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === gamesData.totalPages}
                  className={`h-9 px-3 flex items-center gap-1 text-[13px] font-medium rounded
                    ${currentPage === gamesData.totalPages
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      : 'text-[#858796] bg-white border border-[#e3e6f0] hover:bg-gray-50'
                    }`}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 