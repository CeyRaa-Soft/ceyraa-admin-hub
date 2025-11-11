"use client";

import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Boxes,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import React from "react";


const links = [
  { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  { href: "/dashboard/supplier-orders", label: "Supplier Orders", icon: Truck },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Users },
];

export function SidebarNav() {
  const pathname = usePathname();
  const isDashboardChildActive = links.some(link => pathname.startsWith(link.href));

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible defaultOpen={pathname === '/dashboard' || isDashboardChildActive}>
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild isActive={pathname === '/dashboard' || isDashboardChildActive}>
                         <Link href="/dashboard">
                            <LayoutDashboard />
                            <span>Dashboard</span>
                        </Link>
                    </SidebarMenuButton>
                </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent>
                <SidebarMenuSub>
                    {links.map((link) => (
                    <SidebarMenuSubItem key={link.href}>
                        <SidebarMenuSubButton
                        asChild
                        isActive={pathname.startsWith(link.href)}
                        >
                        <Link href={link.href}>
                            <link.icon />
                            <span>{link.label}</span>
                        </Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    ))}
                </SidebarMenuSub>
            </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
