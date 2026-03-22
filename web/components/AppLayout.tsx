'use client';

import { ReactNode } from 'react';
import Navigation from './Navigation';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex">
      <Navigation />
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  );
}
