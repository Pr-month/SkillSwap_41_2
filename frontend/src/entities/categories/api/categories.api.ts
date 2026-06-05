import { TCategoriesResponse } from "./categories.types";
import { apiClient } from "@/shared/api";

export const getCategoriesApi = async () => {
  return apiClient.get<TCategoriesResponse>('/api/categories');
}