import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    FileText,
    ArrowLeft,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Download,
    MapPin
} from "lucide-react";
import challanService from "@/services/challan.service";
import { generateDeliveryChallanPDF, formatDateDDMMYYYY, formatDCNumber } from "@/utils/pdf/challanPdfGenerator";
import { calculateChallanSummary } from "@/utils/challan/challanCalculations";
import { toast } from "sonner";

export function DeliveryChallanPreviewPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as any;

    const initialTools = state?.selectedTools || [];
    const initialVendor = state?.vendor || { name: "Selected Subcontractor", vendorCode: "V-001" };
    const storeId = state?.storeId;

    // Header & Company Titles (Static Non-Editable)
    const companyName = "LARSEN & TOUBRO LIMITED, CONSTRUCTION";
    const companyDivision = "L&T Construction";
    const documentTitle = "DELIVERY CHALLAN";
    const docReferenceCode = "ECC-O&M/STR/906";
    const registeredOfficeAddress = "Registered Office : L & T House, Ballard Estate, Bombay - 400 038.";

    // Dates & Remarks
    const [challanDate, setChallanDate] = useState(state?.challanDate || new Date().toISOString().split("T")[0]);

    const [remarks, setRemarks] = useState(state?.remarks || "");

    // Consignee / Subcontractor & Location Details (Editable)
    const vendorCode = initialVendor.vendorCode || "V-001";
    const [subcontractorName, setSubcontractorName] = useState(initialVendor.name || "Selected Subcontractor");
    const [consigneeAddress, setConsigneeAddress] = useState(initialVendor.address || "Powai Campus, Saki Vihar Road, Mumbai");
    const [siteCode, setSiteCode] = useState(state?.siteCode || "LT003");
    const [locationChainage, setLocationChainage] = useState("Loc: 59/3 to 60/0");
    const [consigneeGstNo, setConsigneeGstNo] = useState(initialVendor.gstNumber || "27AAACL0140P1Z0");

    // Accounting & TRN Fields (Editable)
    const [trnCode, setTrnCode] = useState("M 25");
    const [sendingCentreCode, setSendingCentreCode] = useState("STR-01");
    const [mrNo, setMrNo] = useState("-");
    const [mrDate, setMrDate] = useState("-");
    const [stockType, setStockType] = useState("CAPTIVE");
    const [ewayBillNo, setEwayBillNo] = useState("-");

    // Gate Pass & Transport Details (Editable)
    const [gatePassNo, setGatePassNo] = useState("GP-2026-001");
    const [gatePassApprovedBy, setGatePassApprovedBy] = useState("APPROVED");
    const [consignorTaxNo, setConsignorTaxNo] = useState("27AAACL0140P1Z0");
    const [vehicleNo, setVehicleNo] = useState("-");
    const [lrNo, setLrNo] = useState("-");
    const [freightStatus, setFreightStatus] = useState("PAID");

    // Receiver Details (Editable)
    const [receiverName, setReceiverName] = useState("");
    const [receiverMobile, setReceiverMobile] = useState("");
    const [mrnNo, setMrnNo] = useState("");
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);

    const [items, setItems] = useState<any[]>(
        initialTools.map((t: any, idx: number) => ({
            tool: t._id,
            toolId: t.toolId || t._id,
            materialCode: t.materialCode || t.toolCode || `MAT-${1000 + idx}`,
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

    const getChallanPayload = () => ({
        subcontractorName,
        siteCode,
        vendorCode,
        locationChainage,
        vendorId: initialVendor._id,
        vendor: {
            ...initialVendor,
            name: subcontractorName,
            address: consigneeAddress,
            vendorCode: vendorCode,
            gstNumber: consigneeGstNo
        },
        storeId,
        challanDate,
        trnCode,
        sendingCentreCode,
        mrNo,
        mrDate,
        stockType,
        ewayBillNo,
        gatePassNo,
        gatePassApprovedBy,
        consignorTaxNo,
        vehicleNo,
        lrNo,
        freightStatus,
        receiverName,
        receiverMobile,
        mrnNo,
        receiptDate,
        docReferenceCode,
        remarks,
        items
    });

    const handleDownloadDraft = async () => {
        try {
            const draftData = {
                challanNumber: "DC-26-001",
                ...getChallanPayload()
            };
            await generateDeliveryChallanPDF(draftData, { download: true, fileName: "Delivery_Challan_Draft.pdf" });
            toast.success("Downloaded Delivery Challan PDF Draft");
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate draft PDF");
        }
    };

    const handleConfirmCreate = async () => {
        try {
            setCreating(true);
            const payload = getChallanPayload();
            const res = await challanService.createDeliveryChallan(payload);

            if (res.success && res.data) {
                toast.success(`Delivery Challan ${formatDCNumber(res.data.challanNumber)} created successfully! Automatically downloading PDF...`);

                try {
                    await generateDeliveryChallanPDF({ ...payload, ...res.data }, { download: true });
                } catch (pdfErr) {
                    console.error("PDF generation error:", pdfErr);
                    toast.error("Challan created, but automatic PDF download failed.");
                }

                setTimeout(() => {
                    if (storeId) {
                        navigate(`/stores/${storeId}/tools`);
                    } else {
                        navigate("/challans/history");
                    }
                }, 1500);
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err.message || "Failed to create Delivery Challan");
            setCreating(false);
        }
    };

    return (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col w-full py-4 px-2 sm:px-6 space-y-6">
            
            {/* Top Toolbar Navigation & Title */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-border/60 pb-3 sm:pb-4">
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl shrink-0 mt-0.5 sm:mt-0">
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-base sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                            <FileText className="size-5 sm:size-6 text-primary shrink-0" />
                            <span>Official Delivery Challan Document Canvas</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-none">
                            Subcontractor details, Location chainage, Material codes, Returnable stamp, and Receiver details editor.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0">
                    <Button
                        variant="outline"
                        onClick={handleDownloadDraft}
                        disabled={creating}
                        className="rounded-xl h-9 sm:h-10 px-4 text-xs font-bold gap-2 cursor-pointer flex items-center justify-center w-full sm:w-auto"
                    >
                        <Download className="size-4 text-primary" />
                        <span>Download PDF Draft</span>
                    </Button>
                    <Button
                        onClick={handleConfirmCreate}
                        disabled={creating}
                        className="rounded-xl h-9 sm:h-10 px-5 sm:px-6 font-bold shadow-md flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer w-full sm:w-auto text-xs sm:text-sm"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Creating Challan...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="size-4" />
                                <span>Confirm & Issue Challan</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Location & Receiver Details Input Card */}
            <Card className="border border-border/60 shadow-2xs rounded-2xl bg-card p-3.5 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2.5 sm:pb-3">
                    <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary shrink-0" />
                        <h3 className="text-xs sm:text-sm font-extrabold text-foreground">Location & Receiver Entry Details</h3>
                    </div>
                    <span className="text-[11px] sm:text-xs text-muted-foreground">Manual Challan Slip Alignments</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Site Code</label>
                        <Input value={siteCode} onChange={e => setSiteCode(e.target.value)} className="h-8 text-xs font-semibold" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Tower / Location / Chainage</label>
                        <Input value={locationChainage} onChange={e => setLocationChainage(e.target.value)} placeholder="e.g. Loc: 59/3 to 60/0" className="h-8 text-xs font-semibold" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Receiver Name</label>
                        <Input value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Full Name" className="h-8 text-xs font-semibold" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Receiver Mobile No.</label>
                        <Input value={receiverMobile} onChange={e => setReceiverMobile(e.target.value)} placeholder="Mobile Number" className="h-8 text-xs font-semibold" />
                    </div>
                </div>
            </Card>

            {/* Mobile Scroll Hint Banner */}
            <div className="sm:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                <span className="flex items-center gap-1.5">
                    <FileText className="size-3.5" />
                    Official Challan Canvas
                </span>
                <span className="text-[11px] text-muted-foreground">Swipe horizontally to view/edit →</span>
            </div>

            {/* Authentic L&T Delivery Challan Document Canvas Scroll Container */}
            <div className="w-full overflow-x-auto pb-4">
                <div className="min-w-[760px] lg:min-w-0 bg-white text-black p-4 sm:p-8 rounded-2xl border-2 border-slate-900 shadow-xl font-sans max-w-5xl mx-auto w-full space-y-0 text-xs">
                
                {/* L&T Top Header (Static Title & Division) */}
                <div className="text-center space-y-1 pb-4">
                    <div className="flex items-center justify-start">
                        <div className="bg-[#0e4c92] text-white px-3 py-1.5 rounded font-bold text-xs tracking-wider inline-block">
                            {companyDivision}
                        </div>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-black uppercase tracking-tight text-center font-serif">
                        {companyName}
                    </h2>
                </div>

                {/* Delivery Challan Document Table Frame */}
                <div className="border-2 border-black divide-y-2 divide-black">
                    
                    {/* Row 1: Title & Consignee / Subcontractor Box */}
                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black min-h-[90px]">
                        <div className="md:col-span-7 flex flex-col divide-y-2 divide-black">
                            <div className="p-2 text-center bg-slate-50 font-black text-base sm:text-lg text-black uppercase">
                                {documentTitle}
                            </div>
                            <div className="grid grid-cols-2 divide-x-2 divide-black flex-1">
                                <div className="p-2 space-y-1">
                                    <span className="font-bold text-[10px] block">DC NO.</span>
                                    <span className="font-bold text-xs block font-mono text-slate-700">DC-26-001</span>
                                </div>
                                <div className="p-2 space-y-1">
                                    <span className="font-bold text-[10px] block">DATE (DD-MM-YYYY)</span>
                                    <Input
                                        type="date"
                                        value={challanDate}
                                        onChange={e => setChallanDate(e.target.value)}
                                        className="h-7 text-xs font-bold border-slate-400 bg-white"
                                    />
                                    <span className="text-[10px] font-mono text-slate-500 font-bold">{formatDateDDMMYYYY(challanDate)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Consignee / Subcontractor Box */}
                        <div className="md:col-span-5 p-3 space-y-2 bg-slate-50/50">
                            <span className="font-bold text-[10px] block">CONSIGNEE / SUBCONTRACTOR</span>
                            <Input 
                                value={subcontractorName}
                                onChange={e => setSubcontractorName(e.target.value)}
                                placeholder="Subcontractor Name"
                                className="font-extrabold text-xs h-7 border-slate-400 bg-white"
                            />
                            <Input 
                                value={consigneeAddress}
                                onChange={e => setConsigneeAddress(e.target.value)}
                                placeholder="Work Location Address"
                                className="text-xs h-7 border-slate-400 bg-white"
                            />
                            <div className="pt-1 flex items-center justify-between text-[11px] gap-2">
                                <span className="font-bold shrink-0">SITE CODE NO.</span>
                                <Input 
                                    value={siteCode}
                                    onChange={e => setSiteCode(e.target.value)}
                                    className="h-6 font-mono font-bold text-xs text-right border-slate-400 bg-white w-28"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: TRN CD & Accounting Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x-2 divide-y-2 sm:divide-y-0 divide-black p-0 bg-slate-50 text-[10px]">
                        <div className="p-1.5 space-y-1 text-center">
                            <span className="font-bold block text-[9px]">TRN CD</span>
                            <Input value={trnCode} onChange={e => setTrnCode(e.target.value)} className="h-6 text-center text-xs font-bold border-slate-400 bg-white p-1" />
                        </div>
                        <div className="p-1.5 space-y-1 text-center">
                            <span className="font-bold block text-[9px]">SENDING / ACCT CENTRE CODE</span>
                            <Input value={sendingCentreCode} onChange={e => setSendingCentreCode(e.target.value)} className="h-6 text-center text-xs font-bold border-slate-400 bg-white p-1" />
                        </div>
                        <div className="p-1.5 space-y-1 text-center">
                            <span className="font-bold block text-[9px]">M.R.N. NO.</span>
                            <Input value={mrNo} onChange={e => setMrNo(e.target.value)} className="h-6 text-center text-xs font-bold border-slate-400 bg-white p-1" />
                        </div>
                        <div className="p-1.5 space-y-1 text-center">
                            <span className="font-bold block text-[9px]">M.R.N. DATE</span>
                            <Input value={mrDate} onChange={e => setMrDate(e.target.value)} className="h-6 text-center text-xs font-bold border-slate-400 bg-white p-1" />
                        </div>
                        <div className="p-1.5 space-y-1 text-center">
                            <span className="font-bold block text-[9px]">STOCK TYPE</span>
                            <Input value={stockType} onChange={e => setStockType(e.target.value)} className="h-6 text-center text-xs font-bold border-slate-400 bg-white p-1" />
                        </div>
                        <div className="p-1.5 space-y-1 text-center">
                            <span className="font-bold block text-[9px]">VENDOR CODE</span>
                            <Input value={vendorCode} readOnly className="h-6 text-center text-xs font-bold border-slate-400 bg-slate-100 p-1 font-mono cursor-not-allowed" />
                        </div>
                        <div className="p-1.5 space-y-1 text-center">
                            <span className="font-bold block text-[9px]">E-WAY BILL NO.</span>
                            <Input value={ewayBillNo} onChange={e => setEwayBillNo(e.target.value)} className="h-6 text-center text-xs font-bold border-slate-400 bg-white p-1" />
                        </div>
                    </div>

                    {/* Returnable Stamp Banner */}
                    <div className="p-2 text-center bg-red-50 border-b border-red-200 uppercase tracking-wide space-y-0.5">
                        <div className="font-black text-xs text-red-700">NOT FOR SALE – MATERIAL ISSUED ON RETURNABLE BASIS</div>
                        <div className="text-[10px] font-medium text-slate-700 normal-case italic">
                            We have despatched the following goods. Kindly return the duplicate copy duly signed acknowledging receipt of goods.
                        </div>
                    </div>

                    {/* Row 3: Items Table with Material Code Column */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black bg-slate-100 text-center font-bold text-[11px]">
                                    <th className="p-2 border-r-2 border-black w-12">SL. NO.</th>
                                    <th className="p-2 border-r-2 border-black w-32">MATERIAL CODE</th>
                                    <th className="p-2 border-r-2 border-black">DESCRIPTION & QR</th>
                                    <th className="p-2 border-r-2 border-black w-24">QUANTITY</th>
                                    <th className="p-2 border-r-2 border-black w-20">UNIT</th>
                                    <th className="p-2 w-28">RATE RS.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black">
                                {items.map((item, idx) => (
                                    <tr key={item.tool} className="text-center font-medium">
                                        <td className="p-2 border-r-2 border-black font-bold">{idx + 1}</td>
                                        <td className="p-2 border-r-2 border-black">
                                            <Input
                                                value={item.materialCode}
                                                onChange={e => handleItemChange(idx, "materialCode", e.target.value)}
                                                className="font-mono font-bold text-xs h-7 border-slate-400 bg-white text-center"
                                            />
                                        </td>
                                        <td className="p-2 border-r-2 border-black text-left space-y-1">
                                            <Input
                                                value={item.description}
                                                onChange={e => handleItemChange(idx, "description", e.target.value)}
                                                className="font-extrabold text-xs h-7 border-slate-400 bg-white"
                                            />
                                            <p className="font-mono text-[11px] text-blue-700">QR: {item.toolId || item.tool}</p>
                                        </td>
                                        <td className="p-2 border-r-2 border-black">
                                            <Input 
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                                                className="h-7 w-20 text-center font-bold text-xs border-slate-400 bg-white mx-auto"
                                            />
                                        </td>
                                        <td className="p-2 border-r-2 border-black">
                                            <Input 
                                                value={item.unit}
                                                onChange={e => handleItemChange(idx, "unit", e.target.value)}
                                                className="h-7 w-16 text-center uppercase font-bold text-xs border-slate-400 bg-white mx-auto"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <Input 
                                                type="number"
                                                value={item.rate || 0}
                                                onChange={e => handleItemChange(idx, "rate", Number(e.target.value))}
                                                className="h-7 w-24 text-center font-mono text-xs border-slate-400 bg-white mx-auto"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Row 4: Gate Pass Approval & Total Qty */}
                    <div className="grid grid-cols-12 divide-x-2 divide-black p-2 bg-slate-100 items-center font-bold">
                        <div className="col-span-8 sm:col-span-9 flex items-center gap-2 flex-wrap">
                            <span>GATE PASS NO:</span>
                            <Input value={gatePassNo} onChange={e => setGatePassNo(e.target.value)} className="h-7 w-28 font-bold text-xs border-slate-400 bg-white" />
                            <span className="ml-2">APPROVED BY:</span>
                            <Input value={gatePassApprovedBy} onChange={e => setGatePassApprovedBy(e.target.value)} className="h-7 w-36 font-bold text-xs border-slate-400 bg-white" />
                        </div>
                        <div className="col-span-4 sm:col-span-3 text-right pr-4 text-sm font-black">
                            TOTAL: <span className="text-base text-blue-900">{summary.totalQuantity}</span>
                        </div>
                    </div>

                    {/* Row 5: Tax Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black p-2 bg-white gap-2">
                        <div>
                            <span className="font-bold text-[10px] block">CONSIGNOR SALES / GST TAX NO. & DATE</span>
                            <Input value={consignorTaxNo} onChange={e => setConsignorTaxNo(e.target.value)} className="h-7 font-bold text-xs border-slate-400 bg-white mt-1" />
                        </div>
                        <div>
                            <span className="font-bold text-[10px] block">CONSIGNEE / SUBCONTRACTOR GST NO. & DATE</span>
                            <Input value={consigneeGstNo} onChange={e => setConsigneeGstNo(e.target.value)} className="h-7 font-bold text-xs border-slate-400 bg-white mt-1 font-mono" />
                        </div>
                    </div>

                    {/* Row 6: Vehicle, LR, Freight */}
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black p-2 bg-slate-50 gap-2">
                        <div>
                            <span className="font-bold text-[10px] block">VEHICLE / DESPATCH THROUGH</span>
                            <Input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} className="h-7 font-bold text-xs border-slate-400 bg-white mt-1" />
                        </div>
                        <div>
                            <span className="font-bold text-[10px] block">LR / RR NO. & DATE</span>
                            <Input value={lrNo} onChange={e => setLrNo(e.target.value)} className="h-7 font-bold text-xs border-slate-400 bg-white mt-1" />
                        </div>
                        <div>
                            <span className="font-bold text-[10px] block">FREIGHT RS.</span>
                            <Select value={freightStatus} onValueChange={(val: any) => val && setFreightStatus(val)}>
                                <SelectTrigger className="h-7 w-full font-bold text-xs border border-slate-400 rounded bg-white mt-1 px-2 shadow-none focus:ring-1 focus:ring-primary">
                                    <SelectValue placeholder="Select Freight" />
                                </SelectTrigger>
                                <SelectContent align="end" className="z-50 min-w-36 max-w-[calc(100vw-2rem)] bg-white text-black border border-slate-300 shadow-xl rounded-xl">
                                    <SelectItem value="PAID">PAID</SelectItem>
                                    <SelectItem value="TO PAY">TO PAY</SelectItem>
                                    <SelectItem value="NOT APPLICABLE">NOT APPLICABLE</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 7: Receipt Details & Signature */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black min-h-[95px] p-3 bg-white">
                        <div className="flex flex-col justify-between space-y-1">
                            <span className="font-bold text-[10px]">RECEIPT DETAILS</span>
                            <p className="text-[9.5px] text-slate-600 italic leading-tight font-medium">
                                We have despatched the following goods. Kindly return the duplicate copy duly signed acknowledging receipt of goods.
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                    <span className="font-bold text-[9px] text-slate-500">RECEIVER NAME</span>
                                    <Input value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder="Full Name" className="h-6 text-[10px] font-bold border-slate-300" />
                                </div>
                                <div>
                                    <span className="font-bold text-[9px] text-slate-500">MOBILE NO.</span>
                                    <Input value={receiverMobile} onChange={e => setReceiverMobile(e.target.value)} placeholder="Mobile Number" className="h-6 text-[10px] font-bold border-slate-300" />
                                </div>
                                <div>
                                    <span className="font-bold text-[9px] text-slate-500">MRN NO.</span>
                                    <Input value={mrnNo} onChange={e => setMrnNo(e.target.value)} placeholder="MRN-001" className="h-6 text-[10px] font-bold border-slate-300" />
                                </div>
                                <div>
                                    <span className="font-bold text-[9px] text-slate-500">RECEIPT DATE</span>
                                    <Input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} className="h-6 text-[10px] font-bold border-slate-300" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-between text-right font-bold space-y-1">
                            <span className="text-xs font-black">FOR LARSEN & TOUBRO LIMITED CONSTRUCTION DIVISION</span>
                            <span className="text-xs text-slate-700">AUTHORIZED SIGNATORY</span>
                        </div>
                    </div>

                    {/* Row 8: Remarks */}
                    <div className="p-3 space-y-1 bg-slate-50">
                        <span className="font-bold text-[10px] block">REMARKS</span>
                        <Textarea 
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            placeholder="Add remarks or dispatch instructions..."
                            className="text-xs font-semibold border-slate-400 bg-white h-14"
                        />
                    </div>
                </div>

                {/* Footer Copy Distribution Line with Static Printable Checkboxes */}
                <div className="pt-4 space-y-2 text-[11px] font-bold">
                    <div className="flex flex-wrap items-center justify-between text-slate-600 gap-2">
                        <span>{docReferenceCode}</span>
                        <span>{registeredOfficeAddress}</span>
                    </div>

                    {/* Static Printable Copy Distribution Checkboxes */}
                    <div className="flex flex-wrap items-center gap-5 pt-2 border-t border-slate-300">
                        <span className="text-black font-extrabold">COPY DISTRIBUTION:</span>
                        <div className="flex flex-wrap items-center gap-4 text-black font-bold">
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center size-3.5 border-2 border-black rounded-xs text-[10px]" />
                                <span>CONSIGNEE</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center size-3.5 border-2 border-black rounded-xs text-[10px]" />
                                <span>CONSIGNEE – CONSIGNOR</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center size-3.5 border-2 border-black rounded-xs text-[10px]" />
                                <span>GATE PASS (SECURITY - ACCOUNTS)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center size-3.5 border-2 border-black rounded-xs text-[10px]" />
                                <span>CONSIGNOR'S FILE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>

        </div>
    );
}

export default DeliveryChallanPreviewPage;
