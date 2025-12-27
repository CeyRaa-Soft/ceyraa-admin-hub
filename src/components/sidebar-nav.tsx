"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Boxes, Truck, Users } from "lucide-react";
import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/supplier-orders", label: "Supplier Orders", icon: Truck },
  { href: "/suppliers", label: "Suppliers", icon: Users },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  console.log("Current pathname:", pathname); // Debug log

  const handleClick = (href: string) => {
    console.log("Navigating to:", href); // Debug log
    router.push(href);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {links.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href));

          console.log(`Link ${link.href} active:`, isActive); // Debug log

          return (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link href={link.href} onClick={() => handleClick(link.href)}>
                  <link.icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
