"use client"

import { useState } from "react"
import { useQuery } from "@apollo/client"
import { 
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  User,
  Calendar,
  Tag
} from "lucide-react"
import { gql } from "@apollo/client"

const GET_ACTIVITY_LOGS = gql`
  query GetActivityLogs($limit: Int, $offset: Int) {
    getActivityLogs(limit: $limit, offset: $offset) {
      id
      userId
      username
      activityType
      description
      metadata
      createdAt
    }
  }
`;

export default function ActivityPage() {
  const [page, setPage] = useState(0)
  const limit = 20

  const { data, loading } = useQuery(GET_ACTIVITY_LOGS, {
    variables: {
      limit,
      offset: page * limit
    }
  })

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'BALANCE_UPDATE':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'AGENT_CREATED':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'AGENT_STATUS_CHANGED':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'API_KEY_CREATED':
        return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'API_KEY_DELETED':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'API_KEY_STATUS_CHANGED':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="p-4 sm:p-6 bg-[#F8F9FC]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-[#18B69B]/10 flex items-center justify-center">
            <ClipboardList className="h-4.5 w-4.5 text-[#18B69B]" />
          </div>
          <h1 className="text-[#2D3359] text-xl sm:text-2xl font-semibold">Activity Log</h1>
        </div>
        <div className="flex items-center gap-2 text-[#858796]">
          <span className="text-xs sm:text-sm">Track all actions and changes in the system</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search activities..."
              className="w-64 h-9 pl-9 pr-4 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#18B69B] focus:ring-2 focus:ring-[#18B69B]/20"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <button className="h-9 px-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#18B69B]/5 border-y border-gray-200">
                <th className="text-left whitespace-nowrap px-4 py-3 w-[180px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <Calendar className="h-3.5 w-3.5" />
                    Timestamp
                  </div>
                </th>
                <th className="text-left whitespace-nowrap px-4 py-3 w-[150px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <User className="h-3.5 w-3.5" />
                    User
                  </div>
                </th>
                <th className="text-left whitespace-nowrap px-4 py-3 w-[150px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <Tag className="h-3.5 w-3.5" />
                    Activity Type
                  </div>
                </th>
                <th className="text-left whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#18B69B] uppercase">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Description
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading activities...
                    </div>
                  </td>
                </tr>
              ) : data?.getActivityLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="h-8 w-8 text-gray-400" />
                      <p>No activities found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.getActivityLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 w-[180px]">
                      <div className="text-sm text-gray-900">{formatDate(log.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 w-[150px]">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#18B69B]/10 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-[#18B69B]" />
                        </div>
                        <span className="text-sm text-gray-900">{log.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 w-[150px]">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${getActivityTypeColor(log.activityType)}`}>
                        {log.activityType.split('_').join(' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{log.description}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="h-8 px-3 text-sm text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowUp className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page + 1}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={data?.getActivityLogs.length < limit}
            className="h-8 px-3 text-sm text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 