import api from "@/lib/axios";

export interface ChallanItemRecord {
    tool: string;
    toolId: string;
    description?: string;
    toolCode?: string;
    quantity: number;
    unit: string;
    rate?: number;
    remarks?: string;
    returnStatus: 'Sent' | 'Returned' | 'Missing';
}

export interface ChallanRecord {
    _id: string;
    challanNumber: string;
    challanType: 'Delivery' | 'Return';
    status: 'Active' | 'Completed' | 'Cancelled';
    vendor: {
        _id?: string;
        name: string;
        vendorCode?: string;
        address?: string;
        gstNumber?: string;
        contactPerson?: string;
        contactPhone?: string;
    };
    store?: any;
    challanDate: string;
    deliveryDate?: string;
    remarks?: string;
    notes?: string;
    referenceDcId?: string;
    referenceDcNumber?: string;
    items: ChallanItemRecord[];
    toolCount: number;
    returnedCount?: number;
    missingCount?: number;
    createdBy?: {
        _id?: string;
        name: string;
        email?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface ChallanListResponse {
    success: boolean;
    data: ChallanRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const challanService = {
    createDeliveryChallan: async (data: any): Promise<{ success: boolean; data: ChallanRecord; message?: string }> => {
        const res = await api.post('/api/challans/delivery', data);
        return res.data;
    },

    createReturnChallan: async (data: any): Promise<{ success: boolean; data: ChallanRecord; message?: string }> => {
        const res = await api.post('/api/challans/return', data);
        return res.data;
    },

    getChallans: async (params: Record<string, any> = {}): Promise<ChallanListResponse> => {
        const res = await api.get('/api/challans', { params });
        return res.data;
    },

    getChallanById: async (id: string): Promise<{ success: boolean; data: ChallanRecord }> => {
        const res = await api.get(`/api/challans/${id}`);
        return res.data;
    },

    updateDeliveryChallan: async (id: string, data: any): Promise<{ success: boolean; data: ChallanRecord; message?: string }> => {
        const res = await api.put(`/api/challans/${id}`, data);
        return res.data;
    },

    logPdfDownload: async (referenceNumber: string, details?: string): Promise<{ success: boolean }> => {
        const res = await api.post('/api/challans/log-pdf-download', { referenceNumber, details });
        return res.data;
    }
};

export default challanService;
