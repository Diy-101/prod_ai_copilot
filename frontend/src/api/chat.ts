import { ENDPOINTS } from '@/constants/api';

export interface GeneratePipelineRequest {
  dialog_id: string;
  message: string;
  user_id: string | null;
  capability_ids: string[] | null;
}

export const generatePipeline = async (request: GeneratePipelineRequest) => {
  try {
    const response = await fetch(ENDPOINTS.PIPELINES.GENERATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    return response.ok;
  } catch (error) {
    console.error('Error generating pipeline:', error);
    return false;
  }
};
