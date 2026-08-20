import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PieChart, BarChart3, Activity } from "lucide-react";
import type { StatusDistributionItem } from "@/services/dashboard.service";

interface Props {
    statusData: StatusDistributionItem[];
    totalTools: number;
    onStatusClick?: (status: string) => void;
    activeStatus?: string;
}

export const ToolStatusOverview: React.FC<Props> = ({
    statusData,
    totalTools,
    onStatusClick,
    activeStatus
}) => {
    return (
        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden h-full flex flex-col justify-between">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                            <PieChart className="size-5 text-primary" />
                            <span>Tool Status Overview</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Overall distribution of tool status across enterprise inventory
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-primary font-semibold bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                        <Activity className="size-3.5" />
                        <span>{totalTools} Total Units</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
                {/* Visual Stacked Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>Status Breakdown</span>
                        <span>Percentage (%)</span>
                    </div>

                    <div className="h-4 w-full rounded-full bg-muted/50 overflow-hidden flex shadow-inner border border-border/40">
                        {statusData.map((item) => {
                            const percent = totalTools > 0 ? (item.count / totalTools) * 100 : 0;
                            if (percent === 0) return null;
                            return (
                                <div
                                    key={item.status}
                                    style={{
                                        width: `${percent}%`,
                                        backgroundColor: item.color
                                    }}
                                    className="h-full transition-all duration-500 relative group cursor-pointer"
                                    title={`${item.status}: ${item.count} (${percent.toFixed(1)}%)`}
                                    onClick={() => onStatusClick && onStatusClick(item.status)}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Status Grid Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {statusData.map((item) => {
                        const percent = totalTools > 0 ? ((item.count / totalTools) * 100).toFixed(1) : "0.0";
                        const isSelected = activeStatus === item.status;

                        return (
                            <div
                                key={item.status}
                                onClick={() => onStatusClick && onStatusClick(item.status)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                        ? "ring-2 ring-primary bg-primary/10 border-primary/40 shadow-sm"
                                        : "bg-background/60 border-border/50 hover:bg-muted/40"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="size-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-bold text-foreground truncate max-w-[100px]">
                                            {item.status}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                        {percent}%
                                    </span>
                                </div>

                                <div className="mt-2 flex items-baseline justify-between">
                                    <span className="text-xl font-black tracking-tight text-foreground">
                                        {item.count}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-medium">units</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default ToolStatusOverview;
