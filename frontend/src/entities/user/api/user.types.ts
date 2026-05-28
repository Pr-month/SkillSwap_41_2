import { TApiResponse } from "@/shared/api/types";
import { User } from "../model/types";

export type TUserResponse = TApiResponse<{ user: User }>;
export type TUsersResponse = TApiResponse<User[]>;

export type TUpdateProfileData = {
  name: string;
  birthdate: string;
  gender: 'Мужской' | 'Женский';
  city: string;
  description: string;
  avatar?: string;
  password?: string;
};

// export type TUpdateProfileResponse = TApiResponse<{
//   user: User;
// }>;