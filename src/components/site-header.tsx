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
import { HomeIcon, ChevronRightIcon, MoreVertical } from "lucide-react"

const generateBreadcrumbs = (pathname: string, state?: any): Array<{ label: string, href: string }> => {
    const projectId = state?.projectId || state?.fromProjectId;
    const storesHref = projectId ? `/projects/${projectId}/stores` : '/projects';
    const fromStoreId = state?.fromStoreId;
    const toolsHref = fromStoreId ? `/stores/${fromStoreId}/tools` : storesHref;

    // 1. Explicit Route Maps for perfect structural matching
    const routes = [
        {
            test: /^\/stores$/,
            build: () => [
                { label: 'Projects', href: '/projects' }
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
                { label: 'Stores', href: storesHref },
                { label: 'Tools', href: `/stores/${m[1]}/tools` },
                { label: 'Import Tools', href: `/stores/${m[1]}/tools/import` }
            ]
        },
        {
            test: /^\/stores\/([^\/]+)\/tools$/,
            build: (m: string[]) => [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: storesHref },
                { label: 'Tools', href: `/stores/${m[1]}/tools` }
            ]
        },
        {
            test: /^\/vt\/([^\/]+)$/,
            build: (m: string[]) => [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: storesHref },
                { label: 'Tools', href: toolsHref },
                { label: `Quick View (${m[1]})`, href: `/vt/${m[1]}` }
            ]
        },
        {
            test: /^\/tooldetails\/([^\/]+)$/,
            build: (m: string[]) => [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: storesHref },
                { label: 'Tools', href: toolsHref },
                { label: `Tool Details (${m[1]})`, href: `/tooldetails/${m[1]}` }
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
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: storesHref },
                { label: 'Return Challan Preview', href: `/challans/return/preview/${m[1]}` }
            ]
        },
        {
            test: /^\/challans\/delivery\/preview$/,
            build: () => [
                { label: 'Projects', href: '/projects' },
                { label: 'Stores', href: storesHref },
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
        },
        {
            test: /^\/settings\/tool-quick-view$/,
            build: () => [
                { label: 'Settings', href: '/settings' },
                { label: 'Tool Quick View Layout', href: `/settings/tool-quick-view` }
            ]
        },
        {
            test: /^\/settings\/tool-details-view$/,
            build: () => [
                { label: 'Settings', href: '/settings' },
                { label: 'Tool Details Layout', href: `/settings/tool-details-view` }
            ]
        }
    ];

    for (const route of routes) {
        const match = pathname.match(route.test);
        if (match) {
            return route.build(match);
        }
    }

    // 2. Fallback logic for generic paths (/dashboard, /projects, etc)
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

    const rawBreadcrumbs = (state as any)?.breadcrumbs;
    const finalBreadcrumbs = (Array.isArray(rawBreadcrumbs) && rawBreadcrumbs.length > 0)
        ? rawBreadcrumbs
        : (generateBreadcrumbs(pathname, state) || []);

    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 transition-all duration-300">
            <SidebarTrigger className="-ml-1 hover:bg-muted/50 rounded-lg size-8 md:hidden text-foreground" title="Open navigation">
                <MoreVertical className="size-4.5" />
            </SidebarTrigger>
            <Separator orientation="vertical" className="mx-1.5 h-4.5 bg-border/50 md:hidden" />
            <Breadcrumb>
                <BreadcrumbList className="font-medium tracking-tight sm:gap-1.5 text-sm text-foreground/80">
                    <BreadcrumbItem className="hidden md:flex items-center">
                        <BreadcrumbLink render={(props) => (
                            <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors" {...props}>
                                <HomeIcon className="size-4" />
                            </Link>
                        )} />
                    </BreadcrumbItem>

                    {finalBreadcrumbs.length > 0 && (
                        <BreadcrumbSeparator className="hidden md:block">
                            <ChevronRightIcon className="size-4 text-muted-foreground/50" />
                        </BreadcrumbSeparator>
                    )}

                    {finalBreadcrumbs.map((item: any, index: number) => {
                        if (!item) return null;
                        const label = typeof item === 'object' ? item.label : String(item);
                        const href = typeof item === 'object' ? item.href : '#';
                        const isLast = index === finalBreadcrumbs.length - 1;

                        return (
                            <React.Fragment key={(href || '') + index}>
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage className="font-semibold text-foreground bg-primary/10 px-2.5 py-0.5 rounded-md text-primary text-xs">{label}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink render={(props) => (
                                            <Link to={href} className="hover:text-primary transition-colors text-xs" {...props}>{label}</Link>
                                        )} />
                                    )}
                                </BreadcrumbItem>
                                {!isLast && (
                                    <BreadcrumbSeparator>
                                        <ChevronRightIcon className="size-4 text-muted-foreground/50" />
                                    </BreadcrumbSeparator>
                                )}
                            </React.Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </header>
    )
}
