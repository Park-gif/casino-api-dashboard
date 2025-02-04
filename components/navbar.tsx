"use client";

import Link from "next/link";
import { Search, User, Settings, ChevronDown, LogOut, BarChart3, DollarSign, LayoutDashboard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SearchInput } from './search-input';
import { NotificationDropdown } from './notification-dropdown';
import { useQuery, gql } from '@apollo/client';

const GET_USER_STATS = gql`
  query GetUserStats {
    me {
      id
      currency
      ggrPercentage
    }
  }
`;

interface SearchResult {
  id: string;
  title: string;
  type: string;
  url: string;
}

const searchResults: SearchResult[] = [
  { id: '1', title: 'Recent Transaction', type: 'Transaction', url: '/backoffice/transactions-recent' },
  { id: '2', title: 'Player Stats', type: 'Player', url: '/backoffice/players' },
  { id: '3', title: 'Billing Statement', type: 'Billing', url: '/billing/statements' },
];

const NavBar = () => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const { data: userStats, loading: statsLoading } = useQuery(GET_USER_STATS, {
    fetchPolicy: 'network-only'
  });

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Dashboard';
      case '/account':
        return 'Account';
      case '/api-keys':
        return 'API Keys';
      default:
        return pathname.split('/').pop()?.replace(/-/g, ' ').replace(/(^\w|\s\w)/g, c => c.toUpperCase()) || 'Dashboard';
    }
  };

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm">
        <div className="flex flex-1 items-center justify-between">
          {/* Left side - Breadcrumb and Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{getPageTitle()}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link 
                href="/dashboard/settings" 
                className="flex items-center gap-1.5 hover:bg-gray-50 p-1.5 rounded-md transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 bg-[#18B69B]/10 rounded flex items-center justify-center">
                    <BarChart3 className="h-3.5 w-3.5 text-[#18B69B] group-hover:text-[#18B69B]/80" />
                  </div>
                  <span className="text-gray-500">GGR:</span>
                  <span className="font-medium group-hover:text-[#18B69B]">
                    {statsLoading ? "..." : `${userStats?.me?.ggrPercentage || 18}%`}
                  </span>
                </div>
              </Link>
              <Link 
                href="/dashboard/settings"
                className="flex items-center gap-1.5 hover:bg-gray-50 p-1.5 rounded-md transition-colors group"
              >
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 bg-[#18B69B]/10 rounded flex items-center justify-center">
                    <Settings className="h-3.5 w-3.5 text-[#18B69B] group-hover:text-[#18B69B]/80" />
                  </div>
                  <span className="text-gray-500">Currency:</span>
                  <span className="font-medium group-hover:text-[#18B69B]">
                    {statsLoading ? "..." : userStats?.me?.currency || 'USD'}
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Search */}
            <div className="hidden md:block w-[300px]">
              <SearchInput />
            </div>

            {/* Mobile Search Toggle */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* Settings */}
            <Link
              href="/dashboard/settings"
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                pathname === '/dashboard/settings' ? 'text-[#18B69B]' : 'text-gray-600'
              }`}
            >
              <Settings className="h-5 w-5" />
            </Link>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                {user?.username && (
                  <span className="hidden md:block text-sm font-medium">{user.username}</span>
                )}
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <Link
                    href="/dashboard/profile"
                    className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                      pathname === '/dashboard/profile' ? 'text-[#18B69B]' : ''
                    }`}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                      pathname === '/dashboard/settings' ? 'text-[#18B69B]' : ''
                    }`}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Panel */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white p-4 border-b shadow-lg z-50">
          <SearchInput />
        </div>
      )}
    </>
  );
}

export default NavBar; 