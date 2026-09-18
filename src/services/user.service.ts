import api from "@/lib/axios";

export interface UserRecord {
    _id: string;
    name: string;
    phonenumber?: string;
    email: string;
    role: "Admin" | "Manager" | "Engineer" | "Analyst" | "Viewer" | string;
    user_id: string;
    isVendor?: boolean;
    vendorCode?: string;
    allowedPages?: string[];
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

export const userService = {
    /**
     * Retrieves all registered users.
     */
    getUsers: async (): Promise<UsersResponse> => {
        const response = await api.get<UsersResponse>("/api/users");
        return response.data;
    },

    /**
     * Creates a new user account with assigned Projects & Stores.
     */
    createUser: async (data: Record<string, unknown>): Promise<CreateUserResponse> => {
        const response = await api.post<CreateUserResponse>("/api/users", data);
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
    }
};

export default userService;
