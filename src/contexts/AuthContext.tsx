import * as React from "react"
import { getCookie, setCookie, eraseCookie } from "@/lib/cookie"
import userService from "@/services/user.service"

export interface User {
    username: string
    role: string
    user_id: string
    email: string
    id: string
    isVendor?: boolean
    allowedPages?: string[]
    projects?: any[]
    stores?: any[]
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (token: string, userData: any) => void
    logout: () => void
    refreshSession: () => Promise<void>
    loading: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [token, setToken] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)

    const refreshSession = React.useCallback(async () => {
        const storedToken = getCookie("token") || localStorage.getItem("token")
        if (!storedToken) return

        try {
            const res = await userService.getCurrentUser()
            if (res.success && res.data) {
                const u = res.data
                const isVendorRole = u.role === 'Vendor' || Boolean(u.isVendor)
                setUser({
                    username: u.name,
                    role: u.role || 'User',
                    user_id: u.user_id || u.vendorCode || u._id,
                    email: u.email,
                    id: u._id,
                    isVendor: isVendorRole,
                    allowedPages: u.allowedPages || (isVendorRole ? ["/projects", "/stores", "/tools"] : ["/dashboard", "/projects", "/stores"]),
                    projects: u.projects || [],
                    stores: u.stores || []
                })
            }
        } catch (error) {
            console.error("Failed to refresh session permissions:", error)
        }
    }, [])

    React.useEffect(() => {
        const storedToken = getCookie("token") || localStorage.getItem("token")
        const username = getCookie("username")
        const role = getCookie("role")
        const userId = getCookie("user_id")
        const email = getCookie("email")
        const id = getCookie("id")

        if (storedToken && username && role && email && id) {
            const isVendorRole = role === 'Vendor'
            setUser({
                username,
                role,
                user_id: userId || id,
                email,
                id,
                isVendor: isVendorRole,
                allowedPages: isVendorRole ? ["/projects", "/stores", "/tools"] : ["/dashboard", "/projects", "/stores"],
                projects: [],
                stores: []
            })
            setToken(storedToken)
            // Asynchronously refresh full assigned projects/stores and allowedPages from API
            refreshSession()
        }
        setLoading(false)
    }, [refreshSession])

    const login = (
        jwtToken: string,
        userData: any
    ) => {
        const isVendorRole = userData.role === 'Vendor' || Boolean(userData.isVendor)
        const userIdVal = userData.user_id || userData.vendorCode || userData._id || userData.id

        setCookie("token", jwtToken, 7)
        localStorage.setItem("token", jwtToken)
        setCookie("username", userData.name || userData.username, 7)
        setCookie("role", userData.role || 'User', 7)
        setCookie("user_id", userIdVal, 7)
        setCookie("email", userData.email, 7)
        setCookie("id", userData._id || userData.id, 7)

        setUser({
            username: userData.name || userData.username,
            role: userData.role || 'User',
            user_id: userIdVal,
            email: userData.email,
            id: userData._id || userData.id,
            isVendor: isVendorRole,
            allowedPages: userData.allowedPages || (isVendorRole ? ["/projects", "/stores", "/tools"] : ["/dashboard", "/projects", "/stores"]),
            projects: userData.projects || [],
            stores: userData.stores || []
        })
        setToken(jwtToken)
    }

    const logout = () => {
        eraseCookie("token")
        localStorage.removeItem("token")
        eraseCookie("username")
        eraseCookie("role")
        eraseCookie("user_id")
        eraseCookie("email")
        eraseCookie("id")

        setUser(null)
        setToken(null)
    }

    const value = React.useMemo(
        () => ({
            user,
            token,
            login,
            logout,
            refreshSession,
            loading,
        }),
        [user, token, loading, refreshSession]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = React.useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
