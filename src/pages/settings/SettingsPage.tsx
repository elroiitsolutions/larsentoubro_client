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
import { PaletteIcon, FileTextIcon, ArrowLeftIcon, BarChart3Icon, SlidersIcon } from "lucide-react"
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
        (!user.allowedPages || !user.allowedPages.includes("/settings"))
    )

    if (isRestricted) {
        return <NoAccessPage />
    }

    if (activeTab === 'profile') return <ProfileSettings onBack={() => setActiveTab(null)} />

    return (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full pr-1 pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-5 gap-6">
                <Card className="cursor-pointer border-2 border-transparent bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out" onClick={() => navigate('/settings/forms')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                <FileTextIcon className="size-5" />
                            </div>
                            <h3 className="font-semibold">Forms Management</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Configure dynamic forms like Create Project, Store, and User.
                        </p>
                    </CardContent>
                </Card>

                {/* <Card className="cursor-pointer border-2 border-transparent bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out" onClick={() => navigate('/challans/history')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                <FileTextIcon className="size-5" />
                            </div>
                            <h3 className="font-semibold">Challan Register</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            View and manage delivery & return challan history.
                        </p>
                    </CardContent>
                </Card> */}
                <Card className="cursor-pointer border-2 border-transparent bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out" onClick={() => navigate('/settings/tool-quick-view')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                <SlidersIcon className="size-5" />
                            </div>
                            <h3 className="font-semibold">Tool Quick View Layout</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Configure fields and visibility on the Quick Tool View (/vt) module.
                        </p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer border-2 border-transparent bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out" onClick={() => navigate('/settings/tool-details-view')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                                <PaletteIcon className="size-5" />
                            </div>
                            <h3 className="font-semibold">Tool Details Card Layout</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Configure fields and section visibility on the Full Tool Details (/tooldetails) page.
                        </p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer border-2 border-transparent bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out" onClick={() => navigate('/settings/reports')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                <BarChart3Icon className="size-5" />
                            </div>
                            <h3 className="font-semibold">Reports & Audit</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            View operational reports, inventory analytics, and loss audit registers.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default SettingsPage
