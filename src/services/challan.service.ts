import api from "@/lib/axios";

export interface ChallanItemRecord {
    tool: string;
    toolId: string;
    description?: string;
    toolCode?: string;
    category?: string;
    capacity?: string;
    safeWorkingLoad?: string;
    serialNumber?: string;
    makeYear?: string;
    quantity: number;
    unit: string;
    rate?: number;
    remarks?: string;
    returnStatus: 'Sent' | 'Returned' | 'Missing' | 'Pending';
    returnedAt?: string | Date;
    returnChallanNumber?: string;
    returnChallanId?: string;
}

export interface ChallanRecord {
    _id: string;
    challanNumber: string;
    challanType: 'Delivery' | 'Return' | 'Transfer' | 'Scrap';
    status: 'Active' | 'Completed' | 'Cancelled' | 'Transfer' | 'Returned' | 'Pending';
    isScrapDC?: boolean;
    isStoreTransfer?: boolean;
    project?: {
        _id?: string;
        name: string;
        projectCode?: string;
    };
    sourceStore?: {
        _id?: string;
        name: string;
        storeCode?: string;
        location?: string;
    };
    destinationStore?: {
        _id?: string;
        name: string;
        storeCode?: string;
        location?: string;
    };
    vendor?: {
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
    indentNo?: string;
    siteCode?: string;
    subcontractorName?: string;
    locationChainage?: string;
    workFrontLocation?: string;
    trnCode?: string;
    sendingCentreCode?: string;
    mrNo?: string;
    mrDate?: string;
    stockType?: string;
    ewayBillNo?: string;
    gatePassNo?: string;
    gatePassApprovedBy?: string;
    consignorTaxNo?: string;
    vehicleNo?: string;
    lrNo?: string;
    freightStatus?: string;
    receiverName?: string;
    receiverMobile?: string;
    mrnNo?: string;
    receiptDate?: string;
    remarks?: string;
    notes?: string;
    referenceDcId?: string;
    referenceDcNumber?: string;
    transferFromDcId?: string;
    transferFromDcNumber?: string;
    transferredToDcId?: string;
    transferredToDcNumber?: string;
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

    createScrapDeliveryChallan: async (data: any): Promise<{ success: boolean; data: ChallanRecord; message?: string }> => {
        const res = await api.post('/api/challans/scrap-delivery', data);
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
    },

    getNextChallanNumber: async (type: string = 'Delivery'): Promise<string> => {
        try {
            const res = await api.get('/api/challans/next-number', { params: { type } });
            return res.data?.data?.challanNumber || (type === 'Scrap' ? 'SDC-26-001' : 'DC-26-001');
        } catch (err) {
            console.error('Failed to get next challan number:', err);
            return type === 'Scrap' ? 'SDC-26-001' : 'DC-26-001';
        }
    }
};

export default challanService;
