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
    Loader2
} from "lucide-react";
import profileService, { type ProfileRecord, type ProfileType } from "@/services/profile.service";
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
    const [recipientType, setRecipientType] = useState<"Subcontractor" | "ScrapDealer">("Subcontractor");
    const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [selectedProfileDetails, setSelectedProfileDetails] = useState<ProfileRecord | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Form inputs for Challan Date, Delivery Date, Remarks, Notes
    const [challanDate, setChallanDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [remarks, setRemarks] = useState("");
    const [notes, setNotes] = useState("");

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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Building2 className="size-5 text-primary" />
                                Create Delivery Challan - Select Recipient
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground mt-1">
                                Choose the destination Subcontractor or Scrap Dealer for <span className="font-semibold text-foreground">{selectedTools.length} selected tool(s)</span>.
                            </DialogDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs flex items-center gap-1.5 border-primary/20 hover:border-primary/50"
                            onClick={() => setIsCreatingProfile(!isCreatingProfile)}
                        >
                            <PlusCircle className="size-3.5 text-primary" />
                            {isCreatingProfile ? "Cancel New Profile" : `Add ${recipientType === "Subcontractor" ? "Subcontractor" : "Scrap Dealer"}`}
                        </Button>
                    </div>
                </DialogHeader>

                {/* Recipient Type Switcher (Subcontractor vs Scrap Dealer) */}
                <div className="flex items-center gap-2 bg-muted p-1 rounded-xl my-2">
                    <button
                        type="button"
                        onClick={() => setRecipientType("Subcontractor")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            recipientType === "Subcontractor"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Building2 className="size-3.5 text-blue-500" />
                        <span>Subcontractor (Vendor)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecipientType("ScrapDealer")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            recipientType === "ScrapDealer"
                                ? "bg-background text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Building2 className="size-3.5 text-amber-500" />
                        <span>Scrap Dealer</span>
                    </button>
                </div>

                {isCreatingProfile && (
                    <form onSubmit={handleQuickAddProfile} className="bg-muted/40 p-4 rounded-xl border border-border/80 space-y-3 my-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <PlusCircle className="size-4 text-primary" /> Quick Add New {recipientType === "Subcontractor" ? "Subcontractor" : "Scrap Dealer"}
                        </h4>
                        {creatingError && <p className="text-xs text-rose-500 font-medium">{creatingError}</p>}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Firm / Name *</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1"
                                    placeholder="e.g. L&T Subcontractor / Metal Scrap"
                                    value={newProfile.name}
                                    onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Profile Code</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 font-mono uppercase"
                                    placeholder={recipientType === "Subcontractor" ? "e.g. SUB-0001" : "e.g. SCR-0001"}
                                    value={newProfile.code}
                                    onChange={e => setNewProfile({ ...newProfile, code: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">GST Number</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1 font-mono"
                                    placeholder="27AAACL0140P1Z0"
                                    value={newProfile.gstNumber}
                                    onChange={e => setNewProfile({ ...newProfile, gstNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Contact Person</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1"
                                    placeholder="e.g. Rajesh Kumar"
                                    value={newProfile.contactPerson}
                                    onChange={e => setNewProfile({ ...newProfile, contactPerson: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label className="text-xs">Address</Label>
                                <Input
                                    size={1}
                                    className="h-8 text-xs mt-1"
                                    placeholder="Site / Office Address"
                                    value={newProfile.address}
                                    onChange={e => setNewProfile({ ...newProfile, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsCreatingProfile(false)}>Cancel</Button>
                            <Button type="submit" size="sm" className="h-7 text-xs">Save Profile</Button>
                        </div>
                    </form>
                )}

                {/* Profile Dropdown Selection */}
                <div className="space-y-3 my-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-primary" />
                            Select Destination {recipientType === "Subcontractor" ? "Subcontractor" : "Scrap Dealer"} *
                        </Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => fetchProfiles()}
                        >
                            <RefreshCw className="size-3 mr-1" />
                            Refresh List
                        </Button>
                    </div>

                    {loading ? (
                        <div className="h-10 rounded-xl border border-dashed flex items-center justify-center text-xs text-muted-foreground gap-2 bg-muted/20">
                            <Loader2 className="size-4 animate-spin text-primary" />
                            Fetching {recipientType} profiles from database...
                        </div>
                    ) : (
                        <Select value={selectedProfileId || ""} onValueChange={(val: any) => handleProfileChange(val)}>
                            <SelectTrigger className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-all shadow-xs cursor-pointer">
                                <SelectValue placeholder={`-- Select ${recipientType === "Subcontractor" ? "Subcontractor" : "Scrap Dealer"} (${profiles.length} Available) --`} />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => (
                                    <SelectItem key={p._id} value={p._id}>
                                        {p.name} ({p.code}){p.gstNumber ? ` - GST: ${p.gstNumber}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Recipient Details Display */}
                    {selectedProfileDetails ? (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 transition-all animate-in fade-in-50 duration-200">
                            <div className="flex items-start justify-between border-b border-primary/15 pb-2.5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-base text-foreground flex items-center gap-1.5">
                                            {selectedProfileDetails.name}
                                        </h4>
                                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-primary/20 text-primary font-bold">
                                            {selectedProfileDetails.code}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold">
                                            {selectedProfileDetails.status || "Active"}
                                        </span>
                                    </div>
                                    {selectedProfileDetails.gstNumber && (
                                        <p className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1">
                                            <Hash className="size-3 text-primary" />
                                            GST: <strong className="text-foreground">{selectedProfileDetails.gstNumber}</strong>
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
                                    <span>Contact: <strong className="text-foreground">{selectedProfileDetails.contactPerson || "Not Specified"}</strong></span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="size-3.5 text-primary shrink-0" />
                                    <span>Phone: <strong className="text-foreground font-mono">{selectedProfileDetails.contactPhone || "N/A"}</strong></span>
                                </div>
                                {selectedProfileDetails.contactEmail && (
                                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                        <Mail className="size-3.5 text-primary shrink-0" />
                                        <span>Email: <strong className="text-foreground">{selectedProfileDetails.contactEmail}</strong></span>
                                    </div>
                                )}
                                <div className="flex items-start gap-2 text-muted-foreground col-span-2">
                                    <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                                    <span>Address: <strong className="text-foreground">{selectedProfileDetails.address || "No address on file"}</strong></span>
                                </div>
                            </div>
                        </div>
                    ) : !loading && (
                        <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                            Please select a recipient profile from the dropdown above to view details.
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
                            placeholder="e.g. Dispatch for site work or scrap disposal"
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
                            disabled={!selectedProfileDetails || selectedTools.length === 0}
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

export default VendorSelectionModal;
