export type TApiResponse<T> = {
  success: boolean;
} & T;