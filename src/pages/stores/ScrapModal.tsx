import React, { useState, useEffect, useCallback } from "react";
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
    SelectValue
} from "@/components/ui/select"
import { 
    Archive,
    Building2, 
    User, 
    Phone, 
    Mail, 
    PlusCircle, 
    Calendar, 
    ArrowRight, 
    MapPin, 
    Hash, 
    RefreshCw, 
    Loader2,
    FileText} from "lucide-react";
import profileService, { type ProfileRecord } from "@/services/profile.service";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ScrapModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedTools: any[];
    storeId?: string;
}

export function ScrapModal({ open, onOpenChange, selectedTools, storeId }: ScrapModalProps) {
    const navigate = useNavigate();
    const [scrapDealers, setScrapDealers] = useState<ProfileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
    const [selectedDealerDetails, setSelectedDealerDetails] = useState<ProfileRecord | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Form inputs for Challan Date, Delivery Date, Remarks, Notes
    const [challanDate, setChallanDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [scrapReason, setScrapReason] = useState("");
    const [notes, setNotes] = useState("");

    // Quick Add Scrap Dealer state
    const [isCreatingDealer, setIsCreatingDealer] = useState(false);
    const [newDealer, setNewDealer] = useState({
        name: "",
        code: "",
        address: "",
        contactPerson: "",
        contactPhone: "",
        gstNumber: "",
        licenseNumber: ""
    });
    const [creatingError, setCreatingError] = useState("");

    const fetchScrapDealers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await profileService.getProfiles({ profileType: 'ScrapDealer', limit: 1000 });
            const list = res.data || [];
            setScrapDealers(list);
            if (list.length > 0) {
                handleDealerChange(list[0]._id, list);
            } else {
                setSelectedDealerId(null);
                setSelectedDealerDetails(null);
            }
        } catch (err) {
            console.error("Error fetching scrap dealers:", err);
            toast.error("Failed to fetch Scrap Dealer profiles from database");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDealerChange = async (id: string, dealerList?: ProfileRecord[]) => {
        setSelectedDealerId(id);
        const sourceList = dealerList || scrapDealers;
        const found = sourceList.find(d => d._id === id);
        if (found) {
            setSelectedDealerDetails(found);
        }
        try {
            setDetailsLoading(true);
            const res = await profileService.getProfileById(id);
            if (res.data) {
                setSelectedDealerDetails(res.data);
            }
        } catch (err) {
            console.error("Error fetching dealer details:", err);
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchScrapDealers();
        }
    }, [open, fetchScrapDealers]);

    const handleQuickAddDealer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDealer.name) {
            setCreatingError("Scrap Dealer Firm Name is required");
            return;
        }
        try {
            setCreatingError("");
            const res = await profileService.createProfile({
                ...newDealer,
                profileType: 'ScrapDealer'
            });
            const updatedList = [res.data, ...scrapDealers];
            setScrapDealers(updatedList);
            handleDealerChange(res.data._id, updatedList);
            setIsCreatingDealer(false);
            setNewDealer({ name: "", code: "", address: "", contactPerson: "", contactPhone: "", gstNumber: "", licenseNumber: "" });
            toast.success("Scrap Dealer profile created and selected");
        } catch (err: any) {
            setCreatingError(err.message || "Failed to create scrap dealer profile");
        }
    };

    const handleProceedToScrapDC = () => {
        if (!selectedDealerDetails) {
            toast.error("Please select a destination Scrap Dealer profile first");
            return;
        }
        if (selectedTools.length === 0) {
            toast.error("Please select at least one tool to scrap");
            return;
        }

        onOpenChange(false);
        const mappedVendorObj = {
            _id: selectedDealerDetails._id,
            name: selectedDealerDetails.name,
            vendorCode: selectedDealerDetails.code,
            code: selectedDealerDetails.code,
            address: selectedDealerDetails.address || "",
            gstNumber: selectedDealerDetails.gstNumber || "",
            licenseNumber: selectedDealerDetails.licenseNumber || "",
            contactPerson: selectedDealerDetails.contactPerson || "",
            contactPhone: selectedDealerDetails.contactPhone || "",
            profileType: 'ScrapDealer'
        };

        navigate("/challans/delivery/preview", {
            state: {
                selectedTools,
                vendor: mappedVendorObj,
                isScrapDC: true,
                storeId,
                challanDate,
                deliveryDate,
                remarks: scrapReason || `Scrap Transfer & Disposal to ${selectedDealerDetails.name}`,
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
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <Archive className="size-5" />
                                Transfer Selected Tools to Scrap
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                Select Scrap Dealer and generate a Delivery Challan for <span className="font-bold text-foreground">{selectedTools.length} selected tool(s)</span>.
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs flex items-center gap-1.5 border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            onClick={() => setIsCreatingDealer(!isCreatingDealer)}
                        >
                            <PlusCircle className="size-3.5" />
                            {isCreatingDealer ? "Cancel Quick Add" : "Add Scrap Dealer"}
                        </Button>
                    </div>
                </DialogHeader>

                {isCreatingDealer && (
                    <form onSubmit={handleQuickAddDealer} className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 space-y-3 my-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <PlusCircle className="size-4 text-amber-600" /> Quick Add New Scrap Dealer
                        </h4>
                        {creatingError && <p className="text-xs text-rose-500 font-medium">{creatingError}</p>}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Firm / Dealer Name *</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 bg-background"
                                    placeholder="e.g. SHREE METALS SCRAP DEALERS"
                                    value={newDealer.name}
                                    onChange={e => setNewDealer({ ...newDealer, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Dealer Code</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 font-mono uppercase bg-background"
                                    placeholder="e.g. SCR-0001"
                                    value={newDealer.code}
                                    onChange={e => setNewDealer({ ...newDealer, code: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Scrap License No.</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 font-mono bg-background"
                                    placeholder="e.g. PCB/SCRAP/2026/0892"
                                    value={newDealer.licenseNumber}
                                    onChange={e => setNewDealer({ ...newDealer, licenseNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">GST Number</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 font-mono bg-background"
                                    placeholder="27AAACS1234P1Z5"
                                    value={newDealer.gstNumber}
                                    onChange={e => setNewDealer({ ...newDealer, gstNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Contact Person</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 bg-background"
                                    placeholder="e.g. Ramesh Patel"
                                    value={newDealer.contactPerson}
                                    onChange={e => setNewDealer({ ...newDealer, contactPerson: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Phone Number</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 bg-background"
                                    placeholder="e.g. 9820012345"
                                    value={newDealer.contactPhone}
                                    onChange={e => setNewDealer({ ...newDealer, contactPhone: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label className="text-xs">Yard / Address</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 bg-background"
                                    placeholder="Enter scrap yard address"
                                    value={newDealer.address}
                                    onChange={e => setNewDealer({ ...newDealer, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsCreatingDealer(false)}>Cancel</Button>
                            <Button type="submit" size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">Save Scrap Dealer</Button>
                        </div>
                    </form>
                )}

                {/* Scrap Dealer Selection */}
                <div className="space-y-3 my-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-amber-600 dark:text-amber-400" />
                            Select Destination Scrap Dealer (Dynamic from Profile Management) *
                        </Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => fetchScrapDealers()}
                        >
                            <RefreshCw className="size-3 mr-1" />
                            Refresh List
                        </Button>
                    </div>

                    {loading ? (
                        <div className="h-10 rounded-xl border border-dashed flex items-center justify-center text-xs text-muted-foreground gap-2 bg-muted/20">
                            <Loader2 className="size-4 animate-spin text-amber-600" />
                            Fetching Scrap Dealer profiles from database...
                        </div>
                    ) : scrapDealers.length === 0 ? (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-xs space-y-2">
                            <p className="font-semibold text-amber-700 dark:text-amber-400">No Scrap Dealer profiles found in database.</p>
                            <p className="text-muted-foreground">Click "Add Scrap Dealer" above or register Scrap Dealer profiles in Profile Management.</p>
                        </div>
                    ) : (
                        <Select value={selectedDealerId || ""} onValueChange={(val: any) => handleDealerChange(val)}>
                            <SelectTrigger className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-xs cursor-pointer">
                                <SelectValue placeholder={`-- Select Scrap Dealer (${scrapDealers.length} Available) --`} />
                            </SelectTrigger>
                            <SelectContent>
                                {scrapDealers.map(d => (
                                    <SelectItem key={d._id} value={d._id}>
                                        {d.name} ({d.code}){d.licenseNumber ? ` - Lic: ${d.licenseNumber}` : d.gstNumber ? ` - GST: ${d.gstNumber}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Dealer Details Card */}
                    {selectedDealerDetails ? (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3 transition-all animate-in fade-in-50 duration-200">
                            <div className="flex items-start justify-between border-b border-amber-500/20 pb-2.5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                                            {selectedDealerDetails.name}
                                        </h4>
                                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                                            {selectedDealerDetails.code}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold">
                                            {selectedDealerDetails.status || "Active"}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground mt-1">
                                        {selectedDealerDetails.licenseNumber && (
                                            <span className="flex items-center gap-1">
                                                <FileText className="size-3 text-amber-600" />
                                                Lic: <strong className="text-foreground">{selectedDealerDetails.licenseNumber}</strong>
                                            </span>
                                        )}
                                        {selectedDealerDetails.gstNumber && (
                                            <span className="flex items-center gap-1">
                                                <Hash className="size-3 text-amber-600" />
                                                GST: <strong className="text-foreground">{selectedDealerDetails.gstNumber}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {detailsLoading && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Loader2 className="size-3.5 animate-spin text-amber-600" />
                                        Updating...
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="size-3.5 text-amber-600 shrink-0" />
                                    <span>Contact: <strong className="text-foreground">{selectedDealerDetails.contactPerson || "Not Specified"}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="size-3.5 text-amber-600 shrink-0" />
                                    <span>Phone: <strong className="text-foreground font-mono">{selectedDealerDetails.contactPhone || "N/A"}</strong></span>
                                </div>
                                {selectedDealerDetails.contactEmail && (
                                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                        <Mail className="size-3.5 text-amber-600 shrink-0" />
                                        <span>Email: <strong className="text-foreground">{selectedDealerDetails.contactEmail}</strong></span>
                                    </div>
                                )}
                                <div className="flex items-start gap-2 text-muted-foreground col-span-2">
                                    <MapPin className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                                    <span>Yard Address: <strong className="text-foreground">{selectedDealerDetails.address || "No address on file"}</strong></span>
                                </div>
                            </div>
                        </div>
                    ) : !loading && scrapDealers.length > 0 && (
                        <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                            Please select a Scrap Dealer profile from the dropdown.
                        </div>
                    )}
                </div>

                {/* Review Selected Tools */}
                <div className="space-y-2 mt-2">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <FileText className="size-3.5 text-primary" />
                        Selected Tools for Scrap Transfer ({selectedTools.length})
                    </Label>
                    <div className="max-h-36 overflow-y-auto border border-border/60 rounded-xl bg-background p-2 divide-y divide-border/40">
                        {selectedTools.map(t => (
                            <div key={t._id} className="py-1.5 px-2 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-mono font-bold text-foreground mr-2">{t.toolId || t.toolCode || t._id}</span>
                                    <span className="text-muted-foreground">{t.description || "Tool"}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                                    {t.toolType || "Tool"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dispatch & Scrap Metadata */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                        <Label className="text-xs flex items-center gap-1.5 mb-1.5">
                            <Calendar className="size-3.5 text-amber-600" /> Challan Date *
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
                            <Calendar className="size-3.5 text-amber-600" /> Expected Disposal Date
                        </Label>
                        <Input
                            type="date"
                            className="h-9 text-sm"
                            value={deliveryDate}
                            onChange={e => setDeliveryDate(e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Label className="text-xs mb-1.5 block">Scrap Reason / Dispatch Instructions</Label>
                        <Textarea
                            placeholder="e.g. End-of-life wear & tear, unserviceable. Transferred for scrap metal disposal."
                            className="text-xs min-h-[55px]"
                            value={scrapReason}
                            onChange={e => setScrapReason(e.target.value)}
                        />
                    </div>

                    <div className="col-span-2">
                        <Label className="text-xs mb-1.5 block">Internal Reference Notes (Optional)</Label>
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
                        Selected: <strong className="text-foreground font-mono">{selectedTools.length}</strong> tool(s) to scrap
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
                            disabled={!selectedDealerDetails || selectedTools.length === 0}
                            onClick={handleProceedToScrapDC}
                            className="bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1.5 shadow-md h-9 px-4 cursor-pointer font-semibold text-xs"
                        >
                            <span>Create Scrap DC ({selectedTools.length} Tools)</span>
                            <ArrowRight className="size-4" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ScrapModal;
