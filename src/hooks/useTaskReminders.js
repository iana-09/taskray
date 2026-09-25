import { useEffect, useMemo, useRef, useState } from 'react';

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const reminderWindowMap = {
  none: 0,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '3hours': 3 * 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000,
};

const getDueAt = (task) => {
  const date = task.deadlineDate || task.endDate;
  const time = task.deadlineTime || task.endTime || '23:59';
  if (!date) return null;

  const dueAt = new Date(`${date}T${time}`);
  return Number.isNaN(dueAt.getTime()) ? null : dueAt;
};

const formatDueAt = (date) => date.toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const formatRelativeDue = (dueAt, now) => {
  const diffMs = dueAt.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const minutes = Math.max(1, Math.round(absMs / (60 * 1000)));
  const hours = Math.round(absMs / (60 * 60 * 1000));
  const days = Math.round(absMs / (24 * 60 * 60 * 1000));

  const unitText = days >= 1
    ? `${days} day${days === 1 ? '' : 's'}`
    : hours >= 1
      ? `${hours} hour${hours === 1 ? '' : 's'}`
      : `${minutes} minute${minutes === 1 ? '' : 's'}`;

  return diffMs < 0 ? `${unitText} overdue` : `due in ${unitText}`;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
};

const isInQuietHours = (now, quietStart, quietEnd) => {
  const start = timeToMinutes(quietStart);
  const end = timeToMinutes(quietEnd);
  if (start === null || end === null || start === end) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return start < end
    ? current >= start && current < end
    : current >= start || current < end;
};

const buildReminder = (task, now, reminderWindowMs) => {
  if (task.status === 'completed') return null;

  const dueAt = getDueAt(task);
  if (!dueAt) return null;

  const diffMs = dueAt.getTime() - now.getTime();
  if (reminderWindowMs <= 0 || diffMs > reminderWindowMs) return null;

  const isOverdue = diffMs < 0;

  return {
    id: `${task.id}:${isOverdue ? 'overdue' : 'soon'}`,
    taskId: task.id,
    severity: isOverdue ? 'overdue' : 'soon',
    title: task.title,
    dueAt,
    dueAtText: formatDueAt(dueAt),
    relativeText: formatRelativeDue(dueAt, now),
    message: isOverdue
      ? `"${task.title}" was due ${formatDueAt(dueAt)}.`
      : `"${task.title}" is ${formatRelativeDue(dueAt, now)} (${formatDueAt(dueAt)}).`,
  };
};

export function useTaskReminders(tasks, {
  enabled = true,
  defaultReminder = '1day',
  quietStart = '',
  quietEnd = '',
} = {}) {
  const [now, setNow] = useState(() => new Date());
  const notifiedIds = useRef(new Set());
  const reminderWindowMs = reminderWindowMap[defaultReminder] ?? REMINDER_WINDOW_MS;

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), CHECK_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const reminders = useMemo(() => tasks
    .map(task => buildReminder(task, now, reminderWindowMs))
    .filter(Boolean)
    .sort((a, b) => a.dueAt - b.dueAt), [tasks, now, reminderWindowMs]);

  useEffect(() => {
    if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    if (isInQuietHours(now, quietStart, quietEnd)) return;

    reminders.slice(0, 3).forEach((reminder) => {
      if (notifiedIds.current.has(reminder.id)) return;
      notifiedIds.current.add(reminder.id);

      new Notification(reminder.severity === 'overdue' ? 'Task overdue' : 'Task almost due', {
        body: reminder.message,
        tag: reminder.id,
      });
    });
  }, [enabled, now, quietEnd, quietStart, reminders]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  };

  return { reminders, requestNotificationPermission };
}
