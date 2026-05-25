import { User } from "@/entities/user/model/types";
import { TApiResponse } from "./common";

export type TUserResponse = TApiResponse<{ user: User }>;
export type TUsersResponse = TApiResponse<User[]>;

export type TUpdateProfileData = {
  name: string;
  birthdate: string;
  gender: 'Мужской' | 'Женский';
  city: string;
  description: string;
  avatar?: string;
};

export type TUpdateProfileResponse = TApiResponse<{
  user: User;
}>;