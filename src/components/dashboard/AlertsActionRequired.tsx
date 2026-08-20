import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, Clock, HelpCircle, Wrench, ChevronRight } from "lucide-react";
import type { AlertItem } from "@/services/dashboard.service";

interface Props {
    alerts: AlertItem[];
    onAlertClick?: (alert: AlertItem) => void;
}

export const AlertsActionRequired: React.FC<Props> = ({ alerts, onAlertClick }) => {
    const getSeverityStyles = (severity: string) => {
        if (severity === "danger") {
            return "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400";
        }
        if (severity === "warning") {
            return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";
        }
        return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";
    };

    const getAlertIcon = (type: string) => {
        const t = (type || "").toLowerCase();
        if (t.includes("expired")) return <AlertTriangle className="size-4 text-rose-500 shrink-0" />;
        if (t.includes("missing")) return <HelpCircle className="size-4 text-red-600 shrink-0" />;
        if (t.includes("inspection")) return <Clock className="size-4 text-amber-500 shrink-0" />;
        if (t.includes("repair") || t.includes("damaged")) return <Wrench className="size-4 text-orange-500 shrink-0" />;
        return <ShieldAlert className="size-4 text-amber-500 shrink-0" />;
    };

    return (
        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden h-full flex flex-col justify-between">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                            <AlertTriangle className="size-5 text-rose-500" />
                            <span>Alerts & Action Required</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Critical operational alerts requiring immediate management intervention
                        </CardDescription>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        {alerts.length} Active Items
                    </span>
                </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 max-h-[350px] overflow-y-auto space-y-2.5">
                {alerts.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                        No critical action items or alerts pending.
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            onClick={() => onAlertClick && onAlertClick(alert)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] flex items-start justify-between gap-3 ${getSeverityStyles(
                                alert.severity
                            )}`}
                        >
                            <div className="flex items-start gap-2.5">
                                {getAlertIcon(alert.type)}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs">{alert.title}</span>
                                        {alert.toolId && (
                                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background/60 border border-border/40 font-semibold">
                                                {alert.toolId}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] opacity-90 mt-0.5 leading-snug">
                                        {alert.message}
                                    </p>
                                </div>
                            </div>

                            <ChevronRight className="size-4 shrink-0 opacity-60 self-center" />
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
};

export default AlertsActionRequired;
