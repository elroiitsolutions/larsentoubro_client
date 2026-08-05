import { Outlet } from "react-router-dom"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ScrollArea } from "@/components/ui/scroll-area"

export function SidebarLayout() {
    return (
        <SidebarProvider className="h-screen overflow-hidden">
            <AppSidebar />
            <SidebarInset className="h-screen overflow-hidden flex flex-col">
                <SiteHeader />
                <ScrollArea className="flex-1 min-h-0 [&_[data-slot=scroll-area-viewport]>div]:!block [&_[data-slot=scroll-area-viewport]>div]:min-h-full">
                    <div className="p-4 pt-0 flex flex-col min-h-full">
                        <Outlet />
                    </div>
                </ScrollArea>
            </SidebarInset>
        </SidebarProvider>
    )
}
