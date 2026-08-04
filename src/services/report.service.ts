import api from "@/lib/axios";

export interface ReportListResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const reportService = {
    getDeliveryChallanReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<any>> => {
        const res = await api.get('/api/reports/delivery-challans', { params });
        return res.data;
    },

    getReturnChallanReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<any>> => {
        const res = await api.get('/api/reports/return-challans', { params });
        return res.data;
    },

    getMissingToolsReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<any>> => {
        const res = await api.get('/api/reports/missing-tools', { params });
        return res.data;
    },

    getToolMovementReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<any>> => {
        const res = await api.get('/api/reports/tool-movements', { params });
        return res.data;
    },

    getAuditLogsReport: async (params: Record<string, any> = {}): Promise<ReportListResponse<any>> => {
        const res = await api.get('/api/reports/audit-logs', { params });
        return res.data;
    },

    downloadReportExport: async (type: string, format: 'excel' | 'csv' = 'excel', params: Record<string, any> = {}) => {
        const response = await api.get('/api/reports/export', {
            params: { ...params, type, format },
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};

export default reportService;
