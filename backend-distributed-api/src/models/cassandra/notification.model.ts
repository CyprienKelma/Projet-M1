export interface Notification {
  user_id: number; // Changed order to match primary key
  notification_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: Date;
}
