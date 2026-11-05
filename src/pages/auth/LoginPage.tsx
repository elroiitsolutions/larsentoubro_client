import { LoginForm } from "@/components/login-form"
import logoUrl from "@/assets/logo.png"

const BG_VIDEO_URL = "/login-bg.mp4"

export function LoginPage() {
    return (
        <div className="h-full w-full relative bg-slate-950 overflow-y-auto overflow-x-hidden flex flex-col select-none">
            {/* FIXED BACKGROUND VIDEO LAYER - CLEAN, DIRECT VIDEO PLAYBACK WITHOUT ANY BLACK OVERLAY SCREEN */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    controls={false}
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src={BG_VIDEO_URL} type="video/mp4" />
                </video>
            </div>

            {/* TOP-LEFT CORNER LOGO */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20 flex items-center gap-2.5">
                <div className="size-8 sm:size-9 rounded-lg bg-white/95 shadow-lg border border-white/50 p-1 flex items-center justify-center backdrop-blur-md">
                    <img src={logoUrl} alt="L&T Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-black tracking-wider text-white uppercase leading-none drop-shadow-md">
                        Larsen &amp; Toubro
                    </span>
                    <span className="text-[9px] font-semibold text-slate-200 uppercase tracking-widest mt-0.5 drop-shadow-md">
                        Tools &amp; Equipment Portal
                    </span>
                </div>
            </div>

            {/* MAIN CONTENT: CENTERED IN BOTH X AND Y */}
            <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
                <div className="w-full max-w-[420px] my-auto py-16 sm:py-20 flex flex-col items-center justify-center">
                    {/* Centered Glassmorphic Login Card */}
                    <div className="w-full drop-shadow-2xl">
                        <LoginForm />
                    </div>

                    {/* Sub-footer */}
                    <div className="mt-6 text-center text-[11px] text-white font-medium leading-relaxed drop-shadow-md">
                        Protected by Enterprise Two-Factor Authentication<br />
                        &copy; {new Date().getFullYear()} Larsen &amp; Toubro Limited. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
