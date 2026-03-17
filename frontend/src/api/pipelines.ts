import { ENDPOINTS } from '@/constants/api';
import { apiRequest } from '@/lib/api';
import { PipelineEdge, PipelineNode } from '@/types/pipeline';

export interface UpdatePipelineGraphRequest {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export interface UpdatePipelineGraphResponse {
  pipeline_id: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  updated_at: string;
}

export const updatePipelineGraph = async (
  pipelineId: string,
  payload: UpdatePipelineGraphRequest
): Promise<UpdatePipelineGraphResponse> => {
  return apiRequest<UpdatePipelineGraphResponse>(ENDPOINTS.PIPELINES.GRAPH(pipelineId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};
