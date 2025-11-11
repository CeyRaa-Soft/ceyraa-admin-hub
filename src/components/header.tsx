"use client";

import { useState, useEffect } from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserProfile } from "@/components/user-profile";
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function Header() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full bg-card/80 backdrop-blur-sm transition-transform duration-300 border-b",
      hidden ? "-translate-y-full" : "translate-y-0"
    )}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <div className="items-center space-x-2 hidden md:flex">
             <Link href="/dashboard" className="flex items-center gap-2">
                <ShoppingBag className="size-7 text-primary" />
                <span className="text-lg font-semibold truncate font-headline">CeyRaa Admin</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
