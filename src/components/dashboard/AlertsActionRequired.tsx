import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
    AlertTriangle,
    ShieldAlert,
    Clock,
    HelpCircle,
    Wrench,
    ChevronRight,
    Building2,
    Store
} from "lucide-react";
import type { AlertItem } from "@/services/dashboard.service";

interface Props {
    alerts: AlertItem[];
    onAlertClick?: (alert: AlertItem) => void;
}

export const AlertsActionRequired: React.FC<Props> = ({ alerts, onAlertClick }) => {
    const [selectedTab, setSelectedTab] = useState<"all" | "missing" | "expired" | "other">("all");

    // Group counts
    const counts = useMemo(() => {
        let missing = 0;
        let expired = 0;
        let other = 0;

        alerts.forEach(a => {
            const t = (a.type || "").toLowerCase();
            if (t.includes("missing")) {
                missing++;
            } else if (t.includes("expired")) {
                expired++;
            } else {
                other++;
            }
        });

        return { all: alerts.length, missing, expired, other };
    }, [alerts]);

    // Filtered list
    const filteredAlerts = useMemo(() => {
        if (selectedTab === "missing") {
            return alerts.filter(a => (a.type || "").toLowerCase().includes("missing"));
        }
        if (selectedTab === "expired") {
            return alerts.filter(a => (a.type || "").toLowerCase().includes("expired"));
        }
        if (selectedTab === "other") {
            return alerts.filter(a => {
                const t = (a.type || "").toLowerCase();
                return !t.includes("missing") && !t.includes("expired");
            });
        }
        return alerts;
    }, [alerts, selectedTab]);

    const getAlertTheme = (type: string, severity: string) => {
        const t = (type || "").toLowerCase();

        if (t.includes("missing")) {
            return {
                containerClass: "border-l-4 border-l-rose-500 border-rose-500/30 bg-gradient-to-r from-rose-500/12 via-rose-500/5 to-card text-foreground hover:border-rose-500/60",
                icon: <HelpCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />,
                iconBox: "bg-rose-500/20 ring-1 ring-rose-500/30",
                badgeClass: "bg-rose-600 text-white",
                badgeText: "CRITICAL MISSING"
            };
        }

        if (t.includes("expired")) {
            return {
                containerClass: "border-l-4 border-l-amber-500 border-amber-500/30 bg-gradient-to-r from-amber-500/12 via-amber-500/5 to-card text-foreground",
                icon: <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />,
                iconBox: "bg-amber-500/20 ring-1 ring-amber-500/30",
                badgeClass: "bg-amber-600 text-white",
                badgeText: "VALIDITY EXPIRED"
            };
        }

        if (t.includes("inspection")) {
            return {
                containerClass: "border-l-4 border-l-blue-500 border-blue-500/30 bg-gradient-to-r from-blue-500/12 via-blue-500/5 to-card text-foreground hover:border-blue-500/60",
                icon: <Clock className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />,
                iconBox: "bg-blue-500/20 ring-1 ring-blue-500/30",
                badgeClass: "bg-blue-600 text-white",
                badgeText: "INSPECTION DUE"
            };
        }

        if (t.includes("repair") || t.includes("damaged")) {
            return {
                containerClass: "border-l-4 border-l-orange-500 border-orange-500/30 bg-gradient-to-r from-orange-500/12 via-orange-500/5 to-card text-foreground hover:border-orange-500/60",
                icon: <Wrench className="size-4 text-orange-600 dark:text-orange-400 shrink-0" />,
                iconBox: "bg-orange-500/20 ring-1 ring-orange-500/30",
                badgeClass: "bg-orange-600 text-white",
                badgeText: "DAMAGED"
            };
        }

        if (severity === "danger") {
            return {
                containerClass: "border-l-4 border-l-rose-500 border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-card text-foreground hover:border-rose-500/60",
                icon: <ShieldAlert className="size-4 text-rose-600 shrink-0" />,
                iconBox: "bg-rose-500/20",
                badgeClass: "bg-rose-600 text-white",
                badgeText: "ACTION REQUIRED"
            };
        }

        return {
            containerClass: "border-l-4 border-l-blue-500 border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-card text-foreground hover:border-blue-500/60",
            icon: <ShieldAlert className="size-4 text-blue-600 shrink-0" />,
            iconBox: "bg-blue-500/20",
            badgeClass: "bg-blue-600 text-white",
            badgeText: "NOTICE"
        };
    };

    return (
        <Card className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-md shadow-sm overflow-hidden h-full flex flex-col p-0 gap-0 transition-all hover:border-border">
            {/* Card Header */}
            <CardHeader className="p-3 sm:p-3.5 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent border-b border-border/50 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-500/10 shrink-0">
                            <ShieldAlert className="size-4 sm:size-4.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm sm:text-base font-bold tracking-tight text-foreground">
                                    Alerts & Action Required
                                </CardTitle>
                                {alerts.length > 0 && (
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                    </span>
                                )}
                            </div>
                            <CardDescription className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                Critical operational alerts requiring immediate management intervention
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs shadow-rose-500/30 flex items-center gap-1.5">
                            <AlertTriangle className="size-3" />
                            <span>{alerts.length} Active Items</span>
                        </span>
                    </div>
                </div>

                {/* Filter Tabs */}
                {alerts.length > 0 && (
                    <div className="flex items-center gap-1 pt-2 mt-1 border-t border-border/40 overflow-x-auto no-scrollbar">
                        <button
                            type="button"
                            onClick={() => setSelectedTab("all")}
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                selectedTab === "all"
                                    ? "bg-foreground text-background shadow-xs"
                                    : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                        >
                            <span>All Alerts</span>
                            <span className="px-1 py-0.1 rounded text-[9px] bg-background/20 font-mono">
                                {counts.all}
                            </span>
                        </button>

                        {counts.missing > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedTab("missing")}
                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                    selectedTab === "missing"
                                        ? "bg-rose-600 text-white shadow-xs shadow-rose-500/25"
                                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                }`}
                            >
                                <HelpCircle className="size-2.5" />
                                <span>Missing</span>
                                <span className="px-1 py-0.1 rounded text-[9px] bg-black/15 font-mono">
                                    {counts.missing}
                                </span>
                            </button>
                        )}

                        {counts.expired > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedTab("expired")}
                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                    selectedTab === "expired"
                                        ? "bg-amber-600 text-white shadow-xs shadow-amber-500/25"
                                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20"
                                }`}
                            >
                                <AlertTriangle className="size-2.5" />
                                <span>Expired</span>
                                <span className="px-1 py-0.1 rounded text-[9px] bg-black/15 font-mono">
                                    {counts.expired}
                                </span>
                            </button>
                        )}

                        {counts.other > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedTab("other")}
                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                                    selectedTab === "other"
                                        ? "bg-blue-600 text-white shadow-xs shadow-blue-500/25"
                                        : "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                                }`}
                            >
                                <span>Other Items</span>
                                <span className="px-1 py-0.1 rounded text-[9px] bg-black/15 font-mono">
                                    {counts.other}
                                </span>
                            </button>
                        )}
                    </div>
                )}
            </CardHeader>

            {/* Content List */}
            <CardContent className="p-2.5 sm:p-3 flex-1 min-h-0 overflow-y-auto space-y-2">
                {filteredAlerts.length === 0 ? (
                    <div className="text-center py-12 text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                            <Clock className="size-5" />
                        </div>
                        <p className="font-semibold text-sm text-foreground">Zero Critical Alerts Pending</p>
                        <p className="text-muted-foreground text-xs max-w-xs">
                            {selectedTab !== "all"
                                ? "No items matching the selected alert category."
                                : "All inventory tools are active, inspected, and verified."}
                        </p>
                    </div>
                ) : (
                    filteredAlerts.map((alert) => {
                        const theme = getAlertTheme(alert.type, alert.severity);
                        const isExpired = (alert.type || "").toLowerCase().includes("expired");
                        const isClickable = !isExpired && Boolean(onAlertClick);

                        return (
                            <div
                                key={alert.id}
                                onClick={isClickable ? () => onAlertClick && onAlertClick(alert) : undefined}
                                className={`group p-3 sm:p-3.5 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                                    isClickable
                                        ? "cursor-pointer hover:scale-[1.01]"
                                        : "cursor-default select-text"
                                } ${theme.containerClass}`}
                            >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${theme.iconBox}`}>
                                        {theme.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-xs tracking-wider ${theme.badgeClass}`}>
                                                {theme.badgeText}
                                            </span>
                                            <span className="font-bold text-xs text-foreground truncate">
                                                {alert.title}
                                            </span>
                                            {alert.toolId && (
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-background/90 text-foreground border border-border/70 font-bold shadow-xs">
                                                    {alert.toolId}
                                                </span>
                                            )}
                                            {alert.project && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold flex items-center gap-1">
                                                    <Building2 className="size-2.5" />
                                                    {alert.project.projectCode || alert.project.name || 'Project'}
                                                </span>
                                            )}
                                            {alert.store && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground border border-border/60 font-semibold flex items-center gap-1">
                                                    <Store className="size-2.5" />
                                                    {alert.store.name || 'Store'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 leading-snug">
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>

                                {isClickable && (
                                    <div className="shrink-0 self-center pl-1">
                                        <div className="p-1.5 rounded-lg bg-background/60 border border-border/50 text-muted-foreground group-hover:text-foreground group-hover:bg-background transition-colors">
                                            <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
};

export default AlertsActionRequired;
