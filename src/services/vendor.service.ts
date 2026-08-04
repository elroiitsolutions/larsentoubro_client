import api from "@/lib/axios";

export interface VendorRecord {
    _id: string;
    name: string;
    vendorCode: string;
    address?: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    gstNumber?: string;
    status: 'Active' | 'Inactive';
    metrics?: {
        dcCount: number;
        rcCount: number;
        returnedCount: number;
        missingCount: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface VendorListResponse {
    success: boolean;
    data: VendorRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const vendorService = {
    getVendors: async (params: Record<string, any> = {}): Promise<VendorListResponse> => {
        const res = await api.get('/api/vendors', { params });
        return res.data;
    },

    getVendorById: async (id: string): Promise<{ success: boolean; data: VendorRecord }> => {
        const res = await api.get(`/api/vendors/${id}`);
        return res.data;
    },

    createVendor: async (data: Partial<VendorRecord>): Promise<{ success: boolean; data: VendorRecord }> => {
        const res = await api.post('/api/vendors', data);
        return res.data;
    },

    updateVendor: async (id: string, data: Partial<VendorRecord>): Promise<{ success: boolean; data: VendorRecord }> => {
        const res = await api.put(`/api/vendors/${id}`, data);
        return res.data;
    },

    deleteVendor: async (id: string): Promise<{ success: boolean; message: string }> => {
        const res = await api.delete(`/api/vendors/${id}`);
        return res.data;
    }
};

export default vendorService;
