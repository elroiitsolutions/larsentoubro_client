import React from "react";
import {
    Wrench,
    CheckCircle2,
    Truck,
    HelpCircle,
    Archive,
    Hammer,
    Activity
} from "lucide-react";
import type { SummaryCardsData } from "@/services/dashboard.service";

interface Props {
    data: SummaryCardsData;
}

export const SummaryCardsGrid: React.FC<Props> = ({ data }) => {
    const total = data.totalTools || 1;
    const available = data.available || 0;
    const moving = data.inTransit ?? data.moving ?? 0;
    const repair = data.repair ?? data.damagedRepair ?? 0;
    const missing = data.missing || 0;
    const scrap = data.scrap || 0;

    const availPct = Math.min(100, Math.max(0, (available / total) * 100));
    const movPct = Math.min(100, Math.max(0, (moving / total) * 100));
    const repPct = Math.min(100, Math.max(0, (repair / total) * 100));
    const misPct = Math.min(100, Math.max(0, (missing / total) * 100));
    const scrPct = Math.min(100, Math.max(0, (scrap / total) * 100));

    // The exact card design requested from user screenshot with clean, small font sizes and old soft card colors
    const cards = [
        {
            key: "totalTools",
            title: "Total Tools",
            count: data.totalTools,
            subtext: "100% Registered",
            icon: Wrench,
            bgGradient: "from-blue-50/70 via-blue-50/30 to-white dark:from-blue-950/30 dark:via-blue-900/15 dark:to-card",
            borderColor: "border-blue-200/90 hover:border-blue-300 dark:border-blue-800/60 dark:hover:border-blue-700",
            glowColor: "bg-blue-500/10",
            iconBg: "bg-blue-600 text-white shadow-xs shadow-blue-500/25",
            badgeStyle: "bg-blue-100/80 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
            badgeText: "Enterprise Total"
        },
        {
            key: "available",
            title: "Available",
            count: data.available,
            subtext: `${availPct.toFixed(1)}% of fleet`,
            icon: CheckCircle2,
            bgGradient: "from-emerald-50/70 via-emerald-50/30 to-white dark:from-emerald-950/30 dark:via-emerald-900/15 dark:to-card",
            borderColor: "border-emerald-200/90 hover:border-emerald-300 dark:border-emerald-800/60 dark:hover:border-emerald-700",
            glowColor: "bg-emerald-500/10",
            iconBg: "bg-emerald-500 text-white shadow-xs shadow-emerald-500/25",
            badgeStyle: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
            badgeText: "Ready for Deployment"
        },
        {
            key: "moving",
            title: "In Transit / Moving",
            count: moving,
            subtext: "Active Gate Pass",
            icon: Truck,
            bgGradient: "from-cyan-50/70 via-cyan-50/30 to-white dark:from-cyan-950/30 dark:via-cyan-900/15 dark:to-card",
            borderColor: "border-cyan-200/90 hover:border-cyan-300 dark:border-cyan-800/60 dark:hover:border-cyan-700",
            glowColor: "bg-cyan-500/10",
            iconBg: "bg-cyan-500 text-white shadow-xs shadow-cyan-500/25",
            badgeStyle: "bg-cyan-100/80 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60",
            badgeText: "Store/HUB Movement"
        },
        {
            key: "repair",
            title: "Under Repair",
            count: repair,
            subtext: "Service Required",
            icon: Hammer,
            bgGradient: "from-amber-50/90 via-amber-100/40 to-amber-200/40 dark:from-amber-950/30 dark:via-amber-900/15 dark:to-card",
            borderColor: "border-amber-300/90 hover:border-amber-400 dark:border-amber-700/60 dark:hover:border-amber-600",
            glowColor: "bg-amber-500/15",
            iconBg: "bg-amber-500 text-white shadow-xs shadow-amber-500/25",
            badgeStyle: "bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
            badgeText: "Maintenance Queue"
        },
        {
            key: "missing",
            title: "Reported Missing",
            count: missing,
            subtext: "Urgent Action",
            icon: HelpCircle,
            bgGradient: "from-rose-50/80 via-rose-100/30 to-pink-50/50 dark:from-rose-950/30 dark:via-rose-900/15 dark:to-card",
            borderColor: "border-rose-200/90 hover:border-rose-300 dark:border-rose-800/60 dark:hover:border-rose-700",
            glowColor: "bg-rose-500/10",
            iconBg: "bg-rose-500 text-white shadow-xs shadow-rose-500/25",
            badgeStyle: "bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
            badgeText: "Investigation Flag"
        },
        {
            key: "scrap",
            title: "Scrapped / Disposed",
            count: scrap,
            subtext: "Disposal Manifest",
            icon: Archive,
            bgGradient: "from-purple-50/80 via-purple-100/30 to-violet-50/50 dark:from-purple-950/30 dark:via-purple-900/15 dark:to-card",
            borderColor: "border-purple-200/90 hover:border-purple-300 dark:border-purple-800/60 dark:hover:border-purple-700",
            glowColor: "bg-purple-500/10",
            iconBg: "bg-purple-600 text-white shadow-xs shadow-purple-500/25",
            badgeStyle: "bg-purple-100/80 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60",
            badgeText: "Decommissioned"
        }
    ];

    return (
        <div className="space-y-2 sm:space-y-2.5">
            {/* 6 High-Impact Modern Cards with Clean, Small Font Sizes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                {cards.map((card) => {
                    const Icon = card.icon;

                    return (
                        <div
                            key={card.key}
                            className={`group relative overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-0.5 p-2.5 sm:p-3 flex flex-col justify-between rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.bgGradient} shadow-xs hover:shadow-md select-none`}
                        >
                            {/* Decorative soft ambient glow */}
                            <div className={`absolute -right-6 -top-6 size-20 rounded-full ${card.glowColor} blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500`} />

                            {/* Top Title & Solid Circular Icon Badge */}
                            <div className="flex items-start justify-between relative z-10 gap-1.5">
                                <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider leading-tight">
                                    {card.title}
                                </span>
                                <div className={`size-6.5 sm:size-7 rounded-full flex items-center justify-center shrink-0 ${card.iconBg} group-hover:scale-105 transition-transform duration-200`}>
                                    <Icon className="size-3.5" />
                                </div>
                            </div>

                            {/* Center Number & Subtext */}
                            <div className="mt-1.5 relative z-10 flex items-baseline justify-between gap-1.5">
                                <div className="text-xl sm:text-[21px] font-black tracking-tight text-slate-900 dark:text-white leading-none">
                                    {card.count.toLocaleString()}
                                </div>
                                <span className="text-[9.5px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">
                                    {card.subtext}
                                </span>
                            </div>

                            {/* Bottom Pill Badge with Small, Crisp Font */}
                            <div className="mt-2 relative z-10 flex items-center">
                                <span className={`text-[8.5px] sm:text-[9px] font-semibold px-2 py-0.5 rounded-full border ${card.badgeStyle} truncate max-w-full inline-block`}>
                                    {card.badgeText}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Visual Fleet Allocation & Health Distribution Strip */}
            <div className="bg-card/70 border border-border/60 rounded-xl p-2 sm:p-2.5 backdrop-blur-md shadow-xs transition-all hover:border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-primary/10 text-primary">
                            <Activity className="size-3" />
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-foreground uppercase tracking-wide">
                            Fleet Allocation & Operational Health Distribution
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground">
                            ({data.totalTools.toLocaleString()} units)
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-[9px] sm:text-[10px] font-medium text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                            <span className="size-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                            <strong className="text-foreground">{data.available.toLocaleString()}</strong> Available ({availPct.toFixed(1)}%)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="size-2 rounded-full bg-cyan-500 shadow-xs shadow-cyan-500/50" />
                            <strong className="text-foreground">{moving}</strong> Moving ({movPct.toFixed(1)}%)
                        </span>
                        {repair > 0 && (
                            <span className="flex items-center gap-1">
                                <span className="size-2 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50" />
                                <strong className="text-foreground">{repair}</strong> Repair
                            </span>
                        )}
                        {missing > 0 && (
                            <span className="flex items-center gap-1">
                                <span className="size-2 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" />
                                <strong className="text-foreground">{missing}</strong> Missing
                            </span>
                        )}
                        {scrap > 0 && (
                            <span className="flex items-center gap-1">
                                <span className="size-2 rounded-full bg-purple-500 shadow-xs shadow-purple-500/50" />
                                <strong className="text-foreground">{scrap}</strong> Scrap
                            </span>
                        )}
                    </div>
                </div>

                {/* Compact Progress Bar */}
                <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden flex shadow-inner border border-border/40 p-0.5 gap-0.5">
                    {availPct > 0 && (
                        <div
                            style={{ width: `${availPct}%` }}
                            className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            title={`Available: ${data.available} (${availPct.toFixed(1)}%)`}
                        />
                    )}
                    {movPct > 0 && (
                        <div
                            style={{ width: `${Math.max(1, movPct)}%` }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500"
                            title={`Moving / In Transit: ${moving}`}
                        />
                    )}
                    {repPct > 0 && (
                        <div
                            style={{ width: `${Math.max(1, repPct)}%` }}
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                            title={`Under Repair: ${repair}`}
                        />
                    )}
                    {misPct > 0 && (
                        <div
                            style={{ width: `${Math.max(1, misPct)}%` }}
                            className="h-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-500"
                            title={`Missing: ${missing}`}
                        />
                    )}
                    {scrPct > 0 && (
                        <div
                            style={{ width: `${Math.max(1, scrPct)}%` }}
                            className="h-full rounded-r-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-500"
                            title={`Scrap: ${scrap}`}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SummaryCardsGrid;
