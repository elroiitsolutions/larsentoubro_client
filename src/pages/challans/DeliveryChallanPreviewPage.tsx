import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    FileText,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    Building2,
    Package,
    Truck,
    AlertCircle
} from "lucide-react";
import challanService from "@/services/challan.service";
import { generateDeliveryChallanPDF } from "@/utils/pdf/challanPdfGenerator";
import { calculateChallanSummary } from "@/utils/challan/challanCalculations";
import { toast } from "sonner";

export function DeliveryChallanPreviewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as any;

    const initialTools = state?.selectedTools || [];
    const initialVendor = state?.vendor || { name: "Selected Vendor", vendorCode: "V-001" };
    const storeId = state?.storeId;

    const [challanDate, setChallanDate] = useState(state?.challanDate || new Date().toISOString().split("T")[0]);
    const [deliveryDate, setDeliveryDate] = useState(state?.deliveryDate || new Date().toISOString().split("T")[0]);
    const [remarks, setRemarks] = useState(state?.remarks || "");
    const [notes, setNotes] = useState(state?.notes || "");

    const [items, setItems] = useState<any[]>(
        initialTools.map((t: any) => ({
            tool: t._id,
            toolId: t.toolId || t._id,
            description: t.description || "Tool Item",
            toolCode: t.toolCode || "",
            quantity: Number(t.quantity || 1),
            unit: "NOS",
            rate: Number(t.rate || 0),
            remarks: ""
        }))
    );

    const [creating, setCreating] = useState(false);

    if (initialTools.length === 0) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <Card className="p-12 border-dashed">
                    <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">No Tools Selected for Delivery Challan</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-6">
                        Please go back to the inventory and select tools before creating a Delivery Challan.
                    </p>
                    <Button onClick={() => navigate(-1)} variant="outline">
                        <ArrowLeft className="size-4 mr-2" /> Back to Inventory
                    </Button>
                </Card>
            </div>
        );
    }

    const summary = calculateChallanSummary(items);

    const handleItemChange = (idx: number, field: string, val: any) => {
        const next = [...items];
        next[idx] = { ...next[idx], [field]: val };
        setItems(next);
    };

    const handleConfirmCreate = async () => {
        try {
            setCreating(true);
            const res = await challanService.createDeliveryChallan({
                vendorId: initialVendor._id,
                storeId,
                challanDate,
                deliveryDate,
                remarks,
                notes,
                items
            });

            if (res.success && res.data) {
                toast.success(`Delivery Challan ${res.data.challanNumber} created successfully! Automatically downloading PDF...`);

                // Auto generate and download high-fidelity L&T PDF
                try {
                    await generateDeliveryChallanPDF(res.data, { download: true });
                } catch (pdfErr) {
                    console.error("PDF generation error:", pdfErr);
                    toast.error("Challan created, but automatic PDF download failed.");
                }

                // Redirect back to store tools or challan history
                setTimeout(() => {
                    if (storeId) {
                        navigate(`/stores/${storeId}/tools`);
                    } else {
                        navigate("/challans/history");
                    }
                }, 1500);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to create Delivery Challan");
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
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <FileText className="size-6 text-primary" />
                            Review & Create Delivery Challan
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Verify dispatch quantities, rates, and consignee details before issuing an official L&T Delivery Challan.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        disabled={creating}
                    >
                        Back to Selection
                    </Button>
                    <Button
                        onClick={handleConfirmCreate}
                        disabled={creating}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg flex items-center gap-2 px-5"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Creating Challan...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="size-4" />
                                <span>Confirm & Create Challan</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Consignee Vendor</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Building2 className="size-4 text-primary" />
                        <span className="font-bold text-foreground truncate">{initialVendor.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{initialVendor.vendorCode}</span>
                </Card>
                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Total Tools</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Package className="size-4 text-emerald-600" />
                        <span className="text-xl font-bold text-foreground">{items.length}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Unique items</span>
                </Card>
                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Total Quantity</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Truck className="size-4 text-blue-600" />
                        <span className="text-xl font-bold text-foreground">{summary.totalQuantity}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Units (NOS)</span>
                </Card>
                <Card className="p-4 bg-card/60 backdrop-blur-sm border-border shadow-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Estimated Value</p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold text-primary">₹ {summary.totalRate.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Total Rate across items</span>
                </Card>
            </div>

            {/* Challan Metadata Form */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">Challan Header Information</CardTitle>
                    <CardDescription className="text-xs">
                        Review consignee address, GST, and delivery timeframe.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label className="text-xs">Challan Issue Date *</Label>
                        <Input
                            type="date"
                            className="h-9 mt-1 text-sm"
                            value={challanDate}
                            onChange={e => setChallanDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Expected Delivery Date</Label>
                        <Input
                            type="date"
                            className="h-9 mt-1 text-sm"
                            value={deliveryDate}
                            onChange={e => setDeliveryDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Consignee GST Number</Label>
                        <Input
                            disabled
                            className="h-9 mt-1 text-sm bg-muted font-mono"
                            value={initialVendor.gstNumber || "Not Provided"}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <Label className="text-xs">Remarks / Dispatch Instructions</Label>
                        <Input
                            placeholder="Dispatch instructions..."
                            className="h-9 mt-1 text-sm"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Internal Notes</Label>
                        <Input
                            placeholder="Internal reference..."
                            className="h-9 mt-1 text-sm"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Editable Items Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold">Tool Items to Dispatch</CardTitle>
                    <CardDescription className="text-xs">
                        You can adjust the quantity, rate (Rs.), and remarks for each item before generating the Delivery Challan.
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
                                <th className="px-4 py-3 w-28">Quantity</th>
                                <th className="px-4 py-3 w-24">Unit</th>
                                <th className="px-4 py-3 w-32">Rate (₹)</th>
                                <th className="px-4 py-3">Item Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {items.map((item, idx) => (
                                <tr key={item.tool} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-semibold text-muted-foreground">{idx + 1}</td>
                                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{item.toolId}</td>
                                    <td className="px-4 py-3 font-medium text-foreground">{item.description}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{item.toolCode || "-"}</td>
                                    <td className="px-4 py-3">
                                        <Input
                                            type="number"
                                            min={1}
                                            className="h-8 w-24 text-center font-semibold"
                                            value={item.quantity}
                                            onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            className="h-8 w-20 text-center uppercase font-mono text-xs"
                                            value={item.unit}
                                            onChange={e => handleItemChange(idx, "unit", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            type="number"
                                            min={0}
                                            className="h-8 w-28 text-right font-mono"
                                            value={item.rate}
                                            onChange={e => handleItemChange(idx, "rate", Number(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Input
                                            placeholder="Optional remarks"
                                            className="h-8 text-xs"
                                            value={item.remarks}
                                            onChange={e => handleItemChange(idx, "remarks", e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
                <CardFooter className="bg-muted/30 px-6 py-4 flex items-center justify-between text-sm font-semibold border-t">
                    <span className="text-muted-foreground">Total {items.length} Tool(s)</span>
                    <div className="flex items-center gap-6">
                        <span>Total Qty: <strong className="text-foreground">{summary.totalQuantity}</strong></span>
                        <span>Total Value: <strong className="text-primary">₹ {summary.totalRate.toLocaleString()}</strong></span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default DeliveryChallanPreviewPage;

// DeliveryChallanPreviewPage component
