import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, LayoutDashboard, ListTodo, LogOut, Pencil, Save, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import '../Admin.css';

function EditUserModal({ user, saving, error, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user.name || '',
    username: user.username || '',
    role: user.role || 'user',
  });

  const submit = (event) => {
    event.preventDefault();
    onSave({ ...user, ...form });
  };

  return (
    <div className="admin-modal-overlay">
      <form className="admin-modal" onSubmit={submit}>
        <div className="admin-modal-head">
          <div><h2>Edit user</h2><p>{user.email}</p></div>
          <button type="button" className="admin-icon-btn" onClick={onClose} title="Close"><X size={16} /></button>
        </div>
        {error && <div className="admin-action-error">{error}</div>}
        <label className="admin-field"><span>Full name</span><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label className="admin-field"><span>Username</span><input value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} required /></label>
        <label className="admin-field"><span>Role</span><select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}><option value="user">User</option><option value="admin">Admin</option></select></label>
        <div className="admin-modal-actions">
          <button type="button" className="admin-secondary-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-primary-btn" disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
}

function DeleteUserModal({ user, deleting, error, onDelete, onClose }) {
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal admin-delete-modal">
        <div className="admin-danger-icon"><Trash2 size={21} /></div>
        <h2>Delete this account?</h2>
        <p>This permanently removes <strong>{user.username || user.email}</strong>, their profile, and all their tasks.</p>
        {error && <div className="admin-action-error">{error}</div>}
        <div className="admin-modal-actions">
          <button className="admin-secondary-btn" onClick={onClose}>Cancel</button>
          <button className="admin-danger-btn" onClick={() => onDelete(user.id)} disabled={deleting}><Trash2 size={15} /> {deleting ? 'Deleting...' : 'Delete account'}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteTaskModal({ task, deleting, error, onDelete, onClose }) {
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal admin-delete-modal">
        <div className="admin-danger-icon"><Trash2 size={21} /></div>
        <h2>Delete this task?</h2>
        <p>This permanently removes <strong>{task.title}</strong> from {task.ownerName}.</p>
        {error && <div className="admin-action-error">{error}</div>}
        <div className="admin-modal-actions">
          <button className="admin-secondary-btn" onClick={onClose}>Cancel</button>
          <button className="admin-danger-btn" onClick={() => onDelete(task.id)} disabled={deleting}><Trash2 size={15} /> {deleting ? 'Deleting...' : 'Delete task'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ currentUser, onLogout }) {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [taskQuery, setTaskQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const adminName = currentUser.name?.trim().split(/\s+/)[0] || currentUser.username || 'Admin';

  const loadData = useCallback(async () => {
    try {
      setError('');
      setData(await adminApi.getDashboardData());
    } catch {
      setError('Unable to load admin data. Check that the admin database migrations have been applied.');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdateUser = async (user) => {
    setActionPending(true);
    setActionError('');
    try {
      await adminApi.updateUser(user);
      setEditingUser(null);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Unable to update this user.');
    } finally {
      setActionPending(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setActionPending(true);
    setActionError('');
    try {
      await adminApi.deleteUser(id);
      setDeletingUser(null);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Unable to delete this user.');
    } finally {
      setActionPending(false);
    }
  };

  const handleTaskStatus = async (id, status) => {
    setActionPending(true);
    setActionError('');
    try {
      await adminApi.updateTaskStatus(id, status);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Unable to update this task.');
    } finally {
      setActionPending(false);
    }
  };

  const handleDeleteTask = async (id) => {
    setActionPending(true);
    setActionError('');
    try {
      await adminApi.deleteTask(id);
      setDeletingTask(null);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Unable to delete this task.');
    } finally {
      setActionPending(false);
    }
  };

  const users = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return data.users;

    return data.users.filter(user => [user.name, user.username, user.email, user.id]
      .some(value => (value || '').toLowerCase().includes(needle)));
  }, [data, query]);

  const tasks = useMemo(() => {
    if (!data) return [];
    const needle = taskQuery.trim().toLowerCase();
    if (!needle) return data.tasks;
    return data.tasks.filter(task => [task.title, task.ownerName, task.ownerEmail, task.category, task.status]
      .some(value => (value || '').toLowerCase().includes(needle)));
  }, [data, taskQuery]);

  return (
    <div className="admin-root">
      <header className="admin-topbar">
        <div className="admin-heading">
          <span className="admin-heading-icon"><ShieldCheck size={22} /></span>
          <div>
            <span className="admin-eyebrow">System administration</span>
            <h1>Welcome, {adminName}</h1>
            <p>Signed in as {currentUser.email}</p>
          </div>
        </div>
        <button className="admin-logout-btn" onClick={onLogout}>
          <LogOut size={16} /> Sign out
        </button>
      </header>

      <nav className="admin-section-nav">
        <button className={activeSection === 'overview' ? 'active' : ''} onClick={() => setActiveSection('overview')}><LayoutDashboard size={16} /> Overview</button>
        <button className={activeSection === 'users' ? 'active' : ''} onClick={() => setActiveSection('users')}><Users size={16} /> Users</button>
        <button className={activeSection === 'tasks' ? 'active' : ''} onClick={() => setActiveSection('tasks')}><ListTodo size={16} /> Tasks</button>
      </nav>

      <main className="admin-main">
        {error ? (
          <div className="admin-error">{error}</div>
        ) : !data ? (
          <div className="admin-placeholder">Fetching user records...</div>
        ) : (
          <>
            {activeSection === 'overview' && <><section className="admin-stats">
              <div className="admin-stat">
                <Users size={19} />
                <div><strong>{data.totalUsers}</strong><span>Users</span></div>
              </div>
              <div className="admin-stat">
                <ClipboardList size={19} />
                <div><strong>{data.totalTasks}</strong><span>Total tasks</span></div>
              </div>
              <div className="admin-stat success">
                <ShieldCheck size={19} />
                <div><strong>{data.completedTasks}</strong><span>Completed</span></div>
              </div>
            </section>
            <section className="admin-overview-grid">
              <div className="admin-control-panel"><h2>Account control</h2><strong>{data.adminUsers}</strong><p>Administrators with elevated access</p><button onClick={() => setActiveSection('users')}>Manage users</button></div>
              <div className="admin-control-panel"><h2>Task operations</h2><strong>{data.activeTasks}</strong><p>Active tasks across all accounts</p><button onClick={() => setActiveSection('tasks')}>Manage tasks</button></div>
              <div className="admin-control-panel"><h2>Completion rate</h2><strong>{data.totalTasks ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0}%</strong><p>Tasks completed system-wide</p></div>
            </section></>}

            {activeSection === 'users' && <section className="admin-users-section">
              <div className="admin-section-head">
                <div><h2>Users</h2><p>Unique account identities and activity.</p></div>
                <label className="admin-search">
                  <Search size={15} />
                  <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search users" />
                </label>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>User</th><th>Unique ID</th><th>Role</th><th>Tasks</th><th>Joined</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td><strong>{user.name || user.username || 'Unnamed user'}</strong><span>{user.email}</span></td>
                        <td><code>{user.id}</code></td>
                        <td><span className={`admin-role ${user.role || 'user'}`}>{user.role || 'user'}</span></td>
                        <td>{user.completedTaskCount} / {user.taskCount}</td>
                        <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className="admin-row-actions">
                            <button className="admin-edit-btn" onClick={() => { setActionError(''); setEditingUser(user); }}><Pencil size={14} /> Edit</button>
                            <button className="admin-icon-btn danger" onClick={() => { setActionError(''); setDeletingUser(user); }} disabled={user.id === currentUser.id} title={user.id === currentUser.id ? 'You cannot delete your own account' : 'Delete user'}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!users.length && <div className="admin-empty">No users match that search.</div>}
            </section>}

            {activeSection === 'tasks' && <section className="admin-users-section">
              <div className="admin-section-head">
                <div><h2>Task operations</h2><p>Review, update, and remove tasks across the system.</p></div>
                <label className="admin-search"><Search size={15} /><input value={taskQuery} onChange={event => setTaskQuery(event.target.value)} placeholder="Search tasks or owners" /></label>
              </div>
              {actionError && <div className="admin-action-error">{actionError}</div>}
              <div className="admin-table-wrap">
                <table className="admin-table admin-task-table">
                  <thead><tr><th>Task</th><th>Owner</th><th>Priority</th><th>Status</th><th>Due</th><th>Actions</th></tr></thead>
                  <tbody>{tasks.map(task => (
                    <tr key={task.id}>
                      <td><strong>{task.title}</strong><span>{task.category || 'Uncategorized'}</span></td>
                      <td><strong>{task.ownerName}</strong><span>{task.ownerEmail}</span></td>
                      <td><span className={`admin-priority ${task.priority}`}>{task.priority}</span></td>
                      <td><select className="admin-status-select" value={task.status} onChange={event => handleTaskStatus(task.id, event.target.value)} disabled={actionPending}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></select></td>
                      <td>{task.deadline_date || task.end_date || '-'}</td>
                      <td><button className="admin-icon-btn danger" onClick={() => { setActionError(''); setDeletingTask(task); }} title="Delete task"><Trash2 size={15} /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {!tasks.length && <div className="admin-empty">No tasks match that search.</div>}
            </section>}
          </>
        )}
      </main>
      {editingUser && <EditUserModal user={editingUser} saving={actionPending} error={actionError} onSave={handleUpdateUser} onClose={() => setEditingUser(null)} />}
      {deletingUser && <DeleteUserModal user={deletingUser} deleting={actionPending} error={actionError} onDelete={handleDeleteUser} onClose={() => setDeletingUser(null)} />}
      {deletingTask && <DeleteTaskModal task={deletingTask} deleting={actionPending} error={actionError} onDelete={handleDeleteTask} onClose={() => setDeletingTask(null)} />}
    </div>
  );
}
