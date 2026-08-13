import api from "@/lib/axios";

export interface ToolRecord {
    _id: string;
    toolId?: string;
    toolCode?: string;
    description?: string;
    toolType?: string;
    status: string;
    makeYear?: string;
    capacity?: string;
    safeWorkingLoad?: string;
    metalType?: string;
    toolVariant?: string;
    dateOfSupply?: string;
    validityPeriod?: string;
    purchaserName?: string;
    purchaserContact?: string;
    supplierCode?: string;
    testCertificate?: string;
    subcontractorName?: string;
    subcontractorCode?: string;
    subcontractorMobile?: string;
    jobCode?: string;
    jobDescription?: string;
    remarks?: string;
    qrLink?: string;
    project?: any;
    currentSite?: any;
    createdAt?: string;
    updatedAt?: string;
    name?: string;
    category?: string;
    serialNumber?: string;
    condition?: string;
}

export interface ToolListResponse {
    success: boolean;
    data: ToolRecord[];
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    message?: string;
}

export interface ToolDetailResponse {
    success: boolean;
    data: ToolRecord;
    message?: string;
}

export interface ToolMutationResponse {
    success: boolean;
    data?: ToolRecord;
    message?: string;
}

export interface BulkImportPreviewResponse {
    success: boolean;
    data: {
        jobId: string;
        records: any[];
        totalRows: number;
        validCount: number;
        invalidCount: number;
        columns: any[];
        pagination: {
            page: number;
            pageSize: number;
            totalPages: number;
        };
    };
    message?: string;
}

export interface BulkImportCommitData {
    successCount: number;
    failedCount: number;
    failedRows?: Array<{ row: number | string; reason: string }>;
}

export interface BulkImportCommitResponse {
    success: boolean;
    data: {
        jobId: string;
        status: string;
        totalToProcess: number;
    };
    message?: string;
}

export interface ImportJobProgress {
    processedCount: number;
    successCount: number;
    failedCount: number;
    totalToProcess: number;
    percentage: number;
    failedRows: Array<{ row: number | string; reason: string }>;
}

export interface ImportJobStatus {
    _id: string;
    status: 'parsing' | 'preview_ready' | 'processing' | 'completed' | 'failed';
    totalRows: number;
    validCount: number;
    invalidCount: number;
    progress: ImportJobProgress;
    completedAt?: string;
}

export const toolService = {
    /**
     * Retrieves tools assigned to a specific store with optional filtering and sorting.
     */
    getToolsByStore: async (storeId: string, queryParams?: Record<string, string>): Promise<ToolListResponse> => {
        const query = new URLSearchParams(queryParams || {});
        const url = `/api/stores/${storeId}/tools?${query.toString()}`;
        const response = await api.get<ToolListResponse>(url);
        return response.data;
    },

    /**
     * Retrieves details of a single tool by its unique ID.
     */
    getToolById: async (toolId: string): Promise<ToolDetailResponse> => {
        const url = `/api/tools/${encodeURIComponent(toolId)}`;
        const response = await api.get<ToolDetailResponse>(url);
        return response.data;
    },

    /**
     * Creates a new tool under a store.
     */
    createTool: async (storeId: string, data: Record<string, unknown>): Promise<ToolMutationResponse> => {
        const url = `/api/stores/${storeId}/tools`;
        const response = await api.post<ToolMutationResponse>(url, data);
        return response.data;
    },

    /**
     * Updates an existing tool by its unique ID or _id.
     */
    updateTool: async (toolId: string, data: Record<string, unknown>): Promise<ToolMutationResponse> => {
        const url = `/api/tools/${encodeURIComponent(toolId)}`;
        const response = await api.put<ToolMutationResponse>(url, data);
        return response.data;
    },

    /**
     * Exports tools from a store as an Excel/CSV blob file.
     */
    exportTools: async (storeId: string, queryParams?: Record<string, string>): Promise<Blob> => {
        const query = new URLSearchParams(queryParams || {});
        const url = `/api/stores/${storeId}/tools/export?${query.toString()}`;
        const response = await api.get(url, { responseType: "blob" });
        return response.data;
    },

    /**
     * Previews a bulk import spreadsheet — returns jobId + first page of records.
     * Records are stored server-side; client fetches pages on demand.
     */
    previewBulkImport: async (storeId: string, formData: FormData): Promise<BulkImportPreviewResponse> => {
        const url = `/api/stores/${storeId}/tools/bulk-import/preview`;
        const response = await api.post<BulkImportPreviewResponse>(url, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            },
            timeout: 120000 // 2 min timeout for large file uploads
        });
        return response.data;
    },

    /**
     * Fetches paginated preview records from a stored import job.
     */
    getImportJobRecords: async (storeId: string, jobId: string, page: number, pageSize: number) => {
        const url = `/api/stores/${storeId}/tools/bulk-import/jobs/${jobId}/records?page=${page}&pageSize=${pageSize}`;
        const response = await api.get(url);
        return response.data;
    },

    /**
     * Fetches import job status (for page reload recovery).
     */
    getImportJobStatus: async (storeId: string, jobId: string): Promise<{ success: boolean; data: ImportJobStatus }> => {
        const url = `/api/stores/${storeId}/tools/bulk-import/jobs/${jobId}`;
        const response = await api.get(url);
        return response.data;
    },

    /**
     * Commits an import job — returns immediately, processing happens in background.
     */
    commitBulkImport: async (storeId: string, jobId: string): Promise<BulkImportCommitResponse> => {
        const url = `/api/stores/${storeId}/tools/bulk-import/commit`;
        const response = await api.post<BulkImportCommitResponse>(url, { jobId });
        return response.data;
    },

    /**
     * Creates an EventSource for SSE progress streaming of an import job.
     * Returns the EventSource instance; caller must manage cleanup.
     */
    createImportProgressStream: (storeId: string, jobId: string): EventSource => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const token = localStorage.getItem('token') || '';
        const url = `${baseUrl}/api/stores/${storeId}/tools/bulk-import/jobs/${jobId}/progress?token=${token}`;
        return new EventSource(url);
    },

    /**
     * Downloads the sample Excel file template for bulk import.
     */
    downloadSampleBulkImport: async (storeId: string): Promise<Blob> => {
        const url = `/api/stores/${storeId}/tools/bulk-import/sample`;
        const response = await api.get(url, { responseType: "blob" });
        return response.data;
    },

    getToolFilterOptions: async (storeId: string): Promise<Record<string, string[]>> => {
        const url = `/api/stores/${storeId}/tools/filter-options`;
        const response = await api.get<{ success: boolean; data: Record<string, string[]> }>(url);
        return response.data?.data || {};
    },

    bulkEditTools: async (
        storeId: string,
        payload: {
            toolIds?: string[];
            filterCriteria?: Record<string, string>;
            updates: Record<string, any>;
        }
    ): Promise<{ success: boolean; message?: string; data?: any }> => {
        const url = storeId ? `/api/stores/${storeId}/tools/bulk-edit` : `/api/tools/bulk-edit`;
        const response = await api.post<{ success: boolean; message?: string; data?: any }>(url, payload);
        return response.data;
    },
};

export default toolService;
