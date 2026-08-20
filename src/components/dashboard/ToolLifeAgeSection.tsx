import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ShieldAlert, ShieldCheck, Award, ArrowUpRight } from "lucide-react";
import type { ToolLifeAgeData } from "@/services/dashboard.service";
import ToolLifeExtensionModal from "./ToolLifeExtensionModal";

interface Props {
    ageData: ToolLifeAgeData;
    onRefresh?: () => void;
}

export const ToolLifeAgeSection: React.FC<Props> = ({ ageData, onRefresh }) => {
    const [modalOpen, setModalOpen] = useState<boolean>(false);

    const totalCalculated =
        ageData.under1Year +
        ageData.yr1To2 +
        ageData.yr2To3 +
        ageData.over3YrPendingInspection +
        ageData.extended1Yr +
        ageData.extended2Yr;

    return (
        <>
            <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden h-full flex flex-col justify-between">
                <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Clock className="size-5 text-amber-500" />
                                <span>Tool Life & Age Lifecycle</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                Standard tool life is 3 years. After 3 years, manual inspection approval extends validity by +1 or +2 years.
                            </CardDescription>
                        </div>

                        <Button
                            size="sm"
                            onClick={() => setModalOpen(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 h-8"
                        >
                            <ShieldCheck className="size-3.5" />
                            <span>Extend Tool Life (+1 / +2 Yrs)</span>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-5 flex-1 flex flex-col justify-between gap-5">
                    {/* Key Metric Banner */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600">
                                <ShieldAlert className="size-5" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                    3+ Year Lifecycle Threshold
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                    {ageData.over3YrPendingInspection} tools awaiting mandatory QA/QC inspection
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                {ageData.over3YrPendingInspection}
                            </div>
                            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-semibold">Inspection Due</span>
                        </div>
                    </div>

                    {/* Age Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl border border-border/50 bg-background/60">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">New (&lt; 1 Year)</span>
                            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{ageData.under1Year}</div>
                            <span className="text-[10px] text-muted-foreground font-medium">Standard Life</span>
                        </div>

                        <div className="p-3 rounded-xl border border-border/50 bg-background/60">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">1 – 2 Years</span>
                            <div className="text-2xl font-extrabold text-blue-600 mt-1">{ageData.yr1To2}</div>
                            <span className="text-[10px] text-muted-foreground font-medium">Standard Life</span>
                        </div>

                        <div className="p-3 rounded-xl border border-border/50 bg-background/60">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">2 – 3 Years</span>
                            <div className="text-2xl font-extrabold text-indigo-600 mt-1">{ageData.yr2To3}</div>
                            <span className="text-[10px] text-muted-foreground font-medium">Approaching Limit</span>
                        </div>

                        <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10">
                            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">3+ Yrs (Pending)</span>
                            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{ageData.over3YrPendingInspection}</div>
                            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium">Requires Approval</span>
                        </div>

                        <div className="p-3 rounded-xl border border-purple-500/40 bg-purple-500/10">
                            <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400">Extended +1 Year</span>
                            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">{ageData.extended1Yr}</div>
                            <span className="text-[10px] text-purple-700/80 dark:text-purple-400/80 font-medium">Approved Valid</span>
                        </div>

                        <div className="p-3 rounded-xl border border-teal-500/40 bg-teal-500/10">
                            <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400">Extended +2 Years</span>
                            <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">{ageData.extended2Yr}</div>
                            <span className="text-[10px] text-teal-700/80 dark:text-teal-400/80 font-medium">Approved Valid</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ToolLifeExtensionModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSuccess={onRefresh}
            />
        </>
    );
};

export default ToolLifeAgeSection;
