import { TApiResponse } from "@/shared/api/types";
import { User } from "@/entities/user/model/types";

export type TAuthResponse = TApiResponse<{
  refreshToken: string;
  accessToken: string;
  user: User;
}>;

export type TRefreshResponse = TApiResponse<{
  refreshToken: string;
  accessToken: string;
}>;

export type TLoginData = {
  email: string;
  password: string;
};