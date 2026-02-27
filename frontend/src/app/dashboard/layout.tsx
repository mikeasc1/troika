'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated, logout, getCurrentUser } from '@/lib/api';
import type { UserResponse } from '@/types';
import { LayoutDashboard, LogOut, Plus, User, Menu, X, Gift, Settings } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => {
        logout();
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="dashboard-header border-b border-border/40 backdrop-blur-md bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">TwitterOS</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Overview
            </Link>
            <Link 
              href="/dashboard/spinners/new" 
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname.startsWith('/dashboard/spinners') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Spinners
            </Link>
            <Link 
              href="/dashboard/campaigns/new" 
              className="btn btn-primary text-sm py-2 px-4 shadow-lg shadow-primary/20 hover:shadow-primary/40"
            >
              <Plus className="w-4 h-4" />
              New Campaign
            </Link>
            
            <div className="h-6 w-px bg-border/50 mx-2"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-medium text-foreground">{user?.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl absolute w-full left-0 animate-fade-in p-4 shadow-xl">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border/50">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{user?.email}</p>
                </div>
              </div>
              
              <Link 
                href="/dashboard" 
                className="flex items-center gap-3 p-3 hover:bg-surface rounded-lg transition-colors text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard className="w-5 h-5" />
                Overview
              </Link>
              <Link 
                href="/dashboard/spinners/new" 
                className="flex items-center gap-3 p-3 hover:bg-surface rounded-lg transition-colors text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Gift className="w-5 h-5" />
                Spinners
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="flex items-center gap-3 p-3 hover:bg-surface rounded-lg transition-colors text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <Link 
                href="/dashboard/campaigns/new" 
                className="btn btn-primary justify-center w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 p-3 text-error hover:bg-error/10 rounded-lg transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
