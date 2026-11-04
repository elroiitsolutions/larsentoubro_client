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
import {
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  ShieldCheck,
  Phone,
  QrCode,
  CheckCircle2,
  Smartphone,
  AlertCircle
} from "lucide-react"
import { validateEmail } from "@/utils/validation"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = useAuth()

  // Steps: 'email' (Staff Step 1) | 'otp' (Staff Step 2) | 'guest-phone' (Guest Step 1) | 'guest-otp' (Guest Step 2)
  const [step, setStep] = React.useState<"email" | "otp" | "guest-phone" | "guest-otp">("email")
  const [email, setEmail] = React.useState("lntqr@gmail.com")
  const [phone, setPhone] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [resending, setResending] = React.useState(false)
  const [cooldown, setCooldown] = React.useState(0)
  const [devOtpHint, setDevOtpHint] = React.useState<string | null>(null)

  // Resend countdown timer
  React.useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // --- STAFF AUTH FLOW ---
  // Step 1: Request Email OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    const emailCheck = validateEmail(normalizedEmail)
    if (!emailCheck.isValid) {
      setError(emailCheck.error || "Email address must contain '@' and '.'.")
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
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err.message ||
        "Failed to send verification code"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Resend Staff Email OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    const emailCheck = validateEmail(normalizedEmail)
    if (!emailCheck.isValid) {
      const err = emailCheck.error || "Email address must contain '@' and '.'."
      setError(err)
      toast.error(err)
      return
    }

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
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err?.message ||
        "Failed to resend code"
      setError(message)
      toast.error(message)
    } finally {
      setResending(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const cleanOtp = otp.trim()
    if (!cleanOtp) {
      const message = "Please enter the 6-digit verification code."
      setError(message)
      toast.error(message)
      return
    }

    if (cleanOtp.length !== 6) {
      const message = "Please enter the full 6-digit verification code."
      setError(message)
      toast.error(message)
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
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err.message ||
        "Invalid or expired verification code"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // --- GUEST MOBILE SMS OTP FLOW ---
  // Switch to Guest Phone verification
  const handleStartGuestFlow = () => {
    setError(null)
    setOtp("")
    setDevOtpHint(null)
    setCooldown(0)
    setStep("guest-phone")
  }

  // Step 1 (Guest): Request SMS OTP
  const handleRequestGuestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const cleanDigits = phone.replace(/\D/g, "")
    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      setError("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).")
      return
    }

    setLoading(true)
    try {
      const res = await authService.requestGuestOtp(cleanDigits)
      if (res.success) {
        toast.success(res.message || "Verification code sent to your mobile!")
        setStep("guest-otp")
        setOtp("")
        setCooldown(res.resendCooldown || 60)
        if (res.devOtp) {
          setDevOtpHint(res.devOtp)
        }
      } else {
        throw new Error(res.message || "Failed to send SMS code")
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Failed to send SMS code"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Resend Guest SMS OTP
  const handleResendGuestOtp = async () => {
    if (cooldown > 0 || resending) return
    setError(null)
    setResending(true)

    try {
      const cleanDigits = phone.replace(/\D/g, "")
      const res = await authService.requestGuestOtp(cleanDigits)
      if (res.success) {
        toast.success("New verification code sent via SMS!")
        setCooldown(res.resendCooldown || 60)
        setOtp("")
        if (res.devOtp) {
          setDevOtpHint(res.devOtp)
        }
      } else {
        throw new Error(res.message || "Failed to resend SMS code")
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Failed to resend code"
      setError(message)
    } finally {
      setResending(false)
    }
  }

  // Step 2 (Guest): Verify SMS OTP
  const handleVerifyGuestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanOtp = otp.trim()
    if (cleanOtp.length !== 6) {
      setError("Please enter the full 6-digit verification code.")
      return
    }

    setLoading(true)
    try {
      const cleanDigits = phone.replace(/\D/g, "")
      const data = await authService.verifyGuestOtp(cleanDigits, cleanOtp)
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || "Invalid verification code")
      }

      toast.success("Guest verified! Opening equipment scanner...")
      login(data.token, data.user)
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.message ||
        err.message ||
        "Failed to log in as Guest"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.07)] rounded-3xl bg-white overflow-hidden">
        <CardHeader className="space-y-1.5 pt-6 pb-2 px-6 sm:px-8">
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {step === "email" && "Sign in to your account"}
            {step === "otp" && "Enter Verification Code"}
            {step === "guest-phone" && "Guest Scanner Verification"}
            {step === "guest-otp" && "Enter SMS Verification Code"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 leading-relaxed">
            {step === "email" && "Enter your registered L&T company email to receive a single-use login code."}
            {step === "otp" && `We sent a 6-digit verification code to ${email}.`}
            {step === "guest-phone" && "Enter your 10-digit mobile number to receive a verification code via SMS to access the equipment QR scanner."}
            {step === "guest-otp" && `We sent a 6-digit verification code via SMS to +91 ${phone.replace(/\D/g, "")}.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-7">
          {error && (
            <div className="mb-4 rounded-xl bg-destructive/15 border border-destructive/20 p-2 text-xs font-semibold text-destructive animate-in fade-in-0 duration-200">
              {error}
            </div>
          )}

          {/* STEP 1: STAFF EMAIL ENTRY FORM */}
          {step === "email" && (
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
                      placeholder="e.g. lntqr@gmail.com"
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
                    onClick={handleStartGuestFlow}
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100/90 font-bold border-emerald-300/80 cursor-pointer text-xs transition-colors gap-2"
                  >
                    <Smartphone className="size-4" />
                    Continue as Guest User (Mobile OTP)
                  </Button>

                  <FieldDescription className="text-center mt-3 text-[11px] text-slate-400">
                    Access restricted to registered L&T personnel and authorized guest inspectors.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          )}

          {/* STEP 2: STAFF EMAIL OTP VERIFICATION FORM */}
          {step === "otp" && (
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
                        setError(null)
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                        setOtp(val)
                      }}
                      disabled={loading}
                      className={cn(
                        "h-16 text-center font-mono text-3xl font-extrabold tracking-[0.5em] rounded-2xl bg-slate-50/70 border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 shadow-inner text-slate-900 transition-all",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                      )}
                    />
                    <KeyRound className="absolute left-4 top-5.5 size-5 text-slate-400 pointer-events-none" />
                  </div>

                  {error && (
                    <div className="mt-2.5 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 animate-in fade-in-0 duration-200">
                      <AlertCircle className="size-4 shrink-0 text-red-600" />
                      <span>{error}</span>
                    </div>
                  )}
                </Field>

                <Field className="pt-1">
                  <Button
                    type="submit"
                    disabled={loading}
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

          {/* STEP 3: GUEST MOBILE PHONE ENTRY FORM */}
          {step === "guest-phone" && (
            <form onSubmit={handleRequestGuestOtp} className="space-y-4">
              <FieldGroup>
                <Field>
                  <div className="flex items-center justify-between mb-1">
                    <FieldLabel htmlFor="phone" className="text-xs font-semibold text-slate-700">
                      Mobile Number
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email")
                        setError(null)
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="size-3" />
                      Back to Staff Login
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 text-slate-500 font-semibold text-xs border-r border-slate-300 pr-2.5 pointer-events-none">
                      <Phone className="size-3.5 text-slate-400" />
                      <span>+91</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      required
                      autoFocus
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10)
                        setPhone(val)
                      }}
                      disabled={loading}
                      className="h-12 rounded-xl bg-slate-50/70 text-sm pl-20 border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition-all font-medium text-slate-900 tracking-wider"
                    />
                  </div>
                  <FieldDescription className="text-[11px] text-slate-400 mt-1.5">
                    We'll send a 6-digit SMS verification code to this mobile number.
                  </FieldDescription>
                </Field>

                <Field className="pt-1">
                  <Button
                    type="submit"
                    disabled={loading || phone.replace(/\D/g, "").length !== 10}
                    className="w-full h-12 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white shadow-md shadow-emerald-950/20 transition-all hover:shadow-lg cursor-pointer text-sm gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RotateCw className="size-4 animate-spin" />
                        Sending verification code...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 w-full">
                        Send Verification Code via SMS
                        <ArrowRight className="size-4" />
                      </span>
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}

          {/* STEP 4: GUEST SMS OTP VERIFICATION FORM */}
          {step === "guest-otp" && (
            <form onSubmit={handleVerifyGuestOtp} className="space-y-4">
              <FieldGroup>
                <Field>
                  <div className="flex items-center justify-between mb-1">
                    <FieldLabel htmlFor="guest-otp" className="text-xs font-semibold text-slate-700">
                      6-Digit SMS Verification Code
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("guest-phone")
                        setError(null)
                        setDevOtpHint(null)
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="size-3" />
                      Change number
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      id="guest-otp"
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
                      className="h-16 text-center font-mono text-3xl font-extrabold tracking-[0.5em] rounded-2xl bg-slate-50/70 border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 shadow-inner text-slate-900 transition-all"
                    />
                    <KeyRound className="absolute left-4 top-5.5 size-5 text-slate-400 pointer-events-none" />
                  </div>
                </Field>

                {devOtpHint && (
                  <div
                    onClick={() => setOtp(devOtpHint)}
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between cursor-pointer hover:bg-emerald-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Local Test SMS OTP: <strong>{devOtpHint}</strong></span>
                    </div>
                    <span className="font-bold underline text-[11px] text-emerald-700">Auto-fill</span>
                  </div>
                )}

                <Field className="pt-1">
                  <Button
                    type="submit"
                    disabled={loading || otp.trim().length !== 6}
                    className="w-full h-12 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white shadow-md shadow-emerald-950/20 transition-all hover:shadow-lg cursor-pointer text-sm gap-2"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RotateCw className="size-4 animate-spin" />
                        Verifying code...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 w-full">
                        <QrCode className="size-4" />
                        Verify & Access QR Scanner
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
                    <span>Didn't receive the SMS?</span>
                    {cooldown > 0 ? (
                      <span className="font-semibold text-slate-500">
                        Resend in {cooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendGuestOtp}
                        disabled={resending}
                        className="font-bold text-emerald-700 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {resending ? "Sending..." : "Resend SMS Code"}
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
