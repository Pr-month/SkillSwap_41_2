import { TCategoryesResponse } from "./categories.types";
import { apiClient } from "@/shared/api";

export const getCategoriesApi = async () => {
  return apiClient.get<TCategoryesResponse>('/api/categories');
}