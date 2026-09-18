"use client"

import * as React from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  FolderOpenIcon,
  UsersIcon,
  Settings2Icon,
  ShieldCheck,
  Trash2Icon,
  ArchiveIcon,
  Building2,
  FileText,
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
      title: "Challan History",
      url: "/challans/history",
      icon: <FileText />,
      isActive: false,
      items: [],
    },
    {
      title: "Scrap",
      url: "/tools/scrap",
      icon: <ArchiveIcon />,
      isActive: false,
      items: [],
    },
    {
      title: "Profile Management",
      url: "/profiles",
      icon: <Building2 />,
      isActive: false,
      items: [],
    },
    {
      title: "Trash",
      url: "/tools/trash",
      icon: <Trash2Icon />,
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
      title: "Login Approvals",
      url: "/admin/approvals",
      icon: <ShieldCheck />,
      isActive: false,
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { setOpen } = useSidebar()

  const filteredNavMain = React.useMemo(() => {
    if (user?.role === "Admin") {
      return data.navMain
    }
    if (user?.role === "Vendor") {
      return data.navMain.filter((item) => item.url === "/stores")
    }
    const adminOnlyUrls = [
      "/profiles",
      "/tools/trash",
      "/users",
      "/admin/approvals",
      "/settings"
    ];
    return data.navMain.filter((item) => !adminOnlyUrls.includes(item.url))
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
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
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
