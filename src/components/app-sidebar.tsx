"use client"

import * as React from "react"
import { NavLink } from "react-router-dom"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  FolderOpenIcon,
  StoreIcon,
  UsersIcon,
  WrenchIcon,
  Settings2Icon,
  LifeBuoyIcon,
  SendIcon,
  BuildingIcon,
} from "lucide-react"

const data = {
  user: {
    name: "L&T Admin",
    email: "admin@landt.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: false,
      items: [],
    },
    {
      title: "Projects",
      url: "/projects",
      icon: <FolderOpenIcon />,
      isActive: false,
      items: [],
    },
    {
      title: "Stores",
      url: "/stores",
      icon: <StoreIcon />,
      isActive: false,
      items: [],
    },
    {
      title: "Users",
      url: "/users",
      icon: <UsersIcon />,
      isActive: false,
      items: [],
    },
    {
      title: "Tools",
      url: "/tools",
      icon: <WrenchIcon />,
      isActive: false,
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
      items: [
        { title: "General", url: "/settings" },
        { title: "Team", url: "/settings/team" },
        { title: "Billing", url: "/settings/billing" },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/support",
      icon: <LifeBuoyIcon />,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: <SendIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<NavLink to="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <BuildingIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">L&T Portal</span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
