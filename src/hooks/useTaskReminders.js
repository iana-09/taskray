import { useEffect, useMemo, useRef, useState } from 'react';

const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;

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

const buildReminder = (task, now) => {
  if (task.status === 'completed') return null;

  const dueAt = getDueAt(task);
  if (!dueAt) return null;

  const diffMs = dueAt.getTime() - now.getTime();
  if (diffMs > REMINDER_WINDOW_MS) return null;

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

export function useTaskReminders(tasks, { enabled = true } = {}) {
  const [now, setNow] = useState(() => new Date());
  const notifiedIds = useRef(new Set());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), CHECK_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  const reminders = useMemo(() => tasks
    .map(task => buildReminder(task, now))
    .filter(Boolean)
    .sort((a, b) => a.dueAt - b.dueAt), [tasks, now]);

  useEffect(() => {
    if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') return;

    reminders.slice(0, 3).forEach((reminder) => {
      if (notifiedIds.current.has(reminder.id)) return;
      notifiedIds.current.add(reminder.id);

      new Notification(reminder.severity === 'overdue' ? 'Task overdue' : 'Task almost due', {
        body: reminder.message,
        tag: reminder.id,
      });
    });
  }, [enabled, reminders]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  };

  return { reminders, requestNotificationPermission };
}
