import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Link } from "react-router-dom"

export function SettingsPage() {
    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div>
                <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your account settings and preferences.
                </p>
            </div>

            {/* Profile settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
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

            <Separator />

            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
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

            <Separator />

            {/* Forms Management */}
            <Card>
                <CardHeader>
                    <CardTitle>Forms Management</CardTitle>
                    <CardDescription>Configure dynamic forms like Create Project, Store, and User.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" asChild>
                        <Link to="/settings/forms">Manage Forms</Link>
                    </Button>
                </CardContent>
            </Card>

            <Separator />

            {/* Danger zone */}
            <Card className="border-destructive/40">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
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
