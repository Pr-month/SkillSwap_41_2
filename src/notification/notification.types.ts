export type NotificationType = 
  | 'new_request'
  | 'request_accepted'
  | 'request_rejected';

export interface NotificationPayload {
  type: NotificationType;
  data: Record<string, any>;
  timestamp: string;
}