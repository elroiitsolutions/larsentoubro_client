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
  QrCode,
} from "lucide-react"

import logoUrl from "@/assets/logo.png"

import { getDefaultAllowedPath } from "@/utils/navigation"

const data = {
  user: {
    name: "L&T User",
    email: "user@landt.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Scanner",
      url: "/qr-scanner",
      icon: <QrCode />,
      isActive: false,
      items: [],
    },
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
    if (user?.role === "Guest") {
      return [
        {
          title: "Scanner",
          url: "/qr-scanner",
          icon: <QrCode />,
          isActive: true,
          items: [],
        }
      ]
    }
    if (user?.role === "Admin") {
      return data.navMain
    }
    if (user?.role === "Vendor") {
      return data.navMain.filter((item) => item.url === "/stores" || item.url === "/qr-scanner")
    }
    const adminOnlyUrls = [
      "/profiles",
      "/tools/trash",
      "/users",
      "/admin/approvals",
      "/settings"
    ];
    const allowed = user?.allowedPages || [];
    return data.navMain.filter((item) => {
      if (adminOnlyUrls.includes(item.url)) return false;
      if (item.url === "/qr-scanner") return true;
      if (item.url === "/dashboard") return allowed.includes("/dashboard");
      if (item.url === "/projects") return allowed.includes("/projects");
      if (item.url === "/stores") return allowed.includes("/stores");
      if (item.url === "/challans/history") return allowed.includes("/stores") || allowed.includes("/tools") || allowed.includes("/challans");
      if (item.url === "/tools/scrap") return allowed.includes("/stores") || allowed.includes("/tools") || allowed.includes("/scrap");
      return true;
    });
  }, [user])

  const currentUserData = React.useMemo(() => {
    if (!user) return data.user
    return {
      name: user.username || user.email,
      email: user.email,
      avatar: "",
    }
  }, [user])

  const homePath = React.useMemo(() => getDefaultAllowedPath(user), [user]);

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
            <SidebarMenuButton size="lg" render={<NavLink to={homePath} />}>
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
