import { supabase } from '../config/supabase';

export const toTaskRow = (task, userId) => ({
  user_id: userId,
  title: task.title,
  description: task.description || null,
  priority: task.priority,
  category: task.category || null,
  status: task.status,
  start_date: task.startDate || null,
  start_time: task.startTime || null,
  end_date: task.endDate || null,
  end_time: task.endTime || null,
  deadline_date: task.deadlineDate || null,
  deadline_time: task.deadlineTime || null,
  completed_at: task.completedAt || null,
});

export const fromTaskRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  priority: row.priority,
  category: row.category,
  status: row.status,
  startDate: row.start_date,
  startTime: row.start_time,
  endDate: row.end_date,
  endTime: row.end_time,
  deadlineDate: row.deadline_date,
  deadlineTime: row.deadline_time,
  completedAt: row.completed_at,
  createdAt: row.created_at,
});

export const tasksApi = {
  async list(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromTaskRow);
  },

  subscribe(userId, onChange) {
    const channel = supabase
      .channel(`tasks_changes:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        onChange
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  async create(userId, task) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(toTaskRow(task, userId))
      .select()
      .single();

    if (error) throw error;
    return fromTaskRow(data);
  },

  async update(id, updates, userId) {
    const row = toTaskRow(updates, userId);
    delete row.user_id;

    const { data, error } = await supabase
      .from('tasks')
      .update(row)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return fromTaskRow(data);
  },

  async delete(id, userId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
