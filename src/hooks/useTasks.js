import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/tasksApi';

const withTimeout = (promise, ms, message) => Promise.race([
  promise,
  new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error(message)), ms);
  }),
]);

export function useTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshTasks = useCallback(async () => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    try {
      const data = await withTimeout(tasksApi.list(userId), 8000, 'Tasks request timed out');
      setTasks(data);
      return data;
    } catch (err) {
      console.warn('Task load failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return undefined;
    }

    refreshTasks().catch(() => {});
    return tasksApi.subscribe(userId, () => refreshTasks().catch(() => {}));
  }, [userId, refreshTasks]);

  const addTask = async (task) => {
    const data = await tasksApi.create(userId, task);
    setTasks(prev => [data, ...prev]);
    return data;
  };

  const updateTask = async (id, updates) => {
    const existing = tasks.find(t => t.id === id);
    const merged = { ...existing, ...updates };
    const data = await tasksApi.update(id, merged, userId);
    setTasks(prev => prev.map(t => t.id === id ? data : t));
    return data;
  };

  const deleteTask = async (id) => {
    await tasksApi.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return { tasks, loading, refreshTasks, addTask, updateTask, deleteTask };
}
