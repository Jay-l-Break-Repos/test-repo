import { toast } from '../utils/toast';

const API_BASE_URL = '/api';

export interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export const DocumentApi = {
  async deleteDocument(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Show success message
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      throw error;
    }
  },
};