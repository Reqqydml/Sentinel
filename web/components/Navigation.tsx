'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, FileText, Users, Trophy, Radio, Settings, Play } from 'lucide-react';

type NavItem = {
  href: string;
  icon: typeof BarChart3;
  label: string;
};

const navItems: NavItem[] = [
  { href: '/', icon: BarChart3, label: 'Dashboard' },
  { href: '/cases', icon: FileText, label: 'Cases' },
  { href: '/tournament', icon: Trophy, label: 'Tournament' },
  { href: '/live', icon: Radio, label: 'Live Monitor' },
  { href: '/demo', icon: Play, label: 'Demo' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-card border-r border-border fixed h-screen flex flex-col p-4">
      <Link href="/" className="flex items-center gap-2 px-3 py-3 mb-6 rounded-lg hover:bg-muted transition">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">S</span>
        </div>
        <span className="font-bold text-lg text-foreground">Sentinel</span>
      </Link>

      <div className="flex-1 space-y-2">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">System: Operational</p>
      </div>
    </nav>
  );
}
