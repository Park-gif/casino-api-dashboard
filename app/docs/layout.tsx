'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Book, 
  Code2, 
  Terminal, 
  Copy, 
  CheckCheck,
  Hash,
  Globe,
  Layers,
  ChevronRight,
  GamepadIcon,
  ListIcon,
  PlayIcon,
  Users,
  Wallet,
  Settings,
  Menu,
  X,
  Search,
  ArrowLeft,
  Github,
  ExternalLink,
  Home,
  Key,
  AlertTriangle,
  UserPlus,
  UserCheck,
  DollarSign,
  List,
  Info,
  PlayCircle,
  Bell,
  ChevronDown
} from 'lucide-react';

const menuSections = [
  {
    title: 'Getting Started',
    icon: Home,
    items: [
      { id: 'introduction', name: 'Introduction', href: '/docs/getting-started', icon: Info },
      { id: 'authentication', name: 'Authentication', href: '/docs/authentication', icon: Key },
      { id: 'errors', name: 'Error Handling', href: '/docs/errors', icon: AlertTriangle }
    ]
  },
  {
    title: 'Player Management',
    icon: Users,
    items: [
      { id: 'player-create', name: 'Create Player', href: '/docs/create-player', icon: UserPlus },
      { id: 'player-exists', name: 'Check Player', href: '/docs/check-player', icon: UserCheck },
      { id: 'player-balance', name: 'Player Balance', href: '/docs/player-balance', icon: DollarSign }
    ]
  },
  {
    title: 'Game Integration',
    icon: GamepadIcon,
    items: [
      { id: 'game-list', name: 'Get Game List', href: '/docs/game-list', icon: List },
      { id: 'game-details', name: 'Get Game Details', href: '/docs/game-details', icon: Info },
      { id: 'game-demo', name: 'Launch Demo Game', href: '/docs/launch-demo', icon: PlayCircle },
      { id: 'game-real', name: 'Launch Real Game', href: '/docs/launch-game', icon: PlayCircle }
    ]
  },
  {
    title: 'Transactions',
    icon: Wallet,
    items: [
      { id: 'transaction-deposit', name: 'Deposit', href: '/docs/deposit', icon: DollarSign },
      { id: 'transaction-withdraw', name: 'Withdraw', href: '/docs/withdraw', icon: DollarSign },
      { id: 'transaction-history', name: 'Transaction History', href: '/docs/transaction-history', icon: List }
    ]
  },
  {
    title: 'Callbacks',
    icon: Bell,
    items: [
      { id: 'callback-balance', name: 'Balance Updates', href: '/docs/callbacks#balance', icon: DollarSign },
      { id: 'callback-game', name: 'Game Events', href: '/docs/callbacks#game', icon: GamepadIcon },
      { id: 'callback-validation', name: 'Validation', href: '/docs/callbacks#validation', icon: CheckCheck }
    ]
  }
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isCurrentPath = (href: string) => {
    if (href.includes('#')) {
      return pathname.startsWith(href.split('#')[0]);
    }
    return pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/docs" className="flex items-center gap-2">
              <Book className="h-5 w-5 text-[#18B69B]" />
              <span className="text-lg font-semibold">API Docs</span>
            </Link>
          </div>
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-[#18B69B] focus:border-transparent
                  group-hover:border-gray-300 transition-colors"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                ⌘K
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/yourusername/project"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <Link
              href="/dashboard"
              className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 
                px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>Dashboard</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed inset-y-14 left-0 z-40 w-64 bg-white border-r border-gray-200 
          pb-10 transition-all duration-300 lg:translate-x-0 lg:static lg:inset-auto
          backdrop-blur-lg bg-white/95 shadow-lg shadow-gray-200/50`}
        >
          <nav className="sticky top-0 p-4 space-y-2 overflow-y-auto h-[calc(100vh-3.5rem)]">
            {menuSections.map((section) => {
              const isExpanded = expandedSections.includes(section.title);
              const hasActiveItem = section.items.some(item => isCurrentPath(item.href));
              
              return (
                <div key={section.title} className="border-b border-gray-100 last:border-0 pb-2">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={`w-full flex items-center justify-between px-2 py-2 rounded-lg transition-colors
                      ${hasActiveItem ? 'text-[#18B69B]' : 'text-gray-700'}
                      hover:bg-gray-50 group`}
                  >
                    <div className="flex items-center gap-2">
                      <section.icon className={`h-4 w-4 ${hasActiveItem ? 'text-[#18B69B]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <ul className={`mt-1 space-y-1 ${isExpanded ? 'block' : 'hidden'}`}>
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all
                            ${isCurrentPath(item.href)
                              ? 'bg-[#18B69B]/10 text-[#18B69B] font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                          <item.icon className={`h-4 w-4 ${isCurrentPath(item.href) ? 'text-[#18B69B]' : 'text-gray-400'}`} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-white px-4 lg:px-8 py-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 