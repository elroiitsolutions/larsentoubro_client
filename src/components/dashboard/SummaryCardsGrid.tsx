import React from "react";
import {
    Wrench,
    CheckCircle2,
    Truck,
    HelpCircle,
    Archive,
    Hammer
} from "lucide-react";
import type { SummaryCardsData } from "@/services/dashboard.service";

interface Props {
    data: SummaryCardsData;
}

export const SummaryCardsGrid: React.FC<Props> = ({ data }) => {
    const cards = [
        {
            key: "totalTools",
            title: "Total Tools",
            count: data.totalTools,
            icon: Wrench,
            gradient: "from-blue-600/10 via-blue-500/5 to-transparent",
            borderColor: "border-blue-500/30",
            textColor: "text-blue-500",
            bgColor: "bg-blue-500/10",
            badgeText: "Enterprise Total"
        },
        {
            key: "available",
            title: "Available",
            count: data.available,
            icon: CheckCircle2,
            gradient: "from-emerald-600/10 via-emerald-500/5 to-transparent",
            borderColor: "border-emerald-500/30",
            textColor: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            badgeText: "Ready for Deployment"
        },
        {
            key: "moving",
            title: "Moving",
            count: data.inTransit ?? data.moving ?? 0,
            icon: Truck,
            gradient: "from-cyan-600/10 via-cyan-500/5 to-transparent",
            borderColor: "border-cyan-500/30",
            textColor: "text-cyan-500",
            bgColor: "bg-cyan-500/10",
            badgeText: "Store/HUB Movement"
        },
        {
            key: "repair",
            title: "Repair",
            count: data.repair ?? data.damagedRepair ?? 0,
            icon: Hammer,
            gradient: "from-orange-600/10 via-orange-500/5 to-transparent",
            borderColor: "border-orange-500/30",
            textColor: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-500/10",
            badgeText: "Under Repair"
        },
        {
            key: "missing",
            title: "Missing",
            count: data.missing,
            icon: HelpCircle,
            gradient: "from-red-700/10 via-red-600/5 to-transparent",
            borderColor: "border-red-600/30",
            textColor: "text-red-600",
            bgColor: "bg-red-600/10",
            badgeText: "Investigation Flag"
        },
        {
            key: "scrap",
            title: "Scrap",
            count: data.scrap ?? 0,
            icon: Archive,
            gradient: "from-amber-600/10 via-amber-500/5 to-transparent",
            borderColor: "border-amber-500/30",
            textColor: "text-amber-600 dark:text-amber-400",
            bgColor: "bg-amber-500/10",
            badgeText: "Decommissioned / Scrapped"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.key}
                        className={`relative overflow-hidden cursor-default transition-all duration-200 p-4 flex flex-col justify-between rounded-2xl border ${card.borderColor} bg-card/60 backdrop-blur-sm bg-gradient-to-br ${card.gradient} shadow-xs select-none`}
                    >
                        <div className="flex items-start justify-between">
                            <span className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider">
                                {card.title}
                            </span>
                            <div className={`p-2 rounded-xl ${card.bgColor} ${card.textColor}`}>
                                <Icon className="size-4" />
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className="text-3xl font-black tracking-tight text-foreground">
                                {card.count.toLocaleString()}
                            </div>
                            <div className={`mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md w-fit ${card.bgColor} ${card.textColor} truncate max-w-full`}>
                                {card.badgeText}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SummaryCardsGrid;
