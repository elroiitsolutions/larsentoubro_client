import api from "@/lib/axios";

export interface ProjectRecord {
    _id: string;
    name: string;
    description?: string;
    location: string;
    incharge: string;
    status: string;
    startDate?: string;
    endDate?: string;
}

export interface ProjectsResponse {
    success: boolean;
    data: ProjectRecord[];
    message?: string;
}

export interface ProjectMutationResponse {
    success: boolean;
    data?: ProjectRecord;
    message?: string;
}

export const projectService = {
    /**
     * Retrieves all projects.
     */
    getProjects: async (): Promise<ProjectsResponse> => {
        const response = await api.get<ProjectsResponse>("/api/projects");
        return response.data;
    },

    /**
     * Deletes a project by its unique ID.
     */
    deleteProject: async (id: string): Promise<ProjectMutationResponse> => {
        const response = await api.delete<ProjectMutationResponse>(`/api/projects/${id}`);
        return response.data;
    },

    /**
     * Creates a new project.
     */
    createProject: async (data: Record<string, unknown>, endpoint?: string): Promise<ProjectMutationResponse> => {
        const url = endpoint || "/api/projects";
        const response = await api.post<ProjectMutationResponse>(url, data);
        return response.data;
    },

    /**
     * Updates an existing project.
     */
    updateProject: async (id: string, data: Record<string, unknown>, endpoint?: string): Promise<ProjectMutationResponse> => {
        const url = endpoint || `/api/projects/${id}`;
        const response = await api.put<ProjectMutationResponse>(url, data);
        return response.data;
    },
};

export default projectService;
