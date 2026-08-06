import React, { useEffect, useState } from "react"
import { ShieldCheck, Clock, XCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import api from "@/lib/axios"

interface UserWaitingScreenProps {
    requestId: string
    email: string
    onApproved: (token: string, user: any) => void
    onCancel: () => void
}

export function UserWaitingScreen({ requestId, email, onApproved, onCancel }: UserWaitingScreenProps) {
    const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
    const [status, setStatus] = useState<"PENDING" | "REJECTED" | "EXPIRED">("PENDING")
    const [rejectReason, setRejectReason] = useState<string>("")

    useEffect(() => {
        let isMounted = true

        // 1. Connect to Realtime EventSource (SSE)
        const eventSource = new EventSource("/api/users/events")

        eventSource.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data)
                if (parsed.requestId === requestId || parsed.event === "login_approved" || parsed.event === "login_rejected" || parsed.event === "login_expired") {
                    if (parsed.event === "login_approved" && parsed.data?.token) {
                        if (isMounted) {
                            onApproved(parsed.data.token, parsed.data.user)
                        }
                    } else if (parsed.event === "login_rejected") {
                        if (isMounted) {
                            setStatus("REJECTED")
                            setRejectReason(parsed.data?.reason || "Your login request was rejected by the administrator.")
                        }
                    } else if (parsed.event === "login_expired") {
                        if (isMounted) {
                            setStatus("EXPIRED")
                        }
                    }
                }
            } catch (e) {
                console.error("SSE parse error", e)
            }
        }

        // 2. Fallback polling every 3 seconds
        const pollInterval = setInterval(async () => {
            if (status !== "PENDING") return
            try {
                const res = await api.get(`/api/users/login-request/${requestId}`)
                if (res.data.success) {
                    if (res.data.status === "APPROVED" && res.data.token) {
                        if (isMounted) {
                            onApproved(res.data.token, res.data.user)
                        }
                    } else if (res.data.status === "REJECTED") {
                        if (isMounted) {
                            setStatus("REJECTED")
                            setRejectReason(res.data.reason || "Your login request was rejected by the administrator.")
                        }
                    } else if (res.data.status === "EXPIRED") {
                        if (isMounted) {
                            setStatus("EXPIRED")
                        }
                    }
                }
            } catch (e) {
                console.error("Polling error", e)
            }
        }, 3000)

        // 3. 10-minute countdown timer
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    if (isMounted) setStatus("EXPIRED")
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            isMounted = false
            eventSource.close()
            clearInterval(pollInterval)
            clearInterval(timer)
        }
    }, [requestId, onApproved, status])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0')
        const s = (seconds % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    return (
        <Card className="w-full border-border/70 shadow-xl rounded-2xl bg-card">
            <CardHeader className="text-center pb-4">
                {status === "PENDING" && (
                    <div className="mx-auto size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-8 ring-primary/5 mb-2 animate-pulse">
                        <ShieldCheck className="size-8 text-primary" />
                    </div>
                )}

                {status === "REJECTED" && (
                    <div className="mx-auto size-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center ring-8 ring-destructive/5 mb-2">
                        <XCircle className="size-8 text-destructive" />
                    </div>
                )}

                {status === "EXPIRED" && (
                    <div className="mx-auto size-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-8 ring-amber-500/5 mb-2">
                        <Clock className="size-8 text-amber-500" />
                    </div>
                )}

                <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    {status === "PENDING" && "Login Approval Requested"}
                    {status === "REJECTED" && "Request Rejected"}
                    {status === "EXPIRED" && "Request Expired"}
                </CardTitle>

                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    {status === "PENDING" && (
                        <>
                            Login request sent for <strong className="text-foreground">{email}</strong>. Waiting for administrator approval.
                        </>
                    )}
                    {status === "REJECTED" && (
                        <span>Your login request was rejected by the administrator.</span>
                    )}
                    {status === "EXPIRED" && (
                        <span>Your login request timed out after 10 minutes without administrator approval.</span>
                    )}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
                {status === "PENDING" && (
                    <div className="bg-muted/40 border border-border/50 rounded-xl p-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="size-4 text-primary" /> Time Remaining
                        </span>
                        <span className="text-xl font-mono font-bold text-primary">{formatTime(timeLeft)}</span>
                    </div>
                )}

                {status === "REJECTED" && rejectReason && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3.5 rounded-xl font-medium">
                        Reason: {rejectReason}
                    </div>
                )}

                <div className="pt-2">
                    <Button 
                        variant="outline" 
                        onClick={onCancel}
                        className="w-full rounded-xl gap-2 text-xs font-semibold cursor-pointer h-10"
                    >
                        <ArrowLeft className="size-3.5" />
                        {status === "PENDING" ? "Cancel & Return to Login" : "Try Logging In Again"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
