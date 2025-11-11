import Link from "next/link";
import {
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { ShoppingBag } from "lucide-react";

export function SidebarContentWrapper() {
  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border flex items-center justify-between md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
            <ShoppingBag className="size-7 text-primary" />
            <span className="text-lg font-semibold truncate font-headline">CeyRaa Admin</span>
        </Link>
        <SidebarTrigger className="size-7" />
      </SidebarHeader>
      <SidebarHeader className="border-b border-sidebar-border hidden md:flex items-center justify-end">
        <SidebarTrigger className="size-7" />
      </SidebarHeader>
      <SidebarContent className="p-0">
        <SidebarNav />
      </SidebarContent>
    </>
  );
}
