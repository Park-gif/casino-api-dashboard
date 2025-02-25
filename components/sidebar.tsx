"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { 
  LayoutGrid, 
  User, 
  Key, 
  Receipt, 
  Building2, 
  Gift, 
  HelpCircle,
  ChevronDown,
  FileText,
  Wallet,
  Users,
  Gamepad2,
  PhoneCall,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

interface MenuItem {
  href: string
  icon: React.ReactNode
  label: string
}

interface SubMenu {
  label: string
  icon: React.ReactNode
  items: MenuItem[]
}

interface SidebarProps {
  isOpen: boolean
  onCollapse?: (collapsed: boolean) => void
}

const MenuItem = ({ href, icon, children, isActive = false, isCollapsed = false }: { 
  href: string, 
  icon: React.ReactNode, 
  children: React.ReactNode, 
  isActive?: boolean,
  isCollapsed?: boolean 
}) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
        isActive 
          ? "bg-[#18B69B]/10 text-[#18B69B] font-medium" 
          : "text-gray-600 hover:bg-gray-100"
      }`}
      title={isCollapsed ? String(children) : undefined}
    >
      {icon}
      {!isCollapsed && <span>{children}</span>}
    </Link>
  )
}

const SubMenu = ({ label, icon, children, isActive = false, isCollapsed = false }: { 
  label: string, 
  icon: React.ReactNode, 
  children: React.ReactNode, 
  isActive?: boolean,
  isCollapsed?: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(false)

  if (isCollapsed) {
    return (
      <div className="relative group">
        <button
          className={`w-full flex items-center justify-center px-3 py-2 text-sm rounded-lg transition-colors ${
            isActive 
              ? "bg-[#18B69B]/10 text-[#18B69B] font-medium" 
              : "text-gray-600 hover:bg-gray-100"
          }`}
          title={label}
        >
          {icon}
        </button>
        <div className="hidden group-hover:block absolute left-full top-0 ml-2 bg-white rounded-lg shadow-lg border border-gray-100 py-2 w-48">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
          isActive 
            ? "bg-[#18B69B]/10 text-[#18B69B] font-medium" 
            : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ isOpen, onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapse?.(newCollapsed)
  }

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 ${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300 lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } flex flex-col`}>
      {/* Logo */}
      <div className={`h-16 flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} border-b border-gray-100`}>
        <div className="h-9 w-9 rounded-xl bg-[#18B69B] flex items-center justify-center shrink-0">
          <Gamepad2 className="h-5 w-5 text-white" />
        </div>
        {!isCollapsed && (
          <div>
            <div className="text-lg font-semibold text-gray-900">StarGate</div>
            <div className="text-xs text-gray-500">Game Provider</div>
          </div>
        )}
      </div>

      {/* Collapse Button */}
      <button
        onClick={handleCollapse}
        className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Menu */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        <MenuItem 
          href="/dashboard" 
          icon={<LayoutGrid className="h-5 w-5" />}
          isActive={pathname === "/dashboard"}
          isCollapsed={isCollapsed}
        >
          Main
        </MenuItem>

        <MenuItem 
          href="/dashboard/account" 
          icon={<User className="h-5 w-5" />}
          isActive={pathname === "/dashboard/account"}
          isCollapsed={isCollapsed}
        >
          Account
        </MenuItem>

        <MenuItem 
          href="/dashboard/api-keys" 
          icon={<Key className="h-5 w-5" />}
          isActive={pathname === "/dashboard/api-keys"}
          isCollapsed={isCollapsed}
        >
          API Keys
        </MenuItem>

        <MenuItem 
          href="/dashboard/merchants" 
          icon={<Building2 className="h-5 w-5" />}
          isActive={pathname === "/dashboard/merchants"}
          isCollapsed={isCollapsed}
        >
          Merchants
        </MenuItem>

        <SubMenu 
          label="Transactions" 
          icon={<Receipt className="h-5 w-5" />}
          isActive={pathname.includes("/dashboard/transactions")}
          isCollapsed={isCollapsed}
        >
          <MenuItem
            href="/dashboard/transactions"
            icon={<Receipt className="h-4 w-4" />}
            isActive={pathname === "/dashboard/transactions"}
            isCollapsed={isCollapsed}
          >
            Transactions
          </MenuItem>
          <MenuItem
            href="/dashboard/transactions/deposit-withdraw"
            icon={<Wallet className="h-4 w-4" />}
            isActive={pathname === "/dashboard/transactions/deposit-withdraw"}
            isCollapsed={isCollapsed}
          >
            Deposit/Withdraw
          </MenuItem>
        </SubMenu>

        <SubMenu 
          label="Backoffice" 
          icon={<Building2 className="h-5 w-5" />}
          isActive={pathname.includes("/dashboard/backoffice")}
          isCollapsed={isCollapsed}
        >
          <MenuItem
            href="/dashboard/players"
            icon={<Users className="h-4 w-4" />}
            isActive={pathname === "/dashboard/players"}
            isCollapsed={isCollapsed}
          >
            Players
          </MenuItem>
          <MenuItem
            href="/dashboard/games"
            icon={<Gamepad2 className="h-4 w-4" />}
            isActive={pathname === "/dashboard/games"}
            isCollapsed={isCollapsed}
          >
            Games
          </MenuItem>
          <MenuItem
            href="/dashboard/callback-log"
            icon={<PhoneCall className="h-4 w-4" />}
            isActive={pathname === "/dashboard/callback"}
            isCollapsed={isCollapsed}
          >
            Callback Log
          </MenuItem>
        </SubMenu>

        <SubMenu 
          label="Bonus" 
          icon={<Gift className="h-5 w-5" />}
          isActive={pathname.includes("/dashboard/bonus")}
          isCollapsed={isCollapsed}
        >
          <MenuItem
            href="/dashboard/bonus/active"
            icon={<Gift className="h-4 w-4" />}
            isActive={pathname === "/dashboard/bonus/active"}
            isCollapsed={isCollapsed}
          >
            Active Bonuses
          </MenuItem>
          <MenuItem
            href="/dashboard/bonus/history"
            icon={<FileText className="h-4 w-4" />}
            isActive={pathname === "/dashboard/bonus/history"}
            isCollapsed={isCollapsed}
          >
            Bonus History
          </MenuItem>
        </SubMenu>

        <SubMenu 
          label="Help" 
          icon={<HelpCircle className="h-5 w-5" />}
          isActive={pathname.includes("/dashboard/help")}
          isCollapsed={isCollapsed}
        >
          <MenuItem
            href="/dashboard/help/faq"
            icon={<HelpCircle className="h-4 w-4" />}
            isActive={pathname === "/dashboard/help/faq"}
            isCollapsed={isCollapsed}
          >
            FAQ
          </MenuItem>
          <MenuItem
            href="/dashboard/help/support"
            icon={<HelpCircle className="h-4 w-4" />}
            isActive={pathname === "/dashboard/help/support"}
            isCollapsed={isCollapsed}
          >
            Support
          </MenuItem>
        </SubMenu>
      </div>
    </aside>
  )
}

