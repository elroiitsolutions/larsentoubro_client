import * as React from "react"
import { getCookie, setCookie, eraseCookie } from "@/lib/cookie"

interface User {
    username: string
    role: string
    user_id: string
    email: string
    id: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (token: string, userData: { name: string; role: string; user_id: string; email: string; _id: string }) => void
    logout: () => void
    loading: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [token, setToken] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState(true)

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
            })
            setToken(storedToken)
        }
        setLoading(false)
    }, [])

    const login = (
        jwtToken: string,
        userData: { name: string; role: string; user_id: string; email: string; _id: string }
    ) => {
        setCookie("token", jwtToken, 7)
        setCookie("username", userData.name, 7)
        setCookie("role", userData.role, 7)
        setCookie("user_id", userData.user_id, 7)
        setCookie("email", userData.email, 7)
        setCookie("id", userData._id, 7)

        setUser({
            username: userData.name,
            role: userData.role,
            user_id: userData.user_id,
            email: userData.email,
            id: userData._id,
        })
        setToken(jwtToken)
    }

    const logout = () => {
        eraseCookie("token")
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
            loading,
        }),
        [user, token, loading]
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
