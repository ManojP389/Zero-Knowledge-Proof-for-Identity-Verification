import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { NotificationItem } from '../types';

interface NotificationsResponse {
  notifications: NotificationItem[];
}

const accentByType: Record<NotificationItem['type'], string> = {
  pending: 'bg-amber-50 text-amber-700',
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const result = await apiFetch<NotificationsResponse>('/user/notifications');
        setItems(result.notifications || []);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Failed to load notifications');
      }
    };

    void fetchNotifications();
  }, []);

  return (
    <div className="space-y-6 rounded-[2.2rem] border border-white/70 bg-white/78 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] xl:min-h-[calc(100vh-14rem)]">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-teal-700">User side</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold">Notifications</h2>
        <p className="mt-2 text-slate-600">Track when a verifier checks your proof and whether the request is pending, accepted, or rejected.</p>
      </div>

      {message && <div className="rounded-[1.5rem] bg-rose-50 p-4 text-sm text-rose-700">{message}</div>}

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-[1.5rem] bg-stone-100 p-5 text-slate-600">No notifications yet.</div>
        ) : (
          items.map((item) => (
            <article key={`${item.timestamp}-${item.message}`} className="rounded-[1.75rem] border border-stone-200 bg-stone-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${accentByType[item.type]}`}>
                  {item.type}
                </span>
                <span className="text-sm text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-3 text-base text-slate-800">{item.message}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
