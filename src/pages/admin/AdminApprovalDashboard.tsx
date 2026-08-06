import React, { useEffect, useState, useCallback } from "react"
import { ShieldCheck, Check, X, Bell, Activity, Clock, UserCheck, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import api from "@/lib/axios"

interface LoginRequestItem {
    id: string
    user_id: string
    user_name: string
    user_email: string
    status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED"
    requested_at: string
    ip_address?: string
}

export function AdminApprovalDashboard() {
    const [requests, setRequests] = useState<LoginRequestItem[]>([])
    const [onlineCount, setOnlineCount] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const [actionId, setActionId] = useState<string | null>(null)

    const fetchPendingRequests = useCallback(async () => {
        try {
            const res = await api.get("/api/users/login-requests/pending")
            if (res.data.success) {
                setRequests(res.data.data || [])
            }
        } catch (err: any) {
            console.error("Failed to fetch pending requests", err)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchOnlineUsers = useCallback(async () => {
        try {
            const res = await api.get("/api/users/online-users")
            if (res.data.success) {
                setOnlineCount(res.data.data?.count || 0)
            }
        } catch (err: any) {
            console.error("Failed to fetch online users", err)
        }
    }, [])

    useEffect(() => {
        fetchPendingRequests()
        fetchOnlineUsers()

        // Realtime EventSource listener
        const eventSource = new EventSource("/api/users/events")

        eventSource.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data)
                if (parsed.event === "new_login_request") {
                    toast.info(`New login request from ${parsed.data?.user_name || "User"}`)
                    fetchPendingRequests()
                } else if (parsed.event === "online_users_updated") {
                    setOnlineCount(parsed.data?.onlineUsers?.length || 0)
                } else if (parsed.event === "login_approved" || parsed.event === "login_rejected" || parsed.event === "login_expired") {
                    fetchPendingRequests()
                }
            } catch (e) {
                console.error("SSE parse error", e)
            }
        }

        const interval = setInterval(() => {
            fetchPendingRequests()
            fetchOnlineUsers()
        }, 10000)

        return () => {
            eventSource.close()
            clearInterval(interval)
        }
    }, [fetchPendingRequests, fetchOnlineUsers])

    const handleApprove = async (id: string, name: string) => {
        setActionId(id)
        try {
            const res = await api.post(`/api/users/login-requests/${id}/approve`)
            if (res.data.success) {
                toast.success(`Approved login request for ${name}`)
                setRequests(prev => prev.filter(r => r.id !== id))
            } else {
                toast.error(res.data.message || "Failed to approve request")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error approving request")
        } finally {
            setActionId(null)
        }
    }

    const handleReject = async (id: string, name: string) => {
        const reason = window.prompt(`Enter rejection reason for ${name} (optional):`, "Rejected by administrator")
        if (reason === null) return // cancelled prompt

        setActionId(id)
        try {
            const res = await api.post(`/api/users/login-requests/${id}/reject`, { reason })
            if (res.data.success) {
                toast.success(`Rejected login request for ${name}`)
                setRequests(prev => prev.filter(r => r.id !== id))
            } else {
                toast.error(res.data.message || "Failed to reject request")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Error rejecting request")
        } finally {
            setActionId(null)
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/60 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-8 ring-primary/5">
                        <ShieldCheck className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            Admin Login Approvals
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Review and authorize real-time user login requests
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-muted/60 border border-border/50 text-xs font-semibold text-foreground">
                        <Bell className="size-3.5 text-primary" />
                        <span>Pending Requests:</span>
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold">
                            {requests.length}
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <Activity className="size-3.5 text-emerald-500" />
                        <span>Online: {onlineCount}</span>
                    </div>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchPendingRequests}
                        className="rounded-xl h-9 gap-1.5 cursor-pointer text-xs"
                    >
                        <RefreshCw className="size-3.5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Pending Requests Queue Grid */}
            <Card className="border-border/60 shadow-sm rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Clock className="size-4 text-primary" />
                        Pending Authorization Queue ({requests.length})
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Users waiting for login approval. Approving grants immediate authenticated session tokens.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="py-16 text-center text-xs text-muted-foreground italic">
                            Loading pending approval requests...
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="py-16 text-center border-2 border-dashed border-border/60 rounded-2xl bg-muted/20 flex flex-col items-center">
                            <UserCheck className="size-10 mb-2.5 text-primary/40" />
                            <h3 className="text-sm font-bold text-foreground">No Pending Requests</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                All user login authorization requests have been processed.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {requests.map((req) => (
                                <div 
                                    key={req.id} 
                                    className="bg-background border border-border/70 hover:border-primary/40 transition-all rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <h4 className="font-bold text-foreground text-sm tracking-tight">{req.user_name}</h4>
                                            <p className="text-xs text-muted-foreground">{req.user_email}</p>
                                        </div>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                                            {req.status}
                                        </span>
                                    </div>

                                    <div className="bg-muted/40 rounded-xl p-3 border border-border/50 space-y-1 text-[11px] font-mono text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Requested:</span>
                                            <span className="text-foreground font-semibold">
                                                {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        {req.ip_address && (
                                            <div className="flex justify-between">
                                                <span>IP Address:</span>
                                                <span>{req.ip_address}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <Button
                                            size="sm"
                                            disabled={actionId === req.id}
                                            onClick={() => handleApprove(req.id, req.user_name)}
                                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <Check className="size-3.5" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={actionId === req.id}
                                            onClick={() => handleReject(req.id, req.user_name)}
                                            className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold h-9 gap-1.5 cursor-pointer shadow-xs"
                                        >
                                            <X className="size-3.5" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
