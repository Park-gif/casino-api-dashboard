"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface SearchResult {
  id: string;
  title: string;
  type: string;
  url: string;
}

export function SearchInput() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    // TODO: Implement actual search logic here
    // For now, using mock data
    const mockResults: SearchResult[] = [
      { id: '1', title: 'Recent Transaction', type: 'Transaction', url: '/backoffice/transactions-recent' },
      { id: '2', title: 'Player Stats', type: 'Player', url: '/backoffice/players' },
      { id: '3', title: 'Billing Statement', type: 'Billing', url: '/billing/statements' },
    ].filter(result => 
      result.title.toLowerCase().includes(value.toLowerCase()) ||
      result.type.toLowerCase().includes(value.toLowerCase())
    )

    setResults(mockResults)
    setIsLoading(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 h-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#18B69B] focus:ring-2 focus:ring-[#18B69B]/20 transition-all placeholder:text-gray-400"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      
      {query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No results found
            </div>
          ) : (
            <div className="py-2">
              {results.map((result) => (
                <a
                  key={result.id}
                  href={result.url}
                  className="flex items-center px-4 py-2 hover:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {result.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.type}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 