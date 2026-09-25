const DAY_MS = 24 * 60 * 60 * 1000;

export const PRIORITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  flexible: 'Flexible',
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const dateKey = (date) => date.toISOString().slice(0, 10);

const startOfDay = (value) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getDayPart = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const getDaysUntil = (dueAt, todayKey) => {
  if (!dueAt) return null;
  const dueDate = startOfDay(dueAt);
  const today = startOfDay(`${todayKey}T00:00`);
  return Math.round((dueDate - today) / DAY_MS);
};

const isAssessmentText = (text) => /quiz|exam|test|midterm|final|assessment|presentation|defense/i.test(text || '');

const priorityScoreFromManual = (priority) => {
  if (priority === 'high') return 20;
  if (priority === 'medium') return 11;
  if (priority === 'low') return 4;
  return 7;
};

const deadlineScore = (daysUntil) => {
  if (daysUntil === null) return 3;
  if (daysUntil < 0) return 35;
  if (daysUntil === 0) return 34;
  if (daysUntil === 1) return 30;
  if (daysUntil <= 3) return 22;
  if (daysUntil <= 7) return 14;
  return 5;
};

const labelForScore = (score) => {
  if (score >= 85) return 'critical';
  if (score >= 68) return 'high';
  if (score >= 48) return 'medium';
  if (score >= 30) return 'low';
  return 'flexible';
};

const matchReviewerNeed = (task, reviewerProgress = []) => {
  const haystack = `${task.title || ''} ${task.category || ''} ${task.description || ''}`.toLowerCase();
  const reviewer = reviewerProgress.find(item => (
    item.subject && haystack.includes(String(item.subject).toLowerCase())
  ));
  if (!reviewer || !reviewer.total) return { score: 0, reviewer: null };
  if (reviewer.progress < 35) return { score: 10, reviewer };
  if (reviewer.progress < 60) return { score: 7, reviewer };
  if (reviewer.progress < 80) return { score: 3, reviewer };
  return { score: 0, reviewer };
};

export const calculateSmartPriorities = (statusContext) => {
  const todayKey = statusContext.currentDate || dateKey(new Date());
  return (statusContext.tasks || [])
    .filter(task => task.status !== 'completed')
    .map(task => {
      const daysUntil = getDaysUntil(task.dueAt, todayKey);
      const assessment = isAssessmentText(`${task.title || ''} ${task.category || ''} ${task.description || ''}`);
      const reviewerNeed = matchReviewerNeed(task, statusContext.reviewerProgress);
      const deadline = deadlineScore(daysUntil);
      const userPriority = priorityScoreFromManual(task.priority);
      const remainingWork = task.status === 'todo' ? 15 : task.status === 'in-progress' ? 9 : 3;
      const academicImportance = assessment ? 15 : /assignment|project|activity/i.test(task.category || '') ? 10 : 6;
      const recency = task.status === 'in-progress' ? 5 : 2;
      const score = clamp(Math.round(deadline + userPriority + remainingWork + academicImportance + reviewerNeed.score + recency), 0, 100);
      const label = labelForScore(score);
      const dueText = daysUntil === null
        ? 'No deadline'
        : daysUntil < 0
          ? `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} overdue`
          : daysUntil === 0
            ? 'Due today'
            : daysUntil === 1
              ? 'Due tomorrow'
              : `Due in ${daysUntil} days`;

      return {
        id: `task-${task.id}`,
        source: 'task',
        task,
        taskId: task.id,
        reviewerId: reviewerNeed.reviewer?.id,
        title: task.title,
        subject: task.category || 'Task',
        score,
        label,
        labelText: PRIORITY_LABELS[label],
        dueText,
        actionLabel: reviewerNeed.reviewer ? 'Start Review' : task.status === 'in-progress' ? 'Continue Task' : 'Start Task',
        reasons: [
          dueText,
          `${PRIORITY_LABELS[label]} priority score: ${score}/100`,
          assessment ? 'Assessment-related work' : null,
          reviewerNeed.reviewer ? `${reviewerNeed.reviewer.subject} reviewer progress is ${reviewerNeed.reviewer.progress}%` : null,
          task.status === 'in-progress' ? 'Already in progress' : null,
        ].filter(Boolean),
      };
    })
    .sort((a, b) => b.score - a.score);
};

export const buildTodayPriorities = (statusContext, { taskPriorities = [], studyPlanRecommendation = null } = {}) => {
  const todayKey = statusContext.currentDate || dateKey(new Date());
  const studyItem = studyPlanRecommendation && studyPlanRecommendation.status !== 'completed' && studyPlanRecommendation.status !== 'skipped'
    ? {
        id: `study-${studyPlanRecommendation.id}`,
        source: 'studyPlan',
        title: studyPlanRecommendation.topic || studyPlanRecommendation.subject,
        subject: studyPlanRecommendation.subject || 'Study Plan',
        score: studyPlanRecommendation.priority === 'urgent' ? 92 : studyPlanRecommendation.priority === 'high' ? 76 : 56,
        label: studyPlanRecommendation.priority === 'urgent' ? 'critical' : studyPlanRecommendation.priority || 'medium',
        labelText: studyPlanRecommendation.priority === 'urgent' ? 'Critical' : PRIORITY_LABELS[studyPlanRecommendation.priority] || 'Medium',
        dueText: studyPlanRecommendation.date === todayKey
          ? `Study at ${studyPlanRecommendation.startTime || 'today'}`
          : `Planned for ${studyPlanRecommendation.date}`,
        actionLabel: 'Start Session',
        studySession: studyPlanRecommendation,
        reasons: studyPlanRecommendation.reasons?.length
          ? studyPlanRecommendation.reasons
          : [studyPlanRecommendation.reason || 'Recommended by your Study Plan'],
      }
    : null;

  return [
    ...taskPriorities,
    studyItem,
  ]
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

export const buildDailyBrief = (statusContext, { taskPriorities = [], studyPlanRecommendation = null, name = 'there' } = {}) => {
  const todayKey = statusContext.currentDate || dateKey(new Date());
  const tomorrow = dateKey(new Date(startOfDay(`${todayKey}T00:00`).getTime() + DAY_MS));
  const prioritiesToday = taskPriorities.filter(item => ['critical', 'high', 'medium'].includes(item.label)).length;
  const deadlinesTomorrow = (statusContext.tasks || []).filter(task => task.status !== 'completed' && task.dueAt && dateKey(new Date(task.dueAt)) === tomorrow).length;
  const sessionsToday = (statusContext.studyPlan?.sessions || []).filter(session => session.date === todayKey && session.status !== 'skipped');
  const highest = taskPriorities[0] || (studyPlanRecommendation ? {
    title: studyPlanRecommendation.topic || studyPlanRecommendation.subject,
    labelText: studyPlanRecommendation.priority || 'Study Plan',
  } : null);
  const availableMinutes = Math.max(
    0,
    (statusContext.studyPreferences?.endMinutes || 0) - (statusContext.studyPreferences?.startMinutes || 0)
  );
  const availableText = availableMinutes
    ? `${Math.floor(availableMinutes / 60)}h ${String(availableMinutes % 60).padStart(2, '0')}m available study time`
    : 'Set study availability for better planning';

  const state = (statusContext.overdueTasks || []).length
    ? 'Heavy workload detected. Start with the highest impact item first.'
    : prioritiesToday
      ? 'You have a focused set of priorities today.'
      : studyPlanRecommendation
        ? 'You are in a good spot. Your next planned study session is ready.'
        : 'No urgent academic pressure detected right now.';

  return {
    greeting: `Good ${getDayPart()}, ${name}.`,
    state,
    stats: [
      `${prioritiesToday} priorit${prioritiesToday === 1 ? 'y' : 'ies'} remaining`,
      `${deadlinesTomorrow} deadline${deadlinesTomorrow === 1 ? '' : 's'} tomorrow`,
      `${sessionsToday.length} study session${sessionsToday.length === 1 ? '' : 's'} today`,
      availableText,
    ],
    highestTitle: highest?.title || 'Add a task or generate a study plan',
    highestLabel: highest?.labelText || 'Ready',
  };
};

export const buildRecommendedNow = (statusContext, { todayPriorities = [], studyPlanRecommendation = null } = {}) => {
  const best = todayPriorities[0];
  if (best) {
    const duration = best.studySession?.durationMinutes || (best.label === 'critical' ? 30 : 25);
    return {
      title: best.subject,
      topic: best.title,
      duration,
      source: best.source,
      actionLabel: best.actionLabel,
      reasons: best.reasons.slice(0, 3),
      target: best,
    };
  }

  if (studyPlanRecommendation) {
    return {
      title: studyPlanRecommendation.subject,
      topic: studyPlanRecommendation.topic,
      duration: studyPlanRecommendation.durationMinutes || 30,
      source: 'studyPlan',
      actionLabel: 'Start Session',
      reasons: studyPlanRecommendation.reasons || [studyPlanRecommendation.reason],
      target: { source: 'studyPlan', studySession: studyPlanRecommendation },
    };
  }

  const reviewer = (statusContext.reviewerProgress || []).find(item => item.total > 0 && item.progress < 100);
  if (reviewer) {
    return {
      title: reviewer.subject,
      topic: 'Quick active recall',
      duration: 15,
      source: 'reviewer',
      actionLabel: 'Open Reviewer',
      reasons: [`Reviewer progress is ${reviewer.progress}%`, `${reviewer.total} review items available`],
      target: { source: 'reviewer', reviewerId: reviewer.id },
    };
  }

  return null;
};
