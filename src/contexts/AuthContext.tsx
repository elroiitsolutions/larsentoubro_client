import * as React from "react"
import { getCookie, setCookie, eraseCookie } from "@/lib/cookie"
import userService from "@/services/user.service"

export interface User {
    username: string
    role: string
    user_id: string
    email: string
    id: string
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
                setUser({
                    username: u.name,
                    role: u.role,
                    user_id: u.user_id,
                    email: u.email,
                    id: u._id,
                    allowedPages: u.allowedPages || ["/dashboard", "/projects", "/stores"],
                    projects: u.projects || [],
                    stores: u.stores || []
                })
            }
        } catch (error) {
            console.error("Failed to refresh session permissions:", error)
        }
    }, [])

    React.useEffect(() => {
        const storedToken = getCookie("token")
        const username = getCookie("username")
        const role = getCookie("role")
        const userId = getCookie("user_id")
        const email = getCookie("email")
        const id = getCookie("id")

        if (storedToken && username && role && userId && email && id) {
            setUser({
                username,
                role,
                user_id: userId,
                email,
                id,
                allowedPages: ["/dashboard", "/projects", "/stores"],
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
        setCookie("token", jwtToken, 7)
        localStorage.setItem("token", jwtToken)
        setCookie("username", userData.name || userData.username, 7)
        setCookie("role", userData.role, 7)
        setCookie("user_id", userData.user_id, 7)
        setCookie("email", userData.email, 7)
        setCookie("id", userData._id || userData.id, 7)

        setUser({
            username: userData.name || userData.username,
            role: userData.role,
            user_id: userData.user_id,
            email: userData.email,
            id: userData._id || userData.id,
            allowedPages: userData.allowedPages || ["/dashboard", "/projects", "/stores"],
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
