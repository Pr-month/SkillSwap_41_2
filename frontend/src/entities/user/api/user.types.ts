import { TApiResponse } from "@/shared/api/types";
import { User } from "../model/types";

export type TUsersMeta = {
  total: number;
  offset: number;
  limit: number;
  totalPages: number;
};

export type TUsersResponse = TApiResponse<{
  data: User[];
  meta: TUsersMeta;
}>;

export type TUserResponse = TApiResponse<{ user: User }>;

export type TUpdateProfileData = {
  name: string;
  birthdate: string;
  gender: 'Мужской' | 'Женский';
  city: string;
  description: string;
  avatar?: string;
  password?: string;
};

export type TUpdateProfileResponse = TApiResponse<{
  user: User;
}>;
