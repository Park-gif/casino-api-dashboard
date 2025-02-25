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
  Clock,
  User,
  GamepadIcon,
  DollarSign,
  Hash
} from "lucide-react"
import { copyToClipboard } from '@/lib/utils'
import { getCurrencySymbol } from '@/lib/currency-utils'
import { gql, useQuery } from "@apollo/client"
import { format } from 'date-fns'
import { useToast } from '@/components/ui/toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from '@/components/ui/Skeleton'

const GET_SLOT_TRANSACTIONS = gql`
  query GetSlotTransactions($filter: TransactionFilter, $page: Int!, $limit: Int!) {
    slotTransactions(filter: $filter, page: $page, limit: $limit) {
      transactions {
        id
        username
        formattedUsername
        operator
        roundId
        gameId
        type
        credit
        debit
        currency
        callId
        sessionId
        gameplayFinal
        status
        metadata {
          timestamp
          balanceBefore
          balanceAfter
        }
        createdAt
      }
      totalCount
      currentPage
      totalPages
    }
  }
`;

interface SlotTransaction {
  id: string;
  username: string;
  formattedUsername: string;
  operator: string;
  roundId: string;
  gameId: string;
  type: string;
  credit: number | null;
  debit: number | null;
  currency: string;
  callId: string;
  sessionId: string;
  gameplayFinal: boolean;
  status: string;
  metadata: {
    timestamp: string;
    balanceBefore: number;
    balanceAfter: number;
  };
  createdAt: string;
}

interface SlotTransactionResponse {
  transactions: SlotTransaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'MM/dd/yyyy, HH:mm');
  } catch (error) {
    console.error('Invalid date:', dateString);
    return dateString;
  }
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const { loading, error, data } = useQuery<{ slotTransactions: SlotTransactionResponse }>(GET_SLOT_TRANSACTIONS, {
    variables: {
      filter: {},
      page,
      limit
    },
    fetchPolicy: 'network-only'
  });

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load transactions. Please try again.",
    });
  }

  const transactions = data?.slotTransactions.transactions || [];
  const filteredTransactions = searchQuery 
    ? transactions.filter(tx => 
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.gameId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.roundId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transactions;

  return (
    <div className="p-4 sm:p-6 bg-[#F8F9FC]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#18B69B]/10 flex items-center justify-center">
            <FileText className="h-4.5 w-4.5 text-[#18B69B]" />
          </div>
          <h1 className="text-[#2D3359] text-xl sm:text-2xl font-semibold">Transactions</h1>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-xs">
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-[#18B69B] focus:ring-[#18B69B]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#18B69B] bg-[#18B69B]/5">ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#18B69B] bg-[#18B69B]/5">Player</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#18B69B] bg-[#18B69B]/5">Game</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#18B69B] bg-[#18B69B]/5">Round ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#18B69B] bg-[#18B69B]/5">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#18B69B] bg-[#18B69B]/5">Credit</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#18B69B] bg-[#18B69B]/5">Debit</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#18B69B] bg-[#18B69B]/5">Currency</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-[#18B69B] bg-[#18B69B]/5">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500 bg-white">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction: SlotTransaction) => (
                  <tr key={transaction.id} className="bg-white hover:bg-[#18B69B]/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#18B69B]">{transaction.id}</span>
                        <button 
                          onClick={() => copyToClipboard(transaction.id, 'Transaction ID copied!')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{transaction.gameId}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{transaction.roundId}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium text-[#18B69B] bg-[#18B69B]/10 rounded-full">
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#1cc88a]">
                      {transaction.credit ? `+${transaction.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#e74a3b]">
                      {transaction.debit ? `-${transaction.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{transaction.currency}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(transaction.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data?.slotTransactions && filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.slotTransactions.totalCount)} of {data.slotTransactions.totalCount} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-gray-600 hover:bg-[#18B69B]/5 hover:text-[#18B69B] hover:border-[#18B69B] disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              className="text-gray-600 hover:bg-[#18B69B]/5 hover:text-[#18B69B] hover:border-[#18B69B] disabled:opacity-50"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= data.slotTransactions.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 