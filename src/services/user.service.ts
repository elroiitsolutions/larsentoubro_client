import api from "@/lib/axios";

export interface UserRecord {
    _id: string;
    name: string;
    phonenumber?: string;
    email: string;
    role: "Admin" | "User" | "Subuser" | "Vendor" | "Guest" | string;
    user_id: string;
    parentUser?: any;
    canCreateUser?: boolean;
    isVendor?: boolean;
    vendorCode?: string;
    allowedPages?: string[];
    hasInspectionAccess?: boolean;
    projects?: any[];
    stores?: any[];
    createdAt?: string;
    updatedAt?: string;
}

export interface UsersResponse {
    success: boolean;
    data: UserRecord[];
    message?: string;
}

export interface CreateUserResponse {
    success: boolean;
    data: UserRecord;
    message?: string;
}

export interface PendingLoginRequestItem {
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    role: string;
    parent_id?: string;
    parent_name?: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
    requested_at: string;
    ip_address?: string;
}

export const userService = {
    /**
     * Retrieves users (Admin sees all; users with canCreateUser see their subusers).
     */
    getUsers: async (): Promise<UsersResponse> => {
        const response = await api.get<UsersResponse>("/api/users");
        return response.data;
    },

    /**
     * Creates a new user account (Admin only).
     */
    createUser: async (data: Record<string, unknown>): Promise<CreateUserResponse> => {
        const response = await api.post<CreateUserResponse>("/api/users", data);
        return response.data;
    },

    /**
     * Retrieves subusers for current user (or all if Admin).
     */
    getSubusers: async (): Promise<UsersResponse> => {
        const response = await api.get<UsersResponse>("/api/users/subusers");
        return response.data;
    },

    /**
     * Creates a subuser under current user.
     */
    createSubuser: async (data: Record<string, unknown>): Promise<CreateUserResponse> => {
        const response = await api.post<CreateUserResponse>("/api/users/subusers", data);
        return response.data;
    },

    /**
     * Updates an existing subuser.
     */
    updateSubuser: async (id: string, data: Record<string, unknown>): Promise<CreateUserResponse> => {
        const response = await api.put<CreateUserResponse>(`/api/users/subusers/${id}`, data);
        return response.data;
    },

    /**
     * Deletes a subuser.
     */
    deleteSubuser: async (id: string): Promise<{ success: boolean; message?: string }> => {
        const response = await api.delete(`/api/users/subusers/${id}`);
        return response.data;
    },

    /**
     * Updates an existing user's details or Project/Store assignments.
     */
    updateUser: async (id: string, data: Record<string, unknown>): Promise<CreateUserResponse> => {
        const response = await api.put<CreateUserResponse>(`/api/users/${id}`, data);
        return response.data;
    },

    /**
     * Deletes a user account.
     */
    deleteUser: async (id: string): Promise<{ success: boolean; message?: string }> => {
        const response = await api.delete(`/api/users/${id}`);
        return response.data;
    },

    /**
     * Retrieves a single user by their database ID.
     */
    getUserById: async (id: string): Promise<CreateUserResponse> => {
        const response = await api.get<CreateUserResponse>(`/api/users/${id}`);
        return response.data;
    },

    /**
     * Retrieves current user profile with latest assigned Projects and Stores.
     */
    getCurrentUser: async (): Promise<CreateUserResponse> => {
        const response = await api.get<CreateUserResponse>("/api/users/me");
        return response.data;
    },

    /**
     * Retrieves pending login requests (for Admin or Parent Users).
     */
    getPendingLoginRequests: async (): Promise<{ success: boolean; data: PendingLoginRequestItem[] }> => {
        const response = await api.get("/api/users/login-requests/pending");
        return response.data;
    },

    /**
     * Approves a pending login request.
     */
    approveLoginRequest: async (requestId: string): Promise<{ success: boolean; message?: string }> => {
        const response = await api.post(`/api/users/login-requests/${requestId}/approve`);
        return response.data;
    },

    /**
     * Rejects a pending login request.
     */
    rejectLoginRequest: async (requestId: string, reason?: string): Promise<{ success: boolean; message?: string }> => {
        const response = await api.post(`/api/users/login-requests/${requestId}/reject`, { reason });
        return response.data;
    },

    /**
     * Logs out the user on backend to record session duration.
     */
    logout: async (): Promise<{ success: boolean }> => {
        try {
            const response = await api.post("/api/users/logout");
            return response.data;
        } catch {
            return { success: false };
        }
    }
};

export default userService;
