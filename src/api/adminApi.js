import { supabase } from '../config/supabase';

export const adminApi = {
  async getDashboardData() {
    const [profilesResult, tasksResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,name,username,email,role,created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('id,user_id,title,status,priority,category,end_date,end_time,deadline_date,deadline_time,created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (tasksResult.error) throw tasksResult.error;

    const tasksByUser = (tasksResult.data || []).reduce((counts, task) => {
      const current = counts[task.user_id] || { total: 0, completed: 0 };
      current.total += 1;
      if (task.status === 'completed') current.completed += 1;
      counts[task.user_id] = current;
      return counts;
    }, {});

    const users = (profilesResult.data || []).map(profile => ({
      ...profile,
      taskCount: tasksByUser[profile.id]?.total || 0,
      completedTaskCount: tasksByUser[profile.id]?.completed || 0,
    }));
    const profileById = Object.fromEntries(users.map(user => [user.id, user]));
    const tasks = (tasksResult.data || []).map(task => ({
      ...task,
      ownerName: profileById[task.user_id]?.name || profileById[task.user_id]?.username || 'Unknown user',
      ownerEmail: profileById[task.user_id]?.email || '',
    }));

    return {
      users,
      tasks,
      totalUsers: users.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      activeTasks: tasks.filter(task => task.status !== 'completed').length,
      adminUsers: users.filter(user => user.role === 'admin').length,
    };
  },

  async updateUser({ id, name, username, role }) {
    const { error } = await supabase.rpc('admin_update_user', {
      target_user_id: id,
      new_name: name.trim() || null,
      new_username: username.trim().toLowerCase(),
      new_role: role,
    });

    if (error) throw error;
  },

  async deleteUser(id) {
    const { error } = await supabase.rpc('admin_delete_user', {
      target_user_id: id,
    });

    if (error) throw error;
  },

  async updateTaskStatus(id, status) {
    const { error } = await supabase.rpc('admin_update_task_status', {
      target_task_id: id,
      new_status: status,
    });
    if (error) throw error;
  },

  async deleteTask(id) {
    const { error } = await supabase.rpc('admin_delete_task', {
      target_task_id: id,
    });
    if (error) throw error;
  },
};
