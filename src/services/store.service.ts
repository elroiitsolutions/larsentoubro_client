import api from "@/lib/axios";

export interface StoreRecord {
    _id: string;
    name: string;
    location: string;
    incharge: string;
    contactNumber: string;
    totalToolsCount: number;
    assignedToolsCount: number;
    availableToolsCount: number;
    underMaintenanceToolsCount: number;
    status: string;
    projectId?: string;
    project?: any;
}

export interface StoresResponse {
    success: boolean;
    data: StoreRecord[];
    message?: string;
}

export interface StoreMutationResponse {
    success: boolean;
    data?: StoreRecord;
    message?: string;
}

export const storeService = {
    /**
     * Retrieves all stores, optionally filtered by projectId.
     */
    getStores: async (projectId?: string): Promise<StoresResponse> => {
        const url = projectId ? `/api/stores?projectId=${projectId}` : "/api/stores";
        const response = await api.get<StoresResponse>(url);
        return response.data;
    },

    /**
     * Deletes a store by its unique ID.
     */
    deleteStore: async (id: string): Promise<StoreMutationResponse> => {
        const response = await api.delete<StoreMutationResponse>(`/api/stores/${id}`);
        return response.data;
    },

    /**
     * Creates a new store.
     */
    createStore: async (data: Record<string, unknown>, endpoint?: string): Promise<StoreMutationResponse> => {
        const url = endpoint || "/api/stores";
        const response = await api.post<StoreMutationResponse>(url, data);
        return response.data;
    },

    /**
     * Retrieves a single store by its unique ID.
     */
    getStoreById: async (id: string): Promise<{ success: boolean; data?: StoreRecord; message?: string }> => {
        const response = await api.get<{ success: boolean; data?: StoreRecord; message?: string }>(`/api/stores/${id}`);
        return response.data;
    },

    /**
     * Updates an existing store.
     */
    updateStore: async (id: string, data: Record<string, unknown>, endpoint?: string): Promise<StoreMutationResponse> => {
        const url = endpoint || `/api/stores/${id}`;
        const response = await api.put<StoreMutationResponse>(url, data);
        return response.data;
    },
};

export default storeService;
