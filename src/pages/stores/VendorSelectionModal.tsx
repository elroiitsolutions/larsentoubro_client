import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
    Building2, 
    User, 
    Phone, 
    Mail, 
    PlusCircle, 
    Calendar as CalendarIcon, 
    ArrowRight, 
    MapPin, 
    Hash, 
    RefreshCw, 
    Loader2,
    X
} from "lucide-react";
import profileService, { type ProfileRecord } from "@/services/profile.service";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
    const [recipientType] = useState<"Subcontractor" | "ScrapDealer">("Subcontractor");
    const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [selectedProfileDetails, setSelectedProfileDetails] = useState<ProfileRecord | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Form inputs for Challan Date, Delivery Date, Remarks, Notes
    const [challanDate, setChallanDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [challanCalendarOpen, setChallanCalendarOpen] = useState(false);
    const [deliveryCalendarOpen, setDeliveryCalendarOpen] = useState(false);

    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return "-";
        try {
            const parts = dateStr.split("-");
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
            }
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        } catch {
            return dateStr;
        }
    };
    const [remarks, setRemarks] = useState("");
    const [notes, setNotes] = useState("");

    const handleDeliveryPresetClick = (type: "1week" | "1month" | "3months" | "6months") => {
        const base = challanDate ? new Date(challanDate + "T00:00:00") : new Date();
        const d = new Date(base);
        if (type === "1week") {
            d.setDate(d.getDate() + 7);
        } else if (type === "1month") {
            d.setMonth(d.getMonth() + 1);
        } else if (type === "3months") {
            d.setMonth(d.getMonth() + 3);
        } else if (type === "6months") {
            d.setMonth(d.getMonth() + 6);
        }

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        setDeliveryDate(`${year}-${month}-${day}`);
        setSelectedPreset(type);
    };

    // Quick Add Profile state
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [newProfile, setNewProfile] = useState({
        name: "",
        code: "",
        address: "",
        contactPerson: "",
        contactPhone: "",
        gstNumber: ""
    });
    const [creatingError, setCreatingError] = useState("");

    const fetchProfiles = useCallback(async () => {
        try {
            setLoading(true);
            const res = await profileService.getProfiles({ profileType: recipientType, limit: 1000 });
            const list = res.data || [];
            setProfiles(list);
            if (list.length > 0) {
                handleProfileChange(list[0]._id, list);
            } else {
                setSelectedProfileId(null);
                setSelectedProfileDetails(null);
            }
        } catch (err) {
            console.error("Error fetching profiles:", err);
            toast.error("Failed to fetch recipient profiles list from database");
        } finally {
            setLoading(false);
        }
    }, [recipientType]);

    const handleProfileChange = async (id: string, profileList?: ProfileRecord[]) => {
        setSelectedProfileId(id);
        const sourceList = profileList || profiles;
        const found = sourceList.find(p => p._id === id);
        if (found) {
            setSelectedProfileDetails(found);
        }
        try {
            setDetailsLoading(true);
            const res = await profileService.getProfileById(id);
            if (res.data) {
                setSelectedProfileDetails(res.data);
            }
        } catch (err) {
            console.error("Error fetching profile details:", err);
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setChallanCalendarOpen(false);
            setDeliveryCalendarOpen(false);
            fetchProfiles();
        }
    }, [open, fetchProfiles]);

    const handleQuickAddProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProfile.name) {
            setCreatingError("Name is required");
            return;
        }
        try {
            setCreatingError("");
            const res = await profileService.createProfile({
                ...newProfile,
                profileType: recipientType
            });
            const updatedList = [res.data, ...profiles];
            setProfiles(updatedList);
            handleProfileChange(res.data._id, updatedList);
            setIsCreatingProfile(false);
            setNewProfile({ name: "", code: "", address: "", contactPerson: "", contactPhone: "", gstNumber: "" });
            toast.success(`${recipientType === "Subcontractor" ? "Subcontractor" : "Scrap Dealer"} profile created and selected`);
        } catch (err: any) {
            setCreatingError(err.message || "Failed to create profile");
        }
    };

    const handleProceedToPreview = () => {
        if (!selectedProfileDetails) {
            toast.error("Please select a destination recipient profile first");
            return;
        }
        if (selectedTools.some((t: any) => t.status === "Moving")) {
            toast.error("Cannot create Delivery Challan: One or more selected tools are already Moving");
            return;
        }
        if (selectedTools.some((t: any) => t.status === "Missing")) {
            toast.error("Cannot create Delivery Challan: One or more selected tools are Missing");
            return;
        }
        if (selectedTools.some((t: any) => !t.isPrinted)) {
            return;
        }
        onOpenChange(false);
        const mappedVendorObj = {
            _id: selectedProfileDetails._id,
            name: selectedProfileDetails.name,
            vendorCode: selectedProfileDetails.code,
            code: selectedProfileDetails.code,
            address: selectedProfileDetails.address || "",
            gstNumber: selectedProfileDetails.gstNumber || "",
            contactPerson: selectedProfileDetails.contactPerson || "",
            contactPhone: selectedProfileDetails.contactPhone || ""
        };

        navigate("/challans/delivery/preview", {
            state: {
                selectedTools,
                vendor: mappedVendorObj,
                storeId,
                challanDate,
                deliveryDate,
                remarks: remarks || `Dispatched to ${recipientType === "ScrapDealer" ? "Scrap Dealer" : "Subcontractor"} ${selectedProfileDetails.name}`,
                notes
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideClose={true} className="max-w-2xl max-h-[90vh] flex flex-col p-0 rounded-xl overflow-hidden shadow-2xl">
                <DialogHeader className="px-5 py-3 border-b border-border/60 bg-muted/20 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                <Building2 className="size-4.5" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                                    Create Delivery Challan - Select Recipient
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                                    Choose destination Subcontractor or Scrap Dealer for <span className="font-semibold text-foreground">{selectedTools.length} selected tool(s)</span>.
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-semibold flex items-center gap-1.5 border-primary/20 hover:border-primary/50 shrink-0 h-7.5 px-3 rounded-lg cursor-pointer"
                                onClick={() => setIsCreatingProfile(!isCreatingProfile)}
                            >
                                <PlusCircle className="size-3.5 text-primary" />
                                {isCreatingProfile ? "Cancel New Profile" : `Add ${recipientType === "Subcontractor" ? "Subcontractor" : "Scrap Dealer"}`}
                            </Button>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
                                aria-label="Close modal"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {isCreatingProfile && (
                    <form onSubmit={handleQuickAddProfile} className="bg-muted/40 p-3 rounded-lg border border-border/70 space-y-2.5">
                        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <PlusCircle className="size-3.5 text-primary" /> Quick Add New {recipientType === "Subcontractor" ? "Subcontractor" : "Scrap Dealer"}
                        </h4>
                        {creatingError && <p className="text-[10px] text-rose-500 font-medium">{creatingError}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 block mb-1">Firm / Name *</Label>
                                <Input
                                    size={1}
                                    className="h-7.5 sm:h-8 text-xs rounded-lg px-2.5"
                                    placeholder="e.g. L&T Subcontractor / Metal Scrap"
                                    value={newProfile.name}
                                    onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 block mb-1">Profile Code</Label>
                                <Input
                                    size={1}
                                    className="h-7.5 sm:h-8 text-xs font-mono uppercase rounded-lg px-2.5"
                                    placeholder={recipientType === "Subcontractor" ? "e.g. SUB-0001" : "e.g. SCR-0001"}
                                    value={newProfile.code}
                                    onChange={e => setNewProfile({ ...newProfile, code: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 block mb-1">GST Number</Label>
                                <Input
                                    size={1}
                                    className="h-7.5 sm:h-8 text-xs font-mono rounded-lg px-2.5"
                                    placeholder="27AAACL0140P1Z0"
                                    value={newProfile.gstNumber}
                                    onChange={e => setNewProfile({ ...newProfile, gstNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-[11px] font-semibold text-foreground/90 block mb-1">Contact Person</Label>
                                <Input
                                    size={1}
                                    className="h-7.5 sm:h-8 text-xs rounded-lg px-2.5"
                                    placeholder="e.g. Rajesh Kumar"
                                    value={newProfile.contactPerson}
                                    onChange={e => setNewProfile({ ...newProfile, contactPerson: e.target.value })}
                                />
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <Label className="text-[11px] font-semibold text-foreground/90 block mb-1">Address</Label>
                                <Input
                                    size={1}
                                    className="h-7.5 sm:h-8 text-xs rounded-lg px-2.5"
                                    placeholder="Site / Office Address"
                                    value={newProfile.address}
                                    onChange={e => setNewProfile({ ...newProfile, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={() => setIsCreatingProfile(false)}>Cancel</Button>
                            <Button type="submit" size="sm" className="h-7 text-xs rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">Save Profile</Button>
                        </div>
                    </form>
                )}

                {/* Profile Dropdown Selection */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Label className="text-[11px] font-semibold text-foreground/90 flex items-center gap-1.5 truncate">
                            <Building2 className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="truncate">Select Destination {recipientType === "Subcontractor" ? "Subcontractor" : "Scrap Dealer"} *</span>
                        </Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground shrink-0 rounded-md cursor-pointer"
                            onClick={() => fetchProfiles()}
                        >
                            <RefreshCw className="size-2.5 mr-1" />
                            Refresh List
                        </Button>
                    </div>

                    {loading ? (
                        <div className="h-8 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground gap-2 bg-muted/20">
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                            Fetching {recipientType} profiles from database...
                        </div>
                    ) : (
                        <Select value={selectedProfileId || ""} onValueChange={(val: any) => handleProfileChange(val)}>
                            <SelectTrigger className="h-7.5 sm:h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-2xs cursor-pointer truncate">
                                <SelectValue placeholder={`-- Select ${recipientType === "Subcontractor" ? "Subcontractor" : "Scrap Dealer"} (${profiles.length} Available) --`}>
                                    {(val: any) => {
                                        if (!val) return null;
                                        const p = profiles.find(item => item._id === val) || (selectedProfileDetails?._id === val ? selectedProfileDetails : null);
                                        return p 
                                            ? `${p.name} (${p.code})${p.gstNumber ? ` - GST: ${p.gstNumber}` : ""}`
                                            : val;
                                    }}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {profiles.map(p => (
                                    <SelectItem key={p._id} value={p._id} className="text-xs">
                                        {p.name} ({p.code}){p.gstNumber ? ` - GST: ${p.gstNumber}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Recipient Details Display */}
                    {selectedProfileDetails ? (
                        <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 space-y-2 transition-all">
                            <div className="flex items-start justify-between border-b border-indigo-500/15 pb-2">
                                <div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                                            {selectedProfileDetails.name}
                                        </h4>
                                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
                                            {selectedProfileDetails.code}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold">
                                            {selectedProfileDetails.status || "Active"}
                                        </span>
                                    </div>
                                    {selectedProfileDetails.gstNumber && (
                                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1">
                                            <Hash className="size-3 text-indigo-600" />
                                            GST: <strong className="text-foreground">{selectedProfileDetails.gstNumber}</strong>
                                        </p>
                                    )}
                                </div>
                                {detailsLoading && (
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                                        <Loader2 className="size-3 animate-spin text-primary" />
                                        Updating...
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <User className="size-3 text-indigo-600 shrink-0" />
                                    <span>Contact: <strong className="text-foreground">{selectedProfileDetails.contactPerson || "Not Specified"}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Phone className="size-3 text-indigo-600 shrink-0" />
                                    <span>Phone: <strong className="text-foreground font-mono">{selectedProfileDetails.contactPhone || "N/A"}</strong></span>
                                </div>
                                {selectedProfileDetails.contactEmail && (
                                    <div className="flex items-center gap-1.5 text-muted-foreground col-span-1 sm:col-span-2">
                                        <Mail className="size-3 text-indigo-600 shrink-0" />
                                        <span>Email: <strong className="text-foreground">{selectedProfileDetails.contactEmail}</strong></span>
                                    </div>
                                )}
                                <div className="flex items-start gap-1.5 text-muted-foreground col-span-1 sm:col-span-2">
                                    <MapPin className="size-3 text-indigo-600 shrink-0 mt-0.5" />
                                    <span>Address: <strong className="text-foreground">{selectedProfileDetails.address || "No address on file"}</strong></span>
                                </div>
                            </div>
                        </div>
                    ) : !loading && (
                        <div className="rounded-lg border border-dashed p-3 sm:p-4 text-center text-xs text-muted-foreground">
                            Please select a recipient profile from the dropdown above to view details.
                        </div>
                    )}
                </div>

                {/* Dispatch / Challan Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                        <Label className="text-[11px] font-semibold text-foreground/90 flex items-center gap-1.5 mb-1">
                            <CalendarIcon className="size-3.5 text-indigo-600 shrink-0" /> Challan Date *
                        </Label>
                        <Popover open={challanCalendarOpen} onOpenChange={setChallanCalendarOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setChallanCalendarOpen(prev => !prev)}
                                    className="h-7.5 sm:h-8 px-2.5 text-xs w-full rounded-lg border border-input bg-background flex items-center justify-between font-mono hover:bg-muted/30 focus:ring-2 focus:ring-indigo-500/30 shadow-2xs outline-none transition-all cursor-pointer text-left"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <CalendarIcon className="size-3 text-muted-foreground shrink-0" />
                                        <span>{challanDate ? formatDateDisplay(challanDate) : "Select challan date"}</span>
                                    </div>
                                    <span className="text-[10px] text-indigo-600 font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10">
                                        {challanCalendarOpen ? "Close" : "Change"}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border border-border/80 shadow-2xl rounded-xl overflow-hidden bg-background" align="start">
                                <Calendar
                                    selected={challanDate}
                                    onSelect={(_d, dateStr) => {
                                        setChallanDate(dateStr);
                                        setChallanCalendarOpen(false);
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                        <Label className="text-[11px] font-semibold text-foreground/90 flex items-center gap-1.5 mb-1">
                            <CalendarIcon className="size-3.5 text-indigo-600 shrink-0" /> Expected Delivery Date
                        </Label>
                        <Popover open={deliveryCalendarOpen} onOpenChange={setDeliveryCalendarOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setDeliveryCalendarOpen(prev => !prev)}
                                    className="h-7.5 sm:h-8 px-2.5 text-xs w-full rounded-lg border border-input bg-background flex items-center justify-between font-mono hover:bg-muted/30 focus:ring-2 focus:ring-indigo-500/30 shadow-2xs outline-none transition-all cursor-pointer text-left"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <CalendarIcon className="size-3 text-muted-foreground shrink-0" />
                                        <span>{deliveryDate ? formatDateDisplay(deliveryDate) : "Select return date"}</span>
                                    </div>
                                    <span className="text-[10px] text-indigo-600 font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10">
                                        {deliveryCalendarOpen ? "Close" : "Change"}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border border-border/80 shadow-2xl rounded-xl overflow-hidden bg-background" align="start">
                                <Calendar
                                    selected={deliveryDate}
                                    minDate={challanDate || undefined}
                                    onSelect={(_d, dateStr) => {
                                        setDeliveryDate(dateStr);
                                        setSelectedPreset(null);
                                        setDeliveryCalendarOpen(false);
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {[
                                { label: "1 week", value: "1week" as const },
                                { label: "1 month", value: "1month" as const },
                                { label: "3 months", value: "3months" as const },
                                { label: "6 months", value: "6months" as const },
                            ].map(preset => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => handleDeliveryPresetClick(preset.value)}
                                    className={`px-2 py-0.5 text-[10px] font-medium rounded-md border transition-all cursor-pointer ${
                                        selectedPreset === preset.value
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold"
                                            : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border/80"
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                        <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Remarks / Dispatch Instructions</Label>
                        <Textarea
                            placeholder="e.g. Dispatch for site work or scrap disposal"
                            className="text-xs min-h-[48px] rounded-lg p-2"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                        />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                        <Label className="text-[11px] font-semibold text-foreground/90 mb-1 block">Internal Notes (Optional)</Label>
                        <Textarea
                            placeholder="Additional internal reference notes..."
                            className="text-xs min-h-[48px] rounded-lg p-2"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                </div>
                </div>

                <div className="px-5 py-3 border-t border-border/60 bg-muted/30 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-[11px] text-muted-foreground text-center sm:text-left">
                        Selected: <strong className="text-foreground font-mono">{selectedTools.length}</strong> tool(s) for DC
                    </div>
                    <div className="flex items-center justify-end gap-2.5">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="h-8 rounded-lg px-4 text-xs font-semibold hover:bg-muted/60 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <TooltipProvider delay={100}>
                            <Tooltip>
                                <TooltipTrigger>
                                    <span
                                        className="inline-block"
                                        title={
                                            !selectedProfileDetails
                                                ? "Please select a destination recipient profile first"
                                                : selectedTools.some((t: any) => !t.isPrinted)
                                                    ? "Disabled: All selected tools must be marked as Printed before creating a Delivery Challan"
                                                    : `Proceed to Preview with ${selectedTools.length} tools`
                                        }
                                    >
                                        <Button
                                            disabled={!selectedProfileDetails || selectedTools.length === 0 || selectedTools.some((t: any) => !t.isPrinted)}
                                            onClick={handleProceedToPreview}
                                            className="h-8 rounded-lg px-4.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <span>Proceed to Preview ({selectedTools.length} Tools)</span>
                                            <ArrowRight className="size-3.5" />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {(!selectedProfileDetails || selectedTools.some((t: any) => !t.isPrinted)) && (
                                    <TooltipContent side="top" className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl max-w-xs text-center z-[100]">
                                        {!selectedProfileDetails
                                            ? "Please select a destination recipient profile first"
                                            : "Disabled: All selected tools must be marked as Printed before creating a Delivery Challan"}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default VendorSelectionModal;
