import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import toolService from "@/services/tool.service";
import jsqr from "jsqr";
import { toast } from "sonner";
import {
    QrCode,
    Camera,
    CameraOff,
    Upload,
    Search,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    LogOut,
    Building2,
    Store,
    Calendar,
    Tag,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ToolValidityData {
    toolId: string;
    description: string;
    project: string;
    store: string;
    expiryDate: string;
    validityStatus: 'VALID' | 'EXPIRED' | 'INVALID_EXPIRY';
    validityLabel: string;
    isValid: boolean;
    status: string;
}

export function QRScannerPage() {
    const { user, logout } = useAuth();
    const [isScanning, setIsScanning] = useState<boolean>(true);
    const [cameraActive, setCameraActive] = useState<boolean>(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

    const [manualCode, setManualCode] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    // Modal state
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [lookupResult, setLookupResult] = useState<ToolValidityData | null>(null);
    const [lookupError, setLookupError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);

    // Process a scanned or typed QR code string
    const processScannedCode = useCallback(async (code: string) => {
        if (!code || loading) return;
        setLoading(true);
        setLookupError(null);
        setLookupResult(null);

        // Temporarily pause camera scanning while processing result
        setIsScanning(false);

        try {
            const res = await toolService.lookupToolValidity(code);
            if (res.success && res.data) {
                setLookupResult(res.data);
                setModalOpen(true);
            } else {
                setLookupError(res.message || "Invalid QR code or Tool Not Found.");
                setModalOpen(true);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Invalid QR Code or Tool Not Found.";
            setLookupError(msg);
            setModalOpen(true);
        } finally {
            setLoading(false);
        }
    }, [loading]);

    // Live Video Frame Loop for QR detection using jsQR
    const scanFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !isScanning) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const context = canvas.getContext("2d");
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsqr(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert"
                });

                if (code && code.data) {
                    processScannedCode(code.data);
                    return;
                }
            }
        }

        if (isScanning) {
            animationFrameId.current = requestAnimationFrame(scanFrame);
        }
    }, [isScanning, processScannedCode]);

    // Start / Stop Camera Stream
    useEffect(() => {
        let currentStream: MediaStream | null = null;

        const startCamera = async () => {
            setCameraError(null);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode }
                });
                currentStream = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute("playsinline", "true");
                    await videoRef.current.play();
                    setCameraActive(true);
                }
            } catch (err: any) {
                console.error("Camera access error:", err);
                setCameraError("Camera access unavailable. You can use manual entry or file upload.");
                setCameraActive(false);
            }
        };

        if (isScanning && !modalOpen) {
            startCamera();
        } else {
            setCameraActive(false);
        }

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const s = videoRef.current.srcObject as MediaStream;
                s.getTracks().forEach(t => t.stop());
                videoRef.current.srcObject = null;
            }
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isScanning, facingMode, modalOpen]);

    // Trigger frame scanning loop once camera is active
    useEffect(() => {
        if (cameraActive && isScanning && !modalOpen) {
            animationFrameId.current = requestAnimationFrame(scanFrame);
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [cameraActive, isScanning, modalOpen, scanFrame]);

    // Handle image file upload for QR code decoding
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsqr(imageData.data, imageData.width, imageData.height);
                    if (code && code.data) {
                        processScannedCode(code.data);
                    } else {
                        toast.error("No valid QR code detected in the uploaded image.");
                    }
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCode.trim()) {
            toast.error("Please enter a Tool ID or QR Code.");
            return;
        }
        processScannedCode(manualCode.trim());
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setLookupResult(null);
        setLookupError(null);
        setIsScanning(true);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <QrCode className="size-5" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-tight text-white leading-tight">L&T Tool Validator</h1>
                        <p className="text-[11px] text-slate-400 font-medium">{user?.role === "Guest" ? "Guest User QR Scanner" : "QR Tool Validator & Scanner"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                        {user?.email || "Guest Session"}
                    </span>
                    {user?.role === "Guest" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={logout}
                            className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs rounded-lg cursor-pointer"
                        >
                            <LogOut className="size-3.5 mr-1.5" />
                            Logout
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col gap-5 justify-center">
                {/* Scanner Viewfinder Box */}
                <div className="relative aspect-square w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center">
                    <video
                        ref={videoRef}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                            cameraActive ? "opacity-100" : "opacity-0 absolute"
                        }`}
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Camera Off / Error Fallback */}
                    {!cameraActive && (
                        <div className="flex flex-col items-center justify-center p-6 text-center gap-3">
                            <div className="size-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-1">
                                {cameraError ? <CameraOff className="size-8 text-amber-400" /> : <Camera className="size-8 text-emerald-400" />}
                            </div>
                            <h3 className="text-base font-semibold text-slate-200">
                                {cameraError ? "Camera Unavailable" : "Camera Initializing..."}
                            </h3>
                            <p className="text-xs text-slate-400 max-w-xs">
                                {cameraError || "Point your camera at a tool QR code to scan and verify its validity status."}
                            </p>
                        </div>
                    )}

                    {/* Scanner Frame Overlay with Laser Beam Animation */}
                    {cameraActive && !modalOpen && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="relative size-64 border-2 border-emerald-500/60 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                                {/* Corners styling */}
                                <div className="absolute -top-1 -left-1 size-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                                <div className="absolute -top-1 -right-1 size-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                                <div className="absolute -bottom-1 -left-1 size-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                                <div className="absolute -bottom-1 -right-1 size-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                                {/* Laser Line */}
                                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse absolute top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    )}

                    {/* Loading Overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                            <Loader2 className="size-8 animate-spin text-emerald-400" />
                            <p className="text-xs font-semibold text-emerald-300">Fetching Tool Details...</p>
                        </div>
                    )}
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFacingMode(prev => (prev === "environment" ? "user" : "environment"))}
                        className="flex-1 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-xl py-5 cursor-pointer"
                    >
                        <RefreshCw className="size-4 mr-2 text-emerald-400" />
                        Flip Camera
                    </Button>

                    <label className="flex-1">
                        <span className="flex items-center justify-center w-full px-3 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl cursor-pointer transition-colors">
                            <Upload className="size-4 mr-2 text-emerald-400" />
                            Upload QR Image
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>

                {/* Manual Search Form */}
                <form onSubmit={handleManualSubmit} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Manual Tool ID / QR Search
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="e.g. T-0001 or QR link..."
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:border-emerald-500 focus:ring-emerald-500/20"
                        />
                        <Button
                            type="submit"
                            disabled={loading || !manualCode.trim()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 rounded-xl cursor-pointer font-bold"
                        >
                            <Search className="size-4 mr-1" />
                            Lookup
                        </Button>
                    </div>
                </form>
            </main>

            {/* Modal Popup Displaying Scanned Tool Details & Validity Indicator */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
                    onClick={handleCloseModal}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl p-6 relative animate-in zoom-in-95 duration-200 text-left space-y-4"
                    >
                        {/* Error Case: Tool Not Found or Invalid QR */}
                        {lookupError ? (
                            <div className="space-y-4 text-center py-2">
                                <div className="size-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                                    <XCircle className="size-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-extrabold text-rose-400">Tool Not Found</h3>
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                        {lookupError}
                                    </p>
                                </div>
                                <Button
                                    onClick={handleCloseModal}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer text-xs font-semibold"
                                >
                                    Scan Another QR Code
                                </Button>
                            </div>
                        ) : lookupResult ? (
                            /* Success Case: Tool Found - Display Indicator & Info */
                            <div className="space-y-4">
                                {/* Validity Status Indicator Banner */}
                                {lookupResult.validityStatus === 'VALID' ? (
                                    <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 text-emerald-300">
                                        <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="size-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-black tracking-wide text-emerald-400 uppercase">VALID</span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px] font-bold text-emerald-300">Tool Approved</span>
                                            </div>
                                            <p className="text-[11px] text-emerald-200/90 font-medium">
                                                Tool is within valid operational inspection period.
                                            </p>
                                        </div>
                                    </div>
                                ) : lookupResult.validityStatus === 'EXPIRED' ? (
                                    <div className="bg-rose-950/80 border border-rose-500/40 rounded-2xl p-4 flex items-center gap-3 text-rose-300">
                                        <div className="size-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                                            <XCircle className="size-6 text-rose-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-black tracking-wide text-rose-400 uppercase">EXPIRED</span>
                                                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-[10px] font-bold text-rose-300">Action Required</span>
                                            </div>
                                            <p className="text-[11px] text-rose-200/90 font-medium">
                                                Tool expiry date has passed. Re-inspection required.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-950/80 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-3 text-amber-300">
                                        <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="size-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-black tracking-wide text-amber-400 uppercase">NO EXPIRY DATE</span>
                                                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-[10px] font-bold text-amber-300">Unspecified</span>
                                            </div>
                                            <p className="text-[11px] text-amber-200/90 font-medium">
                                                Expiry date is missing or not configured for this tool.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Header & Tool Description */}
                                <div className="space-y-1">
                                    <h2 className="text-base font-black text-slate-100 leading-snug">
                                        {lookupResult.description}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px] font-bold">
                                            <Tag className="size-3 text-emerald-400" />
                                            {lookupResult.toolId}
                                        </span>
                                        <span className="text-xs text-slate-400 font-semibold">
                                            Status: <span className="text-slate-200">{lookupResult.status}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Detailed Fields Grid */}
                                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-3 text-xs">
                                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Building2 className="size-4 text-emerald-400" />
                                            <span className="font-semibold text-[11px]">Project</span>
                                        </div>
                                        <span className="font-bold text-slate-100">{lookupResult.project}</span>
                                    </div>

                                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Store className="size-4 text-emerald-400" />
                                            <span className="font-semibold text-[11px]">Store</span>
                                        </div>
                                        <span className="font-bold text-slate-100">{lookupResult.store}</span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar className="size-4 text-emerald-400" />
                                            <span className="font-semibold text-[11px]">Expiry Date</span>
                                        </div>
                                        <span className={`font-bold font-mono ${
                                            lookupResult.validityStatus === 'VALID'
                                                ? 'text-emerald-400'
                                                : lookupResult.validityStatus === 'EXPIRED'
                                                ? 'text-rose-400'
                                                : 'text-amber-400'
                                        }`}>
                                            {lookupResult.expiryDate}
                                        </span>
                                    </div>
                                </div>

                                {/* Modal Close / Next Scan Action Button */}
                                <Button
                                    onClick={handleCloseModal}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs"
                                >
                                    Scan Another QR Code
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}

export default QRScannerPage;
