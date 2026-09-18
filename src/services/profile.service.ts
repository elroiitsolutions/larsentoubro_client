import api from "@/lib/axios";

export type ProfileType = "Subcontractor" | "ScrapDealer" | "Supplier";

export interface ProfileDocument {
    _id: string;
    title: string;
    documentType: string;
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    uploadedAt?: string;
    uploadedBy?: string;
}

export interface ProfileRecord {
    _id: string;
    profileType: ProfileType;
    name: string;
    code: string;
    contactPerson?: string;
    contactDesignation?: string;
    contactPhone?: string;
    alternatePhone?: string;
    contactEmail?: string;
    address?: string;
    gstNumber?: string;
    panNumber?: string;
    aadhaarNumber?: string;
    licenseNumber?: string;
    status: "Active" | "Inactive";
    projects?: any[];
    stores?: any[];
    customFields?: Record<string, any>;
    documents?: ProfileDocument[];
    metrics?: {
        dcCount?: number;
        rcCount?: number;
        returnedCount?: number;
        missingCount?: number;
        scrapCount?: number;
        supplyCount?: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface GetProfilesParams {
    profileType?: ProfileType;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}

class ProfileService {
    async getProfiles(params: GetProfilesParams = {}) {
        const response = await api.get("/api/profiles", { params });
        return response.data;
    }

    async getProfileById(id: string) {
        const response = await api.get(`/api/profiles/${id}`);
        return response.data;
    }

    async createProfile(data: Partial<ProfileRecord>) {
        const response = await api.post("/api/profiles", data);
        return response.data;
    }

    async updateProfile(id: string, data: Partial<ProfileRecord>) {
        const response = await api.put(`/api/profiles/${id}`, data);
        return response.data;
    }

    async deleteProfile(id: string) {
        const response = await api.delete(`/api/profiles/${id}`);
        return response.data;
    }

    async uploadDocument(profileId: string, formData: FormData) {
        const response = await api.post(`/api/profiles/${profileId}/documents`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    }

    async deleteDocument(profileId: string, docId: string) {
        const response = await api.delete(`/api/profiles/${profileId}/documents/${docId}`);
        return response.data;
    }

    getDocumentDownloadUrl(filename: string) {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        return `${baseUrl}/api/profiles/documents/file/${filename}`;
    }
}

export const profileService = new ProfileService();
export default profileService;
