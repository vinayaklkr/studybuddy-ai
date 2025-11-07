'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Calendar,
  MessageSquare,
  TrendingUp,
  Zap,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react'
import Image from 'next/image'
import studybuddyai from "../../../public/studybuddyai.jpg"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

interface SidebarContentProps {
  navItems: NavItem[]
  pathname: string
  setSidebarOpen: (open: boolean) => void
  handleSignOut: () => void
}

function SidebarContent({ navItems, pathname, setSidebarOpen, handleSignOut }: SidebarContentProps) {
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src={studybuddyai} alt="Logo" width={24} height={24} />
          <h1 className="text-xl font-bold">StudyBuddy AI</h1>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3"
                >
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      <Separator />

      {/* User Section */}
      <div className="p-3 space-y-1">
        <Button variant="ghost" className="w-full justify-start gap-3">
          <User className="h-4 w-4" />
          <span className="text-sm">Profile</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Sign Out</span>
        </Button>
      </div>
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navItems: NavItem[] = [
    {
      title: 'Chat Mode',
      href: '/dashboard/chat',
      icon: MessageSquare,
      description: 'Chat with AI assistant'
    },
    {
      title: 'Calendar',
      href: '/dashboard/calendar',
      icon: Calendar,
      description: 'Schedule your exams'
    },
    {
      title: 'Focus Mode',
      href: '/dashboard/focus',
      icon: Zap,
      description: 'Strict study sessions'
    },
    {
      title: 'Progress',
      href: '/dashboard/progress',
      icon: TrendingUp,
      description: 'Track your study progress'
    },
  ]

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-64 border-r bg-muted/30 flex-col">
        <SidebarContent
          navItems={navItems}
          pathname={pathname}
          setSidebarOpen={setSidebarOpen}
          handleSignOut={handleSignOut}
        />
      </div>

      {/* Sidebar - Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 border-r bg-background flex flex-col transform transition-transform duration-200 lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-bold">StudyBuddy AI</h1>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                  </Button>
                </Link>
              )
            })}
          </div>
        </ScrollArea>

        <Separator />

        <div className="p-3 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <User className="h-4 w-4" />
            <span className="text-sm">Profile</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Sign Out</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden border-b bg-background p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">StudyBuddy AI</h1>
        </div>

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
