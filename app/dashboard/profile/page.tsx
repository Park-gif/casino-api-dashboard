"use client"

import { User, Mail, Shield, Calendar, Globe, Clock } from "lucide-react"
import { useQuery } from '@apollo/client'
import { ME_QUERY } from '@/lib/graphql/auth'

export default function ProfilePage() {
  const { data, loading, error } = useQuery(ME_QUERY, {
    fetchPolicy: 'network-only',
  })

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return new Intl.DateTimeFormat('en-US', { 
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse p-3">
        <div className="bg-white rounded-lg p-4 mb-3">
          <div className="w-16 h-16 bg-gray-100 rounded-lg mb-3"></div>
          <div className="h-5 bg-gray-100 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg p-4">
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3">
        <div className="bg-red-50 p-3 rounded-lg text-sm text-red-600">
          Failed to load profile data
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Mobile Profile Card */}
      <div className="p-3 space-y-3">
        {/* User Info */}
        <div className="bg-white rounded-lg p-4">
          <div className="w-16 h-16 bg-[#18B69B] rounded-lg flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-semibold mb-1">
            {data?.me?.username}
          </h1>
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
              active
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
            <Mail className="w-4 h-4" />
            <span className="truncate">{data?.me?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Globe className="w-4 h-4" />
            <span>UTC+3</span>
          </div>
        </div>

        {/* Role */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#18B69B]/10 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#18B69B]" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Account Role</div>
              <div className="font-medium capitalize">{data?.me?.role}</div>
            </div>
          </div>
        </div>

        {/* Member Since */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#18B69B]/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#18B69B]" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Member Since</div>
              <div className="font-medium">{formatDate(data?.me?.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Last Active */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#18B69B]/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#18B69B]" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Last Active</div>
              <div className="font-medium">Just now</div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Hidden on Mobile */}
        <div className="hidden lg:block">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Desktop content here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 