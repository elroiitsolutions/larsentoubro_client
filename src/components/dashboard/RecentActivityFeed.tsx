import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
    History,
    User,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    ShieldCheck,
    Wrench,
    Trash2,
    ArrowRight,
    Tag,
    Activity
} from "lucide-react";
import type { ActivityItem } from "@/services/dashboard.service";

interface Props {
    activities: ActivityItem[];
}

export const RecentActivityFeed: React.FC<Props> = ({ activities }) => {
    const formatDate = (dateStr: string | Date) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return String(dateStr);
        }
    };

    const getActionBadge = (action: string) => {
        const act = (action || "").toLowerCase();

        if (act.includes("issued") || act.includes("delivery")) {
            return (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1 shadow-2xs">
                    <ArrowUpRight className="size-3 text-blue-600 dark:text-blue-400" />
                    <span>Tool Issued</span>
                </span>
            );
        }

        if (act.includes("returned") || act.includes("return")) {
            return (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-2xs">
                    <ArrowDownLeft className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Returned</span>
                </span>
            );
        }

        if (act.includes("life extended") || act.includes("extended") || act.includes("inspection")) {
            return (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="size-3 text-purple-600 dark:text-purple-400" />
                    <span>QA Extended</span>
                </span>
            );
        }

        if (act.includes("scrap")) {
            return (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-2xs">
                    <Trash2 className="size-3 text-rose-600 dark:text-rose-400" />
                    <span>Scrapped</span>
                </span>
            );
        }

        if (act.includes("repair")) {
            return (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-2xs">
                    <Wrench className="size-3 text-amber-600 dark:text-amber-400" />
                    <span>Repair</span>
                </span>
            );
        }

        return (
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                {action}
            </span>
        );
    };

    // Helper to format movement route from "From: Store -> To: Site: 111 (Ref: DC-26-056)"
    const renderDetails = (details: string) => {
        if (!details) return null;

        const arrowPattern = /From:\s*([^-]+)\s*->\s*To:\s*([^()]+)(?:\s*\(([^)]+)\))?/i;
        const match = details.match(arrowPattern);

        if (match) {
            const from = match[1]?.trim();
            const to = match[2]?.trim();
            const ref = match[3]?.trim();

            return (
                <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                    <div className="flex items-center gap-1.5 font-medium bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                        <span className="text-[10px] text-muted-foreground font-semibold">FROM:</span>
                        <span className="font-semibold text-foreground truncate max-w-[140px]">{from}</span>
                    </div>

                    <ArrowRight className="size-3 text-muted-foreground shrink-0" />

                    <div className="flex items-center gap-1.5 font-medium bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                        <span className="text-[10px] text-muted-foreground font-semibold">TO:</span>
                        <span className="font-semibold text-foreground truncate max-w-[140px]">{to}</span>
                    </div>

                    {ref && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                            <Tag className="size-2.5" />
                            {ref}
                        </span>
                    )}
                </div>
            );
        }

        return (
            <p className="text-xs text-foreground/90 leading-snug">
                {details}
            </p>
        );
    };

    return (
        <Card className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md shadow-sm overflow-hidden h-full flex flex-col p-0 gap-0 transition-all hover:border-border">
            {/* Card Header */}
            <CardHeader className="p-3 sm:p-3.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border-b border-border/50 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-500/10 shrink-0">
                            <History className="size-4 sm:size-4.5" />
                        </div>
                        <div>
                            <CardTitle className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                                <span>Recent Operational Activity</span>
                            </CardTitle>
                            <CardDescription className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                Audit trail of recent creation, issues, returns, transfers & inspections
                            </CardDescription>
                        </div>
                    </div>

                    {/* Live Stream Telemetry Indicator */}
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-[11px] font-bold shadow-xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>Live Stream</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            {/* Activity Stream List */}
            <CardContent className="p-2.5 sm:p-3 flex-1 min-h-0 overflow-y-auto space-y-2.5">
                {activities.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <div className="size-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                            <Activity className="size-5" />
                        </div>
                        <p className="font-semibold text-sm text-foreground">No Recent Movements Recorded</p>
                        <p className="text-muted-foreground text-xs">
                            New delivery challans, returns, and inspection audits will appear here live.
                        </p>
                    </div>
                ) : (
                    activities.map((act) => {
                        const userName = typeof act.user === 'object' && act.user !== null
                            ? ((act.user as any).name || (act.user as any).user_id || (act.user as any).email || 'System User')
                            : String(act.user || 'System User');

                        return (
                            <div
                                key={act.id}
                                className="group p-3 sm:p-3.5 rounded-xl border border-border/50 bg-background/60 hover:bg-muted/40 hover:border-primary/30 flex flex-col gap-2 transition-all duration-200 shadow-2xs hover:shadow-xs"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        {getActionBadge(act.action)}
                                        <span className="text-xs font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/40">
                                            {act.toolId}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono shrink-0">
                                        <Clock className="size-3 text-muted-foreground/70" />
                                        {formatDate(act.date)}
                                    </span>
                                </div>

                                {/* Movement Route or Details */}
                                <div>
                                    {renderDetails(act.details)}
                                </div>

                                {/* Author Signature */}
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-1.5 border-t border-border/30">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <div className="size-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <User className="size-2.5" />
                                        </div>
                                        <span className="truncate">
                                            Logged by: <strong className="text-foreground font-semibold">{userName}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
};

export default RecentActivityFeed;
