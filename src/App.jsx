import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import {
  buildDailyBrief,
  buildRecommendedNow,
  buildTodayPriorities,
  calculateSmartPriorities,
} from './services/studentIntelligence';

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

function MetricProgress({ value = 0, label = 'Progress', detail = '' }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="metric-progress" role="meter" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(safeValue)}>
      <div className="metric-progress-head">
        <span>{label}</span>
        <strong>{Math.round(safeValue)}%</strong>
      </div>
      <div className="metric-progress-track">
        <i style={{ width: `${safeValue}%` }} />
      </div>
      {detail && <small>{detail}</small>}
    </div>
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

function SettingsModal({
  user,
  preferences,
  notificationsEnabled,
  notificationPermission,
  themeId,
  onThemeChange,
  onToggleNotifications,
  onSavePreferences,
  onSaveProfile,
  onRequestPasswordReset,
  onClearStudyPlan,
  onClearReviewerHistory,
  onSignOut,
  onClose,
}) {
  const safePreferences = mergeUserPreferences(preferences);
  const savedDetails = getSavedProfileDetails(user.id);
  const initialProfile = normalizeUserProfile(user, user, savedDetails);
  const [activeSection, setActiveSection] = useState('profile');
  const [settingsSearch, setSettingsSearch] = useState('');
  const [draft, setDraft] = useState(safePreferences);
  const [profileDraft, setProfileDraft] = useState({
    name: initialProfile.name || '',
    username: initialProfile.username || '',
    email: initialProfile.email || '',
    program: initialProfile.program || '',
    avatarUrl: initialProfile.avatarUrl || '',
    avatarZoom: initialProfile.avatarZoom || 1,
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const notificationText = notificationPermission === 'granted'
    ? 'Browser alerts are enabled'
    : notificationPermission === 'denied'
      ? 'Browser alerts are blocked in this browser'
      : 'Alert 24 hours before tasks are due';
  const settingsSections = [
    { id: 'profile', group: 'Account', label: 'Profile', icon: <Icons.User />, keywords: 'name email bio avatar' },
    { id: 'academic', group: 'Account', label: 'Academic Profile', icon: <Icons.Graduation />, keywords: 'year term grade tps weekly' },
    { id: 'tasks', group: 'Productivity', label: 'Tasks', icon: <Icons.Zap />, keywords: 'priority reminder overdue archive' },
    { id: 'study', group: 'Productivity', label: 'Study Preferences', icon: <Icons.Calendar />, keywords: 'days time duration break weekend' },
    { id: 'studyPlan', group: 'Productivity', label: 'Study Plan', icon: <Icons.Sparkles />, keywords: 'ai sources schedule assessment confirmation' },
    { id: 'focus', group: 'Productivity', label: 'Focus & Pomodoro', icon: <Icons.Timer />, keywords: 'pomodoro focus break sound analytics' },
    { id: 'reviewer', group: 'Productivity', label: 'Reviewer', icon: <Icons.Book />, keywords: 'quiz feedback shuffle mastery attempts' },
    { id: 'gwa', group: 'Preferences', label: 'GWA & Academic', icon: <Icons.Graduation />, keywords: 'gwa weighted rounding prediction grades' },
    { id: 'notifications', group: 'Preferences', label: 'Notifications', icon: <Icons.Alert />, keywords: 'alerts quiet reminder browser' },
    { id: 'appearance', group: 'Preferences', label: 'Appearance', icon: <Icons.Settings />, keywords: 'theme dark compact sidebar motion' },
    { id: 'privacy', group: 'Privacy & Security', label: 'Privacy & Data', icon: <Icons.Info />, keywords: 'personalized ai data clear policies' },
    { id: 'security', group: 'Privacy & Security', label: 'Account Security', icon: <Icons.LogOut />, keywords: 'password sessions sign out delete account' },
  ];
  const query = settingsSearch.trim().toLowerCase();
  const visibleSections = query
    ? settingsSections.filter(section => `${section.label} ${section.group} ${section.keywords}`.toLowerCase().includes(query))
    : settingsSections;
  const groupedSections = visibleSections.reduce((groups, section) => {
    groups[section.group] = [...(groups[section.group] || []), section];
    return groups;
  }, {});
  const activeSectionInfo = settingsSections.find(section => section.id === activeSection) || settingsSections[0];
  const isDirty = JSON.stringify(draft) !== JSON.stringify(safePreferences)
    || JSON.stringify(profileDraft) !== JSON.stringify({
      name: initialProfile.name || '',
      username: initialProfile.username || '',
      email: initialProfile.email || '',
      program: initialProfile.program || '',
      avatarUrl: initialProfile.avatarUrl || '',
      avatarZoom: initialProfile.avatarZoom || 1,
    })
    || themeId !== (safePreferences.appearance.dashboardTheme || themeId);

  const updateDraft = (section, key, value) => {
    setDraft(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
    setStatus('');
    setError('');
  };
  const updateNestedDraft = (section, group, key, value) => {
    setDraft(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [group]: { ...prev[section][group], [key]: value },
      },
    }));
    setStatus('');
    setError('');
  };
  const toggleStudyDay = (day) => {
    setDraft(prev => {
      const days = prev.study.preferredDays.includes(day)
        ? prev.study.preferredDays.filter(item => item !== day)
        : [...prev.study.preferredDays, day];
      return { ...prev, study: { ...prev.study, preferredDays: days } };
    });
    setStatus('');
  };
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
    reader.onload = () => setProfileDraft(prev => ({ ...prev, avatarUrl: String(reader.result || ''), avatarZoom: 1 }));
    reader.readAsDataURL(file);
  };
  const handleDownloadData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: profileDraft,
      preferences: draft,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskray-settings-${user.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const handleSave = async () => {
    if (!profileDraft.username.trim()) {
      setError('Username is required.');
      setActiveSection('profile');
      return;
    }
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const savedProfile = await onSaveProfile(profileDraft);
      const nextPreferences = mergeUserPreferences({
        ...draft,
        appearance: { ...draft.appearance, dashboardTheme: themeId },
      });
      await onSavePreferences(nextPreferences);
      if (savedProfile) {
        setProfileDraft(prev => ({ ...prev, ...savedProfile }));
      }
      setStatus('Settings updated successfully.');
    } catch (err) {
      setError(err?.message || "We couldn't save your settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const resetDraft = () => {
    setDraft(safePreferences);
    setProfileDraft({
      name: initialProfile.name || '',
      username: initialProfile.username || '',
      email: initialProfile.email || '',
      program: initialProfile.program || '',
      avatarUrl: initialProfile.avatarUrl || '',
      avatarZoom: initialProfile.avatarZoom || 1,
    });
    setStatus('');
    setError('');
  };
  const renderToggle = (section, key, label, description) => (
    <div className="settings-row">
      <div><p className="settings-row-title">{label}</p><p className="settings-row-sub">{description}</p></div>
      <button type="button" className={`toggle-btn ${draft[section][key] ? 'on' : ''}`} onClick={() => updateDraft(section, key, !draft[section][key])} aria-pressed={draft[section][key]}><span className="toggle-thumb" /></button>
    </div>
  );
  const renderNotificationToggle = (key, label) => (
    <div className="settings-row compact-row">
      <div><p className="settings-row-title">{label}</p></div>
      <button type="button" className={`toggle-btn ${draft.notifications[key] ? 'on' : ''}`} onClick={() => updateDraft('notifications', key, !draft.notifications[key])} aria-pressed={draft.notifications[key]}><span className="toggle-thumb" /></button>
    </div>
  );
  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <>
            <p className="settings-section-label">Profile</p>
            <div className="settings-profile-strip">
              <div className={`profile-avatar-lg${profileDraft.avatarUrl ? ' has-photo' : ''}`}>
                {profileDraft.avatarUrl ? <img src={profileDraft.avatarUrl} alt="Profile preview" style={{ transform: `scale(${profileDraft.avatarZoom})` }} /> : (profileDraft.name || profileDraft.username || '?')[0].toUpperCase()}
              </div>
              <div className="profile-photo-actions">
                <label className="profile-change-btn"><Icons.Camera /> Upload photo<input type="file" accept="image/*" onChange={handlePhotoUpload} /></label>
                {profileDraft.avatarUrl && <button className="profile-change-btn muted" type="button" onClick={() => setProfileDraft(prev => ({ ...prev, avatarUrl: '', avatarZoom: 1 }))}>Remove</button>}
              </div>
            </div>
            <div className="settings-form-grid">
              <div className="modal-field"><label>Display name</label><input className="modal-input" value={profileDraft.name} onChange={e => setProfileDraft(prev => ({ ...prev, name: e.target.value }))} /></div>
              <div className="modal-field"><label>Username</label><input className="modal-input" value={profileDraft.username} onChange={e => setProfileDraft(prev => ({ ...prev, username: e.target.value }))} /></div>
              <div className="modal-field"><label>Email display</label><input className="modal-input" type="email" value={profileDraft.email} onChange={e => setProfileDraft(prev => ({ ...prev, email: e.target.value }))} /></div>
              <div className="modal-field"><label>Preferred name</label><input className="modal-input" value={draft.profile.preferredName} onChange={e => updateDraft('profile', 'preferredName', e.target.value)} placeholder="What should TaskRay call you?" /></div>
              <div className="modal-field wide-field"><label>Short bio</label><textarea className="modal-input" rows="3" value={draft.profile.bio} onChange={e => updateDraft('profile', 'bio', e.target.value)} placeholder="Optional note about your student goals" /></div>
              <div className="settings-readonly"><span>Account created</span><strong>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Saved account'}</strong></div>
            </div>
          </>
        );
      case 'academic':
        return (
          <>
            <p className="settings-section-label">Academic Profile</p>
            <div className="settings-form-grid">
              <div className="modal-field"><label>Current academic year</label><input className="modal-input" value={draft.academic.academicYear} onChange={e => updateDraft('academic', 'academicYear', e.target.value)} /></div>
              <div className="modal-field"><label>Current year level</label><select className="settings-select" value={draft.academic.yearLevel} onChange={e => updateDraft('academic', 'yearLevel', e.target.value)}><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option><option>Custom</option></select></div>
              {draft.academic.yearLevel === 'Custom' && <div className="modal-field"><label>Custom level</label><input className="modal-input" value={draft.academic.customYearLevel} onChange={e => updateDraft('academic', 'customYearLevel', e.target.value)} /></div>}
              <div className="modal-field"><label>Number of terms</label><select className="settings-select" value={draft.academic.terms} onChange={e => updateDraft('academic', 'terms', Number(e.target.value))}><option value={2}>2 Terms</option><option value={3}>3 Terms</option><option value={4}>4 Terms</option></select></div>
              <div className="modal-field"><label>Current term</label><select className="settings-select" value={draft.academic.currentTerm} onChange={e => updateDraft('academic', 'currentTerm', e.target.value)}><option>1st Term</option><option>2nd Term</option><option>3rd Term</option><option>4th Term</option></select></div>
              <div className="modal-field"><label>Highest grade</label><input className="modal-input" type="number" step="0.1" value={draft.academic.gradingHigh} onChange={e => updateDraft('academic', 'gradingHigh', Number(e.target.value))} /></div>
              <div className="modal-field"><label>Lowest grade</label><input className="modal-input" type="number" step="0.1" value={draft.academic.gradingLow} onChange={e => updateDraft('academic', 'gradingLow', Number(e.target.value))} /></div>
              <div className="modal-field"><label>Top Performing Student Target</label><input className="modal-input" type="number" step="0.01" value={draft.academic.tpsTarget} onChange={e => updateDraft('academic', 'tpsTarget', Number(e.target.value))} /></div>
              <div className="modal-field"><label>Weekly study goal</label><input className="modal-input" type="number" min="1" value={draft.academic.weeklyStudyGoalHours} onChange={e => updateDraft('academic', 'weeklyStudyGoalHours', Number(e.target.value))} /></div>
            </div>
          </>
        );
      case 'tasks':
        return (
          <>
            <p className="settings-section-label">Task Behavior</p>
            <div className="settings-row"><div><p className="settings-row-title">Default Priority</p><p className="settings-row-sub">Used when you create a new task.</p></div><select className="settings-select" value={draft.tasks.defaultPriority} onChange={e => updateDraft('tasks', 'defaultPriority', e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            {renderToggle('tasks', 'smartPrioritySuggestions', 'Smart Priority Suggestions', 'Let TaskRay recommend priority from deadlines and workload.')}
            <div className="settings-row"><div><p className="settings-row-title">Default Task Reminder</p><p className="settings-row-sub">Applied to new reminders inside TaskRay.</p></div><select className="settings-select" value={draft.tasks.defaultReminder} onChange={e => updateDraft('tasks', 'defaultReminder', e.target.value)}><option value="none">No reminder</option><option value="15min">15 minutes before</option><option value="1hour">1 hour before</option><option value="3hours">3 hours before</option><option value="1day">1 day before</option></select></div>
            <div className="settings-row"><div><p className="settings-row-title">Completed Task Behavior</p><p className="settings-row-sub">Choose how completed tasks should appear.</p></div><select className="settings-select" value={draft.tasks.completedBehavior} onChange={e => updateDraft('tasks', 'completedBehavior', e.target.value)}><option value="keep">Keep visible</option><option value="collapse">Collapse completed</option><option value="archive">Auto-archive</option></select></div>
            {draft.tasks.completedBehavior === 'archive' && <div className="settings-row"><div><p className="settings-row-title">Archive after</p></div><select className="settings-select" value={draft.tasks.archiveAfterDays} onChange={e => updateDraft('tasks', 'archiveAfterDays', Number(e.target.value))}><option value={1}>1 day</option><option value={3}>3 days</option><option value={7}>7 days</option><option value={30}>30 days</option></select></div>}
            {renderToggle('tasks', 'showOverdueProminently', 'Show overdue tasks prominently', 'Keep missed deadlines visible on the dashboard.')}
            {renderToggle('tasks', 'includeOverdueInStudyPlan', 'Include overdue tasks in Study Plan', 'Use overdue work when generating study suggestions.')}
          </>
        );
      case 'study':
        return (
          <>
            <p className="settings-section-label">Study Schedule</p>
            <div className="settings-chip-grid">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => <button key={day} type="button" className={`settings-chip ${draft.study.preferredDays.includes(day) ? 'active' : ''}`} onClick={() => toggleStudyDay(day)}>{day}</button>)}</div>
            <div className="settings-form-grid">
              <div className="modal-field"><label>Available from</label><input className="modal-input" type="time" value={draft.study.start} onChange={e => updateDraft('study', 'start', e.target.value)} /></div>
              <div className="modal-field"><label>Until</label><input className="modal-input" type="time" value={draft.study.end} onChange={e => updateDraft('study', 'end', e.target.value)} /></div>
              <div className="modal-field"><label>Study session length</label><select className="settings-select" value={draft.study.preferredDuration} onChange={e => updateDraft('study', 'preferredDuration', Number(e.target.value))}><option value={25}>25 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={90}>90 minutes</option></select></div>
              <div className="modal-field"><label>Break duration</label><select className="settings-select" value={draft.study.breakDuration} onChange={e => updateDraft('study', 'breakDuration', Number(e.target.value))}><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option></select></div>
              <div className="modal-field"><label>Maximum study time/day</label><input className="modal-input" type="number" min="30" step="15" value={draft.study.maxDailyMinutes} onChange={e => updateDraft('study', 'maxDailyMinutes', Number(e.target.value))} /></div>
              <div className="modal-field"><label>Weekend workload</label><select className="settings-select" value={draft.study.weekendWorkload} onChange={e => updateDraft('study', 'weekendWorkload', e.target.value)}><option value="same">Same as weekdays</option><option value="lighter">Lighter</option><option value="none">No automatic sessions</option></select></div>
            </div>
          </>
        );
      case 'studyPlan':
        return (
          <>
            <p className="settings-section-label">AI Study Plan</p>
            <div className="settings-row"><div><p className="settings-row-title">Workload Style</p><p className="settings-row-sub">Controls how many sessions TaskRay suggests.</p></div><select className="settings-select" value={draft.studyPlan.workloadStyle} onChange={e => updateDraft('studyPlan', 'workloadStyle', e.target.value)}><option value="light">Light</option><option value="balanced">Balanced</option><option value="intensive">Intensive</option></select></div>
            {Object.entries({ tasks: 'Tasks', calendar: 'Calendar', reviewer: 'Reviewer Progress', focus: 'Focus / Pomodoro History', gwa: 'GWA / Academic Progress', essay: 'Essay Practice Activity', previousPlans: 'Previous Study Plans' }).map(([key, label]) => (
              <div className="settings-row compact-row" key={key}><div><p className="settings-row-title">{label}</p><p className="settings-row-sub">Use this source for personalization.</p></div><button type="button" className={`toggle-btn ${draft.studyPlan.sources[key] ? 'on' : ''}`} onClick={() => updateNestedDraft('studyPlan', 'sources', key, !draft.studyPlan.sources[key])}><span className="toggle-thumb" /></button></div>
            ))}
            {renderToggle('studyPlan', 'rescheduleMissed', 'Suggest rescheduling missed sessions', 'Show helpful follow-ups when a planned study session passes.')}
            {renderToggle('studyPlan', 'updateOnDeadlineChange', 'Update when deadlines change', 'Suggest refreshing the plan after important task changes.')}
            {renderToggle('studyPlan', 'assessmentPrep', 'Assessment preparation plans', 'Prioritize exams, quizzes, presentations, and finals.')}
            {renderToggle('studyPlan', 'showReasons', 'Show recommendation reasons', 'Keep visible explanations on each study session.')}
            {renderToggle('studyPlan', 'requireConfirmation', 'Require confirmation before adding', 'TaskRay will not silently change your calendar.')}
          </>
        );
      case 'focus':
        return (
          <>
            <p className="settings-section-label">Focus & Pomodoro</p>
            <div className="settings-form-grid">
              <div className="modal-field"><label>Focus duration</label><input className="modal-input" type="number" min="5" max="120" value={draft.focus.focusDuration} onChange={e => updateDraft('focus', 'focusDuration', Number(e.target.value))} /></div>
              <div className="modal-field"><label>Short break</label><input className="modal-input" type="number" min="1" max="45" value={draft.focus.shortBreak} onChange={e => updateDraft('focus', 'shortBreak', Number(e.target.value))} /></div>
              <div className="modal-field"><label>Long break</label><input className="modal-input" type="number" min="5" max="90" value={draft.focus.longBreak} onChange={e => updateDraft('focus', 'longBreak', Number(e.target.value))} /></div>
              <div className="modal-field"><label>Sessions before long break</label><input className="modal-input" type="number" min="1" max="10" value={draft.focus.sessionsBeforeLongBreak} onChange={e => updateDraft('focus', 'sessionsBeforeLongBreak', Number(e.target.value))} /></div>
            </div>
            {renderToggle('focus', 'autoStartBreak', 'Auto start break', 'Start break timers after a focus session.')}
            {renderToggle('focus', 'autoStartFocus', 'Auto start next focus session', 'Prepare the next focus round without changing tasks automatically.')}
            {renderToggle('focus', 'sound', 'Sound', 'Play focus and break cues.')}
            <div className="settings-row"><div><p className="settings-row-title">Volume</p><p className="settings-row-sub">{draft.focus.volume}%</p></div><input className="settings-range" type="range" min="0" max="100" value={draft.focus.volume} onChange={e => updateDraft('focus', 'volume', Number(e.target.value))} /></div>
            {renderToggle('focus', 'countAnalytics', 'Count completed sessions', 'Include focus sessions in study analytics.')}
            {renderToggle('focus', 'sessionReflection', 'Session reflection', 'Ask how productive the session was after completion.')}
            {renderToggle('focus', 'askTaskProgress', 'Task progress check', 'Ask before changing linked task progress.')}
          </>
        );
      case 'reviewer':
        return (
          <>
            <p className="settings-section-label">Reviewer</p>
            <div className="settings-form-grid">
              <div className="modal-field"><label>Default quiz size</label><select className="settings-select" value={draft.reviewer.quizSize} onChange={e => updateDraft('reviewer', 'quizSize', Number(e.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={15}>15</option><option value={20}>20</option></select></div>
              <div className="modal-field"><label>Default difficulty</label><select className="settings-select" value={draft.reviewer.difficulty} onChange={e => updateDraft('reviewer', 'difficulty', e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option><option value="adaptive">Adaptive</option></select></div>
              <div className="modal-field"><label>Answer feedback</label><select className="settings-select" value={draft.reviewer.answerFeedback} onChange={e => updateDraft('reviewer', 'answerFeedback', e.target.value)}><option value="immediate">Show immediately</option><option value="end">Show after quiz</option><option value="review">Never show until review</option></select></div>
              <div className="modal-field"><label>Mastery target</label><input className="modal-input" type="number" min="50" max="100" value={draft.reviewer.masteryTarget} onChange={e => updateDraft('reviewer', 'masteryTarget', Number(e.target.value))} /></div>
              <div className="modal-field"><label>Minimum attempts</label><input className="modal-input" type="number" min="2" max="10" value={draft.reviewer.minimumAttempts} onChange={e => updateDraft('reviewer', 'minimumAttempts', Number(e.target.value))} /></div>
            </div>
            {renderToggle('reviewer', 'shuffleQuestions', 'Shuffle questions', 'Mix question order in quiz sessions.')}
            {renderToggle('reviewer', 'shuffleChoices', 'Shuffle choices', 'Mix choices for multiple-choice practice.')}
            {renderToggle('reviewer', 'weakTopicPriority', 'Weak topic prioritization', 'Give more attention to topics that need practice.')}
          </>
        );
      case 'gwa':
        return (
          <>
            <p className="settings-section-label">GWA & Academic</p>
            <div className="settings-callout">GWA uses your Academic Profile grading scale: {draft.academic.gradingHigh} highest, {draft.academic.gradingLow} lowest, TPS target {Number(draft.academic.tpsTarget).toFixed(2)}.</div>
            {renderToggle('gwa', 'weighted', 'Use weighted GWA when units are available', 'Falls back to simple average when units are missing.')}
            <div className="settings-row"><div><p className="settings-row-title">GWA rounding</p><p className="settings-row-sub">Full precision is kept internally.</p></div><select className="settings-select" value={draft.gwa.rounding} onChange={e => updateDraft('gwa', 'rounding', Number(e.target.value))}><option value={2}>2 decimal places</option><option value={3}>3 decimal places</option></select></div>
            {renderToggle('gwa', 'predictions', 'Academic predictions', 'Show target and TPS recommendations.')}
            <div className="settings-row"><div><p className="settings-row-title">Grade upload confirmation</p><p className="settings-row-sub">Required so OCR records are reviewed before saving.</p></div><button type="button" className="toggle-btn on" aria-pressed="true"><span className="toggle-thumb" /></button></div>
          </>
        );
      case 'notifications':
        return (
          <>
            <p className="settings-section-label">Notifications</p>
            <div className="settings-row"><div><p className="settings-row-title">Browser reminders</p><p className="settings-row-sub">{notificationText}</p></div><button type="button" className={`toggle-btn ${notificationsEnabled ? 'on' : ''}`} onClick={onToggleNotifications}><span className="toggle-thumb" /></button></div>
            <div className="settings-form-grid"><div className="modal-field"><label>Default reminder time</label><select className="settings-select" value={draft.notifications.defaultReminder} onChange={e => updateDraft('notifications', 'defaultReminder', e.target.value)}><option value="15min">15 minutes</option><option value="30min">30 minutes</option><option value="1hour">1 hour</option><option value="3hours">3 hours</option><option value="1day">1 day</option></select></div><div className="modal-field"><label>Quiet start</label><input className="modal-input" type="time" value={draft.notifications.quietStart} onChange={e => updateDraft('notifications', 'quietStart', e.target.value)} /></div><div className="modal-field"><label>Quiet end</label><input className="modal-input" type="time" value={draft.notifications.quietEnd} onChange={e => updateDraft('notifications', 'quietEnd', e.target.value)} /></div></div>
            <p className="settings-section-label">Task + Study alerts</p>
            {renderNotificationToggle('tasksDueSoon', 'Task due soon')}{renderNotificationToggle('overdueTask', 'Overdue task')}{renderNotificationToggle('highPriorityTask', 'High-priority task')}{renderNotificationToggle('upcomingEvent', 'Upcoming event')}{renderNotificationToggle('examReminder', 'Exam reminder')}{renderNotificationToggle('quizReminder', 'Quiz reminder')}{renderNotificationToggle('upcomingStudySession', 'Upcoming study session')}{renderNotificationToggle('missedStudySession', 'Missed study session')}{renderNotificationToggle('studyPlanUpdate', 'Study Plan update suggested')}{renderNotificationToggle('recommendedReview', 'Recommended review')}{renderNotificationToggle('weakTopicReminder', 'Weak topic reminder')}{renderNotificationToggle('gwaSaved', 'GWA record saved')}{renderNotificationToggle('tpsStatus', 'TPS status update')}{renderNotificationToggle('weeklySummary', 'Weekly academic summary')}{renderNotificationToggle('focusReminder', 'Focus session reminder')}{renderNotificationToggle('studyGoalProgress', 'Study goal progress')}
          </>
        );
      case 'appearance':
        return (
          <>
            <p className="settings-section-label">Appearance</p>
            <div className="settings-row"><div><p className="settings-row-title">Theme mode</p><p className="settings-row-sub">TaskRay keeps the dark identity while preparing system preference support.</p></div><select className="settings-select" value={draft.appearance.themeMode} onChange={e => updateDraft('appearance', 'themeMode', e.target.value)}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></div>
            <div className="settings-row"><div><p className="settings-row-title">Dashboard Density</p><p className="settings-row-sub">Compact tightens major workspace spacing.</p></div><select className="settings-select" value={draft.appearance.density} onChange={e => updateDraft('appearance', 'density', e.target.value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></div>
            {renderToggle('appearance', 'startSidebarCollapsed', 'Start with sidebar collapsed', 'Use a slimmer sidebar when opening TaskRay.')}
            {renderToggle('appearance', 'reduceMotion', 'Reduce Motion', 'Reduce page reveal and decorative motion.')}
            {renderToggle('appearance', 'chartAnimation', 'Chart Animation', 'Keep dashboard chart movement enabled.')}
            <p className="settings-section-label">Dashboard Theme</p>
            <div className="theme-picker-grid" aria-label="Dashboard theme presets">
              {dashboardThemePresets.map(theme => (
                <button key={theme.id} type="button" className={`theme-swatch-card${themeId === theme.id ? ' active' : ''}`} onClick={() => onThemeChange(theme.id)} style={{ '--swatch-a': theme.accent, '--swatch-b': theme.success, '--swatch-c': theme.backgroundEnd }}>
                  <span className="theme-swatch-dots"><i /><i /><i /></span><strong>{theme.label}</strong><small>{theme.description}</small>
                </button>
              ))}
            </div>
          </>
        );
      case 'privacy':
        return (
          <>
            <p className="settings-section-label">Privacy & Data</p>
            {renderToggle('privacy', 'personalizedAI', 'Personalized AI Recommendations', 'Allow TaskRay to use relevant tasks, calendar, reviewer, focus, and academic data for recommendations.')}
            <div className="settings-danger-list">
              <button type="button" className="settings-utility-btn" onClick={handleDownloadData}>Download My Data</button>
              <button type="button" className="settings-utility-btn" onClick={() => window.confirm('Clear Study Plan history?') && onClearStudyPlan()}>Clear Study Plan History</button>
              <button type="button" className="settings-utility-btn" onClick={() => window.confirm('Clear Reviewer practice history? Subjects stay saved.') && onClearReviewerHistory()}>Clear Reviewer History</button>
              <button type="button" className="settings-utility-btn danger" onClick={() => window.confirm('Delete uploaded grade image references from this device?') && localStorage.removeItem(userScopedKey('taskray-gwa-uploads', user.id))}>Delete Uploaded Grade Images</button>
            </div>
            <div className="settings-policy-links"><a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a><a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a><a href="/cookies" target="_blank" rel="noreferrer">Cookie Policy</a></div>
          </>
        );
      case 'security':
        return (
          <>
            <p className="settings-section-label">Account Security</p>
            <div className="settings-callout"><strong>Authentication email</strong><span>{profileDraft.email || user.email || 'No email available'}</span></div>
            <div className="settings-danger-list">
              <button type="button" className="settings-utility-btn" onClick={onRequestPasswordReset}>Send password reset email</button>
              <button type="button" className="settings-utility-btn" onClick={onSignOut}>Sign Out</button>
              <button type="button" className="settings-utility-btn danger" onClick={() => window.confirm('Deleting your account is permanent and cannot be undone. Account deletion still needs backend support before it can run safely.')}>Delete Account</button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box settings-modal">
        <div className="modal-header-row">
          <div>
            <h2 className="modal-title">Settings</h2>
            <p className="settings-row-sub">Personalize how TaskRay plans, reminds, reviews, and focuses with you.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="settings-search">
          <Icons.Search />
          <input value={settingsSearch} onChange={e => setSettingsSearch(e.target.value)} placeholder="Search settings..." />
        </div>
        <select className="settings-mobile-select" value={activeSection} onChange={e => setActiveSection(e.target.value)} aria-label="Settings category">
          {settingsSections.map(section => <option key={section.id} value={section.id}>{section.group} - {section.label}</option>)}
        </select>
        <div className="settings-shell">
          <aside className="settings-nav" aria-label="Settings categories">
            {Object.entries(groupedSections).map(([group, sections]) => (
              <div className="settings-nav-group" key={group}>
                <p>{group}</p>
                {sections.map(section => (
                  <button key={section.id} type="button" className={activeSection === section.id ? 'active' : ''} onClick={() => setActiveSection(section.id)}>
                    {section.icon}<span>{section.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </aside>
          <section className="settings-content" aria-live="polite">
            <div className="settings-content-head">
              <span>{activeSectionInfo.icon}</span>
              <div><h3>{activeSectionInfo.label}</h3><p>{activeSectionInfo.group}</p></div>
            </div>
            {error && <p className="modal-error">{error}</p>}
            {status && <p className="settings-success">{status}</p>}
            {renderSection()}
          </section>
        </div>
        <div className="modal-actions settings-save-bar">
          <button className="modal-btn-cancel" onClick={resetDraft} disabled={!isDirty || saving}>Cancel</button>
          <button className="modal-btn-save" onClick={handleSave} disabled={!isDirty || saving}><Icons.Save /> {saving ? 'Saving...' : 'Save Changes'}</button>
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

  const popover = (
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

  if (typeof document === 'undefined') return popover;
  return createPortal(popover, document.body);
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
const persistentViews = ['productivity', 'tasks', 'pomodoro', 'calendar', 'review', 'essay', 'focusBreak', 'gwa', 'studyPlan'];

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
const stableHash = (value) => String(value || '').split('').reduce((total, char) => (
  ((total << 5) - total + char.charCodeAt(0)) | 0
), 0);
const defaultUserPreferences = {
  profile: {
    bio: '',
    preferredName: '',
  },
  academic: {
    academicYear: '2026-2027',
    yearLevel: '1st Year',
    customYearLevel: '',
    terms: 3,
    currentTerm: '1st Term',
    gradingHigh: 4,
    gradingLow: 0.5,
    tpsTarget: 3.4,
    weeklyStudyGoalHours: 12,
  },
  tasks: {
    defaultPriority: 'medium',
    smartPrioritySuggestions: true,
    defaultReminder: '1day',
    completedBehavior: 'keep',
    archiveAfterDays: 7,
    showOverdueProminently: true,
    includeOverdueInStudyPlan: true,
  },
  study: {
    preferredDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    start: '18:00',
    end: '21:00',
    preferredDuration: 40,
    breakDuration: 10,
    maxDailyMinutes: 180,
    weekendWorkload: 'lighter',
  },
  studyPlan: {
    sources: {
      tasks: true,
      calendar: true,
      reviewer: true,
      focus: true,
      gwa: true,
      essay: true,
      previousPlans: true,
    },
    workloadStyle: 'balanced',
    rescheduleMissed: true,
    updateOnDeadlineChange: true,
    assessmentPrep: true,
    showReasons: true,
    requireConfirmation: true,
  },
  focus: {
    focusDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreak: false,
    autoStartFocus: false,
    sound: true,
    volume: 60,
    countAnalytics: true,
    sessionReflection: true,
    askTaskProgress: true,
  },
  reviewer: {
    quizSize: 10,
    difficulty: 'adaptive',
    shuffleQuestions: true,
    shuffleChoices: true,
    answerFeedback: 'end',
    weakTopicPriority: true,
    masteryTarget: 85,
    minimumAttempts: 3,
  },
  gwa: {
    weighted: true,
    rounding: 2,
    predictions: true,
    requireUploadReview: true,
  },
  notifications: {
    defaultReminder: '1hour',
    quietStart: '22:00',
    quietEnd: '07:00',
    tasksDueSoon: true,
    overdueTask: true,
    highPriorityTask: true,
    upcomingEvent: true,
    examReminder: true,
    quizReminder: true,
    upcomingStudySession: true,
    missedStudySession: true,
    studyPlanUpdate: true,
    recommendedReview: true,
    weakTopicReminder: true,
    gwaSaved: true,
    tpsStatus: true,
    weeklySummary: true,
    focusReminder: true,
    studyGoalProgress: true,
  },
  appearance: {
    themeMode: 'dark',
    density: 'comfortable',
    startSidebarCollapsed: false,
    reduceMotion: false,
    chartAnimation: true,
  },
  privacy: {
    personalizedAI: true,
  },
};
const mergeUserPreferences = (saved = {}) => ({
  profile: { ...defaultUserPreferences.profile, ...(saved.profile || {}) },
  academic: { ...defaultUserPreferences.academic, ...(saved.academic || {}) },
  tasks: { ...defaultUserPreferences.tasks, ...(saved.tasks || {}) },
  study: { ...defaultUserPreferences.study, ...(saved.study || {}) },
  studyPlan: {
    ...defaultUserPreferences.studyPlan,
    ...(saved.studyPlan || {}),
    sources: {
      ...defaultUserPreferences.studyPlan.sources,
      ...(saved.studyPlan?.sources || {}),
    },
  },
  focus: { ...defaultUserPreferences.focus, ...(saved.focus || {}) },
  reviewer: { ...defaultUserPreferences.reviewer, ...(saved.reviewer || {}) },
  gwa: { ...defaultUserPreferences.gwa, ...(saved.gwa || {}) },
  notifications: { ...defaultUserPreferences.notifications, ...(saved.notifications || {}) },
  appearance: { ...defaultUserPreferences.appearance, ...(saved.appearance || {}) },
  privacy: { ...defaultUserPreferences.privacy, ...(saved.privacy || {}) },
});
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const minutesToTime = (minutes) => {
  const safeMinutes = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(safeMinutes / 60)).padStart(2, '0')}:${String(safeMinutes % 60).padStart(2, '0')}`;
};
const timeToMinutes = (time, fallback = 18 * 60) => {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback;
  return hours * 60 + minutes;
};
const formatStudyDate = (dateKey) => new Date(`${dateKey}T00:00`).toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const formatStudyTime = (time) => new Date(`2026-01-01T${time || '18:00'}`).toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
  const [userPreferences, setUserPreferences] = useState(() => mergeUserPreferences());
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
  const [studyPlanSessions, setStudyPlanSessions] = useState([]);
  const [studyPlanGeneratedAt, setStudyPlanGeneratedAt] = useState('');
  const [studyPlanNotice, setStudyPlanNotice] = useState('');
  const [studyPlanDuration, setStudyPlanDuration] = useState(30);
  const [studyPlanAvailability, setStudyPlanAvailability] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('taskray-study-preferences') || 'null') || {
        start: '18:00',
        end: '21:00',
        preferredDuration: 40,
      };
    } catch {
      return { start: '18:00', end: '21:00', preferredDuration: 40 };
    }
  });
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
  const { reminders, requestNotificationPermission } = useTaskReminders(tasks, {
    enabled: notificationsEnabled,
    defaultReminder: userPreferences.tasks.defaultReminder || userPreferences.notifications.defaultReminder,
    quietStart: userPreferences.notifications.quietStart,
    quietEnd: userPreferences.notifications.quietEnd,
  });
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
  const handleSavePreferences = async (nextPreferences) => {
    const merged = mergeUserPreferences(nextPreferences);
    setUserPreferences(merged);
    if (currentUser?.id) {
      localStorage.setItem(userScopedKey('taskray-user-preferences', currentUser.id), JSON.stringify(merged));
    }
    const nextFocusMinutes = Math.max(5, Number(merged.focus.focusDuration) || 25);
    setPomodoroMinutes(nextFocusMinutes);
    localStorage.setItem('taskray-pomodoro-minutes', String(nextFocusMinutes));
    if (!pomodoroRunning) setPomodoroSecondsLeft(nextFocusMinutes * 60);
    const nextStudyAvailability = {
      start: merged.study.start || '18:00',
      end: merged.study.end || '21:00',
      preferredDuration: Math.max(15, Number(merged.study.preferredDuration) || 40),
    };
    setStudyPlanAvailability(nextStudyAvailability);
    setStudyPlanDuration(nextStudyAvailability.preferredDuration);
    setQuizRevealMode(merged.reviewer.answerFeedback === 'immediate' ? 'immediate' : 'end');
    if (!quizSessionActive) setQuizSecondsLeft(Math.max(1, quizTimeLimitMinutes) * 60);
    setCollapsed(Boolean(merged.appearance.startSidebarCollapsed));
    if (merged.appearance.dashboardTheme) handleDashboardThemeChange(merged.appearance.dashboardTheme);
    setNewTask(prev => {
      if (prev.title || prev.description || prev.deadlineDate || prev.startDate) return prev;
      return { ...prev, priority: merged.tasks.defaultPriority || 'medium' };
    });
  };
  const handleSaveSettingsProfile = async (profileDraft) => {
    if (!currentUser?.id) return null;
    const cleanUsername = profileDraft.username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) throw new Error('Username: letters, numbers, underscores only.');
    const [usernameConflict, emailConflict] = await Promise.all([
      profilesApi.usernameExists(cleanUsername, currentUser.id),
      profilesApi.emailExists(profileDraft.email, currentUser.id),
    ]);
    if (usernameConflict) throw new Error('Username already taken.');
    if (emailConflict) throw new Error('Email is already registered.');
    const data = await profilesApi.update(currentUser.id, {
      name: profileDraft.name.trim(),
      username: cleanUsername,
      email: profileDraft.email.trim(),
    });
    const details = {
      avatarUrl: profileDraft.avatarUrl,
      avatarZoom: profileDraft.avatarZoom,
      name: profileDraft.name.trim(),
      username: cleanUsername,
      email: profileDraft.email.trim().toLowerCase(),
      program: profileDraft.program.trim(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`taskray-profile-details-${currentUser.id}`, JSON.stringify(details));
    const nextUser = normalizeUserProfile(currentUser, data, details);
    setCurrentUser(nextUser);
    return nextUser;
  };
  const handleRequestPasswordReset = async () => {
    const email = currentUser?.email;
    if (!email) return;
    await authApi.resetPasswordForEmail(email);
    alert('Password reset email sent. Please check your inbox.');
  };
  const handleClearReviewerHistory = () => {
    setKnownFlashcards({});
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizTimedOut(false);
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
    localStorage.setItem(userScopedKey('taskray-study-plan', currentUser.id), JSON.stringify({
      sessions: studyPlanSessions,
      generatedAt: studyPlanGeneratedAt,
      availability: studyPlanAvailability,
    }));
    localStorage.setItem('taskray-study-preferences', JSON.stringify(studyPlanAvailability));
  }, [studyPlanAvailability, studyPlanGeneratedAt, studyPlanSessions, currentUser?.id]);

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
    const scopedStudyPlan = readScoped('taskray-study-plan');
    const scopedPreferences = readScoped('taskray-user-preferences');

    setCalendarEvents(Array.isArray(scopedEvents) ? scopedEvents : []);
    setReviewers(Array.isArray(scopedReviewers) && scopedReviewers.length ? scopedReviewers : defaultReviewers);
    setActiveReviewerId(Array.isArray(scopedReviewers) && scopedReviewers[0]?.id ? scopedReviewers[0].id : defaultReviewers[0].id);
    setRecentSearches(Array.isArray(scopedRecents) ? scopedRecents.slice(0, 6) : []);
    setDismissedNotificationIds(Array.isArray(scopedDismissed) ? scopedDismissed : []);
    setStudyPlanSessions(Array.isArray(scopedStudyPlan?.sessions) ? scopedStudyPlan.sessions : []);
    setStudyPlanGeneratedAt(scopedStudyPlan?.generatedAt || '');
    if (scopedStudyPlan?.availability) setStudyPlanAvailability(scopedStudyPlan.availability);
    if (scopedPreferences) {
      const merged = mergeUserPreferences(scopedPreferences);
      setUserPreferences(merged);
      if (merged.appearance.dashboardTheme) setDashboardThemeId(merged.appearance.dashboardTheme);
      if (merged.appearance.startSidebarCollapsed) setCollapsed(true);
      setStudyPlanAvailability(prev => ({
        ...prev,
        start: merged.study.start || prev.start,
        end: merged.study.end || prev.end,
        preferredDuration: merged.study.preferredDuration || prev.preferredDuration,
      }));
      setStudyPlanDuration(merged.study.preferredDuration || 30);
      setPomodoroMinutes(merged.focus.focusDuration || 25);
      setPomodoroSecondsLeft((merged.focus.focusDuration || 25) * 60);
      setQuizRevealMode(merged.reviewer.answerFeedback === 'immediate' ? 'immediate' : 'end');
    } else {
      setUserPreferences(mergeUserPreferences());
    }
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
  const buildStudyPlanSessions = (statusContext, preservedSessions = [], targetDuration = null) => {
    const today = new Date(`${statusContext.currentDate}T00:00`);
    const horizonDays = 7;
    const preserved = preservedSessions.filter(session => session.status === 'completed' || session.status === 'accepted');
    const preservedKeys = new Set(preserved.map(session => `${session.date}-${session.relatedTaskId || ''}-${session.subject}-${session.topic}`));
    const candidates = [];
    const pushCandidate = (candidate) => {
      const subject = candidate.subject || 'General Study';
      const topic = candidate.topic || candidate.title || 'Focused study';
      const score = Math.max(1, Math.round(candidate.score || 1));
      const priority = score >= 95 ? 'urgent' : score >= 68 ? 'high' : score >= 42 ? 'medium' : 'low';
      candidates.push({
        ...candidate,
        subject,
        topic,
        priority,
        score,
        durationMinutes: Math.max(15, Math.min(75, targetDuration || candidate.durationMinutes || statusContext.studyPreferences.preferredDuration || 40)),
      });
    };

    statusContext.tasks.forEach(task => {
      if (task.status === 'completed') return;
      const dueAt = task.dueAt;
      const daysUntil = dueAt ? Math.floor((new Date(dueAt).setHours(0, 0, 0, 0) - today.getTime()) / 86400000) : 8;
      const overdue = dueAt && new Date(dueAt).getTime() < Date.now();
      const isAssessment = /quiz|exam|test|midterm|final/i.test(`${task.title} ${task.category} ${task.description || ''}`);
      const base = overdue ? 125 : daysUntil <= 1 ? 105 : daysUntil <= 3 ? 78 : daysUntil <= 6 ? 52 : 28;
      const priorityBoost = task.priority === 'high' ? 18 : task.priority === 'medium' ? 8 : 0;
      const statusBoost = task.status === 'in-progress' ? 12 : 0;
      pushCandidate({
        source: 'task',
        relatedTaskId: task.id,
        title: task.title,
        subject: task.category || (isAssessment ? 'Assessment Prep' : 'Assignments'),
        topic: task.title,
        method: isAssessment ? 'Reviewer quiz + active recall' : 'Focused task work',
        score: base + priorityBoost + statusBoost + (isAssessment ? 16 : 0),
        dueAt,
        durationMinutes: overdue || daysUntil <= 1 ? 45 : 35,
        reasons: [
          overdue ? 'This task is overdue' : dueAt ? `Deadline is ${daysUntil <= 0 ? 'today' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}` : 'No deadline is set',
          task.priority ? `Priority is ${task.priority}` : null,
          task.status === 'in-progress' ? 'Already in progress' : 'Not completed yet',
        ].filter(Boolean),
      });
    });

    statusContext.reviewerProgress.forEach(reviewer => {
      const total = reviewer.total || 0;
      if (!total || reviewer.progress >= 100) return;
      const relatedAssessment = candidates.find(candidate => (
        /quiz|exam|test|midterm|final/i.test(`${candidate.title} ${candidate.topic}`) &&
        `${candidate.title} ${candidate.subject}`.toLowerCase().includes(String(reviewer.subject).toLowerCase())
      ));
      const lowProgressBoost = reviewer.progress < 35 ? 34 : reviewer.progress < 70 ? 18 : 8;
      pushCandidate({
        source: 'reviewer',
        reviewerId: reviewer.id,
        title: `${reviewer.subject} reviewer`,
        subject: reviewer.subject,
        topic: relatedAssessment ? `Prepare for ${relatedAssessment.topic}` : 'Build reviewer progress',
        method: reviewer.questions ? 'Practice quiz and flashcards' : 'Flashcard review',
        score: 36 + lowProgressBoost + (relatedAssessment ? 42 : 0),
        durationMinutes: 25,
        reasons: [
          `Reviewer progress is ${reviewer.progress}%`,
          `${reviewer.total} review item${reviewer.total === 1 ? '' : 's'} available`,
          relatedAssessment ? 'Related assessment is coming up' : 'Keeps this subject fresh',
        ],
      });
    });

    statusContext.calendarEvents.forEach(event => {
      if (!/quiz|exam|test|midterm|final|presentation|defense/i.test(`${event.title} ${event.notes || ''}`)) return;
      const eventDate = new Date(`${event.date}T00:00`);
      const daysUntil = Math.floor((eventDate - today) / 86400000);
      if (daysUntil < 0 || daysUntil > horizonDays) return;
      pushCandidate({
        source: 'assessment',
        eventId: event.id,
        title: event.title,
        subject: event.title.replace(/\b(quiz|exam|test|midterm|final|presentation|defense)\b/ig, '').trim() || 'Assessment Prep',
        topic: event.title,
        method: 'Distributed review',
        score: daysUntil <= 1 ? 112 : daysUntil <= 3 ? 86 : 58,
        durationMinutes: daysUntil <= 1 ? 45 : 35,
        reasons: [
          daysUntil === 0 ? 'Assessment is today' : `Assessment is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
          event.time ? `Scheduled at ${formatStudyTime(event.time)}` : 'Calendar assessment detected',
          'Preparation is spread before the assessment',
        ],
      });
    });

    if (!candidates.length) {
      const fallbackReviewer = statusContext.reviewerProgress.find(item => item.total > 0);
      pushCandidate({
        source: 'fallback',
        title: fallbackReviewer ? `${fallbackReviewer.subject} light review` : 'Plan your next task',
        subject: fallbackReviewer?.subject || 'Study Maintenance',
        topic: fallbackReviewer ? 'Quick active recall' : 'Set one academic priority',
        method: fallbackReviewer ? 'Flashcards' : 'Planning review',
        score: 30,
        durationMinutes: 25,
        reasons: [
          fallbackReviewer ? 'No urgent deadline found' : 'TaskRay needs more academic data',
          fallbackReviewer ? `Reviewer progress is ${fallbackReviewer.progress}%` : 'Add tasks, events, or reviewers for stronger plans',
        ],
      });
    }

    const occupiedByDate = statusContext.calendarEvents.reduce((map, event) => {
      if (!event.date || !event.time) return map;
      const start = timeToMinutes(event.time);
      return { ...map, [event.date]: [...(map[event.date] || []), [start - 10, start + 70]] };
    }, {});
    preserved.forEach(session => {
      if (!session.date || !session.startTime) return;
      const start = timeToMinutes(session.startTime);
      occupiedByDate[session.date] = [...(occupiedByDate[session.date] || []), [start, start + (session.durationMinutes || 30) + 10]];
    });

    const dayLoad = {};
    const scheduled = [];
    const workloadLimit = statusContext.studyPreferences.workloadStyle === 'light'
      ? 8
      : statusContext.studyPreferences.workloadStyle === 'intensive'
        ? 18
        : 14;
    const maxDailyMinutes = Math.max(30, Number(statusContext.studyPreferences.maxDailyMinutes) || 150);
    const orderedCandidates = candidates.sort((a, b) => b.score - a.score).slice(0, workloadLimit);
    const findSlot = (candidate, dayOffset) => {
      const dateKey = dateValue(addDays(today, dayOffset));
      const preferredDays = statusContext.studyPreferences.preferredDays || [];
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(`${dateKey}T00:00`).getDay()];
      if (preferredDays.length && !preferredDays.includes(dayName)) return null;
      const minStart = timeToMinutes(statusContext.studyPreferences.start || '18:00');
      const maxEnd = timeToMinutes(statusContext.studyPreferences.end || '21:00');
      const latestStart = Math.max(minStart, maxEnd - candidate.durationMinutes);
      const busy = occupiedByDate[dateKey] || [];
      for (let start = minStart; start <= latestStart; start += 15) {
        const end = start + candidate.durationMinutes;
        const conflicts = busy.some(([busyStart, busyEnd]) => start < busyEnd && end > busyStart);
        if (!conflicts) {
          occupiedByDate[dateKey] = [...busy, [start, end + 10]];
          return { date: dateKey, startTime: minutesToTime(start) };
        }
      }
      return null;
    };

    orderedCandidates.forEach((candidate, index) => {
      const dueDateKey = candidate.dueAt ? dateValue(new Date(candidate.dueAt)) : null;
      const dueOffset = dueDateKey ? Math.max(0, Math.floor((new Date(`${dueDateKey}T00:00`) - today) / 86400000)) : index % horizonDays;
      const preferredOffsets = dueOffset <= 1 ? [0, 1] : [...Array(Math.min(horizonDays, dueOffset + 1)).keys()].reverse();
      let slot = null;
      for (const offset of preferredOffsets) {
        const dateKey = dateValue(addDays(today, offset));
        if ((dayLoad[dateKey] || 0) >= maxDailyMinutes) continue;
        slot = findSlot(candidate, offset);
        if (slot) break;
      }
      if (!slot) return;
      const key = `${slot.date}-${candidate.relatedTaskId || ''}-${candidate.subject}-${candidate.topic}`;
      if (preservedKeys.has(key)) return;
      dayLoad[slot.date] = (dayLoad[slot.date] || 0) + candidate.durationMinutes;
      scheduled.push({
        id: makeId('study'),
        date: slot.date,
        startTime: slot.startTime,
        durationMinutes: candidate.durationMinutes,
        subject: candidate.subject,
        topic: candidate.topic,
        method: candidate.method,
        priority: candidate.priority,
        reason: candidate.reasons?.[0] || 'Recommended from your TaskRay activity',
        reasons: candidate.reasons || [],
        relatedTaskId: candidate.relatedTaskId,
        reviewerId: candidate.reviewerId,
        eventId: candidate.eventId,
        status: 'suggested',
        source: candidate.source,
      });
    });

    return [...preserved, ...scheduled]
      .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
      .slice(0, 18);
  };

  const emptyTaskDraft = {
    title: '', description: '', priority: userPreferences.tasks.defaultPriority || 'medium', category: 'Assignments',
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
  const activeWorkloadRate = stats.total ? Math.round((activeTaskCount / stats.total) * 100) : 0;
  const riskRate = stats.total ? Math.round((stats.overdue / stats.total) * 100) : 0;
  const focusReadyRate = pomodoroMinutes ? Math.round((pomodoroMinutes / Math.max(pomodoroMinutes, 25)) * 100) : 0;
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
  const quizQuestionSource = quizSessionActive ? activeReviewer.questions : activeExerciseQuestions;
  const displayedQuizQuestions = (userPreferences.reviewer.shuffleQuestions
    ? [...quizQuestionSource].sort((a, b) => stableHash(`${activeReviewer.id}-${a.id}`) - stableHash(`${activeReviewer.id}-${b.id}`))
    : quizQuestionSource
  ).slice(0, Math.max(1, Number(userPreferences.reviewer.quizSize) || 10));
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
  const reviewerProgressList = reviewers.map(reviewer => {
    const flashcards = reviewer.flashcards || [];
    const questions = reviewer.questions || [];
    const total = flashcards.length + questions.length;
    const knownCount = knownFlashcards[reviewer.id]?.length || 0;
    const answeredCount = Object.keys(quizAnswers[reviewer.id] || {}).length;
    return {
      id: reviewer.id,
      subject: reviewer.subject,
      total,
      flashcards: flashcards.length,
      questions: questions.length,
      progress: total ? Math.min(100, Math.round(((knownCount + answeredCount) / total) * 100)) : 0,
    };
  });
  const studyPlanSources = userPreferences.privacy.personalizedAI
    ? userPreferences.studyPlan.sources
    : { tasks: true, calendar: false, reviewer: false, focus: false, gwa: false, essay: false, previousPlans: false };
  const studyPlanTaskSource = studyPlanSources.tasks
    ? tasks.filter(task => userPreferences.tasks.includeOverdueInStudyPlan || !isOverdue(task))
    : [];
  const studyPlanCalendarSource = studyPlanSources.calendar ? calendarEvents : [];
  const studentStatusContext = {
    currentDate: todayKey,
    tasks: studyPlanTaskSource.map(task => ({ ...task, dueAt: getTaskDueAt(task)?.toISOString() || null })),
    overdueTasks: userPreferences.tasks.showOverdueProminently ? tasks.filter(isOverdue) : [],
    upcomingDeadlines: studyPlanTaskSource
      .filter(task => task.status !== 'completed' && getTaskDueAt(task))
      .sort((a, b) => getTaskDueAt(a) - getTaskDueAt(b))
      .slice(0, 8),
    completedTasks: tasks.filter(task => task.status === 'completed'),
    calendarEvents: studyPlanCalendarSource,
    upcomingAssessments: userPreferences.studyPlan.assessmentPrep
      ? studyPlanCalendarSource.filter(event => /quiz|exam|test|midterm|final|presentation|defense/i.test(`${event.title} ${event.notes || ''}`))
      : [],
    reviewerProgress: studyPlanSources.reviewer ? reviewerProgressList : [],
    pomodoroStats: {
      minutes: studyPlanSources.focus ? pomodoroMinutes : 0,
      secondsLeft: studyPlanSources.focus ? pomodoroSecondsLeft : 0,
      running: studyPlanSources.focus ? pomodoroRunning : false,
    },
    studyHistory: studyPlanSources.previousPlans ? studyPlanSessions.filter(session => session.status === 'completed') : [],
    missedStudySessions: userPreferences.studyPlan.rescheduleMissed
      ? studyPlanSessions.filter(session => (
        session.status !== 'completed' && `${session.date}T${session.startTime || '23:59'}` < `${todayKey}T${minutesToTime(currentTime.getHours() * 60 + currentTime.getMinutes())}`
      ))
      : [],
    studyPlan: {
      sessions: studyPlanSources.previousPlans ? studyPlanSessions : [],
      generatedAt: studyPlanGeneratedAt,
    },
    studyPreferences: {
      ...studyPlanAvailability,
      ...userPreferences.study,
      startMinutes: timeToMinutes(studyPlanAvailability.start || '18:00'),
      endMinutes: timeToMinutes(studyPlanAvailability.end || '21:00'),
      maxDailyMinutes: userPreferences.study.maxDailyMinutes,
      workloadStyle: userPreferences.studyPlan.workloadStyle,
    },
    academicPreferences: userPreferences.academic,
    gwaPreferences: userPreferences.gwa,
  };
  const regenerateStudyPlan = (duration = null) => {
    const next = buildStudyPlanSessions(studentStatusContext, studyPlanSessions, duration);
    setStudyPlanSessions(next);
    setStudyPlanGeneratedAt(new Date().toISOString());
    setStudyPlanNotice(next.length
      ? 'TaskRay analyzed your current academic activity and updated the Study Plan.'
      : 'Add tasks, calendar events, or reviewers to unlock stronger recommendations.');
  };
  const updateStudySession = (sessionId, updates) => {
    setStudyPlanSessions(prev => prev.map(session => (
      session.id === sessionId ? { ...session, ...updates } : session
    )));
  };
  const removeStudySession = (sessionId) => {
    setStudyPlanSessions(prev => prev.filter(session => session.id !== sessionId));
  };
  const todayStudySessions = studyPlanSessions.filter(session => session.date === todayKey);
  const acceptedTodayStudySessions = todayStudySessions.filter(session => session.status !== 'skipped');
  const completedTodayStudySessions = todayStudySessions.filter(session => session.status === 'completed');
  const nextStudySession = acceptedTodayStudySessions.find(session => session.status !== 'completed')
    || studyPlanSessions.find(session => session.status !== 'completed' && session.status !== 'skipped');
  const studyPlanProgressPercent = acceptedTodayStudySessions.length
    ? Math.round((completedTodayStudySessions.length / acceptedTodayStudySessions.length) * 100)
    : 0;
  const studyPlanTotalMinutesToday = acceptedTodayStudySessions.reduce((total, session) => total + (Number(session.durationMinutes) || 0), 0);
  const studyPlanRecommendation = studyPlanSessions
    .filter(session => session.status !== 'completed' && session.status !== 'skipped')
    .sort((a, b) => {
      const priorityScore = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityScore[a.priority] ?? 4) - (priorityScore[b.priority] ?? 4)
        || `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`);
    })[0];
  const handleStartStudySession = (session) => {
    updateStudySession(session.id, { status: 'accepted', startedAt: new Date().toISOString() });
    if (session.relatedTaskId) {
      const related = tasks.find(task => task.id === session.relatedTaskId);
      if (related) {
        setActiveView('tasks');
        setPreviewTask(related);
        setSearchQuery(related.title || '');
        return;
      }
    }
    if (session.reviewerId) {
      handleSelectReviewer(session.reviewerId);
      setActiveView('review');
      return;
    }
    setActiveView('pomodoro');
  };
  const handleAddCurrentRecommendation = () => {
    if (studyPlanRecommendation) updateStudySession(studyPlanRecommendation.id, { status: 'accepted' });
    else regenerateStudyPlan(studyPlanDuration);
    setActiveView('studyPlan');
  };
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
  const notificationAllowed = (item) => {
    if (!notificationsEnabled) return false;
    if (item.dismissReminder) return item.filter === 'overdue'
      ? userPreferences.notifications.overdueTask
      : userPreferences.notifications.tasksDueSoon;
    if (item.id.startsWith('event-')) {
      const text = `${item.title} ${item.body}`.toLowerCase();
      if (text.includes('exam') || text.includes('final') || text.includes('midterm')) return userPreferences.notifications.examReminder;
      if (text.includes('quiz') || text.includes('test')) return userPreferences.notifications.quizReminder;
      return userPreferences.notifications.upcomingEvent;
    }
    if (item.id.startsWith('reviewer-')) return userPreferences.notifications.recommendedReview;
    if (item.id.startsWith('pomodoro-')) return userPreferences.notifications.focusReminder;
    if (item.id.startsWith('recommendation-')) return userPreferences.notifications.studyPlanUpdate;
    if (item.id.startsWith('quote-')) return userPreferences.notifications.weeklySummary;
    return true;
  };
  const rawNotificationItems = [
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
  ].filter(Boolean);
  const notificationItems = rawNotificationItems
    .filter(notificationAllowed)
    .filter(item => !dismissedNotificationIds.includes(item.id));
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

  const displayName = userPreferences.profile.preferredName || currentUser.name || currentUser.username || 'User';
  const firstName = userPreferences.profile.preferredName || currentUser.name?.trim().split(/\s+/)[0] || currentUser.username || currentUser.email?.split('@')[0] || 'there';
  const currentHour = currentTime.getHours();
  const timeOfDayMode = currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening';
  const isDayMode = timeOfDayMode !== 'evening';
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const dayNightStatus = `${timeOfDayMode.charAt(0).toUpperCase()}${timeOfDayMode.slice(1)} mode`;
  const dayNightAsset = timeOfDayMode === 'evening' ? '/night.png' : '/day.png';
  const displaySub  = currentUser.username ? `@${currentUser.username}` : (currentUser.email||'');
  const initials    = displayName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)||'?';
  const smartTaskPriorities = userPreferences.tasks.smartPrioritySuggestions
    ? calculateSmartPriorities(studentStatusContext)
    : [];
  const todaysPriorities = buildTodayPriorities(studentStatusContext, {
    taskPriorities: smartTaskPriorities,
    studyPlanRecommendation,
  });
  const dailyBrief = buildDailyBrief(studentStatusContext, {
    taskPriorities: smartTaskPriorities,
    studyPlanRecommendation,
    name: firstName,
  });
  const recommendedNow = buildRecommendedNow(studentStatusContext, {
    todayPriorities: todaysPriorities,
    studyPlanRecommendation,
  });
  const dailyBriefPriorityClass = dailyBrief.highestLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const handlePriorityAction = (item) => {
    if (!item) return;
    if (item.source === 'studyPlan' && item.studySession) {
      handleStartStudySession(item.studySession);
      return;
    }
    if (item.reviewerId) {
      handleSelectReviewer(item.reviewerId);
      setActiveView('review');
      return;
    }
    if (item.task) {
      setActiveView('tasks');
      setFilter('all');
      setSearchQuery(item.task.title || '');
      setPreviewTask(item.task);
      return;
    }
    setActiveView('tasks');
  };
  const handleRecommendedNow = () => {
    if (!recommendedNow) {
      regenerateStudyPlan(studyPlanDuration);
      setActiveView('studyPlan');
      return;
    }
    handlePriorityAction(recommendedNow.target);
  };

  const handleQuickActionsScroll = (event, direction) => {
    const row = event.currentTarget.closest('[data-quick-actions-row]');
    if (!row) return;
    row.scrollBy({
      left: direction * Math.max(260, row.clientWidth * 0.55),
      behavior: 'smooth',
    });
  };

  const handleQuickActionSelect = (action) => {
    if (!action) return;
    switch (action) {
      case 'refresh':
        handleRefreshCurrentTab();
        break;
      case 'doNow':
        handleRecommendedNow();
        break;
      case 'newTask':
        setActiveView('tasks');
        setEditingTask(null);
        setShowAddForm(true);
        break;
      case 'startFocus':
        setActiveView('pomodoro');
        setPomodoroRunning(true);
        break;
      case 'resetFocus':
        handleResetPomodoro();
        break;
      case 'floatFocus':
        handleOpenPomodoroPopup();
        break;
      case 'calendar':
        setActiveView('calendar');
        break;
      case 'todayCalendar':
        setActiveView('calendar');
        setCalendarMonth(monthValue(new Date()));
        break;
      case 'todayAgenda':
        setActiveView('calendar');
        setNewEvent({ ...newEvent, date: new Date().toISOString().slice(0, 10) });
        break;
      case 'reviewer':
        setActiveView('review');
        break;
      case 'startQuiz':
        setActiveView('review');
        if (activeReviewer.questions.length) handleStartSubjectQuiz();
        break;
      case 'essay':
        setActiveView('essay');
        break;
      case 'reloadEssays':
        setEssayRefreshToken(token => token + 1);
        break;
      case 'studyPlan':
        regenerateStudyPlan(studyPlanDuration);
        setActiveView('studyPlan');
        break;
      case 'tasktris':
        setActiveView('focusBreak');
        break;
      case 'gwa':
        setActiveView('gwa');
        break;
      case 'allTasks':
        setActiveView('tasks');
        setFilter('all');
        setCategoryFilter('all');
        break;
      case 'todo':
        setActiveView('tasks');
        setFilter('todo');
        break;
      case 'done':
        setActiveView('tasks');
        setFilter('completed');
        break;
      case 'dashboard':
        setActiveView('productivity');
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'tutorial':
        startTutorial();
        break;
      default:
        break;
    }
  };

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
  const handleNavSelect = (item) => {
    setActiveView(item.id === 'overdue' ? 'tasks' : item.id);
    if (item.id === 'overdue') setFilter('overdue');
    else if (item.id === 'tasks') setFilter('all');
    setMobileNavOpen(false);
  };
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
  const sidebarCollapsed = collapsed && !mobileNavOpen;

  return (
    <div
      className={`dash-root ${dashboardThemeId === 'midnight' ? 'theme-default' : 'theme-custom'} density-${userPreferences.appearance.density} ${userPreferences.appearance.reduceMotion ? 'reduce-motion' : ''} ${userPreferences.appearance.chartAnimation ? '' : 'no-chart-animation'}`}
      style={dashboardThemeStyle}
    >
      <aside
        data-tutorial-target="sidebar"
        className={`dash-sidebar${sidebarCollapsed?' collapsed':''}${mobileNavOpen ? ' mobile-open' : ''}${isTutorialTarget('sidebar') ? ' tutorial-highlight' : ''}`}
      >
        <div className="sidebar-brand">
          <img src="/taskray_logo.png" alt="" className="sidebar-logo-img" />
          {!sidebarCollapsed && <span className="sidebar-logo-text">TaskRay</span>}
        </div>
        <button
          className="sidebar-toggle"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
        </button>
        <nav className="sidebar-nav">
          {navGroups.map(group => (
            <div className="sidebar-nav-group" key={group.label}>
              {!sidebarCollapsed && <span className="sidebar-section-label">{group.label}</span>}
              {group.items.map(item => (
                <button key={item.id}
                  className={`sidebar-nav-item nav-${item.id}${activeView===item.id || (item.id === 'overdue' && filter === 'overdue')?' active':''}${item.danger?' danger':''}`}
                  onClick={() => handleNavSelect(item)} title={sidebarCollapsed ? item.label : ''}>
                  <span className="nav-icon">{item.icon}</span>
                  {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                  {!sidebarCollapsed && <span className={`nav-badge${item.danger?' danger':''}`}>{item.count}</span>}
                  {sidebarCollapsed && item.count > 0 && <span className={`nav-dot${item.danger?' danger':''}`} />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <button
              type="button"
              className={`sidebar-plan-chip${activeView === 'studyPlan' ? ' active' : ''}`}
              onClick={() => setActiveView('studyPlan')}
            >
              <Icons.Sparkles />
              <span>Study Plan</span>
            </button>
          )}
          <div
            data-tutorial-target="profile-settings"
            className={`sidebar-profile-settings${isTutorialTarget('profile-settings') ? ' tutorial-highlight' : ''}`}
          >
          <button className="sidebar-action" onClick={() => setShowProfile(true)} title={sidebarCollapsed?'Profile':''}>
            <span className="nav-icon"><Icons.User /></span>
            {!sidebarCollapsed && <span className="nav-label">Profile</span>}
          </button>
          <button className="sidebar-action" onClick={() => setShowSettings(true)} title={sidebarCollapsed?'Settings':''}>
            <span className="nav-icon"><Icons.Settings /></span>
            {!sidebarCollapsed && <span className="nav-label">Settings</span>}
          </button>
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-motivation-card" aria-hidden="true">
              <strong>Stay focused.</strong>
              <span>Stay consistent.</span>
              <em>You&apos;ve got this.</em>
            </div>
          )}
          <div className={`sidebar-user-row${sidebarCollapsed?' collapsed':''}`}>
            <div className={`sidebar-avatar${currentUser.avatarUrl ? ' has-photo' : ''}`}>
              {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt="" /> : initials}
            </div>
            {!sidebarCollapsed && <div className="sidebar-user-info">
              <p className="sidebar-user-name">{displayName}</p>
              <p className="sidebar-user-sub">{displaySub}</p>
            </div>}
          </div>
          <button className="sidebar-logout" onClick={() => setShowLogout(true)} title={sidebarCollapsed?'Sign Out':''}>
            <span className="nav-icon"><Icons.LogOut /></span>
            {!sidebarCollapsed && <span className="nav-label">Sign Out</span>}
          </button>
        </div>
      </aside>
      {mobileNavOpen && (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

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
                        : activeView === 'studyPlan'
                          ? 'Study Plan'
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
                        : activeView === 'studyPlan'
                          ? 'AI-powered study recommendations based on your current TaskRay activity'
                          : activeView === 'about'
                            ? 'Created by IANA'
                            : `${calendarEvents.length} event${calendarEvents.length!==1?'s':''} scheduled`}
            </p>
            <div className="dash-header-meta">
              <span>{todayLabel}</span>
              <span>{workspaceQuote}</span>
            </div>
          </div>
            {activeView === 'productivity' && (
              <div
                data-tutorial-target="quick-actions"
                data-quick-actions-row
                className={`hero-quick-actions${isTutorialTarget('quick-actions') ? ' tutorial-highlight' : ''}`}
                aria-label="Dashboard quick actions"
              >
                <button
                  type="button"
                  className="quick-actions-arrow left"
                  title="Show previous quick actions"
                  aria-label="Show previous quick actions"
                  onClick={event => handleQuickActionsScroll(event, -1)}
                >
                  <Icons.ChevronLeft />
                </button>
                <span className="hero-quick-actions-label">Quick actions</span>
                <button
                  type="button"
                  className="quick-actions-arrow right"
                  title="Show more quick actions"
                  aria-label="Show more quick actions"
                  onClick={event => handleQuickActionsScroll(event, 1)}
                >
                  <Icons.ChevronRight />
                </button>
                <button
                  type="button"
                  className="primary"
                  title={recommendedNow ? `Do now: ${recommendedNow.topic}` : 'Do now: Generate plan'}
                  aria-label={recommendedNow ? `Do now, ${recommendedNow.duration} minutes, ${recommendedNow.topic}` : 'Do now, generate plan'}
                  onClick={handleRecommendedNow}
                >
                  <span><Icons.Sparkles /></span>
                  <strong>Do now</strong>
                  <small>{recommendedNow ? `${recommendedNow.duration} min - ${recommendedNow.topic}` : 'Generate plan'}</small>
                </button>
                <button
                  type="button"
                  title="New task"
                  aria-label="New task"
                  onClick={() => {
                    setActiveView('tasks');
                    setEditingTask(null);
                    setShowAddForm(true);
                  }}
                >
                  <span><Icons.Plus /></span>
                  <strong>New task</strong>
                  <small>Add one priority</small>
                </button>
                <button
                  type="button"
                  title="Start focus"
                  aria-label={`Start focus, ${pomodoroDisplay}`}
                  onClick={() => {
                    setActiveView('pomodoro');
                    setPomodoroRunning(true);
                  }}
                >
                  <span><Icons.Timer /></span>
                  <strong>Start focus</strong>
                  <small>{pomodoroDisplay}</small>
                </button>
                <button type="button" title="Calendar" aria-label="Open calendar" onClick={() => setActiveView('calendar')}>
                  <span><Icons.Calendar /></span>
                  <strong>Calendar</strong>
                  <small>{upcomingEvents.length || 'No'} upcoming</small>
                </button>
                <button type="button" title="Reviewer" aria-label="Open reviewer" onClick={() => setActiveView('review')}>
                  <span><Icons.Book /></span>
                  <strong>Reviewer</strong>
                  <small>{dashboardReviewerProgress}% ready</small>
                </button>
                <button type="button" title="Essay Practice" aria-label="Open essay practice" onClick={() => setActiveView('essay')}>
                  <span><Icons.Pen /></span>
                  <strong>Essay</strong>
                  <small>Practice writing</small>
                </button>
                <button type="button" title="Study plan" aria-label="Update study plan" onClick={() => { regenerateStudyPlan(); setActiveView('studyPlan'); }}>
                  <span><Icons.Sparkles /></span>
                  <strong>Study plan</strong>
                  <small>Update AI plan</small>
                </button>
                <button type="button" title="TaskTris" aria-label="Open TaskTris" onClick={() => setActiveView('focusBreak')}>
                  <span><Icons.Gamepad /></span>
                  <strong>TaskTris</strong>
                  <small>Quick break</small>
                </button>
                <button type="button" title="GWA Calculator" aria-label="Open GWA calculator" onClick={() => setActiveView('gwa')}>
                  <span><Icons.Graduation /></span>
                  <strong>GWA</strong>
                  <small>Check grades</small>
                </button>
              </div>
            )}
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
            <button
              className={`mobile-menu-toggle${mobileNavOpen ? ' active' : ''}`}
              type="button"
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(open => !open)}
            >
              <span />
              <span />
              <span />
            </button>
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

        {activeView !== 'productivity' && (
          <div
            data-tutorial-target="quick-actions"
            data-quick-actions-row
            className={`tab-quick-actions${isTutorialTarget('quick-actions') ? ' tutorial-highlight' : ''}`}
            aria-label="Quick actions"
          >
            <select
              className="quick-actions-select quick-actions-control"
              defaultValue=""
              aria-label="Open quick actions menu"
              onChange={event => {
                handleQuickActionSelect(event.target.value);
                event.currentTarget.value = '';
              }}
            >
              <option value="" disabled>Quick actions</option>
              <option value="refresh">Refresh current tab</option>
              <option value="doNow">Do now</option>
              <option value="newTask">New task</option>
              <option value="allTasks">All tasks</option>
              <option value="todo">To do tasks</option>
              <option value="done">Done tasks</option>
              <option value="startFocus">Start focus</option>
              <option value="resetFocus">Reset focus timer</option>
              <option value="floatFocus">Float timer</option>
              <option value="todayCalendar">Calendar today</option>
              <option value="todayAgenda">Today agenda</option>
              <option value="reviewer">Reviewer</option>
              <option value="startQuiz">Start quiz</option>
              <option value="essay">Essay Practice</option>
              <option value="reloadEssays">Reload essays</option>
              <option value="studyPlan">Study Plan</option>
              <option value="tasktris">TaskTris</option>
              <option value="gwa">GWA Calculator</option>
              <option value="settings">Settings</option>
              <option value="tutorial">Tutorial</option>
            </select>
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
              <button type="button" onClick={() => setActiveView('review')}><Icons.Book /> Reviewer</button>
              <button type="button" onClick={() => setActiveView('studyPlan')}><Icons.Sparkles /> Study plan</button>
            </>
          )}
          {activeView === 'gwa' && (
            <>
              <button type="button" onClick={() => setActiveView('tasks')}><Icons.Zap /> Tasks</button>
              <button type="button" onClick={() => setActiveView('calendar')}><Icons.Calendar /> Calendar</button>
              <button type="button" onClick={() => setActiveView('studyPlan')}><Icons.Sparkles /> Study plan</button>
              <button type="button" onClick={() => setActiveView('review')}><Icons.Book /> Reviewer</button>
            </>
          )}
          {activeView === 'studyPlan' && (
            <>
              <button type="button" onClick={() => regenerateStudyPlan(studyPlanDuration)}><Icons.Sparkles /> Update plan</button>
              <button type="button" onClick={() => setActiveView('tasks')}><Icons.Zap /> Tasks</button>
              <button type="button" onClick={() => setActiveView('pomodoro')}><Icons.Timer /> Focus timer</button>
              <button type="button" onClick={() => setActiveView('review')}><Icons.Book /> Reviewer</button>
              <button type="button" onClick={() => setActiveView('calendar')}><Icons.Calendar /> Calendar</button>
            </>
          )}
          {activeView === 'about' && (
            <>
              <button type="button" onClick={() => setActiveView('productivity')}><Icons.Chart /> Dashboard</button>
              <button type="button" onClick={() => setActiveView('tasks')}><Icons.Zap /> Tasks</button>
              <button type="button" onClick={() => setShowSettings(true)}><Icons.Settings /> Settings</button>
              <button type="button" onClick={startTutorial}><Icons.Graduation /> Tutorial</button>
            </>
          )}
          </div>
        )}

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
                  const answerOptions = questionType === 'true-false'
                    ? ['True', 'False']
                    : userPreferences.reviewer.shuffleChoices
                      ? [...(item.options || [])].sort((a, b) => stableHash(`${item.id}-${a}`) - stableHash(`${item.id}-${b}`))
                      : item.options || [];
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
                          {answerOptions.map(option => (
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

        {activeView === 'studyPlan' && (
          <section className="study-plan-page">
            <div className="study-plan-hero tool-card">
              <div className="study-plan-hero-copy">
                <span className="metric-label">AI-powered plan</span>
                <h2>Based on your current TaskRay status</h2>
                <p>TaskRay checks your tasks, deadlines, calendar, reviewer progress, and focus preferences before suggesting what to study.</p>
                <div className="study-plan-hero-chips">
                  <span>{studentStatusContext.upcomingDeadlines.length} due soon</span>
                  <span>{studentStatusContext.upcomingAssessments.length} assessments</span>
                  <span>{reviewerCardCount + reviewerQuestionCount} review items</span>
                </div>
                {studyPlanNotice && <small className="study-plan-notice">{studyPlanNotice}</small>}
              </div>
              <div className="study-plan-actions">
                <button type="button" onClick={() => regenerateStudyPlan()}>
                  <Icons.Sparkles /> Generate / Update Plan
                </button>
                <div className="study-availability-card">
                  <span className="metric-label">Availability</span>
                  <div>
                    <label>
                      From
                      <input
                        type="time"
                        value={studyPlanAvailability.start}
                        onChange={event => setStudyPlanAvailability(prev => ({ ...prev, start: event.target.value }))}
                      />
                    </label>
                    <label>
                      Until
                      <input
                        type="time"
                        value={studyPlanAvailability.end}
                        onChange={event => setStudyPlanAvailability(prev => ({ ...prev, end: event.target.value }))}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="study-status-grid">
              <article className="tool-card study-status-card urgent">
                <span className="metric-label">Tasks due soon</span>
                <strong>{studentStatusContext.upcomingDeadlines.length}</strong>
                <p>{studentStatusContext.overdueTasks.length} overdue task{studentStatusContext.overdueTasks.length === 1 ? '' : 's'}</p>
              </article>
              <article className="tool-card study-status-card">
                <span className="metric-label">Assessments</span>
                <strong>{studentStatusContext.upcomingAssessments.length}</strong>
                <p>Detected from calendar events and task titles.</p>
              </article>
              <article className="tool-card study-status-card">
                <span className="metric-label">Reviewer progress</span>
                <strong>{reviewerProgressList.length ? Math.round(reviewerProgressList.reduce((sum, item) => sum + item.progress, 0) / reviewerProgressList.length) : 0}%</strong>
                <p>{reviewerCardCount + reviewerQuestionCount} total review items</p>
              </article>
              <article className="tool-card study-status-card">
                <span className="metric-label">Today&apos;s plan</span>
                <strong>{completedTodayStudySessions.length} / {Math.max(acceptedTodayStudySessions.length, todayStudySessions.length)}</strong>
                <p>{studyPlanTotalMinutesToday} planned minutes</p>
              </article>
            </div>

            <div className="study-plan-grid">
              <div className="tool-card study-now-card">
                <div className="dashboard-card-head">
                  <div>
                    <span className="metric-label">What should I study right now?</span>
                    <h2>{studyPlanRecommendation ? studyPlanRecommendation.subject : 'Generate a recommendation'}</h2>
                  </div>
                  <select value={studyPlanDuration} onChange={event => setStudyPlanDuration(Number(event.target.value))}>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
                {studyPlanRecommendation ? (
                  <div className="study-now-recommendation">
                    <strong>{studyPlanRecommendation.topic}</strong>
                    <p>{studyPlanRecommendation.method} for {studyPlanDuration} to {Math.max(studyPlanDuration, studyPlanRecommendation.durationMinutes)} minutes.</p>
                    {userPreferences.studyPlan.showReasons && (
                      <ul>
                        {(studyPlanRecommendation.reasons || [studyPlanRecommendation.reason]).slice(0, 4).map(reason => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    )}
                    <div className="study-row-actions">
                      <button type="button" onClick={() => handleStartStudySession(studyPlanRecommendation)}>Start Now</button>
                      <button type="button" onClick={handleAddCurrentRecommendation}>Add to Plan</button>
                      <button type="button" onClick={() => regenerateStudyPlan(studyPlanDuration)}>Show Another</button>
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-empty-state small">
                    <Icons.Sparkles />
                    <strong>No recommendation yet</strong>
                    <p>Generate a plan so TaskRay can pick your next best study block.</p>
                    <button type="button" onClick={() => regenerateStudyPlan(studyPlanDuration)}>Generate</button>
                  </div>
                )}
              </div>

              <div className="tool-card study-progress-card">
                <span className="metric-label">Progress</span>
                <strong>{studyPlanProgressPercent}%</strong>
                <p>{completedTodayStudySessions.length} of {Math.max(acceptedTodayStudySessions.length, todayStudySessions.length)} sessions completed today.</p>
                <div className="progress-track"><i style={{ width: `${studyPlanProgressPercent}%` }} /></div>
                {studentStatusContext.missedStudySessions.length > 0 && (
                  <div className="study-alert">
                    <strong>Missed session detected</strong>
                    <p>{studentStatusContext.missedStudySessions[0].subject} was missed. Move or skip it manually.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="tool-card study-plan-panel">
              <div className="dashboard-card-head">
                <div>
                  <span className="metric-label">Recommended today</span>
                  <h2>Today&apos;s Schedule</h2>
                </div>
                <button className="dashboard-link-btn" type="button" onClick={() => regenerateStudyPlan()}>Update Plan</button>
              </div>
              {todayStudySessions.length ? (
                <div className="study-session-list">
                  {todayStudySessions.map(session => (
                    <article className={`study-session-card ${session.priority} ${session.status}`} key={session.id}>
                      <time>{formatStudyTime(session.startTime)}</time>
                      <div>
                        <span className={`study-priority-pill ${session.priority}`}>{session.priority}</span>
                        <h3>{session.subject}</h3>
                        <p>{session.topic} - {session.method} - {session.durationMinutes} min</p>
                        {userPreferences.studyPlan.showReasons && <small>{session.reason}</small>}
                      </div>
                      <div className="study-row-actions">
                        <button type="button" onClick={() => updateStudySession(session.id, { status: 'accepted' })}>Accept</button>
                        <button type="button" onClick={() => handleStartStudySession(session)}>Start</button>
                        <button type="button" onClick={() => updateStudySession(session.id, { status: 'completed', completedAt: new Date().toISOString() })}>Done</button>
                        <button type="button" onClick={() => updateStudySession(session.id, { status: 'skipped' })}>Skip</button>
                        <button type="button" onClick={() => removeStudySession(session.id)} title="Remove"><Icons.X /></button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <Icons.Calendar />
                  <strong>No study sessions planned today</strong>
                  <p>Generate a plan from your current academic activity.</p>
                  <button type="button" onClick={() => regenerateStudyPlan()}>Generate My Study Plan</button>
                </div>
              )}
            </div>

            <div className="tool-card study-plan-panel">
              <div className="dashboard-card-head">
                <div>
                  <span className="metric-label">This week&apos;s study plan</span>
                  <h2>Distributed preparation</h2>
                </div>
              </div>
              <div className="weekly-study-grid">
                {Array.from({ length: 7 }, (_, index) => {
                  const dateKey = dateValue(addDays(new Date(), index));
                  const sessions = studyPlanSessions.filter(session => session.date === dateKey);
                  return (
                    <article key={dateKey}>
                      <strong>{formatStudyDate(dateKey)}</strong>
                      {sessions.length ? sessions.slice(0, 3).map(session => (
                        <div className={`weekly-study-item ${session.priority}`} key={session.id}>
                          <span>{formatStudyTime(session.startTime)}</span>
                          <p>{session.subject}</p>
                          <small>{session.durationMinutes} min</small>
                        </div>
                      )) : <p className="weekly-study-empty">No session</p>}
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="study-insight-grid">
              <article className="tool-card study-insight-card">
                <span className="metric-label">AI Insight</span>
                <strong>{studentStatusContext.overdueTasks.length ? 'Heavy workload detected' : 'Balanced planning'}</strong>
                <p>{studentStatusContext.overdueTasks.length
                  ? 'You have overdue work, so the plan prioritizes urgent tasks before lower-pressure review.'
                  : 'TaskRay is distributing work into realistic focus blocks around your calendar.'}</p>
              </article>
              <article className="tool-card study-insight-card">
                <span className="metric-label">Data used</span>
                <strong>{tasks.length + calendarEvents.length + reviewerProgressList.length} signals</strong>
                <p>Tasks, deadlines, events, reviewer progress, Pomodoro settings, and saved study sessions.</p>
              </article>
            </div>
          </section>
        )}

        {activeView === 'gwa' && (
          <div data-tutorial-target="gwa" className={isTutorialTarget('gwa') ? 'tutorial-module-wrap tutorial-highlight' : 'tutorial-module-wrap'}>
            <GwaCalculator currentUser={currentUser} Icons={Icons} academicPreferences={userPreferences.academic} gwaPreferences={userPreferences.gwa} />
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
              <div className="dashboard-wide-card dashboard-brief-card">
                <div className="dashboard-card-head">
                  <div>
                    <span className="metric-label">Daily brief</span>
                    <h2>{dailyBrief.greeting}</h2>
                  </div>
                  <span className={`smart-priority-pill ${dailyBriefPriorityClass}`}>{dailyBrief.highestLabel}</span>
                </div>
                <p>{dailyBrief.state}</p>
                <div className="dashboard-brief-grid">
                  {dailyBrief.stats.map(item => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <div className="dashboard-brief-next">
                  <small>Highest priority</small>
                  <strong>{dailyBrief.highestTitle}</strong>
                </div>
                <div className="dashboard-brief-actions">
                  <button type="button" onClick={() => { regenerateStudyPlan(); setActiveView('studyPlan'); }}>
                    <Icons.Sparkles /> Start Today&apos;s Plan
                  </button>
                  <button type="button" onClick={() => setActiveView('tasks')}>
                    <Icons.Chart /> View Priorities
                  </button>
                </div>
              </div>

              <div className="dashboard-wide-card dashboard-priority-card">
                <div className="dashboard-card-head">
                  <div>
                    <span className="metric-label">Today&apos;s priorities</span>
                    <h2>Most important next</h2>
                  </div>
                  <span className="dashboard-date-pill">{todaysPriorities.length || 'No'} active</span>
                </div>
                {todaysPriorities.length ? (
                  <div className="smart-priority-list">
                    {todaysPriorities.slice(0, 5).map((item, index) => (
                      <article className={`smart-priority-item ${item.label}`} key={item.id}>
                        <span className="smart-priority-rank">{index + 1}</span>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.subject} - {item.dueText}</p>
                          <div className="smart-priority-reasons">
                            {item.reasons.slice(0, 3).map(reason => <small key={reason}>{reason}</small>)}
                          </div>
                        </div>
                        <span className={`smart-priority-pill ${item.label}`}>{item.labelText}</span>
                        <button type="button" onClick={() => handlePriorityAction(item)}>{item.actionLabel}</button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-empty-state small">
                    <Icons.Check />
                    <strong>No urgent priorities right now</strong>
                    <p>Add a deadline, reviewer, or study session to help TaskRay rank your next work.</p>
                    <button type="button" onClick={() => { setActiveView('tasks'); setShowAddForm(true); }}>Add task</button>
                  </div>
                )}
              </div>

              <div className="tool-card metric-tile active">
                <div className="metric-icon"><Icons.Zap /></div>
                <span className="metric-label">Active tasks</span>
                <strong className="metric-value">{activeTaskCount}</strong>
                <p className="metric-copy">Workload needing attention now.</p>
                <MetricProgress value={activeWorkloadRate} label="Active workload" detail={`${stats.inProgress} in progress · ${stats.todo} waiting`} />
              </div>
              <div className="tool-card metric-tile completed">
                <div className="metric-icon"><Icons.Check /></div>
                <span className="metric-label">Completed</span>
                <strong className="metric-value">{stats.completed}</strong>
                <p className="metric-copy">How much of your task list is done.</p>
                <MetricProgress value={completionRate} label="Completion rate" detail={stats.total ? `${stats.completed} of ${stats.total} tasks complete` : 'No tasks yet'} />
              </div>
              <div className="tool-card metric-tile risk">
                <div className="metric-icon danger"><Icons.Flame /></div>
                <span className="metric-label">Risk watch</span>
                <strong className="metric-value danger">{stats.overdue}</strong>
                <p className="metric-copy">{stats.overdue ? 'Overdue tasks need attention first.' : 'No urgent risks detected.'}</p>
                <MetricProgress value={riskRate} label="Deadline risk" detail={stats.overdue ? `${stats.overdue} overdue task${stats.overdue === 1 ? '' : 's'}` : 'Clear right now'} />
              </div>
              <div className="tool-card metric-tile focus">
                <div className="metric-icon"><Icons.Timer /></div>
                <span className="metric-label">Pomodoro today</span>
                <strong className="metric-value">{pomodoroDisplay}</strong>
                <p className="metric-copy">{pomodoroRunning ? 'Focus session running now.' : 'Ready for your next focus session.'}</p>
                <MetricProgress value={focusReadyRate} label="Focus length" detail={`${pomodoroMinutes} minute session set`} />
              </div>

            <div className="dashboard-wide-card study-plan-dashboard-card">
              <div className="dashboard-card-head">
                <div>
                  <span className="metric-label">AI Study Plan</span>
                  <h2>{nextStudySession ? (nextStudySession.startedAt && nextStudySession.status !== 'completed' ? 'Studying now' : 'Next up') : 'Plan your study day'}</h2>
                </div>
                <button className="dashboard-link-btn" type="button" onClick={() => setActiveView('studyPlan')}>Open Study Plan</button>
              </div>
              {nextStudySession ? (
                <>
                  <div className="dashboard-study-next">
                    <span className={`study-priority-pill ${nextStudySession.priority}`}>{nextStudySession.priority}</span>
                    <div>
                      <strong>{nextStudySession.subject}</strong>
                      <p>{nextStudySession.method} - {formatStudyTime(nextStudySession.startTime)} - {nextStudySession.durationMinutes} min</p>
                      <small>{nextStudySession.reason}</small>
                    </div>
                    <button type="button" onClick={() => handleStartStudySession(nextStudySession)}>Start Session</button>
                  </div>
                  <div className="dashboard-mini-stats">
                    <span>{completedTodayStudySessions.length} / {Math.max(acceptedTodayStudySessions.length, todayStudySessions.length)} sessions completed</span>
                    <span>{studyPlanTotalMinutesToday} min planned today</span>
                    <span>{studyPlanProgressPercent}% progress</span>
                  </div>
                  <div className="progress-track mini"><i style={{ width: `${studyPlanProgressPercent}%` }} /></div>
                </>
              ) : (
                <div className="dashboard-empty-state small">
                  <Icons.Sparkles />
                  <strong>No study sessions planned yet</strong>
                  <p>Generate a plan from your tasks, calendar, reviewer progress, and focus settings.</p>
                  <button type="button" onClick={() => { regenerateStudyPlan(); setActiveView('studyPlan'); }}>Generate Study Plan</button>
                </div>
              )}
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
                  <span>{studyPlanRecommendation ? 'Recommended for you' : todayRecommendation.label}</span>
                  <strong>{studyPlanRecommendation ? `${studyPlanRecommendation.subject}: ${studyPlanRecommendation.topic}` : todayRecommendation.title}</strong>
                  <p>{studyPlanRecommendation ? studyPlanRecommendation.reason : todayRecommendation.copy}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (studyPlanRecommendation) handleAddCurrentRecommendation();
                    else {
                      setActiveView(todayRecommendation.view);
                      if (todayRecommendation.filter) setFilter(todayRecommendation.filter);
                    }
                  }}
                >
                  {studyPlanRecommendation ? 'Add to Study Plan' : todayRecommendation.action}
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
            onClick={() => handleNavSelect(item)}
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
          user={currentUser}
          preferences={userPreferences}
          notificationsEnabled={notificationsEnabled}
          notificationPermission={notificationPermission}
          themeId={dashboardThemeId}
          onThemeChange={handleDashboardThemeChange}
          onToggleNotifications={handleToggleNotifications}
          onSavePreferences={handleSavePreferences}
          onSaveProfile={handleSaveSettingsProfile}
          onRequestPasswordReset={handleRequestPasswordReset}
          onClearStudyPlan={() => {
            setStudyPlanSessions([]);
            setStudyPlanGeneratedAt('');
            setStudyPlanNotice('Study Plan history cleared.');
          }}
          onClearReviewerHistory={handleClearReviewerHistory}
          onSignOut={() => {
            setShowSettings(false);
            setShowLogout(true);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
