"use client"

import * as React from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

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
  FileTextIcon,
  BarChart3Icon,
} from "lucide-react"

import logoUrl from "@/assets/logo.png"

const data = {
  user: {
    name: "L&T User",
    email: "user@landt.com",
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
      title: "Stores & Tools",
      url: "/stores",
      icon: <StoreIcon />,
      isActive: false,
      items: [],
    },
    {
      title: "Challan Register",
      url: "/challans/history",
      icon: <FileTextIcon />,
      isActive: false,
      items: [],
    },
    {
      title: "Reports & Audit",
      url: "/settings/reports",
      icon: <BarChart3Icon />,
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
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
      items: [
        { title: "General", url: "/settings" },
        { title: "Forms Management", url: "/settings/forms" },
        { title: "Reports & Audit", url: "/settings/reports" },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const filteredNavMain = React.useMemo(() => {
    if (!user || user.role === "Admin") {
      return data.navMain
    }
    if (user.role === "Vendor") {
      return data.navMain.filter((item) => item.url === "/stores")
    }
    const allowed = user.allowedPages || []
    return data.navMain.filter((item) => allowed.includes(item.url) || (item.url === "/stores" && allowed.includes("/tools")))
  }, [user])

  const currentUserData = React.useMemo(() => {
    if (!user) return data.user
    return {
      name: user.username || user.email,
      email: user.email,
      avatar: "",
    }
  }, [user])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<NavLink to="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white p-1">
                <img src={logoUrl} alt="L&T Logo" className="w-full h-full object-contain" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">L&T Portal</span>
                <span className="truncate text-xs">{user?.role || "Enterprise"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUserData} />
      </SidebarFooter>
    </Sidebar>
  )
}
