'use client';

import React, { useState } from 'react';
import { Bird, LayoutDashboard, FolderKanban, Users, Clock, Settings, ChevronDown, DollarSign, UserCog, Cog, Home, FileText, Calendar, BarChart, Sun, Moon, Timer, Shield, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { hasFinancialsAccess } from '@/modules/auth/frontend/utils/auth';
import { SupabaseConnectButton } from '@/components/SupabaseConnectButton';
import { LogoutButton } from '@/components/LogoutButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import '@/app/globals.css';

// Add type definitions at the top of the file
type ToolbarItem = {
  label: string;
  icon: LucideIcon;
  items: ToolbarSubItem[];
  adminOnly?: boolean;
  requiresProjectAccess?: boolean;
};

type ToolbarSubItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const toolbarGroups: ToolbarItem[][] = [
  [
    {
      label: 'Home',
      icon: Home,
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/my-performance', label: 'My Dashboard', icon: BarChart },
      ],
    },
    {
      label: 'Projects',
      icon: FolderKanban,
      requiresProjectAccess: true,
      items: [
        { href: '/projects', label: 'Project Admin', icon: FolderKanban },
        { href: '/projects/performance', label: 'Performance', icon: BarChart },
      ],
    },
    {
      label: 'Clients',
      icon: Users,
      items: [
        { href: '/clients/companies', label: 'Companies', icon: Users },
        { href: '/clients/contacts', label: 'Contacts', icon: Users },
      ],
    },
  ],
  [
    {
      label: 'Financials',
      icon: DollarSign,
      items: [
        { href: '/financials/invoicing', label: 'Invoicing', icon: FileText },
        { href: '/financials/budget', label: 'Budget', icon: DollarSign },
        { href: '/dashboard/performance', label: 'Performance', icon: BarChart },
       { href: '/financials/general-ledger', label: 'General Ledger', icon: FileText },
        { href: '/financials/revenue', label: 'Revenue', icon: DollarSign, adminOnly: true },
      ],
    },
    {
      label: 'Time',
      icon: Clock,
      items: [
        { href: '/timesheets/my-timesheets', label: 'My Time', icon: Clock },
        { href: '/timesheets', label: 'Timesheets', icon: Clock, adminOnly: true },
        { href: '/calendar', label: 'Calendar', icon: Calendar, adminOnly: true },
      ],
    },
  ],
  [
    {
      label: 'Admin',
      adminOnly: true,
      icon: Settings,
      items: [
        { href: '/admin', label: 'Employees', icon: UserCog },
        { href: '/admin/subcontractors', label: 'Subcontractors', icon: Users },
        { href: '/admin/users-permissions', label: 'Users & Permissions', icon: Shield },
        { href: '/admin/assets', label: 'Assets', icon: FileText },
        { href: '/admin/reference-tables', label: 'Reference Tables', icon: FileText },
        { href: '/admin/settings', label: 'Settings', icon: Cog },
        { href: '/admin/general', label: 'General', icon: Settings, adminOnly: true },
      ],
    },
  ],
];

function NavigationMenu() {
  const pathname = usePathname() || '/';
  const { isAdmin, user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [activeMainMenuItem, setActiveMainMenuItem] = useState<string | null>(null);

  const isActive = (item: { href: string }) => pathname === item.href;

  const getActiveGroup = () => {
    if (pathname.startsWith('/dashboard')) return 'Home';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/clients')) return 'Clients';
    if (pathname.startsWith('/financials')) return 'Financials';
    if (pathname.startsWith('/timesheets') || pathname.startsWith('/calendar')) return 'Time';
    if (pathname.startsWith('/admin')) return 'Admin';
    return null;
  };

  const activeGroup = getActiveGroup();

  const handleGroupClick = (label: string) => {
    if (selectedGroup === label) {
      setSelectedGroup(null);
      setActiveMainMenuItem(activeGroup === label ? label : null);
    } else {
      setSelectedGroup(label);
      setActiveMainMenuItem(label);
    }
  };

  React.useEffect(() => {
    setActiveMainMenuItem(activeGroup);
    setSelectedGroup(activeGroup);
  }, [pathname, activeGroup]);

  return (
    <nav className="hidden md:block border-b border-gray-200">
      <div className="flex items-center gap-6 px-4 py-1">
        {toolbarGroups.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <div className="flex items-center gap-1">
              {group.map((item) => {
                if (
                  (item.label === 'Financials' && !hasFinancialsAccess(user)) ||
                  (item.adminOnly && !isAdmin()) ||
                  (item.requiresProjectAccess && user?.role === 'production')
                ) {
                  return null;
                }

                const Icon = item.icon;
                const isGroupSelected = selectedGroup === item.label;
                const isCurrentGroup = activeGroup === item.label;
                const isMenuItemActive = activeMainMenuItem === item.label;

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => handleGroupClick(item.label)}
                      className={`px-3 py-1.5 rounded transition-colors ${isGroupSelected ? 'bg-muted/10' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <Icon className={`w-4 h-4 ${isMenuItemActive ? 'text-primary' : 'text-gray-500'}`} />
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                    </button>
                    {isGroupSelected && (
                      <div className="absolute left-0 right-0 bg-background border-b flex items-center gap-2 px-4 py-2 mt-1 z-10">
                        {item.items.map((subItem) => {
                          if ((subItem.label === 'Performance' || subItem.adminOnly) && !isAdmin()) {
                            return null;
                          }
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                isActive(subItem) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                              }`}
                            >
                              {subItem.icon && <subItem.icon className="w-4 h-4 mr-2 inline-block" />}
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {groupIndex < toolbarGroups.length - 1 && (
              <div className="h-8 w-px bg-gray-200" />
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

export function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [utilization] = useState(85);
  const [monthlyUtilization] = useState(78);
  const [isLoading] = useState(false);
  const { isAdmin, user } = useAuth();
  const pathname = usePathname() || '/';
  const isLoginPage = pathname === '/auth/login';
  const { theme, setTheme } = useTheme();

  const logoSrc = theme === 'dark'
    ? '/images/logos/logo_ostrich_dark_background.svg'
    : '/images/logos/logo_ostrich_light_background.svg';

  const getUtilizationColor = (value: number, isDark: boolean) => {
    if (value < 70) return isDark ? 'bg-[#FB7185]' : 'bg-[#E11D48]';
    if (value < 80) return isDark ? 'bg-[#F97316]' : 'bg-[#C05621]';
    if (value <= 85) return isDark ? 'bg-[#2DD4BF]' : 'bg-[#4DB6AC]';
    return 'bg-[#3B82F6]';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="bg-background header-border">
        <div className="flex items-center justify-between px-4 py-2 bg-background gap-4">
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2">
              {!isLoading && (
                <img
                  src={logoSrc}
                  alt="Ostrich Logo"
                  className="h-6 w-auto"
                />
              )}
              <span className="text-lg font-semibold">Ostrich</span>
            </Link>
          </div>
          
          {/* Utilization Indicators */}
          {!isLoginPage && (
            <div className="flex-1 flex items-center justify-center gap-6">
              <div className="flex items-center gap-6">
                <div className="group relative">
                  <Timer className="w-4 h-4 text-gray-500" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block w-64 p-2 text-xs bg-gray-900 rounded shadow-lg z-50">
                    <div className="font-medium mb-1 text-white">Weekly Utilization Rate</div>
                    <p className="text-gray-100">Percentage of time spent on billable work this week. Target: 80-85%.</p>
                    <div className="mt-1 text-gray-100">
                      <div>• Below 70%: Action needed</div>
                      <div>• 70-80%: Good</div>
                      <div>• 80-85%: Optimal</div>
                      <div>• Above 85%: Over-utilized</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Weekly Utilization</div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getUtilizationColor(utilization, theme === 'dark')}`}
                        style={{ width: `${utilization}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{utilization}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="group relative">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block w-64 p-2 text-xs bg-gray-900 rounded shadow-lg z-50">
                    <div className="font-medium mb-1 text-white">Monthly Billable Hours</div>
                    <p className="text-gray-100">Percentage of total hours that are billable this month. Target: 75-80%.</p>
                    <div className="mt-1 text-gray-100">
                      <div>• Below 65%: Low utilization</div>
                      <div>• 65-75%: Acceptable</div>
                      <div>• 75-80%: Target range</div>
                      <div>• Above 80%: Exceptional</div>
                    </div>
                    <div className="mt-1 text-gray-100">Monthly target: 140 billable hours</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Monthly Billable</div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getUtilizationColor(monthlyUtilization, theme === 'dark')}`}
                        style={{ width: `${monthlyUtilization}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{monthlyUtilization}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <SupabaseConnectButton />
            {!isLoginPage && (
              <>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-yellow-500 dark:text-blue-400"
                >
                  {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
                <LogoutButton />
              </>
            )}
          </div>
        </div>
        {!isLoginPage && (
          <div className="toolbar-border">
            <NavigationMenu />
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      {!isLoginPage && (
        <div className="md:hidden bg-muted px-4 py-2">
          <nav className="flex flex-col space-y-1">
            {toolbarGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-1">
                {group.map((item) => {
                  if (
                    (item.label === 'Financials' && !hasFinancialsAccess(user)) ||
                    (item.adminOnly && !isAdmin()) ||
                    (item.requiresProjectAccess && user?.role === 'production')
                  ) {
                    return null;
                  }

                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="pl-10 space-y-1">
                        {item.items.map((subItem) => {
                          if ((subItem.label === 'Performance' || subItem.adminOnly) && !isAdmin()) {
                            return null;
                          }
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className="block px-3 py-2 rounded hover:bg-muted transition-colors text-sm font-medium"
                            >
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2">
                {!isLoading && (
                  <img
                    src={logoSrc}
                    alt="Ostrich Logo"
                    className="h-5 w-auto"
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Fast, reliable, and ready to run.
              </p>
            </div>
            <div className="md:col-span-2 flex justify-end items-end">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Ostrich. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}