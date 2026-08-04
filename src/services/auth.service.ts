import api from "@/lib/axios";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    user_id: string;
}

export interface LoginResponse {
    success: boolean;
    token: string;
    user: AuthUser;
    message?: string;
}

export const authService = {
    /**
     * Authenticates a user with email and password.
     */
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>("/api/users/login", data);
        return response.data;
    },
};

export default authService;
