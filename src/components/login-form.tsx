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
import { Eye , EyeOff} from "lucide-react"

import { UserWaitingScreen } from "@/components/UserWaitingScreen"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [eye, setEye] = React.useState(false)
  const [pendingReq, setPendingReq] = React.useState<{ requestId: string; email: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = await authService.login({ email, password })

      if (data.requestId || data.data?.requestId || data.message?.includes("Waiting for administrator")) {
        const reqId = data.requestId || data.data?.requestId
        setPendingReq({ requestId: reqId, email })
        toast.info("Login request sent. Waiting for administrator approval.")
        setLoading(false)
        return
      }

      if (!data.success) {
        throw new Error(data.message || "Invalid email or password")
      }

      toast.success("Successfully logged in!")
      login(data.token, data.user)
    } catch (err: any) {
      const resData = err?.response?.data
      if (resData?.requestId || resData?.message?.includes("Waiting for administrator")) {
        const reqId = resData.requestId || resData?.data?.requestId
        setPendingReq({ requestId: reqId, email })
        toast.info("Login request sent. Waiting for administrator approval.")
        setLoading(false)
        return
      }

      const message = resData?.message || err.message || "Invalid email or password"
      setError(message)
      setLoading(false)
    }
  }

  if (pendingReq) {
    return (
      <UserWaitingScreen
        requestId={pendingReq.requestId}
        email={pendingReq.email}
        onApproved={(token, user) => {
          toast.success("Login request approved!")
          login(token, user)
        }}
        onCancel={() => setPendingReq(null)}
      />
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="rounded-lg bg-destructive/15 p-3 text-xs font-semibold text-destructive">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-xs underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={eye ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer"
                    onClick={() => setEye(!eye)}
                  >
                    {eye ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4" />
                    )}
                  </button>
                </div>
              </Field>
              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <Button variant="outline" type="button" disabled className="w-full mt-2">
                  Login with Google
                </Button>
                <FieldDescription className="text-center mt-4 text-xs">
                  Don&apos;t have an account? Contact your administrator.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
