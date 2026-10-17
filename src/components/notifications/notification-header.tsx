'use client';

import { NotificationBell } from './notification-bell';
import { NotificationProvider } from './notification-provider';

export function NotificationHeader() {
  return (
    <NotificationProvider>
      <NotificationBell />
    </NotificationProvider>
  );
}
