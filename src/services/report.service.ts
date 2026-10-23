import api from "@/lib/axios";

export interface ReportListResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary?: Record<string, any>;
}

export interface ToolReportItem {
    _id: string;
    toolId: string;
    description: string;
    toolCode?: string;
    toolType?: string;
    toolVariant?: string;
    project?: {
        _id: string;
        name: string;
        projectCode?: string;
    };
    currentSite?: {
        _id: string;
        name: string;
        location?: string;
        type?: string;
    };
    status: string;
    subcontractorName?: string;
    purchaserName?: string;
    supplierCode?: string;
    capacity?: string;
    safeWorkingLoad?: string;
    makeYear?: string;
    manufactureDate?: string;
    dateOfSupply?: string;
    lastInspectionDate?: string;
    nextInspectionDueDate?: string;
    inspectionStatus?: string;
    inspectionResult?: 'Pass' | 'Fail' | 'Pending' | null;
    inspectionAction?: 'Pass' | 'Repair' | 'Scrap' | null;
    lifeExtensionYears?: number;
    isPrinted?: boolean;
    isScrapped?: boolean;
    createdAt?: string;
}

export interface ChallanReportItem {
    _id: string;
    challanNumber: string;
    challanType: 'Delivery' | 'Return' | 'Transfer' | 'Scrap';
    status: 'Active' | 'Completed' | 'Cancelled' | 'Transfer' | 'Pending';
    isScrapDC?: boolean;
    challanDate: string;
    deliveryDate?: string;
    project?: {
        _id?: string;
        name: string;
        projectCode?: string;
    };
    sourceStore?: {
        _id?: string;
        name: string;
        storeCode?: string;
    };
    destinationStore?: {
        _id?: string;
        name: string;
        storeCode?: string;
    };
    vendor?: {
        _id?: string;
        name: string;
        vendorCode?: string;
    };
    subcontractorName?: string;
    vehicleNo?: string;
    ewayBillNo?: string;
    gatePassNo?: string;
    receiverName?: string;
    receiverMobile?: string;
    toolCount: number;
    returnedCount?: number;
    missingCount?: number;
    outstandingTools?: number;
    remarks?: string;
}

export interface MissingToolReportItem {
    _id: string;
    toolIdStr: string;
    description: string;
    toolCode?: string;
    project?: {
        _id?: string;
        name: string;
        projectCode?: string;
    };
    store?: {
        _id?: string;
        name: string;
        location?: string;
    };
    vendor?: {
        _id?: string;
        name: string;
        vendorCode?: string;
    };
    vendorName?: string;
    dcNumber?: string;
    rcNumber?: string;
    missingDate: string;
    reportedBy?: string;
    remarks?: string;
    status: string;
}

export interface InspectionReportItem extends ToolReportItem {
    toolAgeYears: number;
    isOverdue: boolean;
    isDueSoon: boolean;
    daysRemaining: number | null;
    complianceBadge: 'Overdue' | 'Due Soon' | 'Compliant' | 'Unscheduled';
    inspectedBy?: {
        _id?: string;
        name: string;
        email?: string;
    };
    extensionApprovedBy?: string;
}

export interface ScrapReportItem extends ToolReportItem {
    scrappedAt?: string;
    scrappedBy?: {
        _id?: string;
        name: string;
        email?: string;
    };
    scrapReason?: string;
    isDisposed?: boolean;
    disposedAt?: string;
    disposalChallanNumber?: string;
    scrapDealer?: {
        _id?: string;
        name: string;
        code?: string;
        vendorCode?: string;
        contactPerson?: string;
        contactPhone?: string;
    };
}

export interface SubcontractorReportItem {
    _id: string;
    name: string;
    code: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    dcCount: number;
    rcCount: number;
    totalDispatched: number;
    totalReturned: number;
    totalMissing: number;
    holdingCount: number;
    returnComplianceRate: number;
    profileType?: string;
}

export interface LoginLogItem {
    _id: string;
    user?: any;
    userName: string;
    userEmail: string;
    role: string;
    parentUser?: any;
    parentUserName?: string;
    status: 'Success' | 'Failed' | 'Pending Approval' | 'Approved' | 'Rejected';
    loginAt: string;
    approvedBy?: any;
    approverName?: string;
    approvedAt?: string;
    rejectionReason?: string;
    logoutAt?: string;
    sessionDuration?: number;
    ipAddress?: string;
    deviceInfo?: string;
    userAgent?: string;
}

export interface LoginReportResponse {
    success: boolean;
    data: LoginLogItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
    stats: {
        total: number;
        success: number;
        failed: number;
        pending: number;
        rejected: number;
    };
}

const reportService = {
    // 1. Tools Master Register
    getToolsReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<ToolReportItem>> => {
        const res = await api.get('/api/reports/tools', { params });
        return res.data;
    },

    // 2. Challans Register
    getChallansReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<ChallanReportItem>> => {
        const res = await api.get('/api/reports/challans', { params });
        return res.data;
    },

    // 3. Loss & Missing Tools Register
    getMissingToolsReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<MissingToolReportItem>> => {
        const res = await api.get('/api/reports/missing', { params });
        return res.data;
    },

    // 4. Statutory Inspections & Compliance
    getInspectionsReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<InspectionReportItem>> => {
        const res = await api.get('/api/reports/inspections', { params });
        return res.data;
    },

    // 5. Scrap & Asset Disposal Register
    getScrapReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<ScrapReportItem>> => {
        const res = await api.get('/api/reports/scrap', { params });
        return res.data;
    },

    // 6. Subcontractor Custody Ledger
    getSubcontractorsReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<SubcontractorReportItem>> => {
        const res = await api.get('/api/reports/subcontractors', { params });
        return res.data;
    },

    // 7. Login Audit Activity
    getLoginReport: async (params: Record<string, any> = {}): Promise<LoginReportResponse> => {
        const res = await api.get('/api/reports/logins', { params });
        return res.data;
    },

    // Universal Export Downloader
    downloadReportExport: async (type: string, format: 'excel' | 'csv' = 'excel', params: Record<string, any> = {}) => {
        const response = await api.get('/api/reports/export', {
            params: { ...params, type, format },
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = `LT_${type}_report_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // Login Report Export Downloader
    downloadLoginReportExport: async (format: 'excel' | 'csv' = 'excel', params: Record<string, any> = {}) => {
        const response = await api.get('/api/reports/logins/export', {
            params: { ...params, format },
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = `LT_login_activity_report_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};

export default reportService;
