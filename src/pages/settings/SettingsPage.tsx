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
import { UserIcon, PaletteIcon, FileTextIcon, ShieldIcon, ArrowLeftIcon } from "lucide-react"

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

function AppearanceSettings({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeftIcon className="size-4" />
                </Button>
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Appearance</h2>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Theme Settings</CardTitle>
                    <CardDescription>Customize the look and feel of the portal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Dark Mode</p>
                            <p className="text-xs text-muted-foreground">Toggle dark theme across the app</p>
                        </div>
                        <Button variant="outline" size="sm">
                            Toggle Theme
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function SecuritySettings({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeftIcon className="size-4" />
                </Button>
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Security & Danger Zone</h2>
                </div>
            </div>
            <Card className="border-destructive/40">
                <CardHeader>
                    <CardTitle className="text-destructive">Delete Account</CardTitle>
                    <CardDescription>Irreversible and destructive actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Delete Account</p>
                            <p className="text-xs text-muted-foreground">
                                Permanently remove your account and all associated data.
                            </p>
                        </div>
                        <Button variant="destructive" size="sm">
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState<string | null>(null)
    const navigate = useNavigate()

    if (activeTab === 'profile') return <ProfileSettings onBack={() => setActiveTab(null)} />
    if (activeTab === 'appearance') return <AppearanceSettings onBack={() => setActiveTab(null)} />
    if (activeTab === 'security') return <SecuritySettings onBack={() => setActiveTab(null)} />

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* <div className="flex items-center justify-between border-b pb-4">
                <div className="relative pt-4">
                    <Input placeholder="Search settings..." className="w-64 h-9 bg-muted/50" />
                </div>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 pt-5 lg:grid-cols-5 gap-6">
                <Card className="cursor-pointer border-2 border-transparent bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out" onClick={() => setActiveTab('profile')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                <UserIcon className="size-5" />
                            </div>
                            <h3 className="font-semibold">Manage Profile</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Update your personal information, display name, and email address.
                        </p>
                    </CardContent>
                </Card>

                {/* <Card className="cursor-pointer border-2 border-transparent bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out" onClick={() => setActiveTab('appearance')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                <PaletteIcon className="size-5" />
                            </div>
                            <h3 className="font-semibold">Appearance</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Customize the look and feel of the portal, toggle dark mode.
                        </p>
                    </CardContent>
                </Card> */}

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

                {/* <Card className="cursor-pointer border-2 border-transparent bg-card hover:border-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out" onClick={() => setActiveTab('security')}>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                <ShieldIcon className="size-5" />
                            </div>
                            <h3 className="font-semibold">Security</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Manage account security, and perform irreversible actions.
                        </p>
                    </CardContent>
                </Card> */}
            </div>
        </div>
    )
}
