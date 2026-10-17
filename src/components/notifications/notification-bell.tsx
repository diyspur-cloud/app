'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { NotificationCenter } from './notification-center';
import { useNotifications } from './notification-provider';

export function NotificationBell() {
  const { unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      void refresh();
    }
  };

  const handleClose = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const label =
    unreadCount > 0
      ? `Notificações, ${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}`
      : 'Notificações';

  return (
    <div className="notification-bell-wrap" data-notification-bell>
      <button
        ref={buttonRef}
        type="button"
        className={`notification-bell-btn ${open ? 'active' : ''}`}
        onClick={handleToggle}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="notification-center-dialog"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      <NotificationCenter open={open} onClose={handleClose} />
    </div>
  );
}
