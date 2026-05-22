import { User } from "@/entities/user/model/types";
import { TApiResponse } from "./common";

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