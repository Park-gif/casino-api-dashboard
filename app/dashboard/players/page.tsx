"use client"

import { useState } from "react"
import { 
  Search, 
  ChevronDown, 
  Eye,
  ArrowUpDown,
  ChevronRight,
  Calendar,
  Filter,
  Copy,
  MoreVertical,
  RefreshCw,
  Download,
  FileText,
  User,
  DollarSign,
  Hash,
  Mail,
  Globe,
  Clock,
  Shield,
  Ban,
  Coins,
  Wallet
} from "lucide-react"
import { gql, useQuery } from "@apollo/client"

const GET_PLAYERS = gql`
  query GetPlayers($filters: PlayerFilters, $first: Int!, $after: String) {
    players(filters: $filters, first: $first, after: $after) {
      players {
        id
        username
        formattedUsername
        currency
        createdAt
        lastLogin
        status
        totalBets
        totalWins
      }
      totalCount
      hasNextPage
    }
  }
`;

interface Player {
  id: string
  username: string
  formattedUsername: string
  currency: string
  createdAt: string
  lastLogin: string | null
  status: "active" | "blocked"
  totalBets: number
  totalWins: number
}

type SortField = 'username' | 'totalBets' | 'createdAt' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const ITEMS_PER_PAGE = 10;

  const { loading, error, data, refetch } = useQuery(GET_PLAYERS, {
    variables: {
      filters: {
        search: searchQuery || null,
        orderBy: sortField,
        orderDirection: sortDirection
      },
      first: ITEMS_PER_PAGE,
      after: ((currentPage - 1) * ITEMS_PER_PAGE).toString()
    }
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    refetch({
      filters: {
        search: value || null
      },
      first: ITEMS_PER_PAGE,
      after: "0"
    });
  };

  const handleSort = (field: SortField) => {
    let newDirection: SortDirection = 'asc';
    
    if (sortField === field) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }

    setSortField(newDirection ? field : null);
    setSortDirection(newDirection);
    setCurrentPage(1);
    
    refetch({
      filters: {
        search: searchQuery || null,
        orderBy: newDirection ? field : null,
        orderDirection: newDirection
      },
      first: ITEMS_PER_PAGE,
      after: "0"
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-[#18B69B] opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUpDown className="h-3 w-3 text-[#18B69B]" /> : 
      <ArrowUpDown className="h-3 w-3 text-[#18B69B] rotate-180" />;
  };

  const handleExport = () => {
    if (!data?.players?.players) return;

    const csvContent = [
      // CSV Headers
      ["ID", "Username", "Total Bets (USD)", "Currency", "Created At", "Status"],
      // CSV Data
      ...data.players.players.map((player: Player) => [
        player.id,
        player.username,
        ((player.totalBets || 0) * (player.currency === 'EUR' ? 1.08 : player.currency === 'TRY' ? 0.033 : 1)).toFixed(2),
        player.currency,
        new Date(parseInt(player.createdAt)).toLocaleString(),
        player.status
      ])
    ].map(row => row.join(",")).join("\\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'players_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="p-4 sm:p-5 bg-[#F8F9FC] min-h-screen">
        <div className="text-center py-10 text-red-500">
          Error loading players: {error.message}
        </div>
      </div>
    );
  }

  const players = data?.players?.players || [];
  const totalCount = data?.players?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => {
            setCurrentPage(i);
            refetch({
              filters: { search: searchQuery || null },
              first: ITEMS_PER_PAGE,
              after: ((i - 1) * ITEMS_PER_PAGE).toString()
            });
          }}
          className={`px-3 py-1 text-[13px] rounded transition-colors ${
            currentPage === i
              ? 'text-white bg-[#18B69B] border border-[#18B69B] hover:bg-[#18B69B]/90'
              : 'text-[#6e707e] bg-white border border-[#e3e6f0] hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  return (
    <div className="p-4 sm:p-5 bg-[#F8F9FC] min-h-screen">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[#5a5c69] text-xl sm:text-2xl font-normal tracking-[-0.5px] flex items-center gap-2">
          <User className="h-6 w-6 text-[#18B69B]" />
          Players
          <ChevronRight className="h-5 w-5 text-[#858796]" />
          <span className="text-base text-[#858796] font-light">Management</span>
        </h1>
      </div>

      {/* Search and Actions */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-[320px]">
          <input
            type="text"
            placeholder="Search by ID, Username..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-[34px] text-[13px] border border-[#e3e6f0] rounded focus:outline-none focus:border-[#18B69B] focus:shadow-[0_0_0_1px_#18B69B20] transition-all placeholder:text-[#858796]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#858796]" />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <button 
            onClick={handleExport}
            className="h-[34px] px-4 flex items-center gap-2 text-[13px] font-medium text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button 
            onClick={() => refetch()}
            className="h-[34px] w-[34px] flex items-center justify-center text-[#6e707e] bg-white border border-[#e3e6f0] rounded hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-lg border border-[#e3e6f0] shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent text-[#18B69B] rounded-full">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#18B69B]/5 border-y border-[#e3e6f0]">
                <th className="h-11 px-4 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#18B69B]">ID</span>
                    <ArrowUpDown className="h-3 w-3 text-[#18B69B] opacity-50" />
                  </div>
                </th>
                <th className="h-11 px-4 text-left">
                  <button 
                    onClick={() => handleSort('username')}
                    className="flex items-center gap-1.5 hover:opacity-80 w-full"
                    type="button"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#18B69B]">Username</span>
                    {getSortIcon('username')}
                  </button>
                </th>
                <th className="h-11 px-4 text-left">
                  <button 
                    onClick={() => handleSort('totalBets')}
                    className="flex items-center gap-1.5 hover:opacity-80 w-full"
                    type="button"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#18B69B]">Total Bets</span>
                    {getSortIcon('totalBets')}
                  </button>
                </th>
                <th className="h-11 px-4 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#18B69B]">Currency</span>
                    <ArrowUpDown className="h-3 w-3 text-[#18B69B] opacity-50" />
                  </div>
                </th>
                <th className="h-11 px-4 text-left hidden sm:table-cell">
                  <button 
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center gap-1.5 hover:opacity-80 w-full"
                    type="button"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#18B69B]">Created At</span>
                    {getSortIcon('createdAt')}
                  </button>
                </th>
                <th className="h-11 px-4 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#18B69B]">Status</span>
                    <ArrowUpDown className="h-3 w-3 text-[#18B69B] opacity-50" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e6f0]">
              {players.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-[52px]">
                    <div className="flex items-center justify-center h-[52px] text-gray-500">
                      No players found
                    </div>
                  </td>
                </tr>
              ) : (
                players.map((player: Player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="h-[52px] px-4">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-[#858796]" />
                        <span className="text-[13px] text-[#858796]">{player.id}</span>
                      </div>
                    </td>
                    <td className="h-[52px] px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#858796]" />
                        <span className="text-[13px] text-[#858796]">{player.username}</span>
                      </div>
                    </td>
                    <td className="h-[52px] px-4">
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-[#858796]" />
                        <span className="text-[13px] text-[#858796]">
                          {((player.totalBets || 0) * (player.currency === 'EUR' ? 1.08 : player.currency === 'TRY' ? 0.033 : 1)).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} USD
                        </span>
                      </div>
                    </td>
                    <td className="h-[52px] px-4">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-[#858796]" />
                        <span className="text-[13px] text-[#18B69B]">{player.currency}</span>
                      </div>
                    </td>
                    <td className="h-[52px] px-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#858796]" />
                        <span className="text-[13px] text-[#858796]">
                          {new Date(parseInt(player.createdAt)).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="h-[52px] px-4">
                      <span className={`inline-flex items-center h-[20px] px-2.5 text-[11px] font-medium rounded-full ${
                        player.status === 'active' 
                          ? 'text-[#18B69B] bg-[#18B69B]/10'
                          : 'text-red-700 bg-red-50'
                      }`}>
                        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                          player.status === 'active'
                            ? 'bg-[#18B69B]'
                            : 'bg-red-500'
                        }`} />
                        {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer with Pagination */}
        <div className="px-4 py-3 bg-[#F8F9FC] border-t border-[#e3e6f0] text-[13px] text-[#858796] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} out of {totalCount} players</span>
          <div className="flex items-center gap-2 overflow-x-auto">
            {renderPaginationButtons()}
          </div>
        </div>
      </div>
    </div>
  )
} 