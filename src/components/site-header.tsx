import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useLocation } from "react-router-dom"

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/projects": "Projects",
    "/stores": "Stores",
    "/users": "Users",
    "/tools": "Tools",
    "/settings": "Settings",
}

export function SiteHeader() {
    const { pathname } = useLocation()
    const title = pageTitles[pathname] ?? "L&T App"

    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <h1 className="text-base font-semibold">{title}</h1>
        </header>
    )
}
