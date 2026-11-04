import api from "@/lib/axios";

export interface ExtensionHistoryItem {
    extendedAt: string;
    extendedBy: {
        _id?: string;
        name: string;
        email: string;
    };
    durationDays: number;
    durationLabel: string;
    previousExpiresAt: string;
    newExpiresAt: string;
}

export interface GuestUserRecord {
    _id: string;
    name: string;
    phone: string;
    formattedPhone: string;
    email?: string;
    organization?: string;
    purpose?: string;
    status: 'Active' | 'Expired' | 'Disabled';
    computedStatus?: 'Active' | 'Expiring Soon' | 'Expired' | 'Disabled';
    expiresAt: string;
    initialDurationDays: number;
    totalDurationDays: number;
    notificationSentAt?: string;
    notificationStatus: 'None' | 'Pending' | 'Confirmed' | 'Rejected' | 'Expired';
    rejectionReason?: string;
    lastLoginAt?: string;
    createdBy: {
        _id?: string;
        name: string;
        email: string;
        role: string;
    };
    extensionHistory: ExtensionHistoryItem[];
    customFields?: Record<string, any>;
    daysRemaining?: number;
    hoursRemaining?: number;
    isExpired?: boolean;
    isExpiringSoon?: boolean;
    createdAt: string;
    updatedAt: string;
}

export type ExtensionDuration = '15 days' | '45 days' | '1 month' | '3 months' | '6 months';

export interface CreateGuestUserDto {
    name: string;
    phone: string;
    email?: string;
    organization?: string;
    purpose?: string;
    customFields?: Record<string, any>;
}

export interface UpdateGuestUserDto {
    name?: string;
    phone?: string;
    email?: string;
    organization?: string;
    purpose?: string;
    status?: 'Active' | 'Expired' | 'Disabled';
    customFields?: Record<string, any>;
}

export const guestUserService = {
    /**
     * Get list of guest users with optional filtering
     */
    async getGuestUsers(params?: { search?: string; status?: string; scopedOnly?: boolean }): Promise<{ success: boolean; data: GuestUserRecord[] }> {
        const response = await api.get('/api/guest-users', { params });
        return response.data;
    },

    /**
     * Get a single guest user by ID
     */
    async getGuestUserById(id: string): Promise<{ success: boolean; data: GuestUserRecord }> {
        const response = await api.get(`/api/guest-users/${id}`);
        return response.data;
    },

    /**
     * Create a new guest user with 15-day automatic expiry
     */
    async createGuestUser(data: CreateGuestUserDto): Promise<{ success: boolean; message: string; data: GuestUserRecord }> {
        const response = await api.post('/api/guest-users', data);
        return response.data;
    },

    /**
     * Update an existing guest user's details
     */
    async updateGuestUser(id: string, data: UpdateGuestUserDto): Promise<{ success: boolean; message: string; data: GuestUserRecord }> {
        const response = await api.put(`/api/guest-users/${id}`, data);
        return response.data;
    },

    /**
     * Confirm access extension for a guest user with specified duration
     */
    async extendGuestUser(id: string, duration: ExtensionDuration): Promise<{ success: boolean; message: string; data: GuestUserRecord }> {
        const response = await api.post(`/api/guest-users/${id}/extend`, { duration });
        return response.data;
    },

    /**
     * Reject extension request and immediately expire access
     */
    async rejectGuestUser(id: string, reason?: string): Promise<{ success: boolean; message: string; data: GuestUserRecord }> {
        const response = await api.post(`/api/guest-users/${id}/reject`, { reason });
        return response.data;
    },

    /**
     * Fetch pending 14th-day notifications / accounts expiring soon
     */
    async getExpiringNotifications(): Promise<{ success: boolean; data: GuestUserRecord[] }> {
        const response = await api.get('/api/guest-users/notifications');
        return response.data;
    }
};

export default guestUserService;
