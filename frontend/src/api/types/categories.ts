import { Category } from "@/entities/categories/model/types";
import { TApiResponse } from "./common";

export type TCategoriesResponse = TApiResponse<Category[]>