import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import { FileTextIcon, ArrowLeftIcon, BarChart3Icon, SlidersIcon, Settings2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import NoAccessPage from "../NoAccessPage"

function ProfileSettings({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeftIcon className="size-4" />
                </Button>
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="settings-name">
                            Display Name
                        </label>
                        <Input id="settings-name" defaultValue="L&T Admin" />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium" htmlFor="settings-email">
                            Email Address
                        </label>
                        <Input id="settings-email" type="email" defaultValue="admin@landt.com" />
                    </div>
                    <Button>Save Changes</Button>
                </CardContent>
            </Card>
        </div>
    )
}

export function SettingsPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<string | null>(null)
    const navigate = useNavigate()

    const isRestricted = Boolean(
        user &&
        user.role !== "Admin" &&
        (!user.allowedPages || !user.allowedPages.includes("/settings")) && !user.canCreateUser
    )

    if (isRestricted) {
        return <NoAccessPage />
    }

    if (activeTab === 'profile') return <ProfileSettings onBack={() => setActiveTab(null)} />

    return (
        <div className="w-full flex flex-col space-y-3 pt-1 pb-4 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20 shrink-0">
                    <Settings2 className="size-4" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">Settings & Configurations</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <Card className="cursor-pointer border border-border/60 bg-card shadow-2xs hover:border-primary/40 hover:shadow-xs rounded-xl transition-all" onClick={() => navigate('/settings/forms')}>
                    <CardContent className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                                <FileTextIcon className="size-4" />
                            </div>
                            <h3 className="font-bold text-xs sm:text-sm">Forms Management</h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                            Configure dynamic forms like Create Project, Store, and User.
                        </p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer border border-border/60 bg-card shadow-2xs hover:border-primary/40 hover:shadow-xs rounded-xl transition-all" onClick={() => navigate('/settings/tool-quick-view')}>
                    <CardContent className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <SlidersIcon className="size-4" />
                            </div>
                            <h3 className="font-bold text-xs sm:text-sm">Tool Quick View Layout</h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                            Configure fields and visibility on the Quick Tool View (/vt) module.
                        </p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer border border-border/60 bg-card shadow-2xs hover:border-primary/40 hover:shadow-xs rounded-xl transition-all" onClick={() => navigate('/settings/reports')}>
                    <CardContent className="p-3.5 sm:p-4">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <BarChart3Icon className="size-4" />
                            </div>
                            <h3 className="font-bold text-xs sm:text-sm">Reports & Audit</h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                            View operational reports, inventory analytics, and loss audit registers.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default SettingsPage
