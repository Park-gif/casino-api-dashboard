"use client"

import { useState, useEffect } from "react"
import { useQuery, gql, useMutation } from "@apollo/client"
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
  Tag,
  Building2,
  Clock
} from "lucide-react"
import { copyToClipboard } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import Image from 'next/image'

const GET_GAMES = gql`
  query GetGames($filters: GameFilters, $page: Int, $limit: Int) {
    games(filters: $filters, page: $page, limit: $limit) {
      games {
        id
        id_hash
        gameId
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

const LAUNCH_GAME = gql`
  mutation LaunchGame($gameId: ID!) {
    launchGame(gameId: $gameId) {
      url
      success
      error
    }
  }
`

const GET_ALL_GAMES = gql`
  query GetAllGames {
    games(limit: 1000000) {
      games {
        id
        id_hash
        gameId
        name
        provider
        type
        category
        status
        mobile
        new
        has_jackpot
        freerounds_supported
        featurebuy_supported
        createdAt
      }
      totalGames
    }
  }
`

interface Game {
  id: string
  id_hash: string
  gameId: string
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
  const [isChangingPage, setIsChangingPage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

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
    },
    notifyOnNetworkStatusChange: true,
    onCompleted: () => {
      // Loading süresini 300ms'ye indir
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
  })

  const [launchGame] = useMutation(LAUNCH_GAME)

  const { refetch: refetchAllGames } = useQuery(GET_ALL_GAMES, {
    skip: true // Başlangıçta çalıştırma
  })

  useEffect(() => {
    setIsLoading(loading)
  }, [loading])

  const gamesData: GamesResponse = data?.games || { games: [], totalGames: 0, totalPages: 0 }
  const categories: string[] = data?.gameCategories || []

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
    refetch()
  }, [searchQuery, selectedStatus, selectedProvider, selectedCategory])

  const handleRefresh = () => {
    setIsLoading(true)
    refetch()
  }

  const handlePageChange = async (newPage: number) => {
    setIsChangingPage(true)
    setCurrentPage(newPage)
    
    await refetch({
      page: newPage,
      limit: itemsPerPage,
      filters: {
        search: searchQuery || undefined,
        provider: selectedProvider !== "all" ? selectedProvider : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined
      }
    })

    // Pagination butonlarını 300ms disabled yap
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setIsChangingPage(false)
  }

  const handleLaunchGame = async (game: Game) => {
    try {
      setSelectedGame(game)
      const { data } = await launchGame({
        variables: {
          gameId: game.id
        }
      })

      if (data?.launchGame?.success) {
        toast.success('Game launched successfully')
        // Open in center of screen with specific dimensions
        const width = 1024;
        const height = 768;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(
          data.launchGame.url,
          '_blank',
          `width=${width},height=${height},left=${left},top=${top}`
        )
      } else {
        const errorMessage = data?.launchGame?.error || 'Failed to launch game'
        toast.error(errorMessage)
      }
    } catch (error: any) {
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || 'Failed to launch game'
      console.error('Failed to launch game:', errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    e.target.focus() // Keep focus on the input
  }

  const handleDownloadJSON = async () => {
    try {
      // Download butonunu disable et ve loading göster
      const downloadButton = document.querySelector('#downloadButton') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.innerHTML = '<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
      }

      // Tüm oyunları getir
      const { data: allGamesData } = await refetchAllGames();
      
      if (!allGamesData?.games?.games?.length) {
        throw new Error('No games data received');
      }

      // JSON formatına dönüştür
      const jsonData = {
        total: allGamesData.games.totalGames,
        games: allGamesData.games.games.map((game: Game) => ({
          id: game.id,
          id_hash: game.id_hash,
          name: game.name,
          provider: game.provider,
          type: game.type,
          category: game.category,
          status: game.status,
          mobile: game.mobile,
          new: game.new,
          has_jackpot: game.has_jackpot,
          freerounds_supported: game.freerounds_supported,
          featurebuy_supported: game.featurebuy_supported,
          createdAt: game.createdAt
        }))
      }

      // Kontrol et
      if (jsonData.games.length === 0) {
        throw new Error('No games found to download');
      }

      // JSON dosyasını oluştur ve indir
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `all_games_list_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`All games (${jsonData.games.length}) downloaded successfully`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to download games list')
    } finally {
      // Download butonunu reset et
      const downloadButton = document.querySelector('#downloadButton') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.innerHTML = '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
    }
  }

  if (error) {
    return (
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
    )
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
                  onChange={handleSearchChange}
                  autoFocus
                  className="w-full pl-9 pr-3 h-[38px] text-[13px] border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:ring-2 focus:ring-[#18B69B]/20 transition-all placeholder:text-[#858796]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#858796]" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  disabled={isLoading || loading}
                  className="h-[38px] px-3 text-[13px] text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all min-w-[140px] disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="all">All Providers</option>
                  <option value="tbs2">TBS2</option>
                  <option value="spingate">Spingate</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={isLoading || loading}
                  className="h-[38px] px-3 text-[13px] text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all min-w-[140px] disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={isLoading || loading}
                  className="h-[38px] px-3 text-[13px] text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all min-w-[140px] disabled:bg-gray-50 disabled:cursor-not-allowed"
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
                disabled={isLoading || loading}
                className="h-[38px] w-[38px] flex items-center justify-center text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                <RefreshCw className={`h-4 w-4 ${(isLoading || loading) ? 'animate-spin' : ''}`} />
              </button>
              <button 
                id="downloadButton"
                onClick={handleDownloadJSON}
                disabled={isLoading || loading}
                className="h-[38px] w-[38px] flex items-center justify-center text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                title="Download all games as JSON"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="min-w-full overflow-x-auto">
            <div className="min-w-[1000px]">
              <table className="w-full border-collapse">
                <thead className="bg-[#18B69B]/5 border-y border-[#e3e6f0] sticky top-0 z-10">
                  <tr className="h-11">
                    <th className="w-[180px] px-3 text-left whitespace-nowrap bg-[#18B69B]/5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#18B69B] uppercase w-full">
                        <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="flex-shrink-0">ID</span>
                        <ArrowUpDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                      </div>
                    </th>
                    <th className="w-[300px] px-3 text-left whitespace-nowrap bg-[#18B69B]/5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#18B69B] uppercase w-full">
                        <GamepadIcon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="flex-shrink-0">Game</span>
                      </div>
                    </th>
                    <th className="w-[120px] px-3 text-left whitespace-nowrap bg-[#18B69B]/5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#18B69B] uppercase w-full">
                        <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="flex-shrink-0">Provider</span>
                      </div>
                    </th>
                    <th className="w-[120px] px-3 text-left whitespace-nowrap bg-[#18B69B]/5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#18B69B] uppercase w-full">
                        <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="flex-shrink-0">Category</span>
                      </div>
                    </th>
                    <th className="w-[120px] px-3 text-left whitespace-nowrap bg-[#18B69B]/5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#18B69B] uppercase w-full">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="flex-shrink-0">Created</span>
                      </div>
                    </th>
                    <th className="w-[100px] px-3 text-left whitespace-nowrap bg-[#18B69B]/5">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#18B69B] uppercase w-full">
                        <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="flex-shrink-0">Status</span>
                      </div>
                    </th>
                    <th className="w-[100px] px-3 text-right whitespace-nowrap bg-[#18B69B]/5">
                      <div className="inline-flex items-center justify-end text-[11px] font-medium text-[#18B69B] uppercase w-full">
                        <span className="flex-shrink-0">Actions</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-100 ${isChangingPage || isLoading ? 'opacity-40' : ''}`}>
                  {!isChangingPage && gamesData.games.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-[400px] text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <GamepadIcon className="h-8 w-8 text-gray-300" />
                          <p className="text-gray-500 text-sm">No games found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    gamesData.games.map((game: Game) => (
                      <tr key={game.id} className="h-[46px] hover:bg-gray-50/50">
                        <td className="px-3 align-middle">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-[#18B69B] truncate">
                              {game.provider === 'spingate' ? game.id_hash : (game.provider === 'tbs2' ? game.gameId : game.id)}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(game.provider === 'spingate' ? game.id_hash : (game.provider === 'tbs2' ? game.gameId : game.id), 'Game ID copied to clipboard!')}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all flex-shrink-0"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-3 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="relative h-8 w-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                              {game.image ? (
                                <Image
                                  src={game.image}
                                  alt={game.name}
                                  className="object-cover"
                                  fill
                                  sizes="32px"
                                  priority={true}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <GamepadIcon className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] text-gray-900 font-medium truncate">{game.name}</span>
                              <span className="text-[11px] text-gray-500 truncate">{game.provider === 'spingate' ? game.id_hash : game.gameId}</span>
                            </div>
                            {game.new && (
                              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-[#18B69B] bg-[#18B69B]/10 rounded">
                                New
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 align-middle">
                          <span className="text-[13px] text-gray-600">{game.provider}</span>
                        </td>
                        <td className="px-3 align-middle">
                          <span className="text-[13px] text-gray-600">{game.category || '-'}</span>
                        </td>
                        <td className="px-3 align-middle">
                          <span className="text-[13px] text-gray-600">{game.createdAt}</span>
                        </td>
                        <td className="px-3 align-middle">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md ${
                            game.status === 'active'
                              ? 'text-[#18B69B] bg-[#18B69B]/5'
                              : 'text-red-600 bg-red-50'
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${
                              game.status === 'active' ? 'bg-[#18B69B]' : 'bg-red-500'
                            }`} />
                            {game.status === 'active' ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-3 align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleLaunchGame(game)}
                              className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] font-medium text-white bg-[#18B69B] rounded hover:bg-[#18B69B]/90 transition-colors"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Launch
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="border-t border-[#e3e6f0]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3">
            <div className="text-[13px] text-[#858796] order-2 sm:order-1">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, gamesData.totalGames)} of {gamesData.totalGames} entries
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isChangingPage}
                className={`h-9 px-3 flex items-center gap-1 text-[13px] font-medium rounded transition-colors
                  ${currentPage === 1 || isChangingPage
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-[#858796] bg-white border border-[#e3e6f0] hover:bg-gray-50'
                  }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: gamesData.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Always show first and last page
                    if (page === 1 || page === gamesData.totalPages) return true;
                    // Show pages around current page
                    const distance = Math.abs(page - currentPage);
                    return distance <= 1;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis
                    if (index > 0 && array[index - 1] !== page - 1) {
                      return (
                        <div key={`ellipsis-${page}`} className="px-2 text-[#858796]">...</div>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        disabled={isChangingPage}
                        className={`h-9 min-w-[36px] px-3 flex items-center justify-center text-[13px] font-medium rounded transition-colors
                          ${currentPage === page
                            ? 'text-white bg-[#18B69B]'
                            : 'text-[#858796] bg-white border border-[#e3e6f0] hover:bg-gray-50'
                          } ${isChangingPage ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {page}
                      </button>
                    );
                  })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === gamesData.totalPages || isChangingPage}
                className={`h-9 px-3 flex items-center gap-1 text-[13px] font-medium rounded transition-colors
                  ${currentPage === gamesData.totalPages || isChangingPage
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
      </div>
    </div>
  );
} 