import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useLocation, Link } from "react-router-dom"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import React from "react"

const pageTitles: Record<string, string> = {
    "dashboard": "Dashboard",
    "projects": "Projects",
    "stores": "Stores",
    "users": "Users",
    "tools": "Tools",
    "settings": "Settings",
    "forms": "Forms Management",
}

export function SiteHeader() {
    const { pathname } = useLocation()
    
    // Remove empty segments
    const rawSegments = pathname.split('/').filter(Boolean)
    
    // Create breadcrumb items, preserving correct hrefs but filtering out ObjectIds
    const breadcrumbItems = rawSegments.map((segment, index) => ({
        segment,
        href: '/' + rawSegments.slice(0, index + 1).join('/'),
        isId: /^[a-fA-F0-9]{24}$/.test(segment)
    })).filter(item => !item.isId)

    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList className=" font-medium tracking-tight sm:gap-2 text-foreground">
                    {/* Optional: Add a Home link as the root breadcrumb */}
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink render={(props) => <Link to="/" {...props}>Home</Link>} />
                    </BreadcrumbItem>

                    {breadcrumbItems.length > 0 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                    )}

                    {breadcrumbItems.map((item, index) => {
                        const isLast = index === breadcrumbItems.length - 1
                        const href = item.href
                        const segment = item.segment
                        const title = pageTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

                        return (
                            <React.Fragment key={href}>
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage>{title}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink render={(props) => <Link to={href} {...props}>{title}</Link>} />
                                    )}
                                </BreadcrumbItem>
                                {!isLast && <BreadcrumbSeparator />}
                            </React.Fragment>
                        )
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </header>
    )
}
