import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Filter,
    RotateCcw,
    FileSpreadsheet,
    FileText,
    Building2,
    FolderKanban,
    Store as StoreIcon,
    Warehouse,
    Tag,
    Activity,
    Calendar
} from "lucide-react";
import type { DashboardFilterParams, DivisionNode } from "@/services/dashboard.service";

interface Props {
    filters: DashboardFilterParams;
    onChangeFilter: (key: keyof DashboardFilterParams, value: string) => void;
    onResetFilters: () => void;
    hierarchyData: DivisionNode[];
    categories: string[];
    statuses: string[];
    onExportExcel: () => void;
    onExportPDF: () => void;
}

export const DashboardFilterBar: React.FC<Props> = ({
    filters,
    onChangeFilter,
    onResetFilters,
    hierarchyData,
    categories,
    statuses,
    onExportExcel,
    onExportPDF
}) => {
    // Extract available projects for selected division
    const selectedDivNode = hierarchyData.find((d) => d.name === filters.division);
    const availableProjects = selectedDivNode
        ? selectedDivNode.projects
        : hierarchyData.flatMap((d) => d.projects);

    // Extract available stores/hubs for selected project
    const selectedProjNode = availableProjects.find((p) => p.id === filters.project);
    const availableStores = selectedProjNode
        ? selectedProjNode.stores
        : availableProjects.flatMap((p) => p.stores);

    return (
        <div className="w-full bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-sm space-y-3">
            {/* Header & Export Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Filter className="size-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Global Central Filters & Reports</h3>
                        <p className="text-[11px] text-muted-foreground">
                            Filter entire executive dashboard by Division → Project → Store → HUB, Category & Status
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onResetFilters}
                        className="h-8 text-xs rounded-xl flex items-center gap-1.5"
                    >
                        <RotateCcw className="size-3.5" />
                        <span>Reset</span>
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onExportExcel}
                        className="h-8 text-xs rounded-xl border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 font-semibold flex items-center gap-1.5"
                    >
                        <FileSpreadsheet className="size-3.5 text-emerald-600" />
                        <span>Excel Export</span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={onExportPDF}
                        className="h-8 text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                        <FileText className="size-3.5" />
                        <span>PDF Report</span>
                    </Button>
                </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {/* 1. Division */}
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <Building2 className="size-3 text-blue-500" /> Division
                    </Label>
                    <Select
                        value={filters.division || "All"}
                        onValueChange={(val) => {
                            onChangeFilter("division", val);
                            onChangeFilter("project", "All");
                            onChangeFilter("store", "All");
                            onChangeFilter("hub", "All");
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs rounded-xl bg-background/80">
                            <SelectValue placeholder="All Divisions" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="All">All Divisions</SelectItem>
                            {hierarchyData.map((div) => (
                                <SelectItem key={div.id} value={div.name}>
                                    {div.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 2. Project */}
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <FolderKanban className="size-3 text-indigo-500" /> Project
                    </Label>
                    <Select
                        value={filters.project || "All"}
                        onValueChange={(val) => {
                            onChangeFilter("project", val);
                            onChangeFilter("store", "All");
                            onChangeFilter("hub", "All");
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs rounded-xl bg-background/80">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="All">All Projects</SelectItem>
                            {availableProjects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 3. Store */}
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <StoreIcon className="size-3 text-emerald-500" /> Store
                    </Label>
                    <Select
                        value={filters.store || "All"}
                        onValueChange={(val) => onChangeFilter("store", val)}
                    >
                        <SelectTrigger className="h-8 text-xs rounded-xl bg-background/80">
                            <SelectValue placeholder="All Stores" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="All">All Stores</SelectItem>
                            {availableStores
                                .filter((s) => s.type !== "HUB")
                                .map((st) => (
                                    <SelectItem key={st.id} value={st.id}>
                                        {st.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 4. HUB */}
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <Warehouse className="size-3 text-amber-500" /> HUB
                    </Label>
                    <Select
                        value={filters.hub || "All"}
                        onValueChange={(val) => onChangeFilter("hub", val)}
                    >
                        <SelectTrigger className="h-8 text-xs rounded-xl bg-background/80">
                            <SelectValue placeholder="All HUBs" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="All">All HUBs</SelectItem>
                            {availableStores
                                .filter((s) => s.type === "HUB")
                                .map((st) => (
                                    <SelectItem key={st.id} value={st.id}>
                                        {st.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 5. Tool Category */}
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <Tag className="size-3 text-purple-500" /> Category
                    </Label>
                    <Select
                        value={filters.category || "All"}
                        onValueChange={(val) => onChangeFilter("category", val)}
                    >
                        <SelectTrigger className="h-8 text-xs rounded-xl bg-background/80">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="All">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 6. Status */}
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <Activity className="size-3 text-rose-500" /> Status
                    </Label>
                    <Select
                        value={filters.status || "All"}
                        onValueChange={(val) => onChangeFilter("status", val)}
                    >
                        <SelectTrigger className="h-8 text-xs rounded-xl bg-background/80">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="All">All Statuses</SelectItem>
                            {statuses.map((st) => (
                                <SelectItem key={st} value={st}>
                                    {st}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 7. Start Date */}
                <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3 text-cyan-500" /> Start Date
                    </Label>
                    <Input
                        type="date"
                        value={filters.startDate || ""}
                        onChange={(e) => onChangeFilter("startDate", e.target.value)}
                        className="h-8 text-xs rounded-xl bg-background/80"
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardFilterBar;
