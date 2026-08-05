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

const generateBreadcrumbs = (pathname: string): Array<{ label: string, href: string }> => {
    // 1. Explicit Route Maps for perfect structural matching
    const routes = [
        {
            test: /^\/stores$/,
            build: () => [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: '/stores' }
            ]
        },
        {
            test: /^\/projects\/([^\/]+)\/stores$/,
            build: (m: string[]) => [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: `/projects/${m[1]}/stores` }
            ]
        },
        {
            test: /^\/stores\/([^\/]+)\/tools\/import$/,
            build: (m: string[]) => [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: '/stores' },
                { label: 'Tools', href: `/stores/${m[1]}/tools` },
                { label: 'Import Tools', href: `/stores/${m[1]}/tools/import` }
            ]
        },
        {
            test: /^\/stores\/([^\/]+)\/tools$/,
            build: (m: string[]) => [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: '/stores' },
                { label: 'Tools', href: `/stores/${m[1]}/tools` }
            ]
        },
        {
            test: /^\/vt\/([^\/]+)$/,
            build: (m: string[]) => [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: '/stores' },
                { label: 'Tools', href: '/stores' }, // Generic fallback for direct visits
                { label: m[1], href: `/vt/${m[1]}` }
            ]
        },
        {
            test: /^\/users\/([^\/]+)\/access$/,
            build: (m: string[]) => [
                { label: 'Users', href: '/users' },
                { label: 'Access Control', href: `/users/${m[1]}/access` }
            ]
        },
        {
            test: /^\/challans\/return\/preview\/([^\/]+)$/,
            build: (m: string[]) => [
                { label: 'Stores', href: '/stores' },
                { label: 'Return Challan Preview', href: `/challans/return/preview/${m[1]}` }
            ]
        },
        {
            test: /^\/challans\/delivery\/preview$/,
            build: () => [
                { label: 'Stores', href: '/stores' },
                { label: 'Delivery Challan Preview', href: `/challans/delivery/preview` }
            ]
        },
        {
            test: /^\/challans\/history$/,
            build: () => [
                { label: 'Settings', href: '/settings' },
                { label: 'Challan History', href: `/challans/history` }
            ]
        },
        {
            test: /^\/settings\/reports$/,
            build: () => [
                { label: 'Settings', href: '/settings' },
                { label: 'Reports & Audit', href: `/settings/reports` }
            ]
        },
        {
            test: /^\/settings\/forms$/,
            build: () => [
                { label: 'Settings', href: '/settings' },
                { label: 'Forms Management', href: `/settings/forms` }
            ]
        }
    ];

    for (const route of routes) {
        const match = pathname.match(route.test);
        if (match) {
            return route.build(match);
        }
    }

    // 2. Fallback logic for generic paths (/dashboard, /projects, /stores, etc)
    const rawSegments = pathname.split('/').filter(Boolean);
    const pageTitles: Record<string, string> = {
        "dashboard": "Dashboard",
        "projects": "Projects",
        "stores": "Stores",
        "users": "Users",
        "tools": "Tools",
        "settings": "Settings",
        "forms": "Forms Management",
        "reports": "Reports",
    };

    return rawSegments
        .map((segment, index) => {
            const title = pageTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
            return {
                label: title,
                href: '/' + rawSegments.slice(0, index + 1).join('/')
            };
        })
        .filter(item => {
            // Filter out MongoDB ObjectIDs and pure numbers from fallback breadcrumbs
            const segment = item.href.split('/').pop() || '';
            return !(/^[a-fA-F0-9]{24}$/.test(segment) || /^[0-9]+$/.test(segment));
        });
};

export function SiteHeader() {
    const { pathname, state } = useLocation()

    // Priority 1: Navigation State (if perfectly formed and present)
    // Priority 2: URL Parser generator
    let finalBreadcrumbs = (state?.breadcrumbs as Array<{ label: string, href: string }> | undefined)
        || generateBreadcrumbs(pathname);

    // Failsafe
    if (!finalBreadcrumbs || finalBreadcrumbs.length === 0) {
        finalBreadcrumbs = generateBreadcrumbs(pathname);
    }

    return (
        <header className="sticky top-0  flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/60 backdrop-blur-xl px-4 transition-all duration-300 shadow-sm">
            <SidebarTrigger className="-ml-1 hover:bg-muted/50 rounded-xl" />
            <Separator orientation="vertical" className="mx-2 h-5 bg-border/50" />
            <Breadcrumb>
                <BreadcrumbList className="font-medium tracking-tight sm:gap-2 text-foreground/80">
                    <BreadcrumbItem className="hidden md:flex items-center">
                        <BreadcrumbLink render={(props) => (
                            <Link to="/" className="flex items-center gap-1.5 hover:text-primary transition-colors" {...props}>
                                <HomeIcon className="size-4" />
                            </Link>
                        )} />
                    </BreadcrumbItem>

                    {finalBreadcrumbs.length > 0 && (
                        <BreadcrumbSeparator className="hidden md:block">
                            <ChevronRightIcon className="size-4 text-muted-foreground/50" />
                        </BreadcrumbSeparator>
                    )}

                    {finalBreadcrumbs.map((item, index) => {
                        const isLast = index === finalBreadcrumbs.length - 1
                        return (
                            <React.Fragment key={item.href + index}>
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
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </header>
    )
}
