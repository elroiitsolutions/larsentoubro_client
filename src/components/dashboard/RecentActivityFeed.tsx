import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { History, User, Clock, ArrowUpRight, ArrowDownLeft, ShieldCheck, Wrench, Trash2 } from "lucide-react";
import type { ActivityItem } from "@/services/dashboard.service";

interface Props {
    activities: ActivityItem[];
}

export const RecentActivityFeed: React.FC<Props> = ({ activities }) => {
    const formatDate = (dateStr: string | Date) => {
        const d = new Date(dateStr);
        return d.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getActionBadge = (action: string) => {
        const act = (action || "").toLowerCase();
        if (act.includes("issued") || act.includes("delivery")) {
            return (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
                    <ArrowUpRight className="size-3" /> Tool Issued
                </span>
            );
        }
        if (act.includes("returned") || act.includes("return")) {
            return (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                    <ArrowDownLeft className="size-3" /> Returned
                </span>
            );
        }
        if (act.includes("life extended") || act.includes("extended") || act.includes("inspection")) {
            return (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center gap-1">
                    <ShieldCheck className="size-3" /> QA Extended
                </span>
            );
        }
        if (act.includes("scrap")) {
            return (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 flex items-center gap-1">
                    <Trash2 className="size-3" /> Scrap
                </span>
            );
        }
        if (act.includes("repair")) {
            return (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 flex items-center gap-1">
                    <Wrench className="size-3" /> Repair
                </span>
            );
        }
        return (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/40">
                {action}
            </span>
        );
    };

    return (
        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden h-full flex flex-col justify-between">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                            <History className="size-5 text-indigo-500" />
                            <span>Recent Operational Activity</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Audit trail of recent creation, issues, returns, transfers & inspections
                        </CardDescription>
                    </div>

                    <span className="text-xs text-muted-foreground font-mono">Real-time Feed</span>
                </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 max-h-[350px] overflow-y-auto space-y-3">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                        No recent activity recorded.
                    </div>
                ) : (
                    activities.map((act) => (
                        <div
                            key={act.id}
                            className="p-3 rounded-xl border border-border/40 bg-background/50 flex flex-col gap-1.5 transition-all hover:bg-muted/30"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getActionBadge(act.action)}
                                    <span className="text-xs font-mono font-bold text-foreground">
                                        {act.toolId}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                    <Clock className="size-3 text-muted-foreground/70" />
                                    {formatDate(act.date)}
                                </span>
                            </div>

                            <p className="text-xs text-foreground/90 leading-snug">
                                {act.details}
                            </p>

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium pt-1 border-t border-border/30">
                                <User className="size-3 text-primary" />
                                <span>Logged by: <strong className="text-foreground">
                                    {typeof act.user === 'object' && act.user !== null
                                        ? ((act.user as any).name || (act.user as any).user_id || (act.user as any).email || 'System User')
                                        : String(act.user || 'System User')}
                                </strong></span>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
};

export default RecentActivityFeed;
