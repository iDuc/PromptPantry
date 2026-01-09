'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface AppLayoutProps {
  children: React.ReactNode;
  categories: Category[];
}

export function AppLayout({ children, categories }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar categories={categories} />
      <div className="ml-64 flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
