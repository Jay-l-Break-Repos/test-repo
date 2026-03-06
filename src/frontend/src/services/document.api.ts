import axios from 'axios';

export interface ApiDocument {
    id: number;
    name: string;
    size: number;
    content_type: string;
    path: string;
    created_at: string;
    owner_id: number | null;
    last_modified_by: string | null;
}

export const uploadDocument = async (file: File, onProgress?: (percent: number) => void, userId?: string): Promise<ApiDocument> => {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (userId) {
        headers['X-User-ID'] = userId;
    }

    console.log('Uploading document:', file.name);

    try {
        const response = await axios.post<ApiDocument>('/api/documents/upload', formData, {
            headers,
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        });

        console.log('Document uploaded successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
};

export const getDocuments = async (): Promise<ApiDocument[]> => {
    try {
        console.log('Fetching documents from API...');
        const response = await axios.get<ApiDocument[]>('/api/documents');
        
        console.log('Documents fetched:', response.data);
        
        // Log each document name for debugging
        response.data.forEach(doc => {
            console.log(`Document found: ${doc.name}`);
        });
        
        return response.data;
    } catch (error) {
        console.error('Failed to fetch documents:', error);
        throw error;
    }
};

export const getDocument = async (id: number): Promise<ApiDocument> => {
    const response = await axios.get<ApiDocument>(`/api/documents/${id}`);
    return response.data;
};

export const deleteDocument = async (id: number): Promise<void> => {
    await axios.delete(`/api/documents/${id}`);
};