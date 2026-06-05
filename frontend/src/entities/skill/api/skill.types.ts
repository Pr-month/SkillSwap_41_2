import { TApiResponse } from "@/shared/api/types";
import { Skill } from "../model/types";

export type TSkillResponse = TApiResponse<Skill[]>;

export type TGetSkillsParams = {
  category?: number;
  owner?: number;
  search?: string;
  limit?: number;
  offset?: number;
};