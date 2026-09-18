import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ChevronRight,
    Building2,
    FolderKanban,
    Store as StoreIcon,
    Warehouse,
    ChevronDown,
    Filter,
    ShieldAlert,
    CheckCircle} from "lucide-react";
import type { DivisionNode } from "@/services/dashboard.service";

interface Props {
    hierarchyData: DivisionNode[];
    selectedDivision?: string;
    selectedProject?: string;
    selectedStore?: string;
    onSelectNode?: (level: "division" | "project" | "store" | "hub", nameOrId: string) => void;
}

export const LocationHierarchyView: React.FC<Props> = ({
    hierarchyData,
    selectedDivision,
    selectedProject,
    selectedStore,
    onSelectNode
}) => {
    const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({
        "Buildings & Infrastructure": true,
        "Heavy Civil Infrastructure": true
    });
    const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

    const toggleDivision = (divName: string) => {
        setExpandedDivisions((prev) => ({ ...prev, [divName]: !prev[divName] }));
    };

    const toggleProject = (projId: string) => {
        setExpandedProjects((prev) => ({ ...prev, [projId]: !prev[projId] }));
    };

    return (
        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Building2 className="size-5 text-primary" />
                            <span>Location & Hierarchy View</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Division → Project → Store → HUB drill-down with real-time tool counts & alert indicators
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-lg border border-border/60">
                        <Filter className="size-3.5 text-primary" />
                        <span>Interactive Node Filtering</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {hierarchyData.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        No location hierarchy data available.
                    </div>
                ) : (
                    hierarchyData.map((div) => {
                        const isDivExpanded = Boolean(expandedDivisions[div.name]);
                        const isDivSelected = selectedDivision === div.name;

                        return (
                            <div key={div.id} className="rounded-xl border border-border/50 bg-background/50 overflow-hidden transition-all">
                                {/* Division Row */}
                                <div className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                    isDivSelected ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/40"
                                }`}>
                                    <div className="flex items-center gap-2.5" onClick={() => toggleDivision(div.name)}>
                                        <Button size="icon" variant="ghost" className="size-6 p-0 h-6 w-6">
                                            {isDivExpanded ? (
                                                <ChevronDown className="size-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="size-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                        <Building2 className="size-4 text-blue-500" />
                                        <span className="font-bold text-sm text-foreground">{div.name}</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                            Division
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right text-xs">
                                            <span className="font-black text-foreground">{div.totalTools}</span>{" "}
                                            <span className="text-muted-foreground">tools</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs">
                                            <span className="text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                <CheckCircle className="size-3" /> {div.available} avail
                                            </span>
                                            {div.alertsCount > 0 && (
                                                <span className="text-amber-600 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                                    <ShieldAlert className="size-3" /> {div.alertsCount} alerts
                                                </span>
                                            )}
                                        </div>

                                        <Button
                                            size="sm"
                                            variant={isDivSelected ? "default" : "outline"}
                                            className="h-7 text-xs px-2.5 rounded-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectNode && onSelectNode("division", div.name);
                                            }}
                                        >
                                            {isDivSelected ? "Selected" : "Filter"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Projects List (Level 2) */}
                                {isDivExpanded && div.projects && div.projects.length > 0 && (
                                    <div className="pl-6 pr-3 py-2 space-y-2 bg-muted/10 border-t border-border/30">
                                        {div.projects.map((proj) => {
                                            const isProjExpanded = Boolean(expandedProjects[proj.id]);
                                            const isProjSelected = selectedProject === proj.id || selectedProject === proj.name;

                                            return (
                                                <div key={proj.id} className="rounded-lg border border-border/40 bg-card/80 overflow-hidden">
                                                    {/* Project Row */}
                                                    <div className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${
                                                        isProjSelected ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/30"
                                                    }`}>
                                                        <div className="flex items-center gap-2" onClick={() => toggleProject(proj.id)}>
                                                            <Button size="icon" variant="ghost" className="size-5 p-0 h-5 w-5">
                                                                {isProjExpanded ? (
                                                                    <ChevronDown className="size-3.5 text-muted-foreground" />
                                                                ) : (
                                                                    <ChevronRight className="size-3.5 text-muted-foreground" />
                                                                )}
                                                            </Button>
                                                            <FolderKanban className="size-3.5 text-indigo-500" />
                                                            <span className="font-semibold text-xs text-foreground">{proj.name}</span>
                                                            <span className="text-[10px] text-muted-foreground font-mono">({proj.projectCode})</span>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="text-xs font-semibold text-foreground">
                                                                {proj.totalTools} tools
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant={isProjSelected ? "default" : "ghost"}
                                                                className="h-6 text-[11px] px-2 rounded-md"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onSelectNode && onSelectNode("project", proj.id);
                                                                }}
                                                            >
                                                                Filter Project
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {/* Stores & HUBs (Level 3 & 4) */}
                                                    {isProjExpanded && proj.stores && proj.stores.length > 0 && (
                                                        <div className="pl-6 pr-2 py-2 space-y-1.5 bg-muted/20 border-t border-border/30">
                                                            {proj.stores.map((st) => {
                                                                const isHub = st.type === "HUB";
                                                                const isStSelected = selectedStore === st.id;

                                                                return (
                                                                    <div
                                                                        key={st.id}
                                                                        className={`flex items-center justify-between p-2 rounded-md border text-xs transition-all ${
                                                                            isStSelected
                                                                                ? "bg-primary/15 border-primary/40 font-semibold"
                                                                                : "bg-background/80 border-border/40 hover:bg-muted/40"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            {isHub ? (
                                                                                <Warehouse className="size-3.5 text-amber-500" />
                                                                            ) : (
                                                                                <StoreIcon className="size-3.5 text-emerald-500" />
                                                                            )}
                                                                            <span className="text-foreground">{st.name}</span>
                                                                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                                                                isHub ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                            }`}>
                                                                                {st.type}
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-foreground">{st.totalTools} tools</span>
                                                                            <Button
                                                                                size="sm"
                                                                                variant={isStSelected ? "default" : "outline"}
                                                                                className="h-5 text-[10px] px-2 rounded"
                                                                                onClick={() => onSelectNode && onSelectNode(isHub ? "hub" : "store", st.id)}
                                                                            >
                                                                                Filter {isHub ? "HUB" : "Store"}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
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

export default LocationHierarchyView;
