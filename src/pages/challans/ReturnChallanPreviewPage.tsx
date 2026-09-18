import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Building2,
    AlertTriangle,
    RotateCcw,
    ShieldAlert
} from "lucide-react";
import challanService, { type ChallanRecord } from "@/services/challan.service";
import { generateReturnChallanPDF } from "@/utils/pdf/challanPdfGenerator";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";

export function ReturnChallanPreviewPage() {
    const { dcId } = useParams<{ dcId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as any;

    const [dc, setDc] = useState<ChallanRecord | null>(state?.referenceDc ||  null);
    const [loading, setLoading] = useState(!dc);

    const [challanDate, setChallanDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [remarks, setRemarks] = useState("");
    const [notes, setNotes] = useState("");

    // Items list with returnStatus toggle
    const [items, setItems] = useState<any[]>([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const loadDc = async () => {
            if (dc && items.length > 0) return;
            try {
                setLoading(true);
                let currentDc = dc;
                if (!currentDc && dcId) {
                    const res = await challanService.getChallanById(dcId);
                    currentDc = res.data;
                    setDc(currentDc);
                }

                if (currentDc) {
                    const mapped = (currentDc.items || []).map((t: any) => ({
                        tool: t.tool || t._id,
                        toolId: t.toolId || "UNKNOWN",
                        description: t.description || "Tool Item",
                        toolCode: t.toolCode || "",
                        quantity: Number(t.quantity || 1),
                        unit: t.unit || "NOS",
                        rate: Number(t.rate || 0),
                        returnStatus: "Returned", // default returned
                        remarks: ""
                    }));
                    setItems(mapped);
                }
            } catch (err) {
                toast.error("Failed to load reference Delivery Challan");
            } finally {
                setLoading(false);
            }
        };

        loadDc();
    }, [dcId, dc]);

    if (loading) {
        return (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-semibold animate-pulse">Loading Delivery Challan details...</p>
            </div>
        );
    }

    if (!dc) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <Card className="p-12 border-dashed">
                    <AlertTriangle className="size-12 text-rose-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Delivery Challan Not Found</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-6">
                        We could not find a valid Delivery Challan with ID #{dcId}.
                    </p>
                    <Button onClick={() => navigate(-1)} variant="outline">
                        <ArrowLeft className="size-4 mr-2" /> Back to History
                    </Button>
                </Card>
            </div>
        );
    }

    const returnedItems = items.filter(i => i.returnStatus === "Returned");
    const missingItems = items.filter(i => i.returnStatus === "Missing");

    const handleStatusToggle = (idx: number, status: "Returned" | "Missing") => {
        const next = [...items];
        next[idx] = {
            ...next[idx],
            returnStatus: status,
            remarks: status === "Missing" ? "Reported missing during return inspection" : ""
        };
        setItems(next);
    };

    const handleItemChange = (idx: number, field: string, val: any) => {
        const next = [...items];
        next[idx] = { ...next[idx], [field]: val };
        setItems(next);
    };

    const handleConfirmCreateReturn = async () => {
        try {
            setCreating(true);
            const res = await challanService.createReturnChallan({
                referenceDcId: dc._id,
                vendorId: dc.vendor?._id || dc.vendor,
                storeId: dc.store?._id || dc.store,
                challanDate,
                remarks,
                notes,
                items
            });

            if (res.success && res.data) {
                toast.success(`Return Challan ${res.data.challanNumber} created! Inventory statuses updated.`);

                if (missingItems.length > 0) {
                    toast.warning(`${missingItems.length} tool(s) recorded as Missing in audit logs.`);
                }

                // Auto generate and download L&T RC PDF
                try {
                    await generateReturnChallanPDF(res.data, { download: true });
                } catch (pdfErr) {
                    console.error("RC PDF error:", pdfErr);
                    toast.error("Return Challan created, but automatic PDF download failed.");
                }

                setTimeout(() => {
                    navigate("/challans/history");
                }, 1500);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create Return Challan");
            setCreating(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Top Navigation & Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <img src={logoUrl} alt="L&T Logo" className="size-8 object-contain shrink-0" />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <RotateCcw className="size-5 text-primary" />
                                Review & Create Return Challan (RC)
                            </h1>
                            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                Ref DC: {dc.challanNumber}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Verify returned vs. missing tools and inspect items before closing the dispatch loop.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        disabled={creating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmCreateReturn}
                        disabled={creating}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2 px-5"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Creating RC...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="size-4" />
                                <span>Confirm Return ({returnedItems.length} Returned, {missingItems.length} Missing)</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Consignee Vendor</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Building2 className="size-4 text-primary" />
                        <span className="font-bold text-foreground truncate">{dc.vendor?.name || "Selected Vendor"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{dc.vendor?.vendorCode || "-"}</span>
                </Card>

                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Returned Tools</p>
                    <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span className="text-xl font-bold text-emerald-600">{returnedItems.length}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Marked as Returned</span>
                </Card>

                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Missing Tools</p>
                    <div className="flex items-center gap-2 mt-1">
                        <AlertTriangle className="size-4 text-rose-600" />
                        <span className="text-xl font-bold text-rose-600">{missingItems.length}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Marked as Missing</span>
                </Card>
            </div>

            {missingItems.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3 text-sm text-rose-800 dark:text-rose-300">
                    <ShieldAlert className="size-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Missing Tool Incident Notice</h4>
                        <p className="text-xs mt-0.5">
                            You have marked <strong>{missingItems.length} tool(s)</strong> as Missing. Creating this Return Challan will update their inventory status to <span className="font-mono font-bold">Missing</span> and record a formal incident in the audit logs.
                        </p>
                    </div>
                </div>
            )}

            {/* Challan Metadata Form */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">Return Challan Header</CardTitle>
                    <CardDescription className="text-xs">
                        Specify return inspection date and notes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label className="text-xs">Return Date *</Label>
                        <Input
                            type="date"
                            className="h-9 mt-1 text-sm"
                            value={challanDate}
                            onChange={e => setChallanDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Reference DC Number</Label>
                        <Input
                            disabled
                            className="h-9 mt-1 text-sm bg-muted font-mono font-bold text-primary"
                            value={dc.challanNumber}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Original DC Date</Label>
                        <Input
                            disabled
                            className="h-9 mt-1 text-sm bg-muted font-mono"
                            value={new Date(dc.challanDate).toLocaleDateString()}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <Label className="text-xs">Return Remarks / Inspection Summary</Label>
                        <Input
                            placeholder="e.g. Returned after completing stringing at Section-B"
                            className="h-9 mt-1 text-sm"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Internal Notes</Label>
                        <Input
                            placeholder="Internal reference notes..."
                            className="h-9 mt-1 text-sm"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Editable Return Status Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">Tool Return & Inspection Checklist</CardTitle>
                    <CardDescription className="text-xs">
                        Toggle each item as <strong className="text-emerald-600">Returned</strong> or <strong className="text-rose-600">Missing</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="min-w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold border-y">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Tool ID</th>
                                <th className="px-4 py-3">Description</th>
                                <th className="px-4 py-3">Tool Code</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-center">Return Status</th>
                                <th className="px-4 py-3">Remarks / Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {items.map((item, idx) => {
                                const isReturned = item.returnStatus === "Returned";
                                return (
                                    <tr key={item.tool} className={`hover:bg-muted/30 ${!isReturned ? "bg-rose-500/[0.04]" : ""}`}>
                                        <td className="px-4 py-3 font-semibold text-muted-foreground">{idx + 1}</td>
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{item.toolId}</td>
                                        <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{item.toolCode || "-"}</td>
                                        <td className="px-4 py-3 text-center font-semibold">{item.quantity} {item.unit}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="inline-flex items-center rounded-lg border p-0.5 bg-muted">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusToggle(idx, "Returned")}
                                                    className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                                                        isReturned
                                                            ? "bg-emerald-600 text-white shadow-sm"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    <CheckCircle2 className="size-3.5" /> Returned
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusToggle(idx, "Missing")}
                                                    className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                                                        !isReturned
                                                            ? "bg-rose-600 text-white shadow-sm"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    <AlertTriangle className="size-3.5" /> Missing
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Input
                                                placeholder={!isReturned ? "Reason for missing item required..." : "Optional remarks"}
                                                className={`h-8 text-xs ${!isReturned ? "border-rose-300 dark:border-rose-800" : ""}`}
                                                value={item.remarks}
                                                onChange={e => handleItemChange(idx, "remarks", e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
                <CardFooter className="bg-muted/30 px-6 py-4 flex items-center justify-between text-sm font-semibold border-t">
                    <span className="text-muted-foreground">Total {items.length} Item(s) in DC</span>
                    <div className="flex items-center gap-6">
                        <span className="text-emerald-600">Returned: <strong>{returnedItems.length}</strong></span>
                        <span className="text-rose-600">Missing: <strong>{missingItems.length}</strong></span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default ReturnChallanPreviewPage;

// ReturnChallanPreviewPage component
