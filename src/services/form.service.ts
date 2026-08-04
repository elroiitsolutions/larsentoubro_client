import api from "@/lib/axios";

export interface FormDefinition {
    _id?: string;
    slug: string;
    title: string;
    description?: string;
    fields: any[];
}

export interface FormsResponse {
    success: boolean;
    data: FormDefinition[];
    message?: string;
}

export interface FormDetailResponse {
    success: boolean;
    data: FormDefinition;
    message?: string;
}

export interface FormMutationResponse {
    success: boolean;
    data?: any;
    message?: string;
}

export const formService = {
    /**
     * Retrieves all dynamic form definitions.
     */
    getForms: async (): Promise<FormsResponse> => {
        const response = await api.get<FormsResponse>("/api/forms");
        return response.data;
    },

    /**
     * Retrieves a single dynamic form definition by its slug.
     */
    getFormBySlug: async (slug: string): Promise<FormDetailResponse> => {
        const response = await api.get<FormDetailResponse>(`/api/forms/${slug}`);
        return response.data;
    },

    /**
     * Saves or updates a dynamic form definition.
     */
    saveForm: async (data: Record<string, unknown>): Promise<FormMutationResponse> => {
        const response = await api.post<FormMutationResponse>("/api/forms", data);
        return response.data;
    },

    /**
     * Submits dynamic form data to a specified target endpoint.
     */
    submitForm: async (url: string, data: Record<string, unknown>, method?: string): Promise<FormMutationResponse> => {
        const normalizedMethod = (method || "POST").toLowerCase();
        // Ensure relative URLs are prefixed with /api if they don't already start with /api or http
        let targetUrl = url;
        if (!targetUrl.startsWith("http") && !targetUrl.startsWith("/api")) {
            targetUrl = `/api${targetUrl.startsWith("/") ? "" : "/"}${targetUrl}`;
        }
        const response = await api({
            method: normalizedMethod,
            url: targetUrl,
            data,
        });
        return response.data;
    },
};

export default formService;
