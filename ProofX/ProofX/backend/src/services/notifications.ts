import {
  addNotification as addStoredNotification,
  getNotifications as getStoredNotifications,
} from '../store/demoStore';

export type NotificationType = 'verified' | 'rejected' | 'pending';

export interface Notification {
  userId: string;
  message: string;
  type: NotificationType;
  timestamp: string;
}

export function addNotification(notification: Notification) {
  return addStoredNotification(notification);
}

export function getNotifications(userId: string): Notification[] {
  return getStoredNotifications(userId);
}
