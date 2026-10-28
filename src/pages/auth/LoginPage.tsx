import { LoginForm } from "@/components/login-form"
import logoUrl from "@/assets/logo.png"

export function LoginPage() {
    return (
        <div className="h-full w-full relative bg-white overflow-y-auto overflow-x-hidden flex flex-col">
            {/* FIXED BACKGROUND LAYER (Pins behind, ready for future background video) */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                {/* 
                  FUTURE VIDEO INTEGRATION:
                  When you are ready to add a background video:
                  1. Place your video in `client/public/videos/login-bg.mp4`
                  2. Uncomment the <video> block below:
                */}
                {/*
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-35"
                >
                    <source src="/videos/login-bg.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />
                */}

                {/* Subtle ambient modern grid & soft ambient glows */}
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-50/70 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-slate-100/90 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
            </div>

            {/* TOP-LEFT CORNER LOGO (Reduced size, neat corporate corner placement) */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-8 z-20 flex items-center gap-2.5">
                <div className="size-8 sm:size-9 rounded-lg bg-white shadow-sm border border-slate-200/90 p-1 flex items-center justify-center">
                    <img src={logoUrl} alt="L&T Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase leading-none">
                        Larsen &amp; Toubro
                    </span>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                        Tools &amp; Equipment Portal
                    </span>
                </div>
            </div>

            {/* MAIN CONTENT: CENTERED IN BOTH X AND Y */}
            <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
                <div className="w-full max-w-[420px] my-auto py-16 sm:py-20 flex flex-col items-center justify-center">
                    {/* Centered Login Card */}
                    <div className="w-full">
                        <LoginForm />
                    </div>

                    {/* Sub-footer */}
                    <div className="mt-6 text-center text-[11px] text-slate-400 font-medium leading-relaxed">
                        Protected by Enterprise Two-Factor Authentication<br />
                        &copy; {new Date().getFullYear()} Larsen &amp; Toubro Limited. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    )
}
