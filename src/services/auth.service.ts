import api from "@/lib/axios";

export interface LoginRequest {
    email: string;
    password?: string;
    otp?: string;
}

export interface RequestOtpResponse {
    success: boolean;
    message: string;
    email: string;
    resendCooldown?: number;
    expiresIn?: number;
    devOtp?: string;
}

export interface AuthUser {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role: string;
    user_id: string;
    isVendor?: boolean;
    allowedPages?: string[];
    canCreateUser?: boolean;
    hasInspectionAccess?: boolean;
    projects?: any[];
    stores?: any[];
}

export interface LoginResponse {
    success: boolean;
    token: string;
    user: AuthUser;
    message?: string;
}

export const authService = {
    /**
     * Request a 6-digit OTP code to be sent to user's registered email
     */
    requestOtp: async (email: string): Promise<RequestOtpResponse> => {
        const response = await api.post<RequestOtpResponse>("/api/users/request-otp", { email });
        return response.data;
    },

    /**
     * Verify the 6-digit OTP code and retrieve the authenticated session token
     */
    verifyOtp: async (email: string, otp: string): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>("/api/users/verify-otp", { email, otp });
        return response.data;
    },

    /**
     * Authenticates with credentials or OTP (Backward compatibility)
     */
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>("/api/users/login", data);
        return response.data;
    },

    /**
     * Authenticates as Guest User with restricted access to QR Scanner only
     */
    guestLogin: async (): Promise<LoginResponse> => {
        const response = await api.post<LoginResponse>("/api/users/guest-login");
        return response.data;
    },
};

export default authService;
