import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Truck, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock, ShieldCheck } from "lucide-react";
import type { ToolMovementData } from "@/services/dashboard.service";

interface Props {
    movementData: ToolMovementData;
}

export const ToolMovementOverview: React.FC<Props> = ({ movementData }) => {
    return (
        <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden h-full flex flex-col justify-between">
            <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Truck className="size-5 text-cyan-500" />
                            <span>Tool Movement Overview</span>
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Real-time tracking of tool inward, outward, Store/HUB transfers & items in transit
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-cyan-600 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                        <Truck className="size-3.5" />
                        <span>{movementData.currentlyInTransit} In Transit</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {/* IN */}
                    <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Inward (IN)</span>
                            <ArrowDownLeft className="size-4 text-emerald-600" />
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {movementData.movementsIn}
                            </div>
                            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">Returned / Supplied</span>
                        </div>
                    </div>

                    {/* OUT */}
                    <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Outward (OUT)</span>
                            <ArrowUpRight className="size-4 text-blue-600" />
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                {movementData.movementsOut}
                            </div>
                            <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80 font-medium">Issued / Dispatched</span>
                        </div>
                    </div>

                    {/* Transfers */}
                    <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Transfers</span>
                            <ArrowLeftRight className="size-4 text-purple-600" />
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                                {movementData.transfers}
                            </div>
                            <span className="text-[10px] text-purple-700/80 dark:text-purple-400/80 font-medium">Store ↔ HUB</span>
                        </div>
                    </div>

                    {/* Pending Inward */}
                    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Pending Inward</span>
                            <Clock className="size-4 text-amber-600" />
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                                {movementData.pendingInward}
                            </div>
                            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium">Awaiting Receipt</span>
                        </div>
                    </div>

                    {/* In Transit */}
                    <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 flex flex-col justify-between col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">In Transit</span>
                            <Truck className="size-4 text-cyan-600" />
                        </div>
                        <div className="mt-3">
                            <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400">
                                {movementData.currentlyInTransit}
                            </div>
                            <span className="text-[10px] text-cyan-700/80 dark:text-cyan-400/80 font-medium">Currently Transporting</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ToolMovementOverview;
