import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator
} from "@/components/ui/select"
import { 
    Building2, 
    User, 
    Phone, 
    Mail, 
    CheckCircle2, 
    PlusCircle, 
    Calendar, 
    ArrowRight, 
    MapPin, 
    Hash, 
    RefreshCw, 
    Loader2
} from "lucide-react";
import vendorService, { type VendorRecord } from "@/services/vendor.service";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface VendorSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTools: any[];
    storeId?: string;
}

export function VendorSelectionModal({ open, onOpenChange, selectedTools, storeId }: VendorSelectionModalProps) {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState<VendorRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [selectedVendorDetails, setSelectedVendorDetails] = useState<VendorRecord | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Form inputs for Challan Date, Delivery Date, Remarks, Notes
    const [challanDate, setChallanDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [remarks, setRemarks] = useState("");
    const [notes, setNotes] = useState("");

    // Optional Quick Add Vendor state
    const [isCreatingVendor, setIsCreatingVendor] = useState(false);
    const [newVendor, setNewVendor] = useState({
        name: "",
        vendorCode: "",
        address: "",
        contactPerson: "",
        contactPhone: "",
        gstNumber: ""
    });
    const [creatingError, setCreatingError] = useState("");

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const res = await vendorService.getVendors({ limit: 1000 });
            const list = res.data || [];
            setVendors(list);
            if (!selectedVendorId && list.length > 0) {
                handleVendorChange(list[0]._id, list);
            } else if (selectedVendorId) {
                const found = list.find(v => v._id === selectedVendorId);
                if (found) {
                    setSelectedVendorDetails(found);
                }
            }
        } catch (err) {
            console.error("Error fetching vendors:", err);
            toast.error("Failed to fetch vendor list from database");
        } finally {
            setLoading(false);
        }
    };

    const handleVendorChange = async (id: string, vendorList?: VendorRecord[]) => {
        setSelectedVendorId(id);
        const sourceList = vendorList || vendors;
        const found = sourceList.find(v => v._id === id);
        if (found) {
            setSelectedVendorDetails(found);
        }
        try {
            setDetailsLoading(true);
            const res = await vendorService.getVendorById(id);
            if (res.data) {
                setSelectedVendorDetails(res.data);
            }
        } catch (err) {
            console.error("Error fetching vendor details:", err);
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchVendors();
        }
    }, [open]);

    const handleQuickAddVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVendor.name || !newVendor.vendorCode) {
            setCreatingError("Vendor Name and Vendor Code are required");
            return;
        }
        try {
            setCreatingError("");
            const res = await vendorService.createVendor(newVendor);
            const updatedList = [res.data, ...vendors];
            setVendors(updatedList);
            handleVendorChange(res.data._id, updatedList);
            setIsCreatingVendor(false);
            setNewVendor({ name: "", vendorCode: "", address: "", contactPerson: "", contactPhone: "", gstNumber: "" });
            toast.success("Vendor created successfully and selected");
        } catch (err: any) {
            setCreatingError(err.message || "Failed to create vendor");
        }
    };

    const handleProceedToPreview = () => {
        if (!selectedVendorDetails) {
            toast.error("Please select a destination vendor first");
            return;
        }
        onOpenChange(false);
        navigate("/challans/delivery/preview", {
            state: {
                selectedTools,
                vendor: selectedVendorDetails,
                storeId,
                challanDate,
                deliveryDate,
                remarks,
                notes
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Building2 className="size-5 text-primary" />
                                Create Delivery Challan - Select Vendor
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                Choose the destination vendor and specify dispatch details for <span className="font-semibold text-foreground">{selectedTools.length} selected tool(s)</span>.
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs flex items-center gap-1.5 border-primary/20 hover:border-primary/50"
                            onClick={() => setIsCreatingVendor(!isCreatingVendor)}
                        >
                            <PlusCircle className="size-3.5 text-primary" />
                            {isCreatingVendor ? "Cancel New Vendor" : "Add Vendor"}
                        </Button>
                    </div>
                </DialogHeader>

                {isCreatingVendor && (
                    <form onSubmit={handleQuickAddVendor} className="bg-muted/40 p-4 rounded-xl border border-border/80 space-y-3 my-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <PlusCircle className="size-4 text-primary" /> Quick Add New Vendor
                        </h4>
                        {creatingError && <p className="text-xs text-rose-500 font-medium">{creatingError}</p>}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Vendor Name *</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1"
                                    placeholder="e.g. L&T Heavy Engineering"
                                    value={newVendor.name}
                                    onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Vendor Code *</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 font-mono uppercase"
                                    placeholder="e.g. V-LNT01"
                                    value={newVendor.vendorCode}
                                    onChange={e => setNewVendor({ ...newVendor, vendorCode: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">GST Number</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 font-mono"
                                    placeholder="27AAACL0140P1Z0"
                                    value={newVendor.gstNumber}
                                    onChange={e => setNewVendor({ ...newVendor, gstNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Contact Person</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1"
                                    placeholder="e.g. Rajesh Kumar"
                                    value={newVendor.contactPerson}
                                    onChange={e => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label className="text-xs">Address</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1"
                                    placeholder="Site / Office Address"
                                    value={newVendor.address}
                                    onChange={e => setNewVendor({ ...newVendor, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsCreatingVendor(false)}>Cancel</Button>
                            <Button type="submit" size="sm" className="h-7 text-xs">Save Vendor</Button>
                        </div>
                    </form>
                )}

                {/* Vendor Dropdown Selection Section */}
                <div className="space-y-3 my-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-primary" />
                            Select Destination Vendor (Dynamic from Database) *
                        </Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => fetchVendors()}
                        >
                            <RefreshCw className="size-3 mr-1" />
                            Refresh Vendors
                        </Button>
                    </div>

                    {loading ? (
                        <div className="h-10 rounded-xl border border-dashed flex items-center justify-center text-xs text-muted-foreground gap-2 bg-muted/20">
                            <Loader2 className="size-4 animate-spin text-primary" />
                            Fetching vendor list from database...
                        </div>
                    ) : (
                        <Select value={selectedVendorId || ""} onValueChange={(val) => handleVendorChange(val)}>
                            <SelectTrigger className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all shadow-xs cursor-pointer">
                                <SelectValue placeholder={`-- Select a Vendor from Database (${vendors.length} Available) --`} />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.map(v => (
                                    <SelectItem key={v._id} value={v._id}>
                                        {v.name} ({v.vendorCode}){v.gstNumber ? ` - GST: ${v.gstNumber}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Automatic Vendor Details Display */}
                    {selectedVendorDetails ? (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 transition-all animate-in fade-in-50 duration-200">
                            <div className="flex items-start justify-between border-b border-primary/15 pb-2.5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                                            {selectedVendorDetails.name}
                                        </h4>
                                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-primary/20 text-primary font-bold">
                                            {selectedVendorDetails.vendorCode}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold">
                                            {selectedVendorDetails.status || "Active"}
                                        </span>
                                    </div>
                                    {selectedVendorDetails.gstNumber && (
                                        <p className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1">
                                            <Hash className="size-3 text-primary" />
                                            GST: <strong className="text-foreground">{selectedVendorDetails.gstNumber}</strong>
                                        </p>
                                    )}
                                </div>
                                {detailsLoading && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Loader2 className="size-3.5 animate-spin text-primary" />
                                        Updating...
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="size-3.5 text-primary shrink-0" />
                                    <span>Contact: <strong className="text-foreground">{selectedVendorDetails.contactPerson || "Not Specified"}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="size-3.5 text-primary shrink-0" />
                                    <span>Phone: <strong className="text-foreground font-mono">{selectedVendorDetails.contactPhone || "N/A"}</strong></span>
                                </div>
                                {selectedVendorDetails.contactEmail && (
                                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                        <Mail className="size-3.5 text-primary shrink-0" />
                                        <span>Email: <strong className="text-foreground">{selectedVendorDetails.contactEmail}</strong></span>
                                    </div>
                                )}
                                <div className="flex items-start gap-2 text-muted-foreground col-span-2">
                                    <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                                    <span>Address: <strong className="text-foreground">{selectedVendorDetails.address || "No address on file"}</strong></span>
                                </div>
                            </div>

                            {selectedVendorDetails.metrics && (
                                <div className="pt-2 border-t border-primary/15 flex items-center gap-4 text-xs">
                                    <span className="text-muted-foreground">
                                        Delivery Challans: <strong className="text-foreground">{selectedVendorDetails.metrics.dcCount || 0}</strong>
                                    </span>
                                    <span className="text-muted-foreground">
                                        Return Challans: <strong className="text-foreground">{selectedVendorDetails.metrics.rcCount || 0}</strong>
                                    </span>
                                    <span className="text-muted-foreground">
                                        Pending Tools: <strong className="text-primary">{
                                            (selectedVendorDetails.metrics.dcCount || 0) - (selectedVendorDetails.metrics.returnedCount || 0)
                                        }</strong>
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : !loading && (
                        <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                            Please select a vendor from the dropdown above to view details automatically.
                        </div>
                    )}
                </div>

                {/* Dispatch / Challan Metadata */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <Label className="text-xs flex items-center gap-1.5 mb-1.5">
                            <Calendar className="size-3.5 text-primary" /> Challan Date *
                        </Label>
                        <Input
                            type="date"
                            className="h-9 text-sm"
                            value={challanDate}
                            onChange={e => setChallanDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label className="text-xs flex items-center gap-1.5 mb-1.5">
                            <Calendar className="size-3.5 text-primary" /> Expected Delivery Date
                        </Label>
                        <Input
                            type="date"
                            className="h-9 text-sm"
                            value={deliveryDate}
                            onChange={e => setDeliveryDate(e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Label className="text-xs mb-1.5 block">Remarks / Dispatch Instructions</Label>
                        <Textarea
                            placeholder="e.g. Urgent dispatch for stringing erection work at Section-B"
                            className="text-xs min-h-[55px]"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Label className="text-xs mb-1.5 block">Internal Notes (Optional)</Label>
                        <Textarea
                            placeholder="Additional internal reference notes..."
                            className="text-xs min-h-[50px]"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="mt-6 pt-4 border-t flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                        Selected: <strong className="text-foreground font-mono">{selectedTools.length}</strong> tool(s) for DC
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-9"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!selectedVendorDetails || selectedTools.length === 0}
                            onClick={handleProceedToPreview}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 shadow-md h-9 px-4"
                        >
                            <span>Proceed to Preview ({selectedTools.length} Tools)</span>
                            <ArrowRight className="size-4" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// VendorSelectionModal component updated - challan creation supports User table vendors
