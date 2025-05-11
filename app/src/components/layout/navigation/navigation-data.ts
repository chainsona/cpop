import React from 'react';
import { Home, Award, Settings, Sparkles, User, Wallet, Bell, FileText } from 'lucide-react';
import type { ReactNode } from 'react';

export interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
  color: string;
  protected?: boolean;
  badge?: string;
}

export const mainNavigationItems: NavItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: React.createElement(Home, { className: 'h-4 w-4' }),
    color: 'text-blue-600',
    protected: false, // Not protected
  },
  {
    name: 'Explore',
    href: '/explorer',
    icon: React.createElement(Sparkles, { className: 'h-4 w-4' }),
    color: 'text-pink-600',
    protected: false, // Not protected - Explorer should be public
  },
  {
    name: 'POAPs',
    href: '/poaps',
    icon: React.createElement(Award, { className: 'h-4 w-4' }),
    color: 'text-emerald-600',
    protected: true, // Protected route
  },
  {
    name: 'Wallet',
    href: '/wallet',
    icon: React.createElement(Wallet, { className: 'h-4 w-4' }),
    color: 'text-amber-600',
    protected: true, // Protected route
  },
];

export const userNavigationItems: NavItem[] = [
  {
    name: 'Profile',
    href: '/profile',
    icon: React.createElement(User, { className: 'h-4 w-4' }),
    color: 'text-neutral-600',
    protected: true, // Protected route
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: React.createElement(Bell, { className: 'h-4 w-4' }),
    badge: '3',
    color: 'text-red-600',
    protected: true, // Protected route
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: React.createElement(Settings, { className: 'h-4 w-4' }),
    color: 'text-neutral-600',
    protected: true, // Protected route
  },
];

export const supportNavigationItems: NavItem[] = [
  {
    name: 'Documentation',
    href: 'https://github.com/chainsona/cpop',
    icon: React.createElement(FileText, { className: 'h-4 w-4' }),
    color: 'text-blue-600',
  },
  {
    name: 'Get updates',
    href: 'https://x.com/chainsona',
    icon: React.createElement(Bell, { className: 'h-4 w-4' }),
    color: 'text-green-600',
  },
];
