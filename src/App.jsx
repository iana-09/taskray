import React, { useRef, useState, useEffect, useCallback } from 'react';
import './App.css';
import Login from './components/Login';
import Signup from './components/Signup';
import ResetPassword from './components/ResetPassword';
import AdminDashboard from './components/AdminDashboard';
import GwaCalculator from './components/GwaCalculator';
import EssayPractice from './components/EssayPractice';
import FocusBreak from './components/FocusBreak/FocusBreak';
import { authApi } from './api/authApi';
import { profilesApi } from './api/profilesApi';
import { useTasks } from './hooks/useTasks';
import { useTaskReminders } from './hooks/useTaskReminders';

const Icons = {
  Zap:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Circle:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>,
  Clock:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Check:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Flame:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>,
  Settings: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  User:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  LogOut:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Plus:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Edit:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  ChevronLeft:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Save:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Alert:    () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Camera:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Calendar: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Timer:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="15" y2="11"/><circle cx="12" cy="14" r="8"/></svg>,
  Chart:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Clipboard: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>,
  Book:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5z"/></svg>,
  Refresh:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 01-15.3 6.4"/><polyline points="3 18 5.7 18.4 6.1 15.7"/><path d="M3 12A9 9 0 0118.3 5.6"/><polyline points="21 6 18.3 5.6 17.9 8.3"/></svg>,
  Graduation: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 10v6"/></svg>,
  Sparkles: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/><path d="M5 14l.7 1.8L8 16.5l-2.3.7L5 19l-.7-1.8L2 16.5l2.3-.7L5 14z"/></svg>,
  Info:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="12" y1="7" x2="12.01" y2="7"/></svg>,
  Pen:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
  Gamepad:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="4"/></svg>,
};

const tutorialSteps = [
  {
    title: 'Welcome to TaskRay',
    view: 'productivity',
    target: 'workspace',
    body: 'This is your daily command center. It shows your productivity score, today focus, agenda, reviewer progress, and academic shortcuts in one place.',
    tip: 'Start here when you want a quick view of your day.',
  },
  {
    title: 'Sidebar Navigation',
    view: 'productivity',
    target: 'sidebar',
    body: 'Use the sidebar to move between your workspace, study tools, TaskTris, GWA calculator, profile, and settings.',
    tip: 'The badges show quick counts like tasks, calendar events, and review progress.',
  },
  {
    title: 'Quick Actions',
    view: 'productivity',
    target: 'quick-actions',
    body: 'These buttons help you jump into common actions fast, like creating a task, opening the calendar, reviewing, writing essays, or checking GWA.',
    tip: 'They change depending on the tab you are currently using.',
  },
  {
    title: 'Tasks',
    view: 'tasks',
    target: 'tasks',
    body: 'This is where users create, preview, edit, track, and organize tasks. You can filter by status, category, priority, or change the task view.',
    tip: 'Use Preview when you want to focus on one task without editing it.',
  },
  {
    title: 'Pomodoro',
    view: 'pomodoro',
    target: 'pomodoro',
    body: 'Pomodoro helps users focus with a timer. The mini timer can stay visible while moving around TaskRay.',
    tip: 'Use Float outside if you want a separate timer window.',
  },
  {
    title: 'Calendar',
    view: 'calendar',
    target: 'calendar',
    body: 'Schedule agendas, check your monthly calendar, and click events to preview their details in a focused overlay.',
    tip: 'Use the year and month controls for future planning.',
  },
  {
    title: 'Reviewer',
    view: 'review',
    target: 'reviewer',
    body: 'Create subject reviewers with flashcards and quiz exercises. Users can choose timed quizzes and review modes.',
    tip: 'Each subject can have its own cards, questions, and score progress.',
  },
  {
    title: 'Essay Practice',
    view: 'essay',
    target: 'essay',
    body: 'Practice essay writing with prompts, writing stats, saved drafts, and feedback designed to improve skills without writing the essay for the user.',
    tip: 'Use it for timed writing, reflections, or exam practice.',
  },
  {
    title: 'TaskTris',
    view: 'focusBreak',
    target: 'tasktris',
    body: 'TaskTris is a focus break game with difficulty levels, saved high score, reserve block, and keyboard controls.',
    tip: 'Start with Chill mode if you only want a light break.',
  },
  {
    title: 'GWA Calculator',
    view: 'gwa',
    target: 'gwa',
    body: 'Upload or paste grades, review detected subjects, calculate final-grade GWA, save history, and check TPS qualification.',
    tip: 'Final grades are used for computation, and users can review rows before saving.',
  },
  {
    title: 'Profile and Settings',
    view: 'productivity',
    target: 'profile-settings',
    body: 'Profile stores the user account details, while Settings controls preferences like dashboard theme, reminders, and compact view.',
    tip: 'Themes update TaskRay colors across buttons, forms, cards, and panels.',
  },
];

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon-wrap warning"><Icons.Alert /></div>
        <h2 className="modal-title">Sign out?</h2>
        <p className="modal-desc">You'll need to sign back in to access your tasks.</p>
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-btn-danger" onClick={onConfirm}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

function DeleteTaskModal({ task, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon-wrap danger"><Icons.Trash /></div>
        <h2 className="modal-title">Delete task?</h2>
        <p className="modal-desc">This permanently removes <strong>{task.title}</strong>.</p>
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function TaskPreviewModal({ task, fmtDT, isOverdue, onClose, onEdit, onDelete, onStatusChange }) {
  const scheduleLabel = task.startDate || task.endDate
    ? `${fmtDT(task.startDate, task.startTime)}${task.startDate && task.endDate ? ' to ' : ''}${fmtDT(task.endDate, task.endTime)}`
    : 'No schedule added';
  const deadlineLabel = task.deadlineDate ? fmtDT(task.deadlineDate, task.deadlineTime) : 'No deadline added';

  return (
    <div className="modal-overlay task-preview-overlay" role="dialog" aria-modal="true" aria-label="Task preview">
      <article className={`task-preview-modal ${task.status}${isOverdue(task) ? ' overdue' : ''}`}>
        <button className="task-preview-close" type="button" onClick={onClose} title="Close preview">
          <Icons.X />
        </button>
        <div className="task-preview-head">
          <span className={`dash-priority-dot ${task.priority}`} />
          <div>
            <span className="metric-label">Task preview</span>
            <h2>{task.title}</h2>
          </div>
          <span className={`dash-priority-badge ${task.priority}`}>{task.priority}</span>
        </div>

        <p className="task-preview-desc">
          {task.description || 'No description added for this task yet.'}
        </p>

        <div className="task-preview-grid">
          <div>
            <span>Category</span>
            <strong>{task.category || 'Other'}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{task.status === 'completed' ? 'Completed' : task.status === 'in-progress' ? 'In Progress' : 'To Do'}</strong>
          </div>
          <div>
            <span>Schedule</span>
            <strong>{scheduleLabel}</strong>
          </div>
          <div>
            <span>Deadline</span>
            <strong>{deadlineLabel}</strong>
          </div>
        </div>

        <div className="task-preview-status">
          <label htmlFor={`preview-status-${task.id}`}>Quick status</label>
          <select
            id={`preview-status-${task.id}`}
            value={task.status}
            onChange={event => onStatusChange(task.id, { status: event.target.value })}
            className="dash-status-select"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="task-preview-actions">
          <button type="button" className="dash-btn-edit" onClick={() => onEdit(task)}>
            <Icons.Edit /> Edit task
          </button>
          <button type="button" className="dash-btn-delete" onClick={() => onDelete(task)}>
            <Icons.Trash /> Delete
          </button>
        </div>
      </article>
    </div>
  );
}

function TutorialOverlay({ steps, stepIndex, onNext, onPrevious, onClose, onJump }) {
  const step = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [cardPosition, setCardPosition] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const cardRef = useRef(null);
  const dragRef = useRef(null);

  const updateSpotlight = useCallback(() => {
    const target = document.querySelector(`[data-tutorial-target="${step.target}"]`);
    if (!target) {
      setSpotlightRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = 10;
    const left = Math.max(14, rect.left - padding);
    const top = Math.max(14, rect.top - padding);
    const width = Math.min(window.innerWidth - left - 14, rect.width + padding * 2);
    const height = Math.min(window.innerHeight - top - 14, rect.height + padding * 2);

    setSpotlightRect({ left, top, width, height });
  }, [step.target]);

  useEffect(() => {
    const target = document.querySelector(`[data-tutorial-target="${step.target}"]`);
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });

    updateSpotlight();
    const settleTimer = window.setTimeout(updateSpotlight, 280);
    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [step.target, updateSpotlight]);

  useEffect(() => {
    const handlePointerMove = event => {
      if (!dragRef.current) return;
      const { offsetX, offsetY, width, height } = dragRef.current;
      const margin = 12;
      const nextLeft = Math.min(Math.max(margin, event.clientX - offsetX), window.innerWidth - width - margin);
      const nextTop = Math.min(Math.max(margin, event.clientY - offsetY), window.innerHeight - height - margin);
      setCardPosition({ left: nextLeft, top: nextTop });
    };

    const handlePointerUp = () => {
      dragRef.current = null;
      document.body.classList.remove('tutorial-dragging');
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.body.classList.remove('tutorial-dragging');
    };
  }, []);

  const handleCardDragStart = event => {
    if (event.button !== 0 || event.target.closest('button, select, option')) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setCardPosition({ left: rect.left, top: rect.top });
    document.body.classList.add('tutorial-dragging');
  };

  return (
    <div className="tutorial-layer" role="dialog" aria-modal="true" aria-label="TaskRay tutorial">
      <div className={`tutorial-scrim${spotlightRect ? ' has-spotlight' : ''}`} />
      {spotlightRect && (
        <div
          className="tutorial-spotlight"
          style={{
            left: `${spotlightRect.left}px`,
            top: `${spotlightRect.top}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`,
          }}
          aria-hidden="true"
        />
      )}
      <article
        ref={cardRef}
        className={`tutorial-card${isMinimized ? ' is-minimized' : ''}`}
        style={cardPosition ? { left: `${cardPosition.left}px`, top: `${cardPosition.top}px`, right: 'auto' } : undefined}
      >
        <div className="tutorial-card-top" onPointerDown={handleCardDragStart} title="Drag to move tutorial">
          <strong>{stepIndex + 1} / {steps.length}</strong>
          <div className="tutorial-progress" aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
          <select
            value={stepIndex}
            onChange={event => onJump(Number(event.target.value))}
            aria-label="Choose tutorial step"
          >
            {steps.map((item, index) => (
              <option value={index} key={item.title}>
                {index + 1}. {item.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="tutorial-minimize"
            onClick={() => setIsMinimized(current => !current)}
            title={isMinimized ? 'Expand tutorial' : 'Minimize tutorial'}
            aria-label={isMinimized ? 'Expand tutorial' : 'Minimize tutorial'}
          >
            {isMinimized ? 'Open' : '-'}
          </button>
          <button type="button" className="tutorial-close" onClick={onClose} title="Close tutorial">
            <Icons.X />
          </button>
        </div>
        {!isMinimized && (
          <>
            <div className="tutorial-card-body">
              <span className="metric-label">Guided tutorial</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
              <div className="tutorial-tip">
                <Icons.Sparkles />
                <span>{step.tip}</span>
              </div>
            </div>
            <div className="tutorial-card-actions">
              <button type="button" onClick={onPrevious} disabled={stepIndex === 0}>
                <Icons.ChevronLeft /> Previous
              </button>
              <button type="button" className="tutorial-next" onClick={onNext}>
                {stepIndex === steps.length - 1 ? 'Finish' : 'Next'} <Icons.ChevronRight />
              </button>
            </div>
            <p className="tutorial-shortcuts">
              Drag or resize this card if it blocks the highlighted area. Press Esc to close.
            </p>
          </>
        )}
        {isMinimized && (
          <div className="tutorial-minimized-row">
            <span>{step.title}</span>
            <button type="button" onClick={onNext}>
              {stepIndex === steps.length - 1 ? 'Finish' : 'Next'} <Icons.ChevronRight />
            </button>
          </div>
        )}
      </article>
    </div>
  );
}

function MetricWave() {
  return (
    <svg className="metric-wave" viewBox="0 0 320 44" preserveAspectRatio="none" aria-hidden="true">
      <path className="metric-wave-shadow" d="M4 34 C 30 26, 42 18, 66 25 S 104 35, 130 25 S 174 15, 204 24 S 244 35, 272 24 S 304 15, 316 22" />
      <path className="metric-wave-line" d="M4 34 C 30 26, 42 18, 66 25 S 104 35, 130 25 S 174 15, 204 24 S 244 35, 272 24 S 304 15, 316 22" />
    </svg>
  );
}

const getSavedProfileDetails = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(`taskray-profile-details-${userId}`) || '{}');
  } catch {
    return {};
  }
};

const firstText = (...values) => {
  const value = values.find(item => typeof item === 'string' ? item.trim() : item);
  return typeof value === 'string' ? value.trim() : value || '';
};

const normalizeUserProfile = (user = {}, profile = {}, savedDetails = {}) => {
  const metadata = user.user_metadata || user.userMetadata || user.raw_user_meta_data || {};
  const email = firstText(profile.email, savedDetails.email, user.email, metadata.email);
  const emailName = email ? email.split('@')[0] : '';
  const username = firstText(savedDetails.username, profile.username, user.username, metadata.username, emailName);
  const name = firstText(
    savedDetails.name,
    profile.name,
    user.name,
    metadata.name,
    metadata.full_name,
    metadata.display_name,
    username,
    emailName
  );
  const avatarUrl = firstText(
    savedDetails.avatarUrl,
    profile.avatarUrl,
    profile.avatar_url,
    user.avatarUrl,
    metadata.avatar_url,
    metadata.picture
  );

  return {
    ...user,
    ...profile,
    ...savedDetails,
    name,
    username: username ? username.toLowerCase() : '',
    email,
    avatarUrl,
    avatarZoom: Number(savedDetails.avatarZoom || profile.avatarZoom || user.avatarZoom || 1),
    program: firstText(savedDetails.program, profile.program, user.program),
    role: profile.role || savedDetails.role || user.role || metadata.role || 'user',
  };
};

function ProfileModal({ user, onSave, onClose }) {
  const savedDetails = getSavedProfileDetails(user.id);
  const initialProfile = normalizeUserProfile(user, user, savedDetails);
  const [name, setName]         = useState(initialProfile.name || '');
  const [username, setUsername] = useState(initialProfile.username || '');
  const [email, setEmail]       = useState(initialProfile.email || '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl || '');
  const [avatarZoom, setAvatarZoom] = useState(initialProfile.avatarZoom || 1);
  const [program, setProgram] = useState(initialProfile.program || '');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    let isMounted = true;
    const hydrateProfile = async () => {
      const localDetails = getSavedProfileDetails(user.id);
      const applyProfile = (profile = {}) => {
        const nextUser = normalizeUserProfile(user, profile, localDetails);
        if (!isMounted) return;
        setName(nextUser.name || '');
        setUsername(nextUser.username || '');
        setEmail(nextUser.email || '');
        setAvatarUrl(nextUser.avatarUrl || '');
        setAvatarZoom(nextUser.avatarZoom || 1);
        setProgram(nextUser.program || '');
      };

      applyProfile(user);
      try {
        const freshProfile = await profilesApi.getById(user.id);
        applyProfile(freshProfile);
      } catch {
        // Keep the auth metadata/local profile fallback when Supabase is slow or unavailable.
      }
    };

    hydrateProfile();
    return () => { isMounted = false; };
  }, [user]);

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo is too large. Please use an image under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(String(reader.result || ''));
      setAvatarZoom(1);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!username.trim()) return setError('Username is required');
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return setError('Username: letters, numbers, underscores only');
    setSaving(true);
    try {
      const [usernameConflict, emailConflict] = await Promise.all([
        profilesApi.usernameExists(username, user.id),
        profilesApi.emailExists(email, user.id),
      ]);
      if (usernameConflict) { setError('Username already taken'); setSaving(false); return; }
      if (emailConflict) { setError('Email is already registered'); setSaving(false); return; }
      const data = await profilesApi.update(user.id, {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
      });
      const details = {
        avatarUrl,
        avatarZoom,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        program: program.trim(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`taskray-profile-details-${user.id}`, JSON.stringify(details));
      onSave(normalizeUserProfile(user, data, details));
    } catch { setError('Failed to save.'); }
    setSaving(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box wide">
        <div className="modal-header-row">
          <h2 className="modal-title">Edit Profile</h2>
          <button className="modal-close-btn" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="profile-avatar-section">
          <div className={`profile-avatar-lg${avatarUrl ? ' has-photo' : ''}`}>
            {avatarUrl ? <img src={avatarUrl} alt="Profile preview" style={{ transform: `scale(${avatarZoom})` }} /> : (name || username || '?')[0].toUpperCase()}
          </div>
          <div className="profile-photo-actions">
            <label className="profile-change-btn">
              <Icons.Camera /> Upload photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} />
            </label>
            {avatarUrl && (
              <button className="profile-change-btn muted" type="button" onClick={() => { setAvatarUrl(''); setAvatarZoom(1); }}>Remove</button>
            )}
          </div>
          {avatarUrl && (
            <label className="profile-photo-zoom">
              <span>Photo size</span>
              <input
                type="range"
                min="0.75"
                max="1.85"
                step="0.05"
                value={avatarZoom}
                onChange={event => setAvatarZoom(Number(event.target.value))}
              />
              <strong>{Math.round(avatarZoom * 100)}%</strong>
            </label>
          )}
        </div>
        {error && <p className="modal-error">{error}</p>}
        <div className="profile-edit-grid">
          <div className="modal-field"><label>Full Name</label>
            <input className="modal-input" value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="John Doe" /></div>
          <div className="modal-field"><label>Username</label>
            <input className="modal-input" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} placeholder="your_username" /></div>
          <div className="modal-field"><label>Email</label>
            <input className="modal-input" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@example.com" /></div>
          <div className="modal-field"><label>Program / Course</label>
            <input className="modal-input" value={program} onChange={e => setProgram(e.target.value)} placeholder="BSIT, BSEd, etc." /></div>
        </div>
        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn-save" onClick={handleSave} disabled={saving}>
            <Icons.Save /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ notificationsEnabled, notificationPermission, onToggleNotifications, themeId, onThemeChange, onClose }) {
  const [compact, setCompact]         = useState(false);
  const [defaultPriority, setDefault] = useState('medium');
  const notificationText = notificationPermission === 'granted'
    ? 'Browser alerts are enabled'
    : notificationPermission === 'denied'
      ? 'Browser alerts are blocked in this browser'
      : 'Alert 24 hours before tasks are due';

  return (
    <div className="modal-overlay">
      <div className="modal-box wide">
        <div className="modal-header-row">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close-btn" onClick={onClose}><Icons.X /></button>
        </div>
        <p className="settings-section-label">Preferences</p>
        <div className="settings-row">
          <div><p className="settings-row-title">Compact View</p><p className="settings-row-sub">Reduce spacing between tasks</p></div>
          <button className={`toggle-btn ${compact ? 'on' : ''}`} onClick={() => setCompact(!compact)}><span className="toggle-thumb" /></button>
        </div>
        <div className="settings-row">
          <div><p className="settings-row-title">Reminders</p><p className="settings-row-sub">{notificationText}</p></div>
          <button className={`toggle-btn ${notificationsEnabled ? 'on' : ''}`} onClick={onToggleNotifications}><span className="toggle-thumb" /></button>
        </div>
        <div className="settings-row">
          <div><p className="settings-row-title">Default Priority</p><p className="settings-row-sub">Applied to new tasks</p></div>
          <select className="settings-select" value={defaultPriority} onChange={e => setDefault(e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <p className="settings-section-label">Dashboard theme</p>
        <div className="theme-picker-grid" aria-label="Dashboard theme presets">
          {dashboardThemePresets.map(theme => (
            <button
              key={theme.id}
              type="button"
              className={`theme-swatch-card${themeId === theme.id ? ' active' : ''}`}
              onClick={() => onThemeChange(theme.id)}
              style={{
                '--swatch-a': theme.accent,
                '--swatch-b': theme.success,
                '--swatch-c': theme.backgroundEnd,
              }}
            >
              <span className="theme-swatch-dots"><i /><i /><i /></span>
              <strong>{theme.label}</strong>
              <small>{theme.description}</small>
            </button>
          ))}
        </div>
        <div className="modal-actions">
          <button className="modal-btn-save" onClick={onClose}><Icons.Check /> Done</button>
        </div>
      </div>
    </div>
  );
}

function ReminderPanel({ reminders, onDismiss, onEnableNotifications, notificationPermission }) {
  if (!reminders.length) return null;

  const topReminders = reminders.slice(0, 3);
  const hasMore = reminders.length > topReminders.length;

  return (
    <section className="reminder-panel">
      <div className="reminder-panel-head">
        <div className="reminder-title-wrap">
          <span className="reminder-icon"><Icons.Alert /></span>
          <div>
            <h2 className="reminder-title">Reminders</h2>
            <p className="reminder-subtitle">Tasks that are almost due or overdue.</p>
          </div>
        </div>
        {notificationPermission !== 'granted' && (
          <button className="reminder-enable-btn" onClick={onEnableNotifications}>
            Enable alerts
          </button>
        )}
      </div>
      <div className="reminder-list">
        {topReminders.map(reminder => (
          <div key={reminder.id} className={`reminder-item ${reminder.severity}`}>
            <div>
              <p className="reminder-item-title">{reminder.title}</p>
              <p className="reminder-item-meta">{reminder.relativeText} - {reminder.dueAtText}</p>
            </div>
            <button className="reminder-dismiss-btn" onClick={() => onDismiss(reminder.id)}>
              <Icons.X />
            </button>
          </div>
        ))}
      </div>
      {hasMore && <p className="reminder-more">+{reminders.length - topReminders.length} more reminder{reminders.length - topReminders.length === 1 ? '' : 's'}</p>}
    </section>
  );
}

function NotificationCenter({
  items,
  count,
  onClose,
  onOpenItem,
  onDismissItem,
  onEnableNotifications,
  notificationPermission,
}) {
  const urgentItems = items.filter(item => item.priority === 'urgent');
  const recommendationItems = items.filter(item => item.priority === 'recommendation');
  const infoItems = items.filter(item => item.priority === 'info');

  return (
    <div className="notification-popover" role="dialog" aria-label="TaskRay notifications">
      <div className="notification-popover-head">
        <div>
          <span className="metric-label">Notification center</span>
          <h2>Alerts & recommendations</h2>
        </div>
        <div className="notification-head-actions">
          <span>{count}</span>
          <button type="button" onClick={onClose} title="Close notifications">
            <Icons.X />
          </button>
        </div>
      </div>

      {notificationPermission !== 'granted' && (
        <div className="notification-permission-card">
          <Icons.Alert />
          <div>
            <strong>Browser alerts are {notificationPermission === 'denied' ? 'blocked' : 'off'}</strong>
            <p>Enable alerts so TaskRay can remind you before tasks are due.</p>
          </div>
          {notificationPermission !== 'denied' && (
            <button type="button" onClick={onEnableNotifications}>Enable</button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="notification-empty">
          <Icons.Check />
          <strong>No notifications right now</strong>
          <p>You are all caught up. TaskRay will show reminders and study suggestions here.</p>
        </div>
      ) : (
        <div className="notification-sections">
          {urgentItems.length > 0 && (
            <section>
              <h3>Needs Attention</h3>
              {urgentItems.map(item => (
                <NotificationItem key={item.id} item={item} onOpen={onOpenItem} onDismiss={onDismissItem} />
              ))}
            </section>
          )}
          {recommendationItems.length > 0 && (
            <section>
              <h3>Recommended For You</h3>
              {recommendationItems.map(item => (
                <NotificationItem key={item.id} item={item} onOpen={onOpenItem} onDismiss={onDismissItem} />
              ))}
            </section>
          )}
          {infoItems.length > 0 && (
            <section>
              <h3>Updates</h3>
              {infoItems.map(item => (
                <NotificationItem key={item.id} item={item} onOpen={onOpenItem} onDismiss={onDismissItem} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({ item, onOpen, onDismiss }) {
  return (
    <article className={`notification-item ${item.tone || ''}`}>
      <span className="notification-item-icon">{item.icon}</span>
      <div className="notification-item-copy">
        <strong>{item.title}</strong>
        <p>{item.body}</p>
        {item.meta && <small>{item.meta}</small>}
      </div>
      <div className="notification-item-actions">
        {item.actionLabel && (
          <button type="button" onClick={() => onOpen(item)}>
            {item.actionLabel}
          </button>
        )}
        {item.dismissible && (
          <button type="button" className="ghost" onClick={() => onDismiss(item)}>
            <Icons.X />
          </button>
        )}
      </div>
    </article>
  );
}

const withTimeout = (promise, ms, message) => Promise.race([
  promise,
  new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error(message)), ms);
  }),
]);

const trackerTypes = [
  'Assignments',
  'Quizzes',
  'Exams',
  'Thesis Tasks',
  'Chores',
  'Other',
];

const dailyQuotes = [
  { text: 'Small steps today, real progress tonight.', author: 'TaskRay' },
  { text: 'Focus on the next clear action, not the whole mountain.', author: 'Study note' },
  { text: 'Discipline today, success tomorrow.', author: 'TaskRay' },
  { text: 'You do not need a perfect plan to begin.', author: 'TaskRay' },
  { text: 'A calm mind makes sharper work.', author: 'Study note' },
  { text: 'Finish one thing well, then choose the next.', author: 'TaskRay' },
  { text: 'Progress feels quiet until it adds up.', author: 'TaskRay' },
];

const defaultReviewers = [
  {
    id: 'study-skills',
    subject: 'Study Skills',
    reviewModes: ['flashcards', 'multiple-choice', 'identification', 'true-false', 'mixed'],
    flashcards: [
      {
        id: 'card-active-recall',
        term: 'Active Recall',
        meaning: 'A study method where you try to remember the answer before checking notes.',
      },
      {
        id: 'card-spaced-repetition',
        term: 'Spaced Repetition',
        meaning: 'Reviewing material across increasing time intervals so you remember it longer.',
      },
    ],
    questions: [
      {
        id: 'question-active-recall',
        type: 'multiple-choice',
        question: 'Which study method asks you to remember the answer before checking notes?',
        options: ['Active recall', 'Highlighting only', 'Reading silently', 'Skipping review'],
        answer: 'Active recall',
      },
      {
        id: 'question-spaced-repetition',
        type: 'multiple-choice',
        question: 'What does spaced repetition help with?',
        options: ['Long-term memory', 'Making tasks disappear', 'Removing deadlines', 'Avoiding all quizzes'],
        answer: 'Long-term memory',
      },
    ],
  },
];

const reviewModeOptions = [
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'multiple-choice', label: 'Multiple Choice' },
  { id: 'identification', label: 'Identification' },
  { id: 'true-false', label: 'True or False' },
  { id: 'mixed', label: 'Mixed Quiz' },
];

const dashboardThemePresets = [
  {
    id: 'midnight',
    label: 'Midnight Ray',
    description: 'Calm navy with clean blue accents',
    accent: '#60a5fa',
    accentStrong: '#2563eb',
    success: '#2dd4bf',
    backgroundStart: '#070816',
    backgroundMid: '#0d1024',
    backgroundEnd: '#090d18',
    glowA: 'rgba(96,165,250,0.10)',
    glowB: 'rgba(45,212,191,0.06)',
    panel: 'rgba(24,27,52,0.9)',
    sidebar: 'rgba(9,11,27,0.92)',
  },
  {
    id: 'aurora',
    label: 'Aurora Mint',
    description: 'Fresh teal with soft slate depth',
    accent: '#5eead4',
    accentStrong: '#0f766e',
    success: '#86efac',
    backgroundStart: '#061615',
    backgroundMid: '#0b1f23',
    backgroundEnd: '#09111d',
    glowA: 'rgba(94,234,212,0.11)',
    glowB: 'rgba(134,239,172,0.07)',
    panel: 'rgba(19,42,48,0.88)',
    sidebar: 'rgba(7,22,27,0.92)',
  },
  {
    id: 'berry',
    label: 'Berry Pulse',
    description: 'Rose-violet without the glare',
    accent: '#f0abfc',
    accentStrong: '#a855f7',
    success: '#f9a8d4',
    backgroundStart: '#140b1c',
    backgroundMid: '#21142d',
    backgroundEnd: '#0f0b19',
    glowA: 'rgba(240,171,252,0.10)',
    glowB: 'rgba(168,85,247,0.08)',
    panel: 'rgba(39,27,56,0.89)',
    sidebar: 'rgba(18,12,31,0.93)',
  },
  {
    id: 'coffee',
    label: 'Coffee Focus',
    description: 'Warm coffee with readable amber',
    accent: '#f4c76f',
    accentStrong: '#b7791f',
    success: '#d9a441',
    backgroundStart: '#120f0c',
    backgroundMid: '#1d1713',
    backgroundEnd: '#111318',
    glowA: 'rgba(244,199,111,0.09)',
    glowB: 'rgba(217,164,65,0.06)',
    panel: 'rgba(39,32,28,0.9)',
    sidebar: 'rgba(20,17,15,0.94)',
  },
];

const monthValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const dateValue = (date) => `${monthValue(date)}-${String(date.getDate()).padStart(2, '0')}`;
const formatQuizTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
const persistentViews = ['productivity', 'tasks', 'pomodoro', 'calendar', 'review', 'essay', 'focusBreak', 'gwa'];

const titleCaseWords = (text) => text
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .split(' ')
  .filter(Boolean)
  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  .join(' ');

const getTaskTitleSuggestions = ({ title = '', description = '', category = 'Task' }) => {
  const raw = `${title} ${description}`.trim();
  const cleaned = titleCaseWords(raw.replace(/[^\w\s]/g, ' '));
  const fallback = titleCaseWords(category || 'Task');
  const base = cleaned || fallback;
  const words = base.split(' ').filter(Boolean);
  const compact = words.slice(0, 6).join(' ') || fallback;
  const categoryName = titleCaseWords(category || 'Task');
  const startsWithAction = /^(Prepare|Finish|Complete|Review|Study|Draft|Plan|Organize|Submit|Practice|Create|Update|Finalize)\b/i.test(compact);
  const actionBase = startsWithAction ? compact : `Complete ${compact}`;
  const suggestions = [
    actionBase,
    `Prepare ${compact}`,
    `Review ${categoryName}: ${compact}`,
    `Finalize ${compact}`,
  ];
  return [...new Set(suggestions)]
    .map(item => item.slice(0, 72))
    .slice(0, 4);
};

const getSavedPomodoroPosition = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('taskray-pomodoro-position') || 'null');
    if (typeof saved?.x === 'number' && typeof saved?.y === 'number') return saved;
  } catch {
    return null;
  }
  return null;
};

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const userScopedKey = (base, userId) => `${base}-${userId || 'guest'}`;

export default function App() {
  const suppressPomodoroClick = useRef(false);
  const pomodoroCanvasRef = useRef(null);
  const pomodoroVideoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [currentUser, setCurrentUser]   = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authView, setAuthView]         = useState('login');
  const [passwordRecovery, setPasswordRecovery] = useState(() => window.location.pathname === '/reset-password');
  const [activeView, setActiveView]     = useState(() => {
    const savedView = localStorage.getItem('taskray-active-view');
    return persistentViews.includes(savedView) ? savedView : 'productivity';
  });
  const [filter, setFilter]             = useState('all');
  const [sortBy, setSortBy]             = useState('priority');
  const [searchQuery, setSearchQuery]   = useState('');
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [editingTask, setEditingTask]   = useState(null);
  const [collapsed, setCollapsed]       = useState(false);
  const [showLogout, setShowLogout]     = useState(false);
  const [showProfile, setShowProfile]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(() => {
    const savedStep = Number(localStorage.getItem('taskray-tutorial-step') || 0);
    if (!Number.isFinite(savedStep)) return 0;
    return Math.min(Math.max(savedStep, 0), tutorialSteps.length - 1);
  });
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [previewTask, setPreviewTask] = useState(null);
  const [taskError, setTaskError]       = useState('');
  const [refreshingView, setRefreshingView] = useState('');
  const [essayRefreshToken, setEssayRefreshToken] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('taskray-notifications') !== 'off');
  const [notificationPermission, setNotificationPermission] = useState(() => (
    'Notification' in window ? Notification.permission : 'unsupported'
  ));
  const [dashboardThemeId, setDashboardThemeId] = useState(() => localStorage.getItem('taskray-dashboard-theme') || 'midnight');
  const [dismissedReminders, setDismissedReminders] = useState([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(() => Number(localStorage.getItem('taskray-pomodoro-minutes')) || 25);
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(() => pomodoroMinutes * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroPosition, setPomodoroPosition] = useState(getSavedPomodoroPosition);
  const [showMiniPomodoro, setShowMiniPomodoro] = useState(() => localStorage.getItem('taskray-mini-pomodoro') !== 'hidden');
  const [draggingPomodoro, setDraggingPomodoro] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('taskray-calendar-events') || '[]');
    } catch {
      return [];
    }
  });
  const [calendarMonth, setCalendarMonth] = useState(() => monthValue(new Date()));
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', notes: '' });
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [taskViewMode, setTaskViewMode] = useState(() => {
    const saved = localStorage.getItem('taskray-task-view-mode');
    return ['list', 'columns', 'box'].includes(saved) ? saved : 'list';
  });
  const [reviewers, setReviewers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('taskray-reviewers') || 'null');
      return Array.isArray(saved) && saved.length ? saved : defaultReviewers;
    } catch {
      return defaultReviewers;
    }
  });
  const [activeReviewerId, setActiveReviewerId] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('taskray-reviewers') || 'null');
      return Array.isArray(saved) && saved[0]?.id ? saved[0].id : defaultReviewers[0].id;
    } catch {
      return defaultReviewers[0].id;
    }
  });
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [knownFlashcards, setKnownFlashcards] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [subjectName, setSubjectName] = useState('');
  const [editingReviewerId, setEditingReviewerId] = useState(null);
  const [reviewerModes, setReviewerModes] = useState(['flashcards', 'multiple-choice']);
  const [exerciseMode, setExerciseMode] = useState('flashcards');
  const [showReviewerSubjects, setShowReviewerSubjects] = useState(true);
  const [quizSessionActive, setQuizSessionActive] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizRevealMode, setQuizRevealMode] = useState('end');
  const [quizTimeLimitMinutes, setQuizTimeLimitMinutes] = useState(() => Number(localStorage.getItem('taskray-review-quiz-minutes')) || 10);
  const [quizSecondsLeft, setQuizSecondsLeft] = useState(() => (Number(localStorage.getItem('taskray-review-quiz-minutes')) || 10) * 60);
  const [quizTimedOut, setQuizTimedOut] = useState(false);
  const [flashcardForm, setFlashcardForm] = useState({ term: '', meaning: '', id: null });
  const [quizForm, setQuizForm] = useState({ type: 'multiple-choice', question: '', options: ['', '', '', ''], answer: '', id: null });

  const [newTask, setNewTask] = useState({
    title:'', description:'', priority:'medium', category:'Assignments',
    startDate:'', startTime:'', endDate:'', endTime:'',
    deadlineDate:'', deadlineTime:'', status:'todo'
  });

  const { tasks, loading: tasksLoading, refreshTasks, addTask, updateTask, deleteTask } = useTasks(currentUser?.id);
  const { reminders, requestNotificationPermission } = useTaskReminders(tasks, { enabled: notificationsEnabled });
  const pomodoroDisplay = `${String(Math.floor(pomodoroSecondsLeft / 60)).padStart(2, '0')}:${String(pomodoroSecondsLeft % 60).padStart(2, '0')}`;
  const pomodoroStatus = pomodoroRunning
    ? 'Focus session running'
    : pomodoroSecondsLeft === 0
      ? 'Session complete'
      : 'Ready when you are';
  const dashboardTheme = dashboardThemePresets.find(theme => theme.id === dashboardThemeId) || dashboardThemePresets[0];
  const dashboardThemeStyle = {
    '--accent': dashboardTheme.accent,
    '--accent-strong': dashboardTheme.accentStrong,
    '--theme-accent-2': dashboardTheme.success,
    '--accent-soft': `${dashboardTheme.accent}2e`,
    '--success': dashboardTheme.success,
    '--theme-warning': `color-mix(in srgb, ${dashboardTheme.accentStrong} 52%, #f59e0b)`,
    '--theme-danger': `color-mix(in srgb, ${dashboardTheme.accentStrong} 42%, #fb7185)`,
    '--theme-control-bg': `color-mix(in srgb, ${dashboardTheme.backgroundEnd} 82%, ${dashboardTheme.accent} 18%)`,
    '--theme-control-bg-soft': `color-mix(in srgb, ${dashboardTheme.accent} 10%, transparent)`,
    '--theme-control-border': `color-mix(in srgb, ${dashboardTheme.accent} 20%, transparent)`,
    '--theme-control-border-strong': `color-mix(in srgb, ${dashboardTheme.accent} 42%, transparent)`,
    '--theme-focus-ring': `color-mix(in srgb, ${dashboardTheme.accent} 14%, transparent)`,
    '--theme-primary-gradient': `linear-gradient(135deg, ${dashboardTheme.accentStrong}, color-mix(in srgb, ${dashboardTheme.accent} 74%, ${dashboardTheme.success}))`,
    '--theme-primary-shadow': `0 4px 18px color-mix(in srgb, ${dashboardTheme.accent} 22%, transparent), 0 0 0 1px color-mix(in srgb, ${dashboardTheme.accent} 16%, transparent)`,
    '--theme-primary-shadow-strong': `0 8px 24px color-mix(in srgb, ${dashboardTheme.accent} 34%, transparent)`,
    '--theme-panel-border': `color-mix(in srgb, ${dashboardTheme.accent} 18%, transparent)`,
    '--theme-chip-bg': `color-mix(in srgb, ${dashboardTheme.accent} 9%, transparent)`,
    '--theme-chip-border': `color-mix(in srgb, ${dashboardTheme.accent} 20%, transparent)`,
    '--theme-chip-text': `color-mix(in srgb, ${dashboardTheme.accent} 82%, white)`,
    '--theme-bg-start': dashboardTheme.backgroundStart,
    '--theme-bg-mid': dashboardTheme.backgroundMid,
    '--theme-bg-end': dashboardTheme.backgroundEnd,
    '--theme-glow-a': dashboardTheme.glowA,
    '--theme-glow-b': dashboardTheme.glowB,
    '--theme-panel': dashboardTheme.panel,
    '--theme-panel-soft': `color-mix(in srgb, ${dashboardTheme.panel} 82%, ${dashboardTheme.backgroundEnd})`,
    '--theme-panel-raised': `color-mix(in srgb, ${dashboardTheme.panel} 86%, ${dashboardTheme.accent} 14%)`,
    '--theme-sidebar': dashboardTheme.sidebar,
  };

  const handleDashboardThemeChange = (themeId) => {
    setDashboardThemeId(themeId);
    localStorage.setItem('taskray-dashboard-theme', themeId);
  };
  const activeTutorialStep = tutorialSteps[tutorialStepIndex] || tutorialSteps[0];
  const isTutorialTarget = (target) => showTutorial && activeTutorialStep?.target === target;
  const startTutorial = () => {
    const savedStep = Number(localStorage.getItem('taskray-tutorial-step') || tutorialStepIndex || 0);
    const nextStep = Number.isFinite(savedStep) ? Math.min(Math.max(savedStep, 0), tutorialSteps.length - 1) : 0;
    setTutorialStepIndex(nextStep);
    setShowTutorial(true);
  };
  const closeTutorial = useCallback(() => {
    localStorage.setItem('taskray-tutorial-step', String(tutorialStepIndex));
    setShowTutorial(false);
  }, [tutorialStepIndex]);
  const nextTutorialStep = useCallback(() => {
    setTutorialStepIndex(index => {
      if (index >= tutorialSteps.length - 1) {
        localStorage.setItem('taskray-tutorial-step', String(index));
        setShowTutorial(false);
        return index;
      }
      const nextIndex = index + 1;
      localStorage.setItem('taskray-tutorial-step', String(nextIndex));
      return nextIndex;
    });
  }, []);
  const previousTutorialStep = useCallback(() => {
    setTutorialStepIndex(index => {
      const nextIndex = Math.max(0, index - 1);
      localStorage.setItem('taskray-tutorial-step', String(nextIndex));
      return nextIndex;
    });
  }, []);
  const jumpTutorialStep = useCallback((stepIndex) => {
    const nextIndex = Math.min(Math.max(stepIndex, 0), tutorialSteps.length - 1);
    localStorage.setItem('taskray-tutorial-step', String(nextIndex));
    setTutorialStepIndex(nextIndex);
  }, []);

  const drawPomodoroPipFrame = useCallback(() => {
    if (!pomodoroCanvasRef.current) {
      pomodoroCanvasRef.current = document.createElement('canvas');
      pomodoroCanvasRef.current.width = 640;
      pomodoroCanvasRef.current.height = 360;
    }

    const canvas = pomodoroCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#082f49');
    gradient.addColorStop(0.48, '#111033');
    gradient.addColorStop(1, '#050414');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.beginPath();
    ctx.arc(100, 70, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TASKRAY POMODORO', canvas.width / 2, 78);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 110px Arial';
    ctx.fillText(pomodoroDisplay, canvas.width / 2, 200);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 30px Arial';
    ctx.fillText(pomodoroStatus, canvas.width / 2, 258);

    ctx.fillStyle = pomodoroRunning ? '#5eead4' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 304, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 18px Arial';
    ctx.fillText('Hover for PiP play/pause. Reset stays on the TaskRay mini timer.', canvas.width / 2, 334);

    const stream = canvas.captureStream?.(2);
    stream?.getVideoTracks?.()[0]?.requestFrame?.();
    return stream || null;
  }, [pomodoroDisplay, pomodoroRunning, pomodoroStatus]);

  useEffect(() => {
    const clock = window.setInterval(() => setCurrentTime(new Date()), 60000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!pomodoroRunning) return undefined;
    if (pomodoroSecondsLeft <= 0) {
      setPomodoroRunning(false);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setPomodoroSecondsLeft(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pomodoroRunning, pomodoroSecondsLeft]);

  useEffect(() => {
    if (!currentUser?.id) return;
    localStorage.setItem(userScopedKey('taskray-calendar-events', currentUser.id), JSON.stringify(calendarEvents));
  }, [calendarEvents, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    localStorage.setItem(userScopedKey('taskray-reviewers', currentUser.id), JSON.stringify(reviewers));
  }, [reviewers, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const readScoped = (base, fallback = null) => {
      try {
        const scoped = localStorage.getItem(userScopedKey(base, currentUser.id));
        if (scoped) return JSON.parse(scoped);
        const legacy = fallback ? localStorage.getItem(fallback) : null;
        return legacy ? JSON.parse(legacy) : null;
      } catch {
        return null;
      }
    };
    const scopedEvents = readScoped('taskray-calendar-events', 'taskray-calendar-events');
    const scopedReviewers = readScoped('taskray-reviewers', 'taskray-reviewers');
    const scopedRecents = readScoped('taskray-recent-searches');
    const scopedDismissed = readScoped('taskray-dismissed-notifications');

    setCalendarEvents(Array.isArray(scopedEvents) ? scopedEvents : []);
    setReviewers(Array.isArray(scopedReviewers) && scopedReviewers.length ? scopedReviewers : defaultReviewers);
    setActiveReviewerId(Array.isArray(scopedReviewers) && scopedReviewers[0]?.id ? scopedReviewers[0].id : defaultReviewers[0].id);
    setRecentSearches(Array.isArray(scopedRecents) ? scopedRecents.slice(0, 6) : []);
    setDismissedNotificationIds(Array.isArray(scopedDismissed) ? scopedDismissed : []);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    localStorage.setItem(userScopedKey('taskray-recent-searches', currentUser.id), JSON.stringify(recentSearches.slice(0, 6)));
  }, [recentSearches, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    localStorage.setItem(userScopedKey('taskray-dismissed-notifications', currentUser.id), JSON.stringify(dismissedNotificationIds));
  }, [dismissedNotificationIds, currentUser?.id]);

  useEffect(() => {
    localStorage.setItem('taskray-review-quiz-minutes', String(quizTimeLimitMinutes));
  }, [quizTimeLimitMinutes]);

  useEffect(() => {
    if (!quizSessionActive || quizSubmitted) return undefined;
    if (quizSecondsLeft <= 0) {
      setQuizSubmitted(true);
      setQuizTimedOut(true);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setQuizSecondsLeft(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [quizSecondsLeft, quizSessionActive, quizSubmitted]);

  useEffect(() => {
    localStorage.setItem('taskray-active-view', activeView);
  }, [activeView]);

  useEffect(() => {
    const main = document.querySelector('.dash-main');
    if (!main) return undefined;

    const revealSelectors = [
      '.dash-header',
      '.tab-quick-actions',
      '.productivity-hero',
      '.dashboard-wide-card',
      '.premium-metric-card',
      '.dash-stat-card',
      '.metric-tile',
      '.tool-card',
      '.dash-task-card',
      '.task-view-controls',
      '.task-filter-row',
      '.task-view-grid',
      '.calendar-overview',
      '.calendar-form',
      '.calendar-preview',
      '.calendar-list',
      '.review-hero-card',
      '.review-builder-panel',
      '.review-flashcard-panel',
      '.review-quiz-panel',
      '.review-result-card',
      '.essay-hero-card',
      '.essay-panel',
      '.essay-stat-card',
      '.focus-break-layout',
      '.focus-break-panel',
      '.gwa-panel',
      '.gwa-upload-card',
      '.gwa-upload-history-card',
      '.gwa-result-card',
      '.about-hero-card',
      '.about-card',
    ];

    const elements = Array.from(main.querySelectorAll(revealSelectors.join(',')))
      .filter((element) => !element.closest('.modal-overlay, .notification-popover, .tutorial-card'));

    if (!elements.length) return undefined;

    elements.forEach((element, index) => {
      element.classList.add('scroll-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 8, 7) * 32}ms`);
    });

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      root: null,
      rootMargin: '0px 0px -46px 0px',
      threshold: 0.08,
    });

    const frame = window.requestAnimationFrame(() => {
      elements.forEach((element) => {
        if (!element.classList.contains('is-visible')) observer.observe(element);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [
    activeView,
    tasks.length,
    calendarEvents.length,
    reviewers.length,
  ]);

  useEffect(() => {
    if (!showTutorial || !activeTutorialStep) return;
    setActiveView(activeTutorialStep.view);
    setShowProfile(false);
    setShowSettings(false);
    setPreviewTask(null);
    setTaskToDelete(null);
    if (activeTutorialStep.view === 'tasks') {
      setFilter('all');
      setCategoryFilter('all');
    }
  }, [activeTutorialStep, showTutorial]);

  useEffect(() => {
    if (!showTutorial) return undefined;
    const handleTutorialKeys = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeTutorial();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextTutorialStep();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        previousTutorialStep();
      }
    };
    window.addEventListener('keydown', handleTutorialKeys);
    return () => window.removeEventListener('keydown', handleTutorialKeys);
  }, [closeTutorial, nextTutorialStep, previousTutorialStep, showTutorial]);

  useEffect(() => {
    drawPomodoroPipFrame();
  }, [drawPomodoroPipFrame]);

  useEffect(() => () => {
    const video = pomodoroVideoRef.current;
    if (document.pictureInPictureElement === video) {
      document.exitPictureInPicture?.().catch(() => {});
    }
    video?.srcObject?.getTracks?.().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async (user) => {
      try {
        const profile = await withTimeout(profilesApi.getById(user.id), 8000, 'Profile request timed out');
        if (isActive) setCurrentUser(normalizeUserProfile(user, profile, getSavedProfileDetails(user.id)));
      } catch (err) {
        console.warn('Profile load failed:', err);
        if (isActive) setCurrentUser(normalizeUserProfile(user, {}, getSavedProfileDetails(user.id)));
      } finally {
        if (isActive) setAuthChecking(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const callbackCode = urlParams.get('code');
    const isRecoveryRoute = window.location.pathname === '/reset-password' || urlParams.get('type') === 'recovery';
    if (callbackCode && !isRecoveryRoute) {
      withTimeout(authApi.exchangeCodeForSession(callbackCode), 8000, 'Verification link timed out')
        .then(async ({ user, session }) => {
          const verifiedUser = user || session?.user;
          window.history.replaceState({}, '', window.location.pathname);
          if (verifiedUser) await loadProfile(verifiedUser);
        })
        .catch((err) => {
          console.warn('Verification link failed:', err);
          window.history.replaceState({}, '', window.location.pathname);
          if (isActive) setAuthChecking(false);
        });
    }

    withTimeout(authApi.getSession(), 8000, 'Session request timed out')
      .then(async ({ data: { session } }) => {
        if (!callbackCode && session?.user && !isRecoveryRoute) await loadProfile(session.user);
        else if (isActive) setAuthChecking(false);
      })
      .catch((err) => {
        console.warn('Session load failed:', err);
        if (isActive) {
          setCurrentUser(null);
          setAuthChecking(false);
        }
      });

    const { data: { subscription } } = authApi.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (isActive) setPasswordRecovery(true);
        if (isActive) setAuthChecking(false);
        return;
      }
      if (session?.user) await loadProfile(session.user);
      else {
        if (isActive) setCurrentUser(null);
        if (isActive) setAuthChecking(false);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await authApi.signOut();
    setCurrentUser(null);
    setShowLogout(false);
  };

  const handleToggleNotifications = async () => {
    const nextEnabled = !notificationsEnabled;
    setNotificationsEnabled(nextEnabled);
    localStorage.setItem('taskray-notifications', nextEnabled ? 'on' : 'off');

    if (nextEnabled) {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
    }
  };

  const handleEnableBrowserNotifications = async () => {
    setNotificationsEnabled(true);
    localStorage.setItem('taskray-notifications', 'on');
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };

  const visibleReminders = reminders.filter(reminder => !dismissedReminders.includes(reminder.id));

  if (passwordRecovery) {
    return <ResetPassword onReturnToLogin={async () => {
      await authApi.signOut();
      setPasswordRecovery(false);
      setCurrentUser(null);
      setAuthView('login');
      window.history.replaceState({}, '', '/');
    }} />;
  }

  if (authChecking) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-pill" role="status" aria-live="polite">
          <img src="/taskray_logo.png" alt="" />
          <div>
            <span>TaskRay</span>
            <p>Loading...</p>
            <div className="auth-loading-progress" aria-hidden="true"><i /></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return authView === 'login'
    ? <Login onLogin={u => setCurrentUser(normalizeUserProfile(u, u, getSavedProfileDetails(u.id)))} onSwitchToSignup={() => setAuthView('signup')} />
    : <Signup onSignup={u => setCurrentUser(normalizeUserProfile(u, u, getSavedProfileDetails(u.id)))} onSwitchToLogin={() => setAuthView('login')} />;

  if (currentUser.role === 'admin') {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  const handleRefreshCurrentTab = async () => {
    setRefreshingView(activeView);
    setTaskError('');

    try {
      if (activeView === 'productivity' || activeView === 'tasks') {
        await refreshTasks();
      }

      if (activeView === 'calendar' || activeView === 'productivity') {
        try {
          const savedEvents = JSON.parse(localStorage.getItem('taskray-calendar-events') || '[]');
          setCalendarEvents(Array.isArray(savedEvents) ? savedEvents : []);
        } catch {
          setCalendarEvents([]);
        }
        setSelectedEventId(null);
      }

      if (activeView === 'review' || activeView === 'productivity') {
        try {
          const savedReviewers = JSON.parse(localStorage.getItem('taskray-reviewers') || 'null');
          if (Array.isArray(savedReviewers) && savedReviewers.length) {
            setReviewers(savedReviewers);
            if (!savedReviewers.some(reviewer => reviewer.id === activeReviewerId)) {
              setActiveReviewerId(savedReviewers[0].id);
            }
          }
        } catch {
          setReviewers(defaultReviewers);
          setActiveReviewerId(defaultReviewers[0].id);
        }
        setFlashcardFlipped(false);
        setQuizSubmitted(false);
      }

      if (activeView === 'pomodoro') {
        const savedMinutes = Number(localStorage.getItem('taskray-pomodoro-minutes')) || 25;
        const savedMiniVisible = localStorage.getItem('taskray-mini-pomodoro') !== 'hidden';
        setPomodoroMinutes(savedMinutes);
        setShowMiniPomodoro(savedMiniVisible);
        setPomodoroPosition(getSavedPomodoroPosition());
        if (!pomodoroRunning) setPomodoroSecondsLeft(savedMinutes * 60);
      }

      if (activeView === 'essay') {
        setEssayRefreshToken(token => token + 1);
      }
    } catch (err) {
      setTaskError(err.message || 'Unable to refresh this tab.');
    } finally {
      window.setTimeout(() => setRefreshingView(''), 250);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    setTaskError('');
    try {
      await addTask(newTask);
      setNewTask(emptyTaskDraft);
      setShowAddForm(false);
    } catch (err) { setTaskError(err.message || 'Unable to create the task.'); }
  };

  const handleUpdateTask = async (id, updates) => {
    setTaskError('');
    try {
      await updateTask(id, updates);
      setEditingTask(null);
      setPreviewTask(prev => prev?.id === id ? { ...prev, ...updates } : prev);
    }
    catch (err) { setTaskError(err.message || 'Unable to update the task.'); }
  };

  const handleDeleteTask = async (id) => {
    setTaskError('');
    try {
      await deleteTask(id);
      setTaskToDelete(null);
      setPreviewTask(prev => prev?.id === id ? null : prev);
    }
    catch (err) { setTaskError(err.message || 'Unable to delete the task.'); }
  };

  const handlePomodoroMinutes = (value) => {
    const minutes = Math.min(120, Math.max(1, Number(value) || 1));
    setPomodoroMinutes(minutes);
    localStorage.setItem('taskray-pomodoro-minutes', String(minutes));
    if (!pomodoroRunning) setPomodoroSecondsLeft(minutes * 60);
  };

  const handleResetPomodoro = () => {
    setPomodoroRunning(false);
    setPomodoroSecondsLeft(pomodoroMinutes * 60);
  };

  const handleOpenPomodoroPopup = async () => {
    const video = pomodoroVideoRef.current;
    if (!video) return;
    if (!document.pictureInPictureEnabled || !video.requestPictureInPicture) {
      setTaskError('Picture-in-Picture is not available in this browser. Try Microsoft Edge or Chrome.');
      return;
    }
    if (document.pictureInPictureElement === video) return;

    const stream = drawPomodoroPipFrame();
    if (!stream) {
      setTaskError('Unable to start the floating Pomodoro timer.');
      return;
    }

    video.muted = true;
    video.playsInline = true;
    video.disablePictureInPicture = false;
    if (video.srcObject !== stream) {
      video.srcObject?.getTracks?.().forEach(track => track.stop());
      video.srcObject = stream;
    }

    try {
      if ('mediaSession' in navigator) {
        if ('MediaMetadata' in window) {
          navigator.mediaSession.metadata = new window.MediaMetadata({
            title: 'TaskRay Pomodoro',
            artist: pomodoroStatus,
          });
        }
        const setMediaAction = (action, handler) => {
          try {
            navigator.mediaSession.setActionHandler(action, handler);
          } catch {
            // Some PiP actions are not exposed by every browser.
          }
        };
        setMediaAction('play', () => setPomodoroRunning(true));
        setMediaAction('pause', () => setPomodoroRunning(false));
        setMediaAction('stop', handleResetPomodoro);
        setMediaAction('seekbackward', handleResetPomodoro);
        setMediaAction('previoustrack', handleResetPomodoro);
      }
      await video.play();
      await video.requestPictureInPicture();
      setTaskError('');
    } catch (err) {
      console.warn('Unable to open Pomodoro Picture-in-Picture:', err);
      setTaskError('Edge blocked the floating timer. Click Float timer again, or check if Picture-in-Picture is enabled.');
    }
  };

  const handlePomodoroDragStart = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest('button') && !event.target.closest('.floating-pomodoro-main')) return;

    const card = event.currentTarget.closest('.floating-pomodoro');
    if (!card) return;

    event.preventDefault();
    const rect = card.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const initial = { x: rect.left, y: rect.top };
    setDraggingPomodoro(true);

    const move = (moveEvent) => {
      if (Math.abs(moveEvent.clientX - startX) > 4 || Math.abs(moveEvent.clientY - startY) > 4) {
        suppressPomodoroClick.current = true;
      }
      const maxX = Math.max(12, window.innerWidth - rect.width - 12);
      const maxY = Math.max(12, window.innerHeight - rect.height - 12);
      const next = {
        x: Math.min(maxX, Math.max(12, initial.x + moveEvent.clientX - startX)),
        y: Math.min(maxY, Math.max(12, initial.y + moveEvent.clientY - startY)),
      };
      setPomodoroPosition(next);
    };

    const stop = () => {
      setDraggingPomodoro(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      const latestRect = card.getBoundingClientRect();
      localStorage.setItem('taskray-pomodoro-position', JSON.stringify({
        x: latestRect.left,
        y: latestRect.top,
      }));
      window.setTimeout(() => {
        suppressPomodoroClick.current = false;
      }, 0);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date) return;
    const event = {
      id: window.crypto?.randomUUID?.() || `${Date.now()}`,
      title: newEvent.title.trim(),
      date: newEvent.date,
      time: newEvent.time,
      notes: newEvent.notes.trim(),
    };
    setCalendarEvents(prev => [
      event,
      ...prev,
    ]);
    setSelectedEventId(event.id);
    setNewEvent({ title: '', date: '', time: '', notes: '' });
  };

  const handleDeleteEvent = (id) => {
    setCalendarEvents(prev => prev.filter(event => event.id !== id));
    setSelectedEventId(current => current === id ? null : current);
  };

  const getTaskDueAt = (task) => {
    const date = task.deadlineDate || task.endDate;
    const time = task.deadlineTime || task.endTime || '23:59';
    if (!date) return null;
    const dueAt = new Date(`${date}T${time}`);
    return Number.isNaN(dueAt.getTime()) ? null : dueAt;
  };

  const emptyTaskDraft = {
    title: '', description: '', priority: 'medium', category: 'Assignments',
    startDate: '', startTime: '', endDate: '', endTime: '',
    deadlineDate: '', deadlineTime: '', status: 'todo',
  };
  const isTaskEditorOpen = showAddForm || Boolean(editingTask);
  const taskDraft = editingTask || newTask;
  const taskTitleSuggestions = getTaskTitleSuggestions(taskDraft);
  const setTaskDraftField = (field, value) => {
    if (editingTask) setEditingTask({ ...editingTask, [field]: value });
    else setNewTask({ ...newTask, [field]: value });
  };
  const closeTaskEditor = () => {
    setShowAddForm(false);
    setEditingTask(null);
    setTaskError('');
  };
  const handleTaskViewMode = (mode) => {
    setTaskViewMode(mode);
    localStorage.setItem('taskray-task-view-mode', mode);
  };

  const isOverdue = task => task.status !== 'completed' && getTaskDueAt(task)?.getTime() < Date.now();

  const filteredTasks = (() => {
    let f = [...tasks];
    if (filter === 'overdue') f = f.filter(isOverdue);
    else if (filter !== 'all') f = f.filter(t => t.status === filter);
    if (searchQuery) f = f.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description||'').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category||'').toLowerCase().includes(searchQuery.toLowerCase())
    );
    f.sort((a,b) => {
      if (sortBy==='priority') { const o={high:0,medium:1,low:2}; return o[a.priority]-o[b.priority]; }
      if (sortBy==='dueDate')  { const aDue=getTaskDueAt(a); const bDue=getTaskDueAt(b); if (!aDue) return 1; if (!bDue) return -1; return aDue-bDue; }
      if (sortBy==='created')  return new Date(b.createdAt)-new Date(a.createdAt);
      return 0;
    });
    return f;
  })();

  const stats = {
    total:      tasks.length,
    completed:  tasks.filter(t=>t.status==='completed').length,
    inProgress: tasks.filter(t=>t.status==='in-progress').length,
    todo:       tasks.filter(t=>t.status==='todo').length,
    overdue:    tasks.filter(isOverdue).length,
  };
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const activeTaskCount = stats.todo + stats.inProgress;
  const sortedEvents = [...calendarEvents]
    .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));
  const selectedCalendarEvent = sortedEvents.find(event => event.id === selectedEventId) || null;
  const upcomingEvents = sortedEvents.slice(0, 6);
  const calendarMonthDate = new Date(`${calendarMonth}-01T00:00`);
  const calendarMonthLabel = calendarMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarCells = (() => {
    const year = calendarMonthDate.getFullYear();
    const month = calendarMonthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: firstDay }, (_, index) => ({ id: `blank-${index}`, blank: true }));
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({
        id: date,
        day,
        date,
        events: sortedEvents.filter(event => event.date === date),
      });
    }
    return cells;
  })();
  const changeCalendarMonth = (direction) => {
    const next = new Date(calendarMonthDate);
    next.setMonth(next.getMonth() + direction);
    setCalendarMonth(monthValue(next));
  };
  const changeCalendarYear = (years) => {
    const next = new Date(calendarMonthDate);
    next.setFullYear(next.getFullYear() + years);
    setCalendarMonth(monthValue(next));
  };
  const jumpToCalendarYear = (year) => {
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear) || parsedYear < 1 || parsedYear > 9999) return;
    const next = new Date(calendarMonthDate);
    next.setFullYear(parsedYear);
    setCalendarMonth(monthValue(next));
  };
  const eventGroups = sortedEvents.reduce((groups, event) => {
    const label = new Date(`${event.date}T00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return { ...groups, [label]: [...(groups[label] || []), event] };
  }, {});
  const sortedTrackerItems = [...tasks]
    .sort((a, b) => {
      const aDue = getTaskDueAt(a);
      const bDue = getTaskDueAt(b);
      if (!aDue) return 1;
      if (!bDue) return -1;
      return aDue - bDue;
    });
  const trackerStats = {
    total: tasks.length,
    pending: tasks.filter(item => item.status === 'todo').length,
    inProgress: tasks.filter(item => item.status === 'in-progress').length,
    done: tasks.filter(item => item.status === 'completed').length,
    dueSoon: tasks.filter(item => {
      if (item.status === 'completed') return false;
      const dueAt = getTaskDueAt(item)?.getTime();
      if (!dueAt) return false;
      const now = Date.now();
      return dueAt >= now && dueAt <= now + 3 * 24 * 60 * 60 * 1000;
    }).length,
  };
  const trackerByType = trackerTypes.map(type => ({
    type,
    items: sortedTrackerItems.filter(item => {
      const category = trackerTypes.includes(item.category) ? item.category : 'Other';
      return category === type;
    }),
  }));
  const activeReviewerRaw = reviewers.find(reviewer => reviewer.id === activeReviewerId) || reviewers[0] || defaultReviewers[0];
  const activeReviewer = {
    ...activeReviewerRaw,
    reviewModes: activeReviewerRaw.reviewModes || ['flashcards', 'multiple-choice', 'identification', 'true-false', 'mixed'],
    flashcards: activeReviewerRaw.flashcards || [],
    questions: (activeReviewerRaw.questions || []).map(question => ({
      type: 'multiple-choice',
      options: [],
      ...question,
    })),
  };
  const activeKnownFlashcards = knownFlashcards[activeReviewer.id] || [];
  const activeQuizAnswers = quizAnswers[activeReviewer.id] || {};
  const activeExerciseQuestions = exerciseMode === 'mixed'
    ? activeReviewer.questions
    : activeReviewer.questions.filter(question => question.type === exerciseMode);
  const displayedQuizQuestions = quizSessionActive ? activeReviewer.questions : activeExerciseQuestions;
  const shouldRevealQuizAnswers = quizSessionActive ? (quizRevealMode === 'immediate' || quizSubmitted) : true;
  const isCorrectAnswer = (question, response) => {
    if (!response) return false;
    return String(response).trim().toLowerCase() === String(question.answer).trim().toLowerCase();
  };
  const quizAnsweredCount = activeExerciseQuestions.filter(question => activeQuizAnswers[question.id]).length;
  const displayedQuizAnsweredCount = displayedQuizQuestions.filter(question => activeQuizAnswers[question.id]).length;
  const displayedQuizScore = displayedQuizQuestions.reduce((score, item) => (
    isCorrectAnswer(item, activeQuizAnswers[item.id]) ? score + 1 : score
  ), 0);
  const quizLimitSeconds = Math.max(1, quizTimeLimitMinutes) * 60;
  const quizTimeProgress = Math.max(0, Math.min(100, (quizSecondsLeft / quizLimitSeconds) * 100));
  const resultScore = exerciseMode === 'flashcards' && !quizSessionActive ? activeKnownFlashcards.length : displayedQuizScore;
  const resultTotal = exerciseMode === 'flashcards' && !quizSessionActive ? activeReviewer.flashcards.length : displayedQuizQuestions.length;
  const studyTotal = activeReviewer.flashcards.length + activeReviewer.questions.length;
  const studyProgress = studyTotal ? Math.round(((activeKnownFlashcards.length + quizAnsweredCount) / studyTotal) * 100) : 0;
  const todayKey = dateValue(new Date());
  const quoteSeed = todayKey.split('-').reduce((total, part) => total + Number(part), 0);
  const quoteOfTheDay = dailyQuotes[quoteSeed % dailyQuotes.length];
  const todayTasks = tasks.filter(task => {
    const dueDate = task.deadlineDate || task.endDate || task.startDate;
    return dueDate === todayKey;
  });
  const todayEvents = calendarEvents.filter(event => event.date === todayKey);
  const reviewerQuestionCount = reviewers.reduce((total, reviewer) => total + (reviewer.questions || []).length, 0);
  const reviewerCardCount = reviewers.reduce((total, reviewer) => total + (reviewer.flashcards || []).length, 0);
  const dashboardReviewer = activeReviewer || reviewers[0] || defaultReviewers[0];
  const dashboardReviewerKnown = knownFlashcards[dashboardReviewer.id]?.length || 0;
  const dashboardReviewerTotal = (dashboardReviewer.flashcards || []).length + (dashboardReviewer.questions || []).length;
  const dashboardReviewerProgress = dashboardReviewerTotal
    ? Math.round(((dashboardReviewerKnown + Object.keys(quizAnswers[dashboardReviewer.id] || {}).length) / dashboardReviewerTotal) * 100)
    : 0;
  const todayRecommendation = (() => {
    if (stats.overdue > 0) {
      return {
        label: 'Recommended today',
        title: 'Clear overdue tasks first',
        copy: `${stats.overdue} overdue task${stats.overdue === 1 ? '' : 's'} need attention before anything else.`,
        action: 'Open overdue',
        view: 'tasks',
        filter: 'overdue',
        tone: 'urgent',
      };
    }
    if (todayTasks.length > 0) {
      return {
        label: 'Recommended today',
        title: 'Finish what is due today',
        copy: `${todayTasks.length} task${todayTasks.length === 1 ? ' is' : 's are'} scheduled for today. Start with the smallest one.`,
        action: 'Open tasks',
        view: 'tasks',
        filter: 'all',
        tone: 'focus',
      };
    }
    if (todayEvents.length > 0) {
      return {
        label: 'Recommended today',
        title: 'Check your agenda',
        copy: `${todayEvents.length} event${todayEvents.length === 1 ? '' : 's'} on the calendar today. Review the details before planning tasks.`,
        action: 'Open calendar',
        view: 'calendar',
        tone: 'calendar',
      };
    }
    if (reviewerCardCount + reviewerQuestionCount > 0 && dashboardReviewerProgress < 100) {
      return {
        label: 'Recommended today',
        title: 'Do a quick reviewer round',
        copy: `Study ${dashboardReviewer.subject || 'your reviewer'} for a few minutes to build review progress.`,
        action: 'Open reviewer',
        view: 'review',
        tone: 'study',
      };
    }
    if (!pomodoroRunning) {
      return {
        label: 'Recommended today',
        title: 'Start a short focus sprint',
        copy: 'Use the focus timer to work on one small task without switching context.',
        action: 'Start focus',
        view: 'pomodoro',
        tone: 'focus',
      };
    }
    return {
      label: 'Recommended today',
      title: 'Keep the session going',
      copy: 'Your focus timer is running. Stay with the current work until the session ends.',
      action: 'Open timer',
      view: 'pomodoro',
      tone: 'study',
    };
  })();
  const todayActivityItems = [
    { label: 'Tasks due today', value: todayTasks.length, tone: todayTasks.length ? 'warning' : 'success' },
    { label: 'Events scheduled', value: todayEvents.length, tone: todayEvents.length ? 'info' : 'muted' },
    { label: 'Reviewer items', value: reviewerCardCount + reviewerQuestionCount, tone: reviewerCardCount + reviewerQuestionCount ? 'info' : 'muted' },
    { label: 'Focus timer', value: pomodoroRunning ? 'Running' : pomodoroDisplay, tone: pomodoroRunning ? 'success' : 'muted' },
  ];
  const notificationItems = [
    ...visibleReminders.map(reminder => ({
      id: `reminder-${reminder.id}`,
      sourceId: reminder.id,
      priority: reminder.severity === 'overdue' ? 'urgent' : 'info',
      tone: reminder.severity === 'overdue' ? 'danger' : 'warning',
      icon: <Icons.Alert />,
      title: reminder.severity === 'overdue' ? `Overdue: ${reminder.title}` : `Almost due: ${reminder.title}`,
      body: `${reminder.relativeText} - ${reminder.dueAtText}`,
      meta: 'Task reminder',
      actionLabel: 'Open tasks',
      view: 'tasks',
      filter: reminder.severity === 'overdue' ? 'overdue' : 'all',
      dismissible: true,
      dismissReminder: true,
    })),
    {
      id: `recommendation-${todayRecommendation.view}-${todayRecommendation.filter || 'main'}-${todayKey}`,
      priority: 'recommendation',
      tone: todayRecommendation.tone,
      icon: <Icons.Sparkles />,
      title: todayRecommendation.title,
      body: todayRecommendation.copy,
      meta: todayRecommendation.label,
      actionLabel: todayRecommendation.action,
      view: todayRecommendation.view,
      filter: todayRecommendation.filter,
      dismissible: true,
    },
    upcomingEvents[0] && {
      id: `event-${upcomingEvents[0].id}`,
      priority: todayEvents.length ? 'urgent' : 'info',
      tone: todayEvents.length ? 'calendar' : 'info',
      icon: <Icons.Calendar />,
      title: todayEvents.length ? 'Calendar event today' : 'Next calendar event',
      body: `${upcomingEvents[0].title} - ${new Date(`${upcomingEvents[0].date}T00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      meta: upcomingEvents[0].time || 'All day',
      actionLabel: 'View event',
      view: 'calendar',
      eventId: upcomingEvents[0].id,
      dismissible: true,
    },
    reviewerCardCount + reviewerQuestionCount > 0 && dashboardReviewerProgress < 100 && {
      id: `reviewer-${dashboardReviewer.id}-${todayKey}`,
      priority: 'recommendation',
      tone: 'study',
      icon: <Icons.Book />,
      title: 'Reviewer progress waiting',
      body: `${dashboardReviewer.subject || 'Your reviewer'} is at ${dashboardReviewerProgress}%. Try a quick flashcard or timed quiz round.`,
      meta: `${reviewerCardCount + reviewerQuestionCount} total review items`,
      actionLabel: 'Open reviewer',
      view: 'review',
      dismissible: true,
    },
    !pomodoroRunning && {
      id: `pomodoro-ready-${todayKey}`,
      priority: 'recommendation',
      tone: 'focus',
      icon: <Icons.Timer />,
      title: 'Focus sprint available',
      body: `Your Pomodoro is set to ${pomodoroDisplay}. Start it when you are ready to focus.`,
      meta: 'Focus reminder',
      actionLabel: 'Start focus',
      view: 'pomodoro',
      dismissible: true,
    },
    {
      id: `quote-${todayKey}`,
      priority: 'info',
      tone: 'quote',
      icon: <Icons.Sparkles />,
      title: 'Quote of the day',
      body: quoteOfTheDay.text,
      meta: quoteOfTheDay.author,
      actionLabel: null,
      dismissible: true,
    },
  ].filter(Boolean).filter(item => !dismissedNotificationIds.includes(item.id));
  const notificationCount = notificationItems.length;
  const handleOpenNotification = (item) => {
    if (item.view) setActiveView(item.view);
    if (item.filter) setFilter(item.filter);
    if (item.eventId) setSelectedEventId(item.eventId);
    if (item.view === 'tasks' && !item.filter) setFilter('all');
    setShowNotifications(false);
  };
  const handleDismissNotification = (item) => {
    setDismissedNotificationIds(prev => [...prev, item.id]);
    if (item.dismissReminder && item.sourceId) {
      setDismissedReminders(prev => [...prev, item.sourceId]);
    }
  };
  const currentFlashcard = activeReviewer.flashcards[flashcardIndex] || null;
  const updateActiveReviewer = (updater) => {
    setReviewers(prev => prev.map(reviewer => (
      reviewer.id === activeReviewer.id ? updater(reviewer) : reviewer
    )));
  };
  const handleSelectReviewer = (id) => {
    const nextReviewer = reviewers.find(reviewer => reviewer.id === id);
    const nextModes = nextReviewer?.reviewModes || ['flashcards', 'multiple-choice', 'identification', 'true-false', 'mixed'];
    setActiveReviewerId(id);
    setExerciseMode(nextModes.includes(exerciseMode) ? exerciseMode : nextModes[0]);
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
    setQuizSessionActive(false);
    setQuizSubmitted(false);
    setQuizTimedOut(false);
    setQuizSecondsLeft(Math.max(1, quizTimeLimitMinutes) * 60);
    setFlashcardForm({ term: '', meaning: '', id: null });
    setQuizForm({ type: 'multiple-choice', question: '', options: ['', '', '', ''], answer: '', id: null });
  };
  const handleSaveReviewer = () => {
    const subject = subjectName.trim();
    if (!subject) return;
    const modes = reviewerModes.length ? reviewerModes : ['flashcards'];
    if (editingReviewerId) {
      setReviewers(prev => prev.map(reviewer => (
        reviewer.id === editingReviewerId ? { ...reviewer, subject, reviewModes: modes } : reviewer
      )));
      if (editingReviewerId === activeReviewer.id && !modes.includes(exerciseMode)) setExerciseMode(modes[0]);
      setEditingReviewerId(null);
    } else {
      const reviewer = { id: makeId('reviewer'), subject, reviewModes: modes, flashcards: [], questions: [] };
      setReviewers(prev => [...prev, reviewer]);
      setActiveReviewerId(reviewer.id);
      setExerciseMode(modes[0] || 'flashcards');
    }
    setSubjectName('');
    setReviewerModes(['flashcards', 'multiple-choice']);
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
  };
  const handleEditReviewer = (reviewer) => {
    setSubjectName(reviewer.subject);
    setReviewerModes(reviewer.reviewModes || ['flashcards', 'multiple-choice']);
    setEditingReviewerId(reviewer.id);
  };
  const handleDeleteReviewer = (id) => {
    setReviewers(prev => {
      const next = prev.filter(reviewer => reviewer.id !== id);
      if (activeReviewerId === id) {
        setActiveReviewerId(next[0]?.id || defaultReviewers[0].id);
        setFlashcardIndex(0);
        setFlashcardFlipped(false);
      }
      return next.length ? next : defaultReviewers;
    });
  };
  const handleSaveFlashcard = () => {
    if (!flashcardForm.term.trim() || !flashcardForm.meaning.trim()) return;
    updateActiveReviewer(reviewer => {
      const card = {
        id: flashcardForm.id || makeId('card'),
        term: flashcardForm.term.trim(),
        meaning: flashcardForm.meaning.trim(),
      };
      return {
        ...reviewer,
        flashcards: flashcardForm.id
          ? reviewer.flashcards.map(item => item.id === flashcardForm.id ? card : item)
          : [...reviewer.flashcards, card],
      };
    });
    setFlashcardForm({ term: '', meaning: '', id: null });
  };
  const handleEditFlashcard = (card) => {
    setFlashcardForm({ term: card.term, meaning: card.meaning, id: card.id });
  };
  const handleDeleteFlashcard = (id) => {
    updateActiveReviewer(reviewer => ({ ...reviewer, flashcards: reviewer.flashcards.filter(card => card.id !== id) }));
    setKnownFlashcards(prev => ({ ...prev, [activeReviewer.id]: activeKnownFlashcards.filter(cardId => cardId !== id) }));
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
  };
  const handleSaveQuestion = () => {
    const type = quizForm.type;
    const options = type === 'true-false'
      ? ['True', 'False']
      : type === 'multiple-choice'
        ? quizForm.options.map(option => option.trim()).filter(Boolean)
        : [];
    const answer = quizForm.answer.trim();
    if (!quizForm.question.trim() || !answer) return;
    if (type === 'multiple-choice' && (options.length < 2 || !options.includes(answer))) return;
    if (type === 'true-false' && !['True', 'False'].includes(answer)) return;
    updateActiveReviewer(reviewer => {
      const question = {
        id: quizForm.id || makeId('question'),
        type,
        question: quizForm.question.trim(),
        options,
        answer,
      };
      return {
        ...reviewer,
        questions: quizForm.id
          ? reviewer.questions.map(item => item.id === quizForm.id ? question : item)
          : [...reviewer.questions, question],
      };
    });
    setQuizForm({ type: 'multiple-choice', question: '', options: ['', '', '', ''], answer: '', id: null });
    setQuizSessionActive(false);
    setQuizSubmitted(false);
    setQuizTimedOut(false);
    setQuizSecondsLeft(Math.max(1, quizTimeLimitMinutes) * 60);
  };
  const handleEditQuestion = (question) => {
    setQuizForm({
      type: question.type || 'multiple-choice',
      question: question.question,
      options: [...(question.options || []), '', '', '', ''].slice(0, 4),
      answer: question.answer,
      id: question.id,
    });
  };
  const handleDeleteQuestion = (id) => {
    updateActiveReviewer(reviewer => ({ ...reviewer, questions: reviewer.questions.filter(question => question.id !== id) }));
    setQuizAnswers(prev => ({ ...prev, [activeReviewer.id]: {} }));
    setQuizSessionActive(false);
    setQuizSubmitted(false);
    setQuizTimedOut(false);
    setQuizSecondsLeft(Math.max(1, quizTimeLimitMinutes) * 60);
  };
  const handleStartSubjectQuiz = () => {
    if (!activeReviewer.questions.length) return;
    setQuizAnswers(prev => ({ ...prev, [activeReviewer.id]: {} }));
    setQuizSecondsLeft(Math.max(1, quizTimeLimitMinutes) * 60);
    setQuizSessionActive(true);
    setQuizSubmitted(false);
    setQuizTimedOut(false);
    if (exerciseMode === 'flashcards') setExerciseMode('mixed');
  };
  const handleSubmitSubjectQuiz = () => {
    if (!quizSessionActive) return;
    setQuizSubmitted(true);
    setQuizTimedOut(false);
  };
  const handleResetSubjectQuiz = () => {
    setQuizAnswers(prev => ({ ...prev, [activeReviewer.id]: {} }));
    setQuizSessionActive(false);
    setQuizSubmitted(false);
    setQuizTimedOut(false);
    setQuizSecondsLeft(Math.max(1, quizTimeLimitMinutes) * 60);
  };
  const handleNextFlashcard = () => {
    if (!activeReviewer.flashcards.length) return;
    setFlashcardIndex(index => (index + 1) % activeReviewer.flashcards.length);
    setFlashcardFlipped(false);
  };
  const handlePrevFlashcard = () => {
    if (!activeReviewer.flashcards.length) return;
    setFlashcardIndex(index => (index - 1 + activeReviewer.flashcards.length) % activeReviewer.flashcards.length);
    setFlashcardFlipped(false);
  };
  const handleKnowFlashcard = () => {
    if (!currentFlashcard) return;
    setKnownFlashcards(prev => {
      const current = prev[activeReviewer.id] || [];
      return {
        ...prev,
        [activeReviewer.id]: current.includes(currentFlashcard.id) ? current : [...current, currentFlashcard.id],
      };
    });
    handleNextFlashcard();
  };
  const handleResetReview = () => {
    setKnownFlashcards(prev => ({ ...prev, [activeReviewer.id]: [] }));
    setQuizAnswers(prev => ({ ...prev, [activeReviewer.id]: {} }));
    setQuizSessionActive(false);
    setQuizSubmitted(false);
    setQuizTimedOut(false);
    setQuizSecondsLeft(Math.max(1, quizTimeLimitMinutes) * 60);
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
  };
  const fmtDT = (date, time) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}${time?' '+time:''}`;
  };

  const displayName = currentUser.name || currentUser.username || 'User';
  const firstName = currentUser.name?.trim().split(/\s+/)[0] || currentUser.username || currentUser.email?.split('@')[0] || 'there';
  const currentHour = currentTime.getHours();
  const timeOfDayMode = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';
  const isDayMode = timeOfDayMode !== 'evening';
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const dayNightStatus = `${timeOfDayMode.charAt(0).toUpperCase()}${timeOfDayMode.slice(1)} mode`;
  const dayNightAsset = timeOfDayMode === 'evening' ? '/night.png' : '/day.png';
  const displaySub  = currentUser.username ? `@${currentUser.username}` : (currentUser.email||'');
  const initials    = displayName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'?';

  const navItems = [
    { id:'productivity', label:'Dashboard',    icon:<Icons.Chart />,    count:`${completionRate}%` },
    { id:'tasks',        label:'Tasks',        icon:<Icons.Zap />,      count:stats.total },
    { id:'pomodoro',     label:'Pomodoro',     icon:<Icons.Timer />,    count:Math.ceil(pomodoroSecondsLeft / 60) },
    { id:'calendar',     label:'Calendar',     icon:<Icons.Calendar />, count:calendarEvents.length },
    { id:'review',       label:'Reviewer',     icon:<Icons.Book />,     count:`${studyProgress}%` },
    { id:'essay',        label:'Essay Practice', icon:<Icons.Pen />,     count:'AI' },
    { id:'focusBreak',   label:'TaskTris',  icon:<Icons.Gamepad />,  count:'Game' },
    { id:'gwa',          label:'GWA Calculator', icon:<Icons.Graduation />, count:'GWA' },
    { id:'about',        label:'About',        icon:<Icons.Info />,     count:'IANA' },
    ...(stats.overdue>0?[{ id:'overdue', label:'Overdue', icon:<Icons.Flame />, count:stats.overdue, danger:true }]:[]),
  ];
  const navGroups = [
    { label: 'My space', items: navItems.filter(item => ['productivity', 'tasks', 'pomodoro', 'calendar'].includes(item.id)) },
    { label: 'Study tools', items: navItems.filter(item => ['review', 'essay', 'focusBreak', 'gwa'].includes(item.id)) },
    { label: 'About', items: navItems.filter(item => item.id === 'about') },
    { label: 'Attention', items: navItems.filter(item => item.id === 'overdue') },
  ].filter(group => group.items.length);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const workspaceQuote = quoteOfTheDay.text;
  const workspaceSearchItems = [
    ...tasks.map(task => ({
      id: `task-${task.id}`,
      type: 'Task',
      label: task.title,
      detail: `${task.category || 'Task'} - ${task.status === 'completed' ? 'Done' : task.status === 'in-progress' ? 'In progress' : 'To do'}`,
      view: 'tasks',
      task,
    })),
    ...calendarEvents.map(event => ({
      id: `event-${event.id}`,
      type: 'Calendar',
      label: event.title,
      detail: `${new Date(`${event.date}T00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${event.time ? ` - ${event.time}` : ' - All day'}`,
      view: 'calendar',
      eventId: event.id,
    })),
    ...reviewers.map(reviewer => ({
      id: `reviewer-${reviewer.id}`,
      type: 'Reviewer',
      label: reviewer.subject,
      detail: `${(reviewer.flashcards || []).length} flashcards - ${(reviewer.questions || []).length} quiz items`,
      view: 'review',
      reviewerId: reviewer.id,
    })),
    { id: 'page-productivity', type: 'Page', label: 'Dashboard', detail: 'Productivity overview', view: 'productivity' },
    { id: 'page-pomodoro', type: 'Page', label: 'Pomodoro', detail: 'Focus timer', view: 'pomodoro' },
    { id: 'page-gwa', type: 'Page', label: 'GWA Calculator', detail: 'Academic performance', view: 'gwa' },
    { id: 'page-tasktris', type: 'Page', label: 'TaskTris', detail: 'Focus break game', view: 'focusBreak' },
    { id: 'page-about', type: 'Page', label: 'About TaskRay', detail: 'Creator and app credits', view: 'about' },
  ];
  const normalizedWorkspaceSearch = workspaceSearchQuery.trim().toLowerCase();
  const workspaceSearchSuggestions = normalizedWorkspaceSearch
    ? workspaceSearchItems
        .filter(item => `${item.label} ${item.detail} ${item.type}`.toLowerCase().includes(normalizedWorkspaceSearch))
        .slice(0, 7)
    : recentSearches.slice(0, 6);
  const rememberSearchItem = (item) => {
    const recent = {
      id: item.id,
      type: item.type,
      label: item.label,
      detail: item.detail,
      view: item.view,
      taskId: item.task?.id,
      eventId: item.eventId,
      reviewerId: item.reviewerId,
    };
    setRecentSearches(prev => [recent, ...prev.filter(saved => saved.id !== recent.id)].slice(0, 6));
  };
  const handleWorkspaceSearchSelect = (item) => {
    if (!item) return;
    const taskItem = item.taskId ? tasks.find(task => task.id === item.taskId) : item.task;
    setWorkspaceSearchQuery(item.label);
    rememberSearchItem({ ...item, task: taskItem });
    setShowSearchSuggestions(false);
    if (item.view) setActiveView(item.view);
    if (taskItem) {
      setFilter('all');
      setCategoryFilter('all');
      setSearchQuery(taskItem.title || '');
      setPreviewTask(taskItem);
    } else if (item.view === 'tasks') {
      setSearchQuery(item.label || '');
    } else {
      setSearchQuery('');
    }
    if (item.eventId) setSelectedEventId(item.eventId);
    if (item.reviewerId) handleSelectReviewer(item.reviewerId);
  };
  const productivityTone = completionRate >= 80 ? 'Excellent pace' : completionRate >= 50 ? 'Keep it moving' : 'Start gently';
  const topFocusTask = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => {
      const priorityScore = { high: 0, medium: 1, low: 2 };
      return (priorityScore[a.priority] ?? 3) - (priorityScore[b.priority] ?? 3);
    })[0];
  const weekStrip = Array.from({ length: 7 }, (_, index) => {
    const today = new Date();
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + index);
    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      day: date.getDate(),
      active: date.toDateString() === today.toDateString(),
    };
  });
  const dashboardStudyRows = [
    { icon: <Icons.Check />, label: 'Tasks Completed', value: `${stats.completed} / ${Math.max(stats.total, stats.completed, 1)}` },
    { icon: <Icons.Timer />, label: 'Focus Time', value: pomodoroDisplay },
    { icon: <Icons.Book />, label: 'Reviewer Items', value: reviewerCardCount + reviewerQuestionCount },
    { icon: <Icons.Pen />, label: 'Practice Sets', value: reviewers.length },
  ];

  return (
    <div className="dash-root" style={dashboardThemeStyle}>
      <aside
        data-tutorial-target="sidebar"
        className={`dash-sidebar${collapsed?' collapsed':''}${isTutorialTarget('sidebar') ? ' tutorial-highlight' : ''}`}
      >
        <div className="sidebar-brand">
          <img src="/taskray_logo.png" alt="" className="sidebar-logo-img" />
          {!collapsed && <span className="sidebar-logo-text">TaskRay</span>}
        </div>
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
        </button>
        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <div className="sidebar-nav-group" key={group.label}>
              {!collapsed && <span className="sidebar-section-label">{group.label}</span>}
              {group.items.map(item => (
                <button key={item.id}
                  className={`sidebar-nav-item${activeView===item.id || (item.id === 'overdue' && filter === 'overdue')?' active':''}${item.danger?' danger':''}`}
                  onClick={() => {
                    setActiveView(item.id === 'overdue' ? 'tasks' : item.id);
                    if (item.id === 'overdue') setFilter('overdue');
                    else if (item.id === 'tasks') setFilter('all');
                  }} title={collapsed ? item.label : ''}>
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {!collapsed && <span className={`nav-badge${item.danger?' danger':''}`}>{item.count}</span>}
                  {collapsed && item.count > 0 && <span className={`nav-dot${item.danger?' danger':''}`} />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-plan-chip">
              <Icons.Sparkles />
              <span>Study Plan</span>
            </div>
          )}
          <div
            data-tutorial-target="profile-settings"
            className={`sidebar-profile-settings${isTutorialTarget('profile-settings') ? ' tutorial-highlight' : ''}`}
          >
          <button className="sidebar-action" onClick={() => setShowProfile(true)} title={collapsed?'Profile':''}>
            <span className="nav-icon"><Icons.User /></span>
            {!collapsed && <span className="nav-label">Profile</span>}
          </button>
          <button className="sidebar-action" onClick={() => setShowSettings(true)} title={collapsed?'Settings':''}>
            <span className="nav-icon"><Icons.Settings /></span>
            {!collapsed && <span className="nav-label">Settings</span>}
          </button>
          </div>
          {!collapsed && (
            <div className="sidebar-motivation-card" aria-hidden="true">
              <strong>Stay focused.</strong>
              <span>Stay consistent.</span>
              <em>You&apos;ve got this.</em>
            </div>
          )}
          <div className={`sidebar-user-row${collapsed?' collapsed':''}`}>
            <div className={`sidebar-avatar${currentUser.avatarUrl ? ' has-photo' : ''}`}>
              {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" /> : initials}
            </div>
            {!collapsed && <div className="sidebar-user-info">
              <p className="sidebar-user-name">{displayName}</p>
              <p className="sidebar-user-sub">{displaySub}</p>
            </div>}
          </div>
          <button className="sidebar-logout" onClick={() => setShowLogout(true)} title={collapsed?'Sign Out':''}>
            <span className="nav-icon"><Icons.LogOut /></span>
            {!collapsed && <span className="nav-label">Sign Out</span>}
          </button>
        </div>
      </aside>

      <main
        className={`dash-main view-${activeView} ${isDayMode ? 'day-mode' : 'night-mode'} ${timeOfDayMode}-mode`}
        style={{ '--dashboard-scene': `url("${dayNightAsset}")` }}
      >
        <header className="dash-header">
          {activeView === 'productivity' && (
            <div className="dash-header-scene" aria-hidden="true">
              <img src={dayNightAsset} alt="" />
            </div>
          )}
          <div className="dash-header-copy">
            <h1 className="dash-title">
              {activeView === 'tasks'
                ? (filter === 'overdue' ? 'Overdue tasks' : 'Tasks')
                : activeView === 'pomodoro'
                  ? 'Pomodoro timer'
                  : activeView === 'productivity'
                    ? `${greeting}, ${firstName}`
                    : activeView === 'review'
                      ? 'Reviewer'
                      : activeView === 'essay'
                        ? 'Essay Practice'
                        : activeView === 'focusBreak'
                          ? 'TaskTris'
                          : activeView === 'gwa'
                            ? 'GWA Calculator'
                            : activeView === 'about'
                              ? 'About TaskRay'
                              : 'Calendar'}
            </h1>
            <p className="dash-subtitle">
              {activeView === 'tasks'
                ? `${filteredTasks.length} task${filteredTasks.length!==1?'s':''}`
                : activeView === 'pomodoro'
                  ? 'Set focus time and keep sessions visible'
                  : activeView === 'productivity'
                    ? `${completionRate}% completion rate across your tasks`
                    : activeView === 'review'
                      ? `${studyProgress}% review progress`
                      : activeView === 'essay'
                        ? 'Generate prompts, write drafts, and improve with feedback'
                        : activeView === 'focusBreak'
                          ? 'A quick TaskTris block break after focused work'
                          : activeView === 'gwa'
                            ? 'Upload grades, review subjects, and save your academic performance'
                            : activeView === 'about'
                              ? 'Created by IANA'
                              : `${calendarEvents.length} event${calendarEvents.length!==1?'s':''} scheduled`}
            </p>
            <div className="dash-header-meta">
              <span>{todayLabel}</span>
              <span>{workspaceQuote}</span>
            </div>
          </div>
          <div className="workspace-search" role="search">
            <Icons.Search />
            <input
              type="search"
              placeholder="Search tasks, events, reviewers..."
              value={workspaceSearchQuery}
              onFocus={() => setShowSearchSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowSearchSuggestions(false), 120)}
              onChange={event => {
                setWorkspaceSearchQuery(event.target.value);
                setShowSearchSuggestions(true);
                if (activeView === 'tasks') setSearchQuery(event.target.value);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' && workspaceSearchSuggestions[0]) {
                  event.preventDefault();
                  handleWorkspaceSearchSelect(workspaceSearchSuggestions[0]);
                }
                if (event.key === 'Escape') setShowSearchSuggestions(false);
              }}
              aria-label="Search TaskRay"
            />
            <button
              type="button"
              className="workspace-search-clear"
              onMouseDown={event => event.preventDefault()}
              onClick={() => {
                setWorkspaceSearchQuery('');
                if (activeView === 'tasks') setSearchQuery('');
                setShowSearchSuggestions(true);
              }}
              aria-label="Clear search"
            >
              {workspaceSearchQuery ? <Icons.X /> : <Icons.Sparkles />}
            </button>
            {showSearchSuggestions && (
              <div className="workspace-search-menu" onMouseDown={event => event.preventDefault()}>
                <div className="workspace-search-menu-head">
                  <span>{normalizedWorkspaceSearch ? 'Suggestions' : 'Recent searches'}</span>
                  {!normalizedWorkspaceSearch && recentSearches.length > 0 && (
                    <button type="button" onClick={() => setRecentSearches([])}>Clear</button>
                  )}
                </div>
                {workspaceSearchSuggestions.length ? (
                  workspaceSearchSuggestions.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className="workspace-search-option"
                      onClick={() => handleWorkspaceSearchSelect(item)}
                    >
                      <span className="workspace-search-type">{item.type}</span>
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.detail}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="workspace-search-empty">
                    <strong>No matches found</strong>
                    <small>Try a task title, subject, event, or page name.</small>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="dash-header-actions">
            <button className="header-tutorial-btn" type="button" onClick={startTutorial} title="Open guided tutorial">
              <Icons.Graduation /> Tutorial
            </button>
            <button className="header-icon-btn" type="button" title="Refresh tab" onClick={handleRefreshCurrentTab}>
              <Icons.Refresh />
            </button>
            <button
              className={`header-icon-btn ${notificationCount ? 'has-alert' : ''}${showNotifications ? ' active' : ''}`}
              type="button"
              title="Notifications"
              aria-label={`Notifications${notificationCount ? `, ${notificationCount} items` : ''}`}
              aria-expanded={showNotifications}
              onClick={() => setShowNotifications(open => !open)}
            >
              <Icons.Sparkles />
              {notificationCount > 0 && <i>{notificationCount}</i>}
            </button>
            {showNotifications && (
              <NotificationCenter
                items={notificationItems}
                count={notificationCount}
                onClose={() => setShowNotifications(false)}
                onOpenItem={handleOpenNotification}
                onDismissItem={handleDismissNotification}
                onEnableNotifications={handleEnableBrowserNotifications}
                notificationPermission={notificationPermission}
              />
            )}
            <button className="header-user-chip" type="button" onClick={() => setShowProfile(true)}>
              <span className={`sidebar-avatar${currentUser.avatarUrl ? ' has-photo' : ''}`}>
                {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" /> : initials}
              </span>
              <span>
                <strong>{displayName}</strong>
                <small>{displaySub}</small>
              </span>
            </button>
          </div>
          <div className="mobile-header-tools">
            <button onClick={() => setShowProfile(true)} title="Profile"><Icons.User /></button>
            <button onClick={() => setShowSettings(true)} title="Settings"><Icons.Settings /></button>
            <button onClick={() => setShowLogout(true)} title="Sign out"><Icons.LogOut /></button>
          </div>
          {activeView === 'tasks' && (
            <button className="dash-add-btn" onClick={() => { setEditingTask(null); setShowAddForm(true); }}>
              <Icons.Plus /><span>New Task</span>
            </button>
          )}
        </header>

        <div
          data-tutorial-target="quick-actions"
          className={`tab-quick-actions${isTutorialTarget('quick-actions') ? ' tutorial-highlight' : ''}`}
          aria-label="Quick actions"
        >
          <button type="button" onClick={handleRefreshCurrentTab} disabled={refreshingView === activeView}>
            <Icons.Refresh /> {refreshingView === activeView ? 'Refreshing...' : 'Refresh'}
          </button>
          {activeView === 'productivity' && (
            <>
              <button type="button" onClick={() => { setActiveView('tasks'); setEditingTask(null); setShowAddForm(true); }}><Icons.Plus /> New task</button>
              <button type="button" onClick={() => setActiveView('pomodoro')}><Icons.Timer /> Focus</button>
              <button type="button" onClick={() => setActiveView('calendar')}><Icons.Calendar /> Calendar</button>
              <button type="button" onClick={() => setActiveView('review')}><Icons.Book /> Reviewer</button>
              <button type="button" onClick={() => setActiveView('essay')}><Icons.Pen /> Essay</button>
              <button type="button" onClick={() => setActiveView('focusBreak')}><Icons.Gamepad /> TaskTris</button>
              <button type="button" onClick={() => setActiveView('gwa')}><Icons.Graduation /> GWA</button>
            </>
          )}
          {activeView === 'tasks' && (
            <>
              <button type="button" onClick={() => { setFilter('all'); setCategoryFilter('all'); }}><Icons.Zap /> All tasks</button>
              <button type="button" onClick={() => setFilter('todo')}><Icons.Circle /> To do</button>
              <button type="button" onClick={() => setFilter('completed')}><Icons.Check /> Done</button>
            </>
          )}
          {activeView === 'pomodoro' && (
            <>
              <button type="button" onClick={() => setPomodoroRunning(running => !running)}><Icons.Timer /> {pomodoroRunning ? 'Pause' : 'Start'}</button>
              <button type="button" onClick={handleResetPomodoro}>Reset</button>
              <button type="button" onClick={handleOpenPomodoroPopup}>Float outside</button>
            </>
          )}
          {activeView === 'calendar' && (
            <>
              <button type="button" onClick={() => setCalendarMonth(monthValue(new Date()))}>Today</button>
              <button type="button" onClick={() => setNewEvent({ ...newEvent, date: new Date().toISOString().slice(0, 10) })}><Icons.Plus /> Today agenda</button>
              {selectedCalendarEvent && <button type="button" onClick={() => setSelectedEventId(null)}>Close details</button>}
            </>
          )}
          {activeView === 'review' && (
            <>
              <button type="button" onClick={handleStartSubjectQuiz} disabled={!activeReviewer.questions.length}><Icons.Check /> Start quiz</button>
              <button type="button" onClick={() => setShowReviewerSubjects(value => !value)}>{showReviewerSubjects ? 'Focus subject' : 'Show subjects'}</button>
              <button type="button" onClick={handleResetReview}>Reset review</button>
            </>
          )}
          {activeView === 'essay' && (
            <>
              <button type="button" onClick={() => setEssayRefreshToken(token => token + 1)}><Icons.Refresh /> Reload essays</button>
              <button type="button" onClick={() => setActiveView('review')}><Icons.Book /> Reviewer</button>
            </>
          )}
          {activeView === 'focusBreak' && (
            <>
              <button type="button" onClick={() => setActiveView('tasks')}><Icons.Check /> Check tasks</button>
              <button type="button" onClick={() => setActiveView('pomodoro')}><Icons.Timer /> Focus timer</button>
            </>
          )}
        </div>

        {activeView === 'tasks' && (
        <>
        <div className="dash-stats">
          {[['Total',stats.total,'#38bdf8'],['Completed',stats.completed,'#2dd4bf'],
            ['In Progress',stats.inProgress,'#c084fc'],['To Do',stats.todo,'#cbd5e1'],
            ['Overdue',stats.overdue,'#fb7185']].map(([label,value,color]) => (
            <div className="dash-stat-card" key={label}>
              <span className="dash-stat-value" style={{color}}>{value}</span>
              <span className="dash-stat-label">{label}</span>
            </div>
          ))}
        </div>

        <ReminderPanel
          reminders={visibleReminders}
          onDismiss={(id) => setDismissedReminders(prev => [...prev, id])}
          onEnableNotifications={handleEnableBrowserNotifications}
          notificationPermission={notificationPermission}
        />

        {taskError && <div className="dash-error-banner"><Icons.Alert /><span>{taskError}</span><button onClick={() => setTaskError('')}><Icons.X /></button></div>}

        <div className="dash-controls">
          <div className="dash-search-wrap">
            <span className="search-icon"><Icons.Search /></span>
            <input type="text" placeholder="Search tasks…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="dash-search" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="dash-select">
            <option value="priority">Priority</option>
            <option value="dueDate">End Date</option>
            <option value="created">Created</option>
          </select>
        </div>

        <div className="task-status-tabs" aria-label="Task status filters">
          {[
            { id: 'all', label: 'All', icon: <Icons.Zap />, count: stats.total },
            { id: 'todo', label: 'To Do', icon: <Icons.Circle />, count: stats.todo },
            { id: 'in-progress', label: 'In Progress', icon: <Icons.Clock />, count: stats.inProgress },
            { id: 'completed', label: 'Completed', icon: <Icons.Check />, count: stats.completed },
            { id: 'overdue', label: 'Overdue', icon: <Icons.Flame />, count: stats.overdue },
          ].map(item => (
            <button
              key={item.id}
              className={`task-status-tab${filter === item.id ? ' active' : ''}${item.id === 'overdue' ? ' danger' : ''}`}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </button>
          ))}
        </div>

        <div className="task-category-filter" aria-label="Task category filter">
          <label htmlFor="task-category-filter">Category</label>
          <select
            id="task-category-filter"
            className="dash-select"
            value={categoryFilter}
            onChange={event => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories ({trackerStats.total})</option>
            {trackerByType.map(group => (
              <option key={group.type} value={group.type}>
                {group.type} ({group.items.length})
              </option>
            ))}
          </select>
        </div>

        <div className="task-view-controls" aria-label="Task view options">
          <span>View</span>
          {[
            { id: 'list', label: 'List', icon: 'L' },
            { id: 'columns', label: 'Columns', icon: 'C' },
            { id: 'box', label: 'Box', icon: 'B' },
          ].map(view => (
            <button
              key={view.id}
              type="button"
              className={taskViewMode === view.id ? 'active' : ''}
              onClick={() => handleTaskViewMode(view.id)}
              aria-pressed={taskViewMode === view.id}
            >
              <span aria-hidden="true">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        {isTaskEditorOpen && (
          <section className="task-focus-editor" aria-label={editingTask ? 'Edit task focus view' : 'Create task focus view'}>
            <div className="task-focus-head">
              <div>
                <span className="metric-label">Focus editor</span>
                <h2>{editingTask ? 'Edit task' : 'Create task'}</h2>
                <p>{editingTask ? 'Update this task without the rest of the board getting in the way.' : 'Add one task at a time with all details in one clean place.'}</p>
              </div>
              <button className="task-focus-close" type="button" onClick={closeTaskEditor} title="Close task editor">
                <Icons.X />
              </button>
            </div>
            <form
              onSubmit={e => {
                if (editingTask) {
                  e.preventDefault();
                  handleUpdateTask(editingTask.id, editingTask);
                } else {
                  handleAddTask(e);
                }
              }}
              className="dash-form task-focus-form"
            >
              <input type="text" placeholder="Task title *" value={taskDraft.title || ''}
                onChange={e => setTaskDraftField('title', e.target.value)} className="dash-input" required />
              <textarea placeholder="Description (optional)" value={taskDraft.description || ''}
                onChange={e => setTaskDraftField('description', e.target.value)} className="dash-textarea" rows="3" />
              <div className="task-ai-assist">
                <div className="task-ai-head">
                  <span><Icons.Sparkles /> AI title assistant</span>
                  <small>Click a suggestion to use it as your task name.</small>
                </div>
                <div className="task-ai-suggestions">
                  {taskTitleSuggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setTaskDraftField('title', suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              <div className="dash-form-row">
                <select value={taskDraft.priority || 'medium'} onChange={e => setTaskDraftField('priority', e.target.value)} className="dash-select">
                  <option value="low">Low Priority</option><option value="medium">Medium Priority</option><option value="high">High Priority</option>
                </select>
                <select value={taskDraft.category || 'Other'} onChange={e => setTaskDraftField('category', e.target.value)} className="dash-select">
                  {trackerTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <select value={taskDraft.status || 'todo'} onChange={e => setTaskDraftField('status', e.target.value)} className="dash-select">
                  <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                </select>
              </div>
              <div className="dash-datetime-row">
                <div className="dash-datetime-group">
                  <label className="dash-datetime-label">Start Date &amp; Time</label>
                  <div className="dash-datetime-inputs">
                    <input type="date" value={taskDraft.startDate || ''} onChange={e => setTaskDraftField('startDate', e.target.value)} className="dash-input" />
                    <input type="time" value={taskDraft.startTime || ''} onChange={e => setTaskDraftField('startTime', e.target.value)} className="dash-input" />
                  </div>
                </div>
                <div className="dash-datetime-sep">to</div>
                <div className="dash-datetime-group">
                  <label className="dash-datetime-label">End Date &amp; Time</label>
                  <div className="dash-datetime-inputs">
                    <input type="date" value={taskDraft.endDate || ''} onChange={e => setTaskDraftField('endDate', e.target.value)} className="dash-input" />
                    <input type="time" value={taskDraft.endTime || ''} onChange={e => setTaskDraftField('endTime', e.target.value)} className="dash-input" />
                  </div>
                </div>
              </div>
              <div className="dash-deadline-row">
                <div className="dash-datetime-group">
                  <label className="dash-datetime-label">Deadline <span style={{fontSize:'0.68rem',opacity:0.6,fontWeight:400}}>(optional)</span></label>
                  <div className="dash-datetime-inputs">
                    <input type="date" value={taskDraft.deadlineDate || ''} onChange={e => setTaskDraftField('deadlineDate', e.target.value)} className="dash-input" />
                    <input type="time" value={taskDraft.deadlineTime || ''} onChange={e => setTaskDraftField('deadlineTime', e.target.value)} className="dash-input" />
                  </div>
                </div>
              </div>
              <div className="dash-form-btns">
                <button type="submit" className="dash-submit-btn">
                  {editingTask ? <Icons.Save /> : <Icons.Plus />} {editingTask ? 'Save Task' : 'Add Task'}
                </button>
                <button type="button" className="dash-cancel-btn" onClick={closeTaskEditor}><Icons.X /> Cancel</button>
              </div>
            </form>
          </section>
        )}

        {false && showAddForm && (
          <form onSubmit={handleAddTask} className="dash-form">
            <h3 className="dash-form-title">Create New Task</h3>
            <input type="text" placeholder="Task title *" value={newTask.title}
              onChange={e => setNewTask({...newTask,title:e.target.value})} className="dash-input" required />
            <textarea placeholder="Description (optional)" value={newTask.description}
              onChange={e => setNewTask({...newTask,description:e.target.value})} className="dash-textarea" rows="2" />
            <div className="dash-form-row">
              <select value={newTask.priority} onChange={e => setNewTask({...newTask,priority:e.target.value})} className="dash-select">
                <option value="low">Low Priority</option><option value="medium">Medium Priority</option><option value="high">High Priority</option>
              </select>
              <select value={newTask.category} onChange={e => setNewTask({...newTask,category:e.target.value})} className="dash-select">
                {trackerTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="dash-datetime-row">
              <div className="dash-datetime-group">
                <label className="dash-datetime-label">Start Date &amp; Time</label>
                <div className="dash-datetime-inputs">
                  <input type="date" value={newTask.startDate} onChange={e => setNewTask({...newTask,startDate:e.target.value})} className="dash-input" />
                  <input type="time" value={newTask.startTime} onChange={e => setNewTask({...newTask,startTime:e.target.value})} className="dash-input" />
                </div>
              </div>
              <div className="dash-datetime-sep">→</div>
              <div className="dash-datetime-group">
                <label className="dash-datetime-label">End Date &amp; Time</label>
                <div className="dash-datetime-inputs">
                  <input type="date" value={newTask.endDate} onChange={e => setNewTask({...newTask,endDate:e.target.value})} className="dash-input" />
                  <input type="time" value={newTask.endTime} onChange={e => setNewTask({...newTask,endTime:e.target.value})} className="dash-input" />
                </div>
              </div>
            </div>
            <div className="dash-deadline-row">
              <div className="dash-datetime-group">
                <label className="dash-datetime-label">⚑ Deadline <span style={{fontSize:'0.68rem',opacity:0.6,fontWeight:400}}>(optional)</span></label>
                <div className="dash-datetime-inputs">
                  <input type="date" value={newTask.deadlineDate} onChange={e => setNewTask({...newTask,deadlineDate:e.target.value})} className="dash-input" />
                  <input type="time" value={newTask.deadlineTime} onChange={e => setNewTask({...newTask,deadlineTime:e.target.value})} className="dash-input" style={{maxWidth:'130px'}} />
                </div>
              </div>
            </div>
            <div className="dash-form-btns">
              <button type="submit" className="dash-submit-btn"><Icons.Plus /> Add Task</button>
              <button type="button" className="dash-cancel-btn" onClick={() => setShowAddForm(false)}><Icons.X /> Cancel</button>
            </div>
          </form>
        )}

        <div
          data-tutorial-target="tasks"
          className={`dash-tasks task-view-${taskViewMode}${isTutorialTarget('tasks') ? ' tutorial-highlight' : ''}`}
        >
          {tasksLoading ? (
            <div className="dash-empty"><p>Loading tasks…</p></div>
          ) : filteredTasks.length === 0 ? (
            <div className="dash-empty">
              <div className="dash-empty-icon"><Icons.Circle /></div>
              <p>{filter==='all'?'No tasks yet. Create your first one!':'No tasks in this category.'}</p>
              <button className="dash-submit-btn" type="button" onClick={() => { setFilter('all'); setCategoryFilter('all'); setEditingTask(null); setShowAddForm(true); }}>
                <Icons.Plus /> New Task
              </button>
            </div>
          ) : filteredTasks.map(task => (
            <div key={task.id} className={`dash-task-card ${task.status}${isOverdue(task)?' overdue':''}`}>
              {false && editingTask?.id === task.id ? (
                <div className="dash-task-edit">
                  <input type="text" value={editingTask.title}
                    onChange={e => setEditingTask({...editingTask,title:e.target.value})} className="dash-input" />
                  <textarea value={editingTask.description||''}
                    onChange={e => setEditingTask({...editingTask,description:e.target.value})} className="dash-textarea" rows="2" />
                  <div className="dash-form-row">
                    <select value={editingTask.priority} onChange={e => setEditingTask({...editingTask,priority:e.target.value})} className="dash-select">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                    <select value={editingTask.category || 'Other'} onChange={e => setEditingTask({...editingTask,category:e.target.value})} className="dash-select">
                      {trackerTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="dash-datetime-row">
                    <div className="dash-datetime-group">
                      <label className="dash-datetime-label">Start</label>
                      <div className="dash-datetime-inputs">
                        <input type="date" value={editingTask.startDate||''} onChange={e => setEditingTask({...editingTask,startDate:e.target.value})} className="dash-input" />
                        <input type="time" value={editingTask.startTime||''} onChange={e => setEditingTask({...editingTask,startTime:e.target.value})} className="dash-input" />
                      </div>
                    </div>
                    <div className="dash-datetime-sep">→</div>
                    <div className="dash-datetime-group">
                      <label className="dash-datetime-label">End</label>
                      <div className="dash-datetime-inputs">
                        <input type="date" value={editingTask.endDate||''} onChange={e => setEditingTask({...editingTask,endDate:e.target.value})} className="dash-input" />
                        <input type="time" value={editingTask.endTime||''} onChange={e => setEditingTask({...editingTask,endTime:e.target.value})} className="dash-input" />
                      </div>
                    </div>
                  </div>
                  <div className="dash-deadline-row">
                    <div className="dash-datetime-group">
                      <label className="dash-datetime-label">⚑ Deadline <span style={{fontSize:'0.68rem',opacity:0.6,fontWeight:400}}>(optional)</span></label>
                      <div className="dash-datetime-inputs">
                        <input type="date" value={editingTask.deadlineDate||''} onChange={e => setEditingTask({...editingTask,deadlineDate:e.target.value})} className="dash-input" />
                        <input type="time" value={editingTask.deadlineTime||''} onChange={e => setEditingTask({...editingTask,deadlineTime:e.target.value})} className="dash-input" style={{maxWidth:'130px'}} />
                      </div>
                    </div>
                  </div>
                  <div className="dash-task-actions">
                    <button onClick={() => handleUpdateTask(task.id, editingTask)} className="dash-btn-save"><Icons.Save /> Save</button>
                    <button onClick={() => setEditingTask(null)} className="dash-btn-cancel">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="dash-task-top">
                    <div className="dash-task-header">
                      <span className={`dash-priority-dot ${task.priority}`} />
                      <h3 className="dash-task-title">{task.title}</h3>
                      <span className={`dash-priority-badge ${task.priority}`}>{task.priority}</span>
                    </div>
                    {task.description && <p className="dash-task-desc">{task.description}</p>}
                    <div className="dash-task-meta">
                      {task.category && <span className="dash-tag">📁 {task.category}</span>}
                      {(task.startDate || task.endDate) && (
                        <span className={`dash-tag time-tag${isOverdue(task)?' overdue-tag':''}`}>
                          <Icons.Clock />
                          {fmtDT(task.startDate, task.startTime)}
                          {task.startDate && task.endDate && <span className="dash-tag-arrow">→</span>}
                          {fmtDT(task.endDate, task.endTime)}
                        </span>
                      )}
                      {task.deadlineDate && (
                        <span className="deadline-badge">⚑ Deadline: {fmtDT(task.deadlineDate, task.deadlineTime)}</span>
                      )}
                      <span className="dash-tag status-tag">
                        {task.status==='completed'?'✓ Done':task.status==='in-progress'?'In Progress':'To Do'}
                      </span>
                    </div>
                  </div>
                  <div className="dash-task-actions">
                    <select value={task.status} onChange={e => handleUpdateTask(task.id,{status:e.target.value})} className="dash-status-select">
                      <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                    </select>
                    <button onClick={() => setPreviewTask(task)} className="dash-btn-preview"><Icons.Search /> Preview</button>
                    <button onClick={() => { setShowAddForm(false); setEditingTask(task); }} className="dash-btn-edit"><Icons.Edit /> Edit</button>
                    <button onClick={() => setTaskToDelete(task)} className="dash-btn-delete" title="Delete task"><Icons.Trash /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        </>
        )}
        {activeView === 'pomodoro' && (
          <section
            data-tutorial-target="pomodoro"
            className={`tool-panel pomodoro-panel${isTutorialTarget('pomodoro') ? ' tutorial-highlight' : ''}`}
          >
            <div className="pomodoro-clock">
              <span className="pomodoro-kicker">Focus session</span>
              <strong>{pomodoroDisplay}</strong>
              <p>{pomodoroRunning ? 'Timer is running' : pomodoroSecondsLeft === 0 ? 'Session complete' : 'Ready when you are'}</p>
            </div>
            <div className="tool-card">
              <label className="tool-label" htmlFor="pomodoro-minutes">Minutes</label>
              <input
                id="pomodoro-minutes"
                className="dash-input"
                type="number"
                min="1"
                max="120"
                value={pomodoroMinutes}
                onChange={(e) => handlePomodoroMinutes(e.target.value)}
              />
              <input
              className="pomodoro-slider"
                type="range"
                min="5"
                max="90"
                step="5"
                value={pomodoroMinutes}
                onChange={(e) => handlePomodoroMinutes(e.target.value)}
              />
              <div className="pomodoro-presets" aria-label="Pomodoro presets">
                {[15, 25, 45].map(minutes => (
                  <button
                    key={minutes}
                    type="button"
                    className={pomodoroMinutes === minutes ? 'active' : ''}
                    onClick={() => handlePomodoroMinutes(minutes)}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
              <div className="pomodoro-actions">
                <button className="dash-submit-btn" type="button" onClick={() => setPomodoroRunning(running => !running)}>
                  <Icons.Timer /> {pomodoroRunning ? 'Pause' : 'Start'}
                </button>
                <button className="dash-cancel-btn" type="button" onClick={handleResetPomodoro}>
                  Reset
                </button>
                <button className="dash-cancel-btn" type="button" onClick={handleOpenPomodoroPopup}>
                  Float outside
                </button>
                {!showMiniPomodoro && (
                  <button className="dash-cancel-btn" type="button" onClick={() => {
                    setShowMiniPomodoro(true);
                    localStorage.setItem('taskray-mini-pomodoro', 'visible');
                  }}>
                    Show mini timer
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {activeView === 'review' && (
          <section
            data-tutorial-target="reviewer"
            className={`review-study-layout${showReviewerSubjects ? '' : ' focus'}${isTutorialTarget('reviewer') ? ' tutorial-highlight' : ''}`}
          >
            <div className="review-hero-card">
              <div>
                <span className="metric-label">Reviewer builder</span>
                <h2>{activeReviewer.subject}</h2>
                <p>Create subject reviewers, add flashcards, prepare multiple-choice quizzes, and track your score.</p>
              </div>
              <div className="review-hero-actions">
                <button className="dashboard-link-btn" type="button" onClick={() => setShowReviewerSubjects(value => !value)}>
                  {showReviewerSubjects ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
                  {showReviewerSubjects ? 'Hide subjects' : 'Show subjects'}
                </button>
                <button className="dashboard-link-btn" type="button" onClick={handleResetReview}>Reset review</button>
              </div>
              <div className="review-progress-track"><i style={{ width: `${studyProgress}%` }} /></div>
            </div>

            <div className="review-control-strip" aria-label="Reviewer quick controls">
              <label>
                Current subject
                <select className="dash-select" value={activeReviewer.id} onChange={event => handleSelectReviewer(event.target.value)}>
                  {reviewers.map(reviewer => (
                    <option key={reviewer.id} value={reviewer.id}>{reviewer.subject}</option>
                  ))}
                </select>
              </label>
              <label>
                Practice mode
                <select className="dash-select" value={exerciseMode} onChange={event => setExerciseMode(event.target.value)}>
                  {reviewModeOptions.filter(mode => activeReviewer.reviewModes.includes(mode.id)).map(mode => (
                    <option key={mode.id} value={mode.id}>{mode.label}</option>
                  ))}
                </select>
              </label>
              <label>
                New question type
                <select
                  className="dash-select"
                  value={quizForm.type}
                  onChange={event => setQuizForm({
                    ...quizForm,
                    type: event.target.value,
                    answer: event.target.value === 'true-false' ? 'True' : '',
                  })}
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="identification">Identification</option>
                  <option value="true-false">True or False</option>
                </select>
              </label>
            </div>

            <div className="review-mode-tabs" aria-label="Reviewer exercise modes">
              {reviewModeOptions.filter(mode => activeReviewer.reviewModes.includes(mode.id)).map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  className={exerciseMode === mode.id ? 'active' : ''}
                  onClick={() => setExerciseMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {showReviewerSubjects && (
            <div className="review-builder-panel">
              <div className="review-panel-head">
                <div>
                  <span className="metric-label">Subjects</span>
                  <h2>Your reviewers</h2>
                </div>
                <strong>{reviewers.length}</strong>
              </div>
              <div className="review-subject-list">
                {reviewers.map(reviewer => (
                  <article className={`review-subject-card${reviewer.id === activeReviewer.id ? ' active' : ''}`} key={reviewer.id}>
                    <button type="button" onClick={() => handleSelectReviewer(reviewer.id)}>
                      <strong>{reviewer.subject}</strong>
                      <span>{(reviewer.flashcards || []).length} cards - {(reviewer.questions || []).length} questions</span>
                    </button>
                    <div className="review-subject-actions">
                      <button type="button" onClick={() => handleEditReviewer(reviewer)} title="Edit subject"><Icons.Edit /></button>
                      <button type="button" onClick={() => handleDeleteReviewer(reviewer.id)} title="Delete reviewer"><Icons.Trash /></button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="review-mini-form">
                <input
                  className="dash-input"
                  value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  placeholder="Subject name, e.g. Biology"
                />
                <div className="review-mode-picker">
                  {reviewModeOptions.map(mode => (
                    <label key={mode.id}>
                      <input
                        type="checkbox"
                        checked={reviewerModes.includes(mode.id)}
                        onChange={e => {
                          setReviewerModes(prev => e.target.checked
                            ? [...prev, mode.id]
                            : prev.filter(id => id !== mode.id));
                        }}
                      />
                      <span>{mode.label}</span>
                    </label>
                  ))}
                </div>
                <button className="dash-submit-btn" type="button" onClick={handleSaveReviewer}>
                  <Icons.Plus /> {editingReviewerId ? 'Save Subject' : 'Add Subject'}
                </button>
                {editingReviewerId && (
                  <button className="dash-cancel-btn" type="button" onClick={() => { setEditingReviewerId(null); setSubjectName(''); }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
            )}

            <div className="review-flashcard-panel">
              <div className="review-panel-head">
                <div>
                  <span className="metric-label">Flashcards</span>
                  <h2>{activeReviewer.subject} cards</h2>
                </div>
                <strong>{activeKnownFlashcards.length}/{activeReviewer.flashcards.length}</strong>
              </div>
              {currentFlashcard ? (
                <>
                  <button
                    type="button"
                    className={`review-flashcard ${flashcardFlipped ? 'flipped' : ''}`}
                    onClick={() => setFlashcardFlipped(flipped => !flipped)}
                  >
                    <span>{flashcardFlipped ? 'Answer' : 'Term'}</span>
                    <strong>{flashcardFlipped ? currentFlashcard.meaning : currentFlashcard.term}</strong>
                    <p>{flashcardFlipped ? 'Click to return to the term.' : 'Click to reveal the answer.'}</p>
                  </button>
                  <div className="review-card-actions">
                    <button type="button" onClick={handlePrevFlashcard}><Icons.ChevronLeft /> Previous</button>
                    <button type="button" onClick={handleKnowFlashcard}><Icons.Check /> I know this</button>
                    <button type="button" onClick={handleNextFlashcard}>Next <Icons.ChevronRight /></button>
                  </div>
                </>
              ) : (
                <div className="review-empty-state">Add your first flashcard for this subject.</div>
              )}
              <div className="review-mini-form">
                <input className="dash-input" value={flashcardForm.term} onChange={e => setFlashcardForm({ ...flashcardForm, term: e.target.value })} placeholder="Term" />
                <textarea className="dash-textarea" rows="2" value={flashcardForm.meaning} onChange={e => setFlashcardForm({ ...flashcardForm, meaning: e.target.value })} placeholder="Definition or explanation" />
                <button className="dash-submit-btn" type="button" onClick={handleSaveFlashcard}>
                  <Icons.Plus /> {flashcardForm.id ? 'Save Flashcard' : 'Add Flashcard'}
                </button>
              </div>
              <div className="review-manage-list">
                {activeReviewer.flashcards.map(card => (
                  <article className="review-manage-item" key={card.id}>
                    <div><strong>{card.term}</strong><p>{card.meaning}</p></div>
                    <button type="button" onClick={() => handleEditFlashcard(card)} title="Edit flashcard"><Icons.Edit /></button>
                    <button type="button" onClick={() => handleDeleteFlashcard(card.id)} title="Delete flashcard"><Icons.Trash /></button>
                  </article>
                ))}
              </div>
            </div>

            <div className="review-quiz-panel">
              <div className="review-panel-head">
                <div>
                  <span className="metric-label">Quiz questions</span>
                  <h2>{quizSessionActive ? `${activeReviewer.subject} quiz` : 'Upcoming quiz prep'}</h2>
                </div>
                <strong>{displayedQuizAnsweredCount}/{displayedQuizQuestions.length || activeReviewer.questions.length}</strong>
              </div>
              <div className="review-quiz-launch">
                <div>
                  <strong>Start quiz for this subject</strong>
                  <p>{activeReviewer.questions.length ? `${activeReviewer.questions.length} question${activeReviewer.questions.length === 1 ? '' : 's'} ready from ${activeReviewer.subject}.` : 'Add quiz questions first, then start a subject quiz.'}</p>
                </div>
                <div className={`review-timer-card${quizSessionActive && !quizSubmitted ? ' running' : ''}${quizTimedOut ? ' expired' : ''}`}>
                  <span><Icons.Timer /> Timed quiz</span>
                  <strong>{quizSessionActive ? formatQuizTime(quizSecondsLeft) : `${quizTimeLimitMinutes} min`}</strong>
                  <div className="review-timer-track"><i style={{ width: `${quizTimeProgress}%` }} /></div>
                  <label>
                    Time limit
                    <input
                      className="dash-input"
                      type="number"
                      min="1"
                      max="180"
                      value={quizTimeLimitMinutes}
                      disabled={quizSessionActive && !quizSubmitted}
                      onChange={e => {
                        const nextMinutes = Math.max(1, Math.min(180, Number(e.target.value) || 1));
                        setQuizTimeLimitMinutes(nextMinutes);
                        if (!quizSessionActive || quizSubmitted) setQuizSecondsLeft(nextMinutes * 60);
                      }}
                    />
                  </label>
                </div>
                <div className="review-quiz-launch-actions">
                  <div className="review-reveal-toggle" aria-label="Answer reveal timing">
                    <button type="button" className={quizRevealMode === 'immediate' ? 'active' : ''} onClick={() => setQuizRevealMode('immediate')}>
                      Reveal after wrong
                    </button>
                    <button type="button" className={quizRevealMode === 'end' ? 'active' : ''} onClick={() => setQuizRevealMode('end')}>
                      Reveal at end
                    </button>
                  </div>
                  <button className="dash-submit-btn" type="button" onClick={handleStartSubjectQuiz} disabled={!activeReviewer.questions.length}>
                    <Icons.Check /> {quizSessionActive ? 'Restart Quiz' : 'Start Quiz'}
                  </button>
                </div>
              </div>
              {quizTimedOut && (
                <div className="review-timeout-alert">
                  <Icons.Clock /> Time is up. TaskRay submitted this quiz automatically.
                </div>
              )}
              <div className="review-mini-form">
                <select
                  className="dash-select"
                  value={quizForm.type}
                  onChange={e => setQuizForm({
                    ...quizForm,
                    type: e.target.value,
                    answer: e.target.value === 'true-false' ? 'True' : '',
                  })}
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="identification">Identification</option>
                  <option value="true-false">True or False</option>
                </select>
                <input className="dash-input" value={quizForm.question} onChange={e => setQuizForm({ ...quizForm, question: e.target.value })} placeholder="Quiz question" />
                {quizForm.type === 'multiple-choice' && (
                  <>
                    <div className="review-option-editor">
                      {quizForm.options.map((option, index) => (
                        <input
                          key={index}
                          className="dash-input"
                          value={option}
                          onChange={e => {
                            const nextOptions = [...quizForm.options];
                            nextOptions[index] = e.target.value;
                            setQuizForm({ ...quizForm, options: nextOptions });
                          }}
                          placeholder={`Choice ${index + 1}`}
                        />
                      ))}
                    </div>
                    <select className="dash-select" value={quizForm.answer} onChange={e => setQuizForm({ ...quizForm, answer: e.target.value })}>
                      <option value="">Select correct answer</option>
                      {quizForm.options.filter(Boolean).map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </>
                )}
                {quizForm.type === 'identification' && (
                  <input
                    className="dash-input"
                    value={quizForm.answer}
                    onChange={e => setQuizForm({ ...quizForm, answer: e.target.value })}
                    placeholder="Correct typed answer"
                  />
                )}
                {quizForm.type === 'true-false' && (
                  <select className="dash-select" value={quizForm.answer} onChange={e => setQuizForm({ ...quizForm, answer: e.target.value })}>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                )}
                <button className="dash-submit-btn" type="button" onClick={handleSaveQuestion}>
                  <Icons.Plus /> {quizForm.id ? 'Save Question' : 'Add Question'}
                </button>
              </div>
              <div className="review-question-list">
                {!quizSessionActive && exerciseMode === 'flashcards' && <div className="review-empty-state">Use flashcards on the left, or start a subject quiz here.</div>}
                {!quizSessionActive && exerciseMode !== 'flashcards' && activeExerciseQuestions.length === 0 && <div className="review-empty-state">Add questions for this exercise mode to start reviewing.</div>}
                {quizSessionActive && displayedQuizQuestions.length === 0 && <div className="review-empty-state">Add questions first, then start the quiz.</div>}
                {(quizSessionActive || exerciseMode !== 'flashcards') && displayedQuizQuestions.map((item, index) => {
                  const selected = activeQuizAnswers[item.id];
                  const answered = Boolean(selected);
                  const questionType = item.type || 'multiple-choice';
                  const revealThisQuestion = answered && shouldRevealQuizAnswers;
                  const isCorrect = isCorrectAnswer(item, selected);
                  return (
                    <article className="review-question-card" key={item.question}>
                      <div className="review-question-top">
                        <span>{questionType.replace('-', ' ')} - Question {index + 1}</span>
                        {revealThisQuestion && (
                          <strong className={isCorrect ? 'correct' : 'wrong'}>
                            {isCorrect ? 'Correct' : 'Review'}
                          </strong>
                        )}
                      </div>
                      <h3>{item.question}</h3>
                      {(questionType === 'multiple-choice' || questionType === 'true-false') && (
                        <div className="review-options">
                          {(questionType === 'true-false' ? ['True', 'False'] : item.options).map(option => (
                            <button
                              key={option}
                              type="button"
                              disabled={quizSessionActive && quizSubmitted}
                              className={`${selected === option ? 'selected ' : ''}${revealThisQuestion && option === item.answer ? 'correct ' : ''}${revealThisQuestion && selected === option && !isCorrect ? 'wrong ' : ''}`}
                              onClick={() => {
                                if (quizSessionActive && quizSubmitted) return;
                                setQuizAnswers(prev => ({ ...prev, [activeReviewer.id]: { ...(prev[activeReviewer.id] || {}), [item.id]: option } }));
                              }}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                      {questionType === 'identification' && (
                        <div className="review-identification-answer">
                          <input
                            className={`dash-input${revealThisQuestion ? isCorrect ? ' correct' : ' wrong' : ''}`}
                            value={selected || ''}
                            disabled={quizSessionActive && quizSubmitted}
                            onChange={e => {
                              if (quizSessionActive && quizSubmitted) return;
                              setQuizAnswers(prev => ({ ...prev, [activeReviewer.id]: { ...(prev[activeReviewer.id] || {}), [item.id]: e.target.value } }));
                            }}
                            placeholder="Type your answer"
                          />
                          {revealThisQuestion && <p>Correct answer: {item.answer}</p>}
                        </div>
                      )}
                      <div className="review-question-actions">
                        <button type="button" onClick={() => handleEditQuestion(item)}><Icons.Edit /> Edit</button>
                        <button type="button" onClick={() => handleDeleteQuestion(item.id)}><Icons.Trash /> Delete</button>
                      </div>
                    </article>
                  );
                })}
                {quizSessionActive && displayedQuizQuestions.length > 0 && (
                  <div className="review-quiz-submit-row">
                    <button className="dash-submit-btn" type="button" onClick={handleSubmitSubjectQuiz} disabled={quizSubmitted}>
                      <Icons.Check /> {quizSubmitted ? 'Submitted' : 'Submit Quiz'}
                    </button>
                    <button className="dash-cancel-btn" type="button" onClick={handleResetSubjectQuiz}>
                      Reset quiz
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="review-result-card">
              <span className="metric-label">Result</span>
              <strong>{resultScore}/{resultTotal}</strong>
              <p>{exerciseMode === 'flashcards'
                ? 'Mark cards as known to build your flashcard progress.'
                : quizTimedOut
                  ? 'Time is up. Review your score and check the correct answers before trying again.'
                : quizSessionActive && !quizSubmitted
                  ? quizRevealMode === 'end'
                    ? 'Quiz is running. Correct answers will appear after you submit.'
                    : 'Quiz is running. Missed answers are shown right away.'
                  : displayedQuizQuestions.length && displayedQuizAnsweredCount === displayedQuizQuestions.length
                    ? 'Great job. Review any missed answers, then reset when you want to practice again.'
                    : 'Answer all questions in this mode to complete your score.'}</p>
            </div>
          </section>
        )}

        {activeView === 'gwa' && (
          <div data-tutorial-target="gwa" className={isTutorialTarget('gwa') ? 'tutorial-module-wrap tutorial-highlight' : 'tutorial-module-wrap'}>
            <GwaCalculator currentUser={currentUser} Icons={Icons} />
          </div>
        )}

        {activeView === 'essay' && (
          <div data-tutorial-target="essay" className={isTutorialTarget('essay') ? 'tutorial-module-wrap tutorial-highlight' : 'tutorial-module-wrap'}>
            <EssayPractice currentUser={currentUser} refreshToken={essayRefreshToken} />
          </div>
        )}

        {activeView === 'focusBreak' && (
          <div data-tutorial-target="tasktris" className={isTutorialTarget('tasktris') ? 'tutorial-module-wrap tutorial-highlight' : 'tutorial-module-wrap'}>
            <FocusBreak currentUser={currentUser} tasks={tasks} />
          </div>
        )}

        {activeView === 'about' && (
          <section className="about-layout">
            <article className="about-hero-card">
              <div className="about-creator-mark">
                <img src="/iana_creator.png" alt="IANA creator logo" />
              </div>
              <div className="about-copy">
                <span className="metric-label">Creator signature</span>
                <h2>TaskRay was created by IANA.</h2>
                <p>
                  TaskRay is a student productivity workspace for planning tasks, reviewing lessons,
                  practicing essays, tracking focus time, scheduling agendas, playing TaskTris breaks,
                  and monitoring academic performance.
                </p>
                <div className="about-pills" aria-label="TaskRay credits">
                  <span>Created by IANA</span>
                  <span>Student productivity</span>
                  <span>TaskRay workspace</span>
                </div>
              </div>
            </article>

            <div className="about-grid">
              <article className="about-card">
                <span className="metric-label">Purpose</span>
                <h3>Built for everyday student focus</h3>
                <p>Keep tasks, reviewers, grades, essays, reminders, and focus tools in one calm system.</p>
              </article>
              <article className="about-card">
                <span className="metric-label">Modules</span>
                <h3>Everything in one place</h3>
                <p>Dashboard, Tasks, Calendar, Reviewer, Essay Practice, Pomodoro, TaskTris, and GWA Calculator.</p>
              </article>
              <article className="about-card">
                <span className="metric-label">Credit</span>
                <h3>Made with the IANA identity</h3>
                <p>This About page keeps the creator mark visible so users know TaskRay belongs to IANA.</p>
              </article>
            </div>
          </section>
        )}

        {activeView === 'productivity' && (
          <section className="productivity-dashboard">
            <div
              data-tutorial-target="workspace"
              className={`productivity-hero ${isDayMode ? 'day-mode' : 'night-mode'} ${timeOfDayMode}-mode${isTutorialTarget('workspace') ? ' tutorial-highlight' : ''}`}
              style={{ '--hero-scene': `url("${dayNightAsset}")` }}
            >
              <div className="dashboard-day-night-scene" aria-hidden="true" />
              <div className="productivity-copy">
                <div className="dashboard-hero-kicker">
                  <span className="metric-label">Your productivity score</span>
                  <span className="day-night-pill">{dayNightStatus}</span>
                </div>
                <h2>{greeting}, {firstName}</h2>
                <div className="productivity-score-row">
                  <strong>{completionRate}%</strong>
                  <em>{productivityTone}</em>
                </div>
                <p>Your score is based on completed tasks against everything currently in TaskRay.</p>
                <div className="progress-track"><i style={{ width: `${completionRate}%` }} /></div>
              </div>
              <div className="productivity-ring-card" aria-label={`Productivity score ${completionRate}%`}>
                <div className="productivity-ring" style={{ '--score': `${completionRate * 3.6}deg` }}>
                  <div>
                    <span>{completionRate}%</span>
                    <small>Today</small>
                  </div>
                </div>
                <div className="weekly-trend" aria-hidden="true">
                  {[38, 52, 47, 66, 58, 74, Math.max(18, completionRate)].map((value, index) => (
                    <i key={`${value}-${index}`} style={{ height: `${value}%` }} />
                  ))}
                </div>
              </div>
              <div className="dashboard-score-breakdown">
                {dashboardStudyRows.map(row => (
                  <div className="dashboard-score-row" key={row.label}>
                    <span>{row.icon}</span>
                    <strong>{row.label}</strong>
                    <em>{row.value}</em>
                  </div>
                ))}
              </div>
              <div className="dashboard-date-card">
                <div className="dashboard-date-head">
                  <span>Today&apos;s date</span>
                  <button type="button" onClick={() => setActiveView('calendar')}>View Calendar</button>
                </div>
                <strong>{todayLabel}</strong>
                <div className="dashboard-week-strip">
                  {weekStrip.map(day => (
                    <button
                      type="button"
                      key={`${day.label}-${day.day}`}
                      className={day.active ? 'active' : ''}
                      onClick={() => setActiveView('calendar')}
                    >
                      <span>{day.label}</span>
                      <b>{day.day}</b>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="productivity-grid">
              <div className="tool-card metric-tile active">
                <div className="metric-icon"><Icons.Zap /></div>
                <span className="metric-label">Active tasks</span>
                <strong className="metric-value">{activeTaskCount}</strong>
                <p className="metric-copy">{stats.inProgress} in progress and {stats.todo} waiting.</p>
                <MetricWave />
              </div>
              <div className="tool-card metric-tile completed">
                <div className="metric-icon"><Icons.Check /></div>
                <span className="metric-label">Completed</span>
                <strong className="metric-value">{stats.completed}</strong>
                <p className="metric-copy">Great job! Keep going.</p>
                <MetricWave />
              </div>
              <div className="tool-card metric-tile risk">
                <div className="metric-icon danger"><Icons.Flame /></div>
                <span className="metric-label">Risk watch</span>
                <strong className="metric-value danger">{stats.overdue}</strong>
                <p className="metric-copy">{stats.overdue ? 'Overdue tasks need attention first.' : 'No urgent risks detected.'}</p>
                <MetricWave />
              </div>
              <div className="tool-card metric-tile focus">
                <div className="metric-icon"><Icons.Timer /></div>
                <span className="metric-label">Pomodoro today</span>
                <strong className="metric-value">{pomodoroDisplay}</strong>
                <p className="metric-copy">{pomodoroRunning ? 'Focus session running now.' : 'Ready for your next focus session.'}</p>
                <MetricWave />
              </div>

            <div className="dashboard-wide-card">
              <div className="dashboard-card-head">
                <div>
                  <span className="metric-label">Today focus</span>
                  <h2>What needs your attention</h2>
                </div>
                <button className="dashboard-link-btn" type="button" onClick={() => setActiveView('tasks')}>Open tasks</button>
              </div>
              <div className="dashboard-focus-list">
                {topFocusTask ? (
                  <div className="dashboard-focus-item featured">
                    <span className={`dash-priority-dot ${topFocusTask.priority}`} />
                    <div>
                      <strong>{topFocusTask.title}</strong>
                      <p>{topFocusTask.status === 'in-progress' ? 'In progress' : 'To do'}{topFocusTask.deadlineDate ? ` - Deadline ${fmtDT(topFocusTask.deadlineDate, topFocusTask.deadlineTime)}` : ' - Estimate 25 min'}</p>
                    </div>
                    <button type="button" onClick={() => setActiveView('pomodoro')}>Start</button>
                  </div>
                ) : (
                  <div className="dashboard-empty-state">
                    <Icons.Check />
                    <strong>No active tasks right now</strong>
                    <p>Create one priority task to guide your next study block.</p>
                    <button type="button" onClick={() => { setActiveView('tasks'); setShowAddForm(true); }}>Add task</button>
                  </div>
                )}
              </div>
            </div>
            <div className="dashboard-wide-card compact">
              <div className="dashboard-card-head">
                <div>
                  <span className="metric-label">Agenda preview</span>
                  <h2>Next events</h2>
                </div>
                <button className="dashboard-link-btn" type="button" onClick={() => setActiveView('calendar')}>Open calendar</button>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="dashboard-empty-state small">
                  <Icons.Calendar />
                  <strong>No scheduled agendas yet</strong>
                  <p>Add a calendar event to see it here.</p>
                </div>
              ) : upcomingEvents.slice(0, 3).map(event => (
                <div className="dashboard-focus-item agenda" key={event.id}>
                  <span>{new Date(`${event.date}T00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.time || 'All day'}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="dashboard-wide-card compact dashboard-reviewer-card">
              <div className="dashboard-card-head">
                <div>
                  <span className="metric-label">Reviewer</span>
                  <h2>{dashboardReviewer.subject}</h2>
                </div>
                <button className="dashboard-link-btn" type="button" onClick={() => setActiveView('review')}>Open reviewer</button>
              </div>
              <div className="dashboard-reviewer-progress">
                <strong>{dashboardReviewerProgress}%</strong>
                <span>study progress</span>
              </div>
              <div className="progress-track mini"><i style={{ width: `${dashboardReviewerProgress}%` }} /></div>
              <div className="dashboard-mini-stats">
                <span>{(dashboardReviewer.flashcards || []).length} flashcards</span>
                <span>{(dashboardReviewer.questions || []).length} quiz items</span>
                <span>{reviewers.length} subject{reviewers.length === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div className="dashboard-wide-card compact dashboard-activity-card">
              <div className="dashboard-card-head">
                <div>
                  <span className="metric-label">Today&apos;s activity</span>
                  <h2>Mini activity</h2>
                </div>
                <span className="dashboard-date-pill">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className={`dashboard-recommendation ${todayRecommendation.tone}`}>
                <div>
                  <span>{todayRecommendation.label}</span>
                  <strong>{todayRecommendation.title}</strong>
                  <p>{todayRecommendation.copy}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView(todayRecommendation.view);
                    if (todayRecommendation.filter) setFilter(todayRecommendation.filter);
                  }}
                >
                  {todayRecommendation.action}
                </button>
              </div>
              <div className="dashboard-quote-card">
                <span><Icons.Sparkles /> Quote of the day</span>
                <strong>&ldquo;{quoteOfTheDay.text}&rdquo;</strong>
                <p>{quoteOfTheDay.author}</p>
              </div>
              <div className="dashboard-activity-list">
                {todayActivityItems.map(item => (
                  <div className={`dashboard-activity-item ${item.tone}`} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="dashboard-wide-card compact dashboard-gwa-card">
              <div className="dashboard-card-head">
                <div>
                  <span className="metric-label">Academic performance</span>
                  <h2>GWA Calculator</h2>
                </div>
                <button className="dashboard-link-btn" type="button" onClick={() => setActiveView('gwa')}>Open GWA</button>
              </div>
              <div className="dashboard-reviewer-progress">
                <strong><Icons.Graduation /></strong>
                <span>Upload grades, calculate GWA, and save semester records.</span>
              </div>
            </div>
            </div>
          </section>
        )}

        {activeView === 'calendar' && (
          <section
            data-tutorial-target="calendar"
            className={`calendar-layout${isTutorialTarget('calendar') ? ' tutorial-highlight' : ''}`}
          >
            <div className="calendar-overview">
              <div className="calendar-overview-head">
                <div>
                  <span className="metric-label">Calendar overview</span>
                  <h2>{calendarMonthLabel}</h2>
                </div>
                <div className="calendar-month-actions">
                  <button type="button" onClick={() => changeCalendarYear(-10)} title="Previous decade">-10y</button>
                  <button type="button" onClick={() => changeCalendarYear(-1)} title="Previous year">-1y</button>
                  <button type="button" onClick={() => changeCalendarMonth(-1)} title="Previous month"><Icons.ChevronLeft /></button>
                  <button type="button" onClick={() => setCalendarMonth(monthValue(new Date()))}>Today</button>
                  <button type="button" onClick={() => changeCalendarMonth(1)} title="Next month"><Icons.ChevronRight /></button>
                  <button type="button" onClick={() => changeCalendarYear(1)} title="Next year">+1y</button>
                  <button type="button" onClick={() => changeCalendarYear(10)} title="Next decade">+10y</button>
                  <label className="calendar-year-jump">
                    Year
                    <input
                      min="1"
                      max="9999"
                      type="number"
                      value={calendarMonthDate.getFullYear()}
                      onChange={event => jumpToCalendarYear(event.target.value)}
                      aria-label="Jump to calendar year"
                    />
                  </label>
                </div>
              </div>
              <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <span key={day}>{day}</span>)}
              </div>
              <div className="calendar-month-grid">
                {calendarCells.map(cell => (
                  <div key={cell.id} className={`calendar-month-cell${cell.blank ? ' blank' : ''}${cell.events?.length ? ' has-events' : ''}`}>
                    {!cell.blank && (
                      <>
                        <strong>{cell.day}</strong>
                        <div className="calendar-cell-events">
                          {cell.events.slice(0, 3).map(event => (
                            <button key={event.id} type="button" title="View event details" onClick={() => setSelectedEventId(event.id)}>
                              {event.time ? `${event.time} ` : ''}{event.title}
                            </button>
                          ))}
                          {cell.events.length > 3 && <em>+{cell.events.length - 3} more</em>}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <form className="tool-card calendar-form" onSubmit={handleAddEvent}>
              <h2 className="tool-title">Schedule an agenda</h2>
              <input className="dash-input" placeholder="Event or agenda title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
              <div className="dash-form-row">
                <input className="dash-input" type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                <input className="dash-input" type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
              </div>
              <textarea className="dash-textarea" rows="3" placeholder="Notes" value={newEvent.notes} onChange={e => setNewEvent({ ...newEvent, notes: e.target.value })} />
              <button className="dash-submit-btn" type="submit"><Icons.Plus /> Add agenda</button>
            </form>
            {selectedCalendarEvent && (
              <div className="calendar-detail-overlay" role="dialog" aria-modal="true" aria-label="Selected calendar event details" onClick={() => setSelectedEventId(null)}>
                <aside className="calendar-detail-card" onClick={event => event.stopPropagation()}>
                  <div className="calendar-detail-head">
                    <div>
                      <span className="metric-label">Event details</span>
                      <h2>{selectedCalendarEvent.title}</h2>
                    </div>
                    <button className="calendar-detail-close" type="button" onClick={() => setSelectedEventId(null)} title="Close details">
                      <Icons.X />
                    </button>
                  </div>
                  <div className="calendar-detail-date">
                    <strong>{new Date(`${selectedCalendarEvent.date}T00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    <span>{selectedCalendarEvent.time || 'All day'}</span>
                  </div>
                  <div className="calendar-detail-notes">
                    <span className="metric-label">Notes</span>
                    <p>{selectedCalendarEvent.notes || 'No notes added for this event.'}</p>
                  </div>
                  <div className="calendar-detail-actions">
                    <button className="dashboard-link-btn" type="button" onClick={() => setSelectedEventId(null)}>Close</button>
                    <button className="dash-btn-delete" type="button" onClick={() => handleDeleteEvent(selectedCalendarEvent.id)}><Icons.Trash /> Delete event</button>
                  </div>
                </aside>
              </div>
            )}
            <div className="calendar-preview">
              <div className="calendar-preview-head">
                <div>
                  <span className="metric-label">Agenda list</span>
                  <h2>All scheduled events</h2>
                </div>
                <strong>{sortedEvents.length}</strong>
              </div>
              {sortedEvents.length === 0 ? (
                <div className="dash-empty"><p>No agendas yet.</p></div>
              ) : Object.entries(eventGroups).map(([dateLabel, events]) => (
                <section className="calendar-day-group" key={dateLabel}>
                  <h3>{dateLabel}</h3>
                  {events.map(event => (
                    <article className={`calendar-preview-event${selectedEventId === event.id ? ' active' : ''}`} key={event.id}>
                      <button className="calendar-event-open" type="button" onClick={() => setSelectedEventId(event.id)} title="View event details">
                        <time>{event.time || 'All day'}</time>
                      </button>
                      <button className="calendar-event-open calendar-event-text" type="button" onClick={() => setSelectedEventId(event.id)} title="View event details">
                        <strong>{event.title}</strong>
                        {event.notes && <p>{event.notes}</p>}
                      </button>
                      <button className="dash-btn-delete" type="button" onClick={() => handleDeleteEvent(event.id)} title="Delete agenda"><Icons.Trash /></button>
                    </article>
                  ))}
                </section>
              ))}
            </div>
            <div className="calendar-list">
              <div className="calendar-list-title">
                <span className="metric-label">Quick preview</span>
                <h2>Upcoming</h2>
              </div>
              {upcomingEvents.length === 0 ? (
                <div className="dash-empty"><p>No agendas yet.</p></div>
              ) : upcomingEvents.map(event => (
                <article className={`calendar-event${selectedEventId === event.id ? ' active' : ''}`} key={event.id}>
                  <button className="calendar-date-box" type="button" onClick={() => setSelectedEventId(event.id)} title="View event details">
                    <strong>{new Date(`${event.date}T00:00`).toLocaleDateString('en-US', { day: '2-digit' })}</strong>
                    <span>{new Date(`${event.date}T00:00`).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </button>
                  <button className="calendar-event-body" type="button" onClick={() => setSelectedEventId(event.id)} title="View event details">
                    <h3>{event.title}</h3>
                    <p>{event.time || 'All day'}{event.notes ? ` - ${event.notes}` : ''}</p>
                  </button>
                  <button className="dash-btn-delete" type="button" onClick={() => handleDeleteEvent(event.id)} title="Delete agenda"><Icons.Trash /></button>
                </article>
              ))}
            </div>
          </section>
        )}

      </main>

      <video
        ref={pomodoroVideoRef}
        className="pomodoro-pip-video"
        aria-hidden="true"
        muted
        playsInline
        controls
        onPlay={() => setPomodoroRunning(true)}
        onPause={() => setPomodoroRunning(false)}
      />

      {showMiniPomodoro && (
      <aside
        className={`floating-pomodoro ${pomodoroRunning ? 'running' : ''}${draggingPomodoro ? ' dragging' : ''}`}
        aria-label="Mini Pomodoro timer"
        style={pomodoroPosition ? { left: pomodoroPosition.x, top: pomodoroPosition.y, right: 'auto', bottom: 'auto' } : undefined}
      >
        <button
          className="floating-pomodoro-close"
          type="button"
          onClick={() => {
            setShowMiniPomodoro(false);
            localStorage.setItem('taskray-mini-pomodoro', 'hidden');
          }}
          title="Close mini timer"
        >
          <Icons.X />
        </button>
        <button
          className="floating-pomodoro-main"
          type="button"
          onPointerDown={handlePomodoroDragStart}
          onClick={() => {
            if (suppressPomodoroClick.current) return;
            setActiveView('pomodoro');
          }}
          title="Drag to move, click to open Pomodoro"
        >
          <span><Icons.Timer /> Pomodoro</span>
          <strong>{pomodoroDisplay}</strong>
        </button>
        <div className="floating-pomodoro-actions">
          <button type="button" onClick={() => setPomodoroRunning(running => !running)} title={pomodoroRunning ? 'Pause timer' : 'Start timer'}>
            {pomodoroRunning ? 'Pause' : 'Start'}
          </button>
          <button type="button" onClick={handleResetPomodoro} title="Reset timer">Reset</button>
          <button className="floating-pomodoro-float" type="button" onClick={handleOpenPomodoroPopup} title="Float timer outside TaskRay">
            Float outside
          </button>
        </div>
      </aside>
      )}

      <nav className="mobile-task-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`${activeView===item.id || (item.id === 'overdue' && filter === 'overdue')?'active ':''}${item.danger?'danger':''}`}
            onClick={() => {
              setActiveView(item.id === 'overdue' ? 'tasks' : item.id);
              if (item.id === 'overdue') setFilter('overdue');
              else if (item.id === 'tasks') setFilter('all');
            }}
          >
            {item.icon}<span>{item.label}</span>
          </button>
        ))}
      </nav>

      {showTutorial && (
        <TutorialOverlay
          steps={tutorialSteps}
          stepIndex={tutorialStepIndex}
          onNext={nextTutorialStep}
          onPrevious={previousTutorialStep}
          onClose={closeTutorial}
          onJump={jumpTutorialStep}
        />
      )}

      {showLogout   && <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />}
      {previewTask && (
        <TaskPreviewModal
          task={previewTask}
          fmtDT={fmtDT}
          isOverdue={isOverdue}
          onClose={() => setPreviewTask(null)}
          onEdit={(task) => {
            setPreviewTask(null);
            setShowAddForm(false);
            setEditingTask(task);
          }}
          onDelete={(task) => {
            setPreviewTask(null);
            setTaskToDelete(task);
          }}
          onStatusChange={handleUpdateTask}
        />
      )}
      {taskToDelete && <DeleteTaskModal task={taskToDelete} onConfirm={() => handleDeleteTask(taskToDelete.id)} onCancel={() => setTaskToDelete(null)} />}
      {showProfile  && <ProfileModal user={currentUser} onSave={u => { setCurrentUser(u); setShowProfile(false); }} onClose={() => setShowProfile(false)} />}
      {showSettings && (
        <SettingsModal
          notificationsEnabled={notificationsEnabled}
          notificationPermission={notificationPermission}
          themeId={dashboardThemeId}
          onThemeChange={handleDashboardThemeChange}
          onToggleNotifications={handleToggleNotifications}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
