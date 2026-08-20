import React from "react";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
    Wrench,
    CheckCircle2,
    Truck,
    HelpCircle,
    FolderKanban,
    Store as StoreIcon,
    Building2
} from "lucide-react";
import type { SummaryCardsData, DivisionNode, DashboardFilterParams } from "@/services/dashboard.service";

interface Props {
    data: SummaryCardsData;
    onCardClick?: (statusFilter: string) => void;
    activeStatus?: string;
    hierarchyData?: DivisionNode[];
    filters?: DashboardFilterParams;
    onChangeFilter?: (key: keyof DashboardFilterParams, value: string) => void;
}

export const SummaryCardsGrid: React.FC<Props> = ({
    data,
    onCardClick,
    activeStatus,
    hierarchyData,
    filters,
    onChangeFilter
}) => {
    // Extract available projects
    const availableProjects = hierarchyData
        ? (filters?.division && filters.division !== "All"
            ? hierarchyData.find((d) => d.name === filters.division)?.projects || []
            : hierarchyData.flatMap((d) => d.projects))
        : [];

    const selectedProjNode = availableProjects.find((p) => p.id === filters?.project);

    const rawStores = selectedProjNode
        ? selectedProjNode.stores
        : availableProjects.flatMap((p) => p.stores);

    // Deduplicate stores by ID
    const availableStores = Array.from(
        new Map(rawStores.map((s) => [s.id, s])).values()
    );

    // Options formatted for SearchableSelect
    const projectOptions = availableProjects.map((p) => ({
        label: p.name,
        value: p.id
    }));

    const storeOptions = availableStores.map((st) => ({
        label: st.name,
        value: st.id
    }));

    const cards = [
        {
            key: "totalTools",
            title: "Total Tools",
            count: data.totalTools,
            icon: Wrench,
            filterVal: "All",
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
            filterVal: "Available",
            gradient: "from-emerald-600/10 via-emerald-500/5 to-transparent",
            borderColor: "border-emerald-500/30",
            textColor: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            badgeText: "Ready for Deployment"
        },
        {
            key: "moving",
            title: "Moving",
            count: data.inTransit,
            icon: Truck,
            filterVal: "In Transit",
            gradient: "from-cyan-600/10 via-cyan-500/5 to-transparent",
            borderColor: "border-cyan-500/30",
            textColor: "text-cyan-500",
            bgColor: "bg-cyan-500/10",
            badgeText: "Store/HUB Movement"
        },
        {
            key: "missing",
            title: "Missing",
            count: data.missing,
            icon: HelpCircle,
            filterVal: "Missing",
            gradient: "from-red-700/10 via-red-600/5 to-transparent",
            borderColor: "border-red-600/30",
            textColor: "text-red-600",
            bgColor: "bg-red-600/10",
            badgeText: "Investigation Flag"
        }
    ];

    return (
        <div className="w-full space-y-5">
            {/* Enhanced Executive Header Banner with Searchable Project & Store Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-card border border-primary/15 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="size-11 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shadow-inner shrink-0">
                        <Building2 className="size-5.5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-black tracking-tight text-foreground">
                                Centralized Management Dashboard
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Inventory
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Executive monitoring for tool status, field deployments, project stores & movement tracking
                        </p>
                    </div>
                </div>

                {/* Project and Store Filter Selectors */}
                {hierarchyData && onChangeFilter && filters && (
                    <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto bg-background/60 backdrop-blur-md p-2 rounded-xl border border-border/60 shadow-xs">
                        {/* Project Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 pl-1">
                                <FolderKanban className="size-3.5 text-indigo-500" /> Project:
                            </span>
                            <SearchableSelect
                                value={filters.project || "All"}
                                onValueChange={(val) => {
                                    onChangeFilter("project", val);
                                    onChangeFilter("store", "All");
                                    onChangeFilter("hub", "All");
                                }}
                                options={projectOptions}
                                placeholder="All Projects"
                                allLabel="All Projects"
                                searchPlaceholder="Search project..."
                                className="w-[170px] sm:w-[210px]"
                            />
                        </div>

                        {/* Store Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 pl-1">
                                <StoreIcon className="size-3.5 text-emerald-500" /> Store:
                            </span>
                            <SearchableSelect
                                value={filters.store || "All"}
                                onValueChange={(val) => onChangeFilter("store", val)}
                                options={storeOptions}
                                placeholder="All Stores"
                                allLabel="All Stores"
                                searchPlaceholder="Search store..."
                                className="w-[170px] sm:w-[210px]"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    const isSelected = activeStatus === card.filterVal;

                    return (
                        <Card
                            key={card.key}
                            onClick={() => onCardClick && onCardClick(card.filterVal)}
                            className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg p-4 flex flex-col justify-between rounded-2xl border ${
                                isSelected
                                    ? `ring-2 ring-primary ${card.borderColor} shadow-md`
                                    : `${card.borderColor} bg-card/60 backdrop-blur-sm`
                            } bg-gradient-to-br ${card.gradient}`}
                        >
                            <div className="flex items-start justify-between">
                                <span className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider">
                                    {card.title}
                                </span>
                                <div className={`p-2 rounded-xl ${card.bgColor} ${card.textColor} transition-transform duration-300 group-hover:scale-110`}>
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
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default SummaryCardsGrid;
