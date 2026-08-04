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
import { HomeIcon, ChevronRightIcon } from "lucide-react"

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
    const { pathname, state } = useLocation()

    // Remove empty segments
    const rawSegments = pathname.split('/').filter(Boolean)

    // Base breadcrumb generation from URL (Fallback)
    const breadcrumbItems = rawSegments.map((segment, index) => ({
        segment,
        href: '/' + rawSegments.slice(0, index + 1).join('/'),
        isId: /^[a-fA-F0-9]{24}$/.test(segment)
    })).filter(item => !item.isId)

    // If navigation state provides a dynamic breadcrumb trail, use it instead!
    // This perfectly captures the user's actual navigation path without hardcoding.
    const stateBreadcrumbs = state?.breadcrumbs as Array<{ label: string, href: string }> | undefined;

    return (
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/60 backdrop-blur-xl px-4 transition-all duration-300 shadow-sm">
            <SidebarTrigger className="-ml-1 hover:bg-muted/50 rounded-xl" />
            <Separator orientation="vertical" className="mx-2 h-5 bg-border/50" />
            <Breadcrumb>
                <BreadcrumbList className="font-medium tracking-tight sm:gap-2 text-foreground/80">
                    {/* Optional: Add a Home link as the root breadcrumb */}
                    <BreadcrumbItem className="hidden md:flex items-center">
                        <BreadcrumbLink render={(props) => (
                            <Link to="/" className="flex items-center gap-1.5 hover:text-primary transition-colors" {...props}>
                                <HomeIcon className="size-4" />
                            </Link>
                        )} />
                    </BreadcrumbItem>

                    {breadcrumbItems.length > 0 && (
                        <BreadcrumbSeparator className="hidden md:block">
                            <ChevronRightIcon className="size-4 text-muted-foreground/50" />
                        </BreadcrumbSeparator>
                    )}

                    {stateBreadcrumbs ? (
                        stateBreadcrumbs.map((item, index) => {
                            const isLast = index === stateBreadcrumbs.length - 1
                            return (
                                <React.Fragment key={item.href}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage className="font-bold text-foreground bg-primary/10 px-2.5 py-1 rounded-md text-primary">{item.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink render={(props) => (
                                                <Link to={item.href} className="hover:text-primary transition-colors" {...props}>{item.label}</Link>
                                            )} />
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && (
                                        <BreadcrumbSeparator>
                                            <ChevronRightIcon className="size-4 text-muted-foreground/50" />
                                        </BreadcrumbSeparator>
                                    )}
                                </React.Fragment>
                            )
                        })
                    ) : (
                        breadcrumbItems.map((item, index) => {
                            const isLast = index === breadcrumbItems.length - 1
                            const href = item.href
                            const segment = item.segment
                            const title = pageTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

                            return (
                                <React.Fragment key={href}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage className="font-bold text-foreground bg-primary/10 px-2.5 py-1 rounded-md text-primary">{title}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink render={(props) => (
                                                <Link to={href} className="hover:text-primary transition-colors" {...props}>{title}</Link>
                                            )} />
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && (
                                        <BreadcrumbSeparator>
                                            <ChevronRightIcon className="size-4 text-muted-foreground/50" />
                                        </BreadcrumbSeparator>
                                    )}
                                </React.Fragment>
                            )
                        })
                    )}
                </BreadcrumbList>
            </Breadcrumb>
        </header>
    )
}
