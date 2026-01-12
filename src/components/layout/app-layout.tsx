'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { MobileDrawer } from './mobile-drawer';
import { MobileSearchModal } from './mobile-search-modal';
import { WelcomeModal } from '@/components/onboarding/welcome-modal';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface TagWithCount {
  name: string;
  count: number;
}

interface AppLayoutProps {
  children: React.ReactNode;
  categories: Category[];
  tags?: TagWithCount[];
}

export function AppLayout({ children, categories, tags = [] }: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar categories={categories} tags={tags} />
      </div>

      {/* Main content - responsive margin */}
      <div className="flex flex-1 flex-col md:ml-64">
        <Header />
        {/* Extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom nav - hidden on desktop */}
      <div className="md:hidden">
        <MobileBottomNav
          onSearchClick={() => setSearchOpen(true)}
          onMenuClick={() => setDrawerOpen(true)}
        />
      </div>

      {/* Mobile drawer - hidden on desktop */}
      <MobileDrawer
        categories={categories}
        tags={tags}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* Mobile search modal */}
      <MobileSearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Welcome modal for first-time users */}
      <WelcomeModal />
    </div>
  );
}
