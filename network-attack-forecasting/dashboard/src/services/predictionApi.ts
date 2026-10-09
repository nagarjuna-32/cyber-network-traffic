import { apiClient } from './api';
import { CurrentPredictionResponse } from '../types';

export interface HealthResponse {
  status: string;
  isBackendConnected: boolean;
  modelLoaded: boolean;
  inferenceLatencyMs: number;
  pipelineLatencyMs: number;
  dataSource: string;
  lastUpdated: string;
}

export const predictionApi = {
  getCurrentPrediction: async (): Promise<CurrentPredictionResponse> => {
    const res = await apiClient.get('/api/predict/current');
    return res.data;
  },

  getHealth: async (): Promise<HealthResponse> => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  simulateScenario: async (scenario: string): Promise<CurrentPredictionResponse> => {
    const res = await apiClient.post('/api/simulate', { scenario });
    return res.data;
  },
};
