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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import React from "react"
import { ChevronRightIcon, MoreVertical, Info } from "lucide-react"

interface PageDetail {
    title: string;
    description?: string;
}

const getPageDetails = (pathname: string, state?: any, lastBreadcrumbLabel?: string): PageDetail => {
    // 1. Explicit details passed in navigation state
    if (state?.pageDetails) {
        if (typeof state.pageDetails === 'string') {
            return { title: state.pageDetails };
        }
        return state.pageDetails;
    }
    if (state?.pageDescription) {
        return {
            title: state.pageTitle || lastBreadcrumbLabel || "Page Details",
            description: state.pageDescription
        };
    }

    // 2. Exact and regex path matching
    if (pathname === '/' || pathname === '/dashboard') {
        return {
            title: "Executive Dashboard",
            description: "Real-time equipment allocation, gate pass movements, fleet status & compliance telemetry."
        };
    }

    if (pathname === '/projects') {
        return {
            title: "Project Inventory",
            description: "Active infrastructure projects, site locations, and tool crib assignments."
        };
    }

    if (/^\/projects\/[^\/]+\/stores$/.test(pathname) || pathname === '/stores') {
        return {
            title: "Store Inventory",
            description: "Warehouses, site hubs, tool cribs, and material storage locations."
        };
    }

    if (/^\/stores\/[^\/]+\/tools\/import$/.test(pathname)) {
        return {
            title: "Bulk Import Tools",
            description: "Upload, validate, and batch import tools into store inventory from Excel/CSV."
        };
    }

    if (/^\/stores\/[^\/]+\/tools$/.test(pathname) || pathname === '/tools') {
        return {
            title: "Store Tools Inventory",
            description: "Complete equipment registry, calibration tracking, issues, returns, and tool transfers."
        };
    }

    if (pathname === '/tools/trash' || pathname === '/trash') {
        return {
            title: "Deleted Tools (Trash)",
            description: "Soft-deleted tool archives. Restore tools to original store or permanently delete."
        };
    }

    if (pathname === '/tools/scrap' || pathname === '/scrap') {
        return {
            title: "Scrap & Decommissioned Tools",
            description: "Tools condemned or marked for scrap, awaiting salvage manifest or dealer disposal."
        };
    }

    if (/^\/vt\/[^\/]+$/.test(pathname) || /^\/tooldetails\/[^\/]+$/.test(pathname)) {
        return {
            title: "Tool Quick View",
            description: "Detailed specifications, calibration status, movement timeline, and current location."
        };
    }

    if (pathname === '/challans/delivery/preview') {
        return {
            title: "Delivery Challan Preview",
            description: "Outward gate pass documentation, dispatch verification, and printable dispatch forms."
        };
    }

    if (/^\/challans\/return\/preview/.test(pathname)) {
        return {
            title: "Return Challan Preview",
            description: "Inward gate pass documentation, site returns verification, and material receiving."
        };
    }

    if (pathname === '/challans/history') {
        return {
            title: "Challan Documentation History",
            description: "Chronological archive of all generated delivery and return challans."
        };
    }

    if (pathname === '/reports/tools') {
        return {
            title: "Tool Movement Reports",
            description: "Audit trail of tool transfers, issues, and returns across sites and stores."
        };
    }

    if (pathname === '/reports/challans') {
        return {
            title: "Challan Activity Reports",
            description: "Delivery challans (DC) and return challans (RC) documentation logs."
        };
    }

    if (pathname === '/reports/missing') {
        return {
            title: "Missing Tools Investigation",
            description: "Equipment reported missing or lost, pending site verification and recovery."
        };
    }

    if (pathname === '/reports/inspections') {
        return {
            title: "Inspection & Calibration Reports",
            description: "Preventive maintenance, test certificates, and physical verification audit logs."
        };
    }

    if (pathname === '/reports/scrap') {
        return {
            title: "Scrap & Disposal Reports",
            description: "Scrap declarations, gate pass clearances, and authorized dealer disposal logs."
        };
    }

    if (pathname === '/reports/subcontractors') {
        return {
            title: "Subcontractor Reports",
            description: "Tools and heavy equipment issued to external partner agencies."
        };
    }

    if (pathname === '/reports/logins') {
        return {
            title: "User Login & Security Audits",
            description: "Authentication history, session timestamps, and administrative access logs."
        };
    }

    if (pathname.startsWith('/reports')) {
        return {
            title: "Central Reports Hub",
            description: "Comprehensive audit reports, tool movements, challans, inspections, and analytics."
        };
    }

    if (pathname === '/profiles/subcontractors') {
        return {
            title: "Subcontractor Directory",
            description: "Contracting partner profiles, agency contacts, and equipment work orders."
        };
    }

    if (pathname === '/profiles/scrap-dealers') {
        return {
            title: "Authorized Scrap Dealers",
            description: "Certified scrap merchants, disposal agencies, and buyer contact directory."
        };
    }

    if (pathname === '/profiles/suppliers' || pathname === '/vendors') {
        return {
            title: "Equipment Suppliers & OEMs",
            description: "Tool vendors, manufacturers, warranty providers, and procurement contacts."
        };
    }

    if (pathname.startsWith('/profiles')) {
        return {
            title: "Partner & Vendor Profiles",
            description: "Manage subcontractors, authorized scrap dealers, and equipment suppliers."
        };
    }

    if (/^\/users\/[^\/]+\/access$/.test(pathname)) {
        return {
            title: "User Access Control",
            description: "Granular tool permissions, store-level authorizations, and administrative security rights."
        };
    }

    if (pathname === '/users') {
        return {
            title: "User Management",
            description: "System user accounts, credentials, contact details, and department roles."
        };
    }

    if (pathname === '/admin/approvals' || pathname === '/approvals') {
        return {
            title: "Administrative Approval Center",
            description: "Review, authorize, or reject pending tool requests, transfers, and disposals."
        };
    }

    if (pathname === '/settings/forms') {
        return {
            title: "Dynamic Form Management",
            description: "Configure custom inspection checklists, dynamic fields, and form layouts."
        };
    }

    if (pathname === '/settings/tool-quick-view') {
        return {
            title: "Tool Quick View Layout",
            description: "Customize visible attributes, badges, and fields in tool inspection cards."
        };
    }

    if (pathname.startsWith('/settings')) {
        return {
            title: "System Settings",
            description: "Global configurations, branding, company parameters, and site defaults."
        };
    }

    if (pathname === '/qr-scanner') {
        return {
            title: "QR & Barcode Scanner",
            description: "Scan physical tool asset tags and barcodes for instant lookup and status verification."
        };
    }

    const title = lastBreadcrumbLabel || "Page Details";
    return {
        title,
        description: `Overview and management controls for ${title.toLowerCase()}.`
    };
};

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
            test: /^\/tools\/trash$/,
            build: () => [
                { label: 'Tools', href: '/stores' },
                { label: 'Trash', href: '/tools/trash' }
            ]
        },
        {
            test: /^\/tools\/scrap$/,
            build: () => [
                { label: 'Tools', href: '/stores' },
                { label: 'Scrap', href: '/tools/scrap' }
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
        "trash": "Trash",
        "scrap": "Scrap",
        "approvals": "Approvals",
        "profiles": "Profiles",
        "challans": "Challans",
        "history": "History",
        "delivery": "Delivery",
        "return": "Return",
        "preview": "Preview",
        "subcontractors": "Subcontractors",
        "scrap-dealers": "Scrap Dealers",
        "suppliers": "Suppliers",
        "access": "Access Control"
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

    const lastItem = finalBreadcrumbs[finalBreadcrumbs.length - 1];
    const lastLabel = lastItem ? (typeof lastItem === 'object' ? lastItem.label : String(lastItem)) : undefined;
    const pageDetails = getPageDetails(pathname, state, lastLabel);

    return (
        <header className="sticky top-0 z-20 flex h-10 sm:h-11 shrink-0 items-center gap-2 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 transition-all duration-300">
            <SidebarTrigger className="-ml-1 hover:bg-muted/50 rounded-lg size-8 md:hidden text-foreground" title="Open navigation">
                <MoreVertical className="size-4.5" />
            </SidebarTrigger>
            <Separator orientation="vertical" className="mx-1.5 h-4.5 bg-border/50 md:hidden" />
            <Breadcrumb>
                <BreadcrumbList className="font-medium tracking-tight sm:gap-1.5 text-sm text-foreground/80 flex-nowrap items-center overflow-x-auto no-scrollbar">
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

                    {/* Info Icon with Page Details Tooltip */}
                    {pageDetails && (
                        <>
                            {finalBreadcrumbs.length > 0 && (
                                <BreadcrumbSeparator>
                                    <ChevronRightIcon className="size-4 text-muted-foreground/50" />
                                </BreadcrumbSeparator>
                            )}
                            <BreadcrumbItem>
                                <TooltipProvider delay={100}>
                                    <Tooltip>
                                        <TooltipTrigger
                                            className="flex items-center justify-center size-5.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus:outline-none"
                                            aria-label="Page details"
                                        >
                                            <Info className="size-3.5 sm:size-4" />
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="bottom"
                                            align="center"
                                            sideOffset={6}
                                            className="z-50 bg-black text-white dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-800 dark:border-zinc-700 shadow-xl px-3 py-1.5 rounded-lg text-xs"
                                        >
                                            <div className="flex flex-col gap-0.5 text-center">
                                                <span className="font-semibold text-xs tracking-tight whitespace-nowrap">
                                                    {pageDetails.title}
                                                </span>
                                                {pageDetails.description && (
                                                    <span className="text-[10.5px] text-zinc-300 dark:text-zinc-400 font-normal leading-tight max-w-[240px]">
                                                        {pageDetails.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </BreadcrumbItem>
                        </>
                    )}
                </BreadcrumbList>
            </Breadcrumb>
        </header>
    )
}
