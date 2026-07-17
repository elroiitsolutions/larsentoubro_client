import { LoginForm } from "@/components/login-form"

export function LoginPage() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-3">
                        <svg viewBox="0 0 24 24" fill="none" className="size-6 text-primary-foreground" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">L&T Enterprise Portal</h2>
                </div>
                <LoginForm />
            </div>
        </div>
    )
}
