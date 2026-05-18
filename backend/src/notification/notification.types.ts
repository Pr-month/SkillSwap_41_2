export type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'request_rejected';

export interface NotificationPayload<T = unknown> {
  type: NotificationType;
  data: T;
  timestamp: string;
}
