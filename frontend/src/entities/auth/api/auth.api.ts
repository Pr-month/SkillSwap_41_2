import { TAuthResponse, TLoginData, TRefreshResponse } from "./auth.types";
import { apiClient } from "@/shared/api";

export const loginUserApi = async (data: TLoginData): Promise<TAuthResponse> => {
  return apiClient.auth.post<TAuthResponse, TLoginData>('/api/login', data);
};

export const logoutApi = async (): Promise<TRefreshResponse> => {
  return apiClient.auth.post<TRefreshResponse>('/api/logout');
};