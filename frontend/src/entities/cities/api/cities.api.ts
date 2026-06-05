import { apiClient } from "@/shared/api";
import { TCitiesResponse } from "./cities.dto";

/**
 * Получение списка городов
 */
export const getCitiesApi = async () => {
  return apiClient.get<TCitiesResponse>('/api/cities');
};