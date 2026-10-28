import * as React from "react"
import authService from "@/services/auth.service"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Mail, KeyRound, ArrowRight, ArrowLeft, RotateCw, ShieldCheck } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = useAuth()

  // Steps: 'email' (Step 1) | 'otp' (Step 2)
  const [step, setStep] = React.useState<"email" | "otp">("email")
  const [email, setEmail] = React.useState("gdking00724@gmail.com")
  const [otp, setOtp] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [resending, setResending] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)
  const [_devOtpHint, setDevOtpHint] = React.useState<string | null>(null)

  // Resend countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Step 1: Request OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setError("Please enter your registered email address.")
      return
    }

    setLoading(true)
    try {
      const res = await authService.requestOtp(normalizedEmail)
      if (res.success) {
        toast.success(res.message || "Verification code sent to your email!")
        setStep("otp")
        setOtp("")
        setCooldown(res.resendCooldown || 60)
        if (res.devOtp) {
          setDevOtpHint(res.devOtp)
        }
      } else {
        throw new Error(res.message || "Failed to send verification code")
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Failed to send verification code"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return
    setError(null)
    setResending(true)

    try {
      const res = await authService.requestOtp(email.trim().toLowerCase())
      if (res.success) {
        toast.success("New verification code sent to your email!")
        setCooldown(res.resendCooldown || 60)
        setOtp("")
        if (res.devOtp) {
          setDevOtpHint(res.devOtp)
        }
      } else {
        throw new Error(res.message || "Failed to resend verification code")
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Failed to resend code"
      setError(message)
    } finally {
      setResending(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanOtp = otp.trim()
    if (cleanOtp.length !== 6) {
      setError("Please enter the full 6-digit verification code.")
      return
    }

    setLoading(true)
    try {
      const data = await authService.verifyOtp(email.trim().toLowerCase(), cleanOtp)
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || "Invalid verification code")
      }

      toast.success("Authentication successful! Welcome.")
      login(data.token, data.user)
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Invalid or expired verification code"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Guest Login handler
  const handleGuestLogin = async () => {
    setError(null)
    setLoading(true)

    try {
      const data = await authService.guestLogin()
      if (!data.success) {
        throw new Error(data.message || "Failed to log in as Guest")
      }
      toast.success("Logged in as Guest User!")
      login(data.token, data.user)
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Failed to log in as Guest"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] rounded-3xl bg-white overflow-hidden">
        <CardHeader className="space-y-1.5 pt-6 pb-2 px-6 sm:px-8">

          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {step === "email" ? "Sign in to your account" : "Enter Verification Code"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 leading-relaxed">
            {step === "email"
              ? "Enter your registered L&T company email to receive a single-use login code."
              : `We sent a 6-digit verification code to ${email}.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-7">
          {error && (
            <div className="mb-4 rounded-xl bg-destructive/15 border border-destructive/20 p-3 text-xs font-semibold text-destructive animate-in fade-in-0 duration-200">
              {error}
            </div>
          )}

          {step === "email" ? (
            /* STEP 1: EMAIL ENTRY FORM */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email" className="text-xs font-semibold text-slate-700">
                    Registered Email Address
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g. gdking00724@gmail.com"
                      required
                      autoFocus
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="h-12 rounded-xl bg-slate-50/70 text-sm pl-11 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                    <Mail className="absolute left-3.5 top-4 size-4 text-slate-400 pointer-events-none" />
                  </div>
                  {email !== "gdking00724@gmail.com" && (
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setEmail("gdking00724@gmail.com")}
                        className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer"
                      >
                        Use dev email: gdking00724@gmail.com
                      </button>
                    </div>
                  )}
                </Field>

                <Field className="pt-1">
                  <Button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full h-12 rounded-xl font-bold bg-[#0B2545] hover:bg-[#133E87] active:scale-[0.99] text-white shadow-md shadow-blue-950/20 transition-all hover:shadow-lg cursor-pointer text-sm gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RotateCw className="size-4 animate-spin" />
                        Sending verification code...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 w-full">
                        Continue with Email OTP
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </Button>

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative bg-white px-2 text-[10px] uppercase font-bold text-slate-400">
                      Or access as Guest
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100/90 font-bold border-emerald-300/80 cursor-pointer text-xs transition-colors"
                  >
                    Continue as Guest User
                  </Button>

                  <FieldDescription className="text-center mt-3 text-[11px] text-slate-400">
                    Access restricted to registered L&T personnel and authorized vendors.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT OTP VERIFICATION FORM */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <FieldGroup>
                <Field>
                  <div className="flex items-center justify-between mb-1">
                    <FieldLabel htmlFor="otp" className="text-xs font-semibold text-slate-700">
                      6-Digit Security Code
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email")
                        setError(null)
                        setDevOtpHint(null)
                      }}
                      className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="size-3" />
                      Change email
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="••••••"
                      required
                      autoFocus
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                        setOtp(val)
                      }}
                      disabled={loading}
                      className="h-16 text-center font-mono text-3xl font-extrabold tracking-[0.5em] rounded-2xl bg-slate-50/70 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-inner text-slate-900 transition-all"
                    />
                    <KeyRound className="absolute left-4 top-5.5 size-5 text-slate-400 pointer-events-none" />
                  </div>
                </Field>

                {/* {devOtpHint && (
                  <div
                    onClick={() => setOtp(devOtpHint)}
                    className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between cursor-pointer hover:bg-blue-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                      <span>Local Test OTP: <strong>{devOtpHint}</strong></span>
                    </div>
                    <span className="font-bold underline text-[11px] text-blue-700">Auto-fill</span>
                  </div>
                )} */}

                <Field className="pt-1">
                  <Button
                    type="submit"
                    disabled={loading || otp.trim().length !== 6}
                    className="w-full h-12 rounded-xl font-bold bg-[#0B2545] hover:bg-[#133E87] active:scale-[0.99] text-white shadow-md shadow-blue-950/20 transition-all hover:shadow-lg cursor-pointer text-sm gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RotateCw className="size-4 animate-spin" />
                        Verifying code...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 w-full">
                        Verify & Sign In
                        <ShieldCheck className="size-4" />
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
                    <span>Didn't receive the email?</span>
                    {cooldown > 0 ? (
                      <span className="font-semibold text-slate-500">
                        Resend in {cooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="font-bold text-blue-700 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {resending ? "Sending..." : "Resend Code"}
                      </button>
                    )}
                  </div>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
