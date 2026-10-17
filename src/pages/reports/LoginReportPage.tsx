import * as React from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Activity,
    SearchIcon,
    ShieldCheck,
    Download,
    RefreshCw,
    Clock,
    XCircle,
    UserCheck,
    Monitor,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Users
} from "lucide-react"
import reportService, { type LoginLogItem } from "@/services/report.service"
import { toast } from "sonner"

export function LoginReportPage() {
    const [logs, setLogs] = React.useState<LoginLogItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [exporting, setExporting] = React.useState(false)

    // Filter states
    const [search, setSearch] = React.useState("")
    const [roleFilter, setRoleFilter] = React.useState("All")
    const [statusFilter, setStatusFilter] = React.useState("All")
    const [startDate, setStartDate] = React.useState("")
    const [endDate, setEndDate] = React.useState("")

    // Pagination & Stats
    const [page, setPage] = React.useState(1)
    const [limit] = React.useState(25)
    const [totalPages, setTotalPages] = React.useState(1)
    const [stats, setStats] = React.useState({
        total: 0,
        success: 0,
        failed: 0,
        pending: 0,
        rejected: 0
    })

    const fetchReport = React.useCallback(async () => {
        setLoading(true)
        try {
            const params: Record<string, any> = {
                page,
                limit,
                search: search.trim(),
                role: roleFilter,
                status: statusFilter,
                sortBy: "loginAt",
                sortOrder: "desc"
            }
            if (startDate) params.startDate = startDate
            if (endDate) params.endDate = endDate

            const res = await reportService.getLoginReport(params)
            if (res.success) {
                setLogs(res.data || [])
                setTotalPages(res.pagination?.pages || 1)
                if (res.stats) {
                    setStats(res.stats)
                }
            }
        } catch (err: any) {
            console.error("Failed to fetch login report", err)
            toast.error(err?.response?.data?.message || "Error fetching login activity report")
        } finally {
            setLoading(false)
        }
    }, [page, limit, search, roleFilter, statusFilter, startDate, endDate])

    React.useEffect(() => {
        fetchReport()
    }, [fetchReport])

    const handleExport = async (format: "excel" | "csv") => {
        setExporting(true)
        try {
            const params: Record<string, any> = {
                search: search.trim(),
                role: roleFilter,
                status: statusFilter,
                sortBy: "loginAt",
                sortOrder: "desc"
            }
            if (startDate) params.startDate = startDate
            if (endDate) params.endDate = endDate

            await reportService.downloadLoginReportExport(format, params)
            toast.success(`Login activity report exported as ${format.toUpperCase()} successfully!`)
        } catch (err: any) {
            toast.error("Failed to export report.")
        } finally {
            setExporting(false)
        }
    }

    const formatDuration = (seconds?: number | null) => {
        if (seconds === undefined || seconds === null) return "-"
        if (seconds < 60) return `${seconds}s`
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        if (m < 60) return `${m}m ${s}s`
        const h = Math.floor(m / 60)
        const remM = m % 60
        return `${h}h ${remM}m`
    }

    const bentoCardClass = "rounded-2xl border border-border/60 bg-card/50 backdrop-blur-md shadow-xs p-4 flex items-center gap-4"

    return (
        <div className="flex flex-col gap-6 w-full mx-auto p-2 pb-12 animate-in fade-in duration-200">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
                        <Activity className="size-8 text-primary" />
                        Admin Login Activity Report
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Comprehensive audit logs of all user, subuser, and administrator authentications and approval workflows.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchReport}
                        disabled={loading}
                        className="rounded-xl h-9 gap-1.5 font-semibold text-xs cursor-pointer"
                    >
                        <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport("csv")}
                        disabled={exporting}
                        className="rounded-xl h-9 gap-1.5 font-semibold text-xs cursor-pointer border-border"
                    >
                        <Download className="size-3.5" />
                        CSV Export
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => handleExport("excel")}
                        disabled={exporting}
                        className="rounded-xl h-9 gap-1.5 font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                    >
                        <Download className="size-3.5" />
                        Excel (.xlsx) Export
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className={bentoCardClass}>
                    <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Users className="size-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Logins</p>
                        <p className="text-2xl font-black text-foreground mt-0.5">{stats.total}</p>
                    </div>
                </div>

                <div className={bentoCardClass}>
                    <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <UserCheck className="size-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Success / Direct</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.success}</p>
                    </div>
                </div>

                <div className={bentoCardClass}>
                    <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Clock className="size-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending Approval</p>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.pending}</p>
                    </div>
                </div>

                <div className={bentoCardClass}>
                    <div className="size-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <ShieldAlert className="size-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Failed Attempts</p>
                        <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{stats.failed}</p>
                    </div>
                </div>

                <div className={bentoCardClass}>
                    <div className="size-11 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <XCircle className="size-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Rejected Requests</p>
                        <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">{stats.rejected}</p>
                    </div>
                </div>
            </div>

            {/* Filter Controls Bar */}
            <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-xs p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Search */}
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search user, email, parent..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="pl-9 h-9 rounded-xl bg-background border-border/70 text-xs font-medium"
                        />
                    </div>

                    {/* Role Filter */}
                    <div>
                        <Select
                            value={roleFilter}
                            onValueChange={(val) => {
                                setRoleFilter(val || "All")
                                setPage(1)
                            }}
                        >
                            <SelectTrigger className="h-9 w-full rounded-xl bg-background border-border/70 text-xs font-semibold">
                                <SelectValue placeholder="User Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All User Roles</SelectItem>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="User">Standard User</SelectItem>
                                <SelectItem value="Subuser">Subuser</SelectItem>
                                <SelectItem value="Vendor">Vendor</SelectItem>
                                <SelectItem value="Guest">Guest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <Select
                            value={statusFilter}
                            onValueChange={(val) => {
                                setStatusFilter(val || "All")
                                setPage(1)
                            }}
                        >
                            <SelectTrigger className="h-9 w-full rounded-xl bg-background border-border/70 text-xs font-semibold">
                                <SelectValue placeholder="Login Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Statuses</SelectItem>
                                <SelectItem value="Success">Success (Direct)</SelectItem>
                                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="Failed">Failed (Invalid)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value)
                                setPage(1)
                            }}
                            className="h-9 rounded-xl bg-background border-border/70 text-xs"
                            placeholder="From Date"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value)
                                setPage(1)
                            }}
                            className="h-9 rounded-xl bg-background border-border/70 text-xs"
                            placeholder="To Date"
                        />
                    </div>
                </div>
            </Card>

            {/* Login Logs Table */}
            <Card className="rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-md shadow-xs overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20 px-6 py-4">
                    <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <ShieldCheck className="size-4 text-primary" />
                            Authentication Audit Trail ({stats.total} Records)
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            Real-time login events, timestamps, approver decisions, and device details.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent shadow-sm" />
                                <p className="font-semibold text-muted-foreground text-xs">Loading login activity...</p>
                            </div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">
                            <Activity className="size-10 mb-3 mx-auto opacity-40" />
                            <p className="font-semibold text-sm">No login activity records match the selected filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/15 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                                        <th className="text-left px-5 py-3.5">User</th>
                                        <th className="text-left px-5 py-3.5">Role</th>
                                        <th className="text-left px-5 py-3.5">Parent User</th>
                                        <th className="text-left px-5 py-3.5">Login Time</th>
                                        <th className="text-left px-5 py-3.5">Status</th>
                                        <th className="text-left px-5 py-3.5">Approval / Action</th>
                                        <th className="text-left px-5 py-3.5">Session Duration</th>
                                        <th className="text-left px-5 py-3.5">Device & Browser</th>
                                        <th className="text-right px-5 py-3.5">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const isSuccess = log.status === "Success" || log.status === "Approved"
                                        const isPending = log.status === "Pending Approval"
                                        const isRejected = log.status === "Rejected"

                                        return (
                                            <tr
                                                key={log._id}
                                                className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                                            >
                                                {/* User */}
                                                <td className="px-5 py-3.5">
                                                    <div>
                                                        <p className="font-bold text-foreground text-xs">{log.userName || log.userEmail}</p>
                                                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{log.userEmail}</p>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                        log.role === "Admin"
                                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                                            : log.role === "Subuser"
                                                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                                                : log.role === "Vendor"
                                                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                    }`}>
                                                        {log.role}
                                                    </span>
                                                </td>

                                                {/* Parent User */}
                                                <td className="px-5 py-3.5 font-medium">
                                                    {log.parentUserName ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground/80 bg-muted/60 px-2 py-0.5 rounded-md">
                                                            {log.parentUserName}
                                                        </span>
                                                    ) : log.parentUser ? (
                                                        <span className="text-[11px] font-medium text-foreground/80">
                                                            {log.parentUser?.name || "Parent User"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </td>

                                                {/* Login Time */}
                                                <td className="px-5 py-3.5 font-medium text-foreground/80">
                                                    <div>
                                                        <p className="font-semibold text-xs text-foreground">
                                                            {log.loginAt ? new Date(log.loginAt).toLocaleDateString("en-IN", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric"
                                                            }) : "-"}
                                                        </p>
                                                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                                            {log.loginAt ? new Date(log.loginAt).toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                second: "2-digit"
                                                            }) : ""}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                        isSuccess
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                            : isPending
                                                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse"
                                                                : isRejected
                                                                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                                    }`}>
                                                        {log.status}
                                                    </span>
                                                </td>

                                                {/* Approval / Rejection details */}
                                                <td className="px-5 py-3.5">
                                                    {log.approvedBy || log.approverName ? (
                                                        <div className="space-y-0.5">
                                                            <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                                                                By {log.approverName || log.approvedBy?.name}
                                                            </p>
                                                            {log.approvedAt && (
                                                                <p className="text-[10px] font-mono text-muted-foreground">
                                                                    {new Date(log.approvedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : log.rejectionReason ? (
                                                        <div className="space-y-0.5">
                                                            <p className="font-semibold text-red-600 text-[11px] truncate max-w-[180px]" title={log.rejectionReason}>
                                                                {log.rejectionReason}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>

                                                {/* Session Duration */}
                                                <td className="px-5 py-3.5 font-mono text-xs">
                                                    {log.sessionDuration !== null && log.sessionDuration !== undefined ? (
                                                        <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
                                                            <Clock className="size-3 text-primary/70" />
                                                            {formatDuration(log.sessionDuration)}
                                                        </span>
                                                    ) : isSuccess ? (
                                                        <span className="text-emerald-600 font-semibold text-[11px]">Active Session</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>

                                                {/* Device / Browser */}
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                                        <Monitor className="size-3.5 text-primary/60 shrink-0" />
                                                        <span className="truncate max-w-[160px]">{log.deviceInfo || "Desktop Browser"}</span>
                                                    </span>
                                                </td>

                                                {/* IP Address */}
                                                <td className="px-5 py-3.5 text-right font-mono text-[11px] text-muted-foreground">
                                                    {log.ipAddress || "-"}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10">
                        <span className="text-xs text-muted-foreground">
                            Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="h-8 rounded-xl text-xs font-semibold gap-1"
                            >
                                <ChevronLeft className="size-3.5" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage(p => p + 1)}
                                className="h-8 rounded-xl text-xs font-semibold gap-1"
                            >
                                Next
                                <ChevronRight className="size-3.5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default LoginReportPage
