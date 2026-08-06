import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Bold,
  CheckCircle2,
  ClipboardCopy,
  Download,
  Edit3,
  Expand,
  FileText,
  Lightbulb,
  PenLine,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Type,
  Underline,
} from 'lucide-react';
import { essayApi } from '../api/essayApi';

const difficulties = ['Easy', 'Medium', 'Hard'];
const essayTypes = [
  'Narrative',
  'Descriptive',
  'Expository',
  'Argumentative',
  'Persuasive',
  'Reflective',
  'Compare and Contrast',
  'Cause and Effect',
  'Problem and Solution',
];
const categories = [
  'Technology',
  'Artificial Intelligence',
  'Education',
  'Climate Change',
  'Mental Health',
  'Business',
  'Leadership',
  'Science',
  'Sports',
  'Society',
  'Politics',
  'Environment',
  'Ethics',
  'History',
  'Literature',
  'Personal Growth',
  'Current Events',
];

const promptSeeds = {
  Technology: [
    'How does technology affect modern friendships?',
    'Should students use tablets instead of textbooks?',
    'Is digital privacy still possible today?',
  ],
  'Artificial Intelligence': [
    'Should artificial intelligence replace teachers in some classrooms?',
    'How can AI help students without doing their work for them?',
    'Should AI-generated content always be labeled?',
  ],
  Education: [
    'Should college education be free?',
    'What makes a classroom truly effective?',
    'Should grades be the main measure of learning?',
  ],
  'Climate Change': [
    'What responsibility do young people have in fighting climate change?',
    'Should governments make strict climate laws?',
    'How can schools encourage sustainable habits?',
  ],
  'Mental Health': [
    'Should mental health days be allowed in school?',
    'How can students manage pressure in healthy ways?',
    'Why should mental health be discussed more openly?',
  ],
  Business: [
    'Should businesses prioritize profit or social responsibility?',
    'What qualities make a brand trustworthy?',
    'How does online shopping change local businesses?',
  ],
  Leadership: [
    'What makes a leader worth following?',
    'Can leadership be learned, or is it natural?',
    'Describe a leader who changed your perspective.',
  ],
  Science: [
    'How has science improved everyday life?',
    'Should space exploration receive more funding?',
    'Why is scientific thinking important outside laboratories?',
  ],
  Sports: [
    'Do sports teach lessons that classrooms cannot?',
    'Should student athletes receive special academic support?',
    'How does teamwork in sports build character?',
  ],
  Society: [
    'Is social media more beneficial than harmful to teenagers?',
    'How can communities become more inclusive?',
    'What makes a society fair?',
  ],
  Politics: [
    'Should voting be required for all eligible citizens?',
    'How can young people participate in civic life?',
    'What responsibilities come with freedom of speech?',
  ],
  Environment: [
    'Should single-use plastics be banned?',
    'How can cities become greener?',
    'What daily habits can protect the environment?',
  ],
  Ethics: [
    'Is it ever acceptable to break a rule?',
    'Should honesty always come before kindness?',
    'How should people decide what is right?',
  ],
  History: [
    'Why should students study historical mistakes?',
    'How can one event change a country?',
    'What does history teach about leadership?',
  ],
  Literature: [
    'Can fiction change the way people see the world?',
    'Why do classic stories continue to matter?',
    'How does literature help people understand emotions?',
  ],
  'Personal Growth': [
    'Describe a challenge that changed your perspective.',
    'What does failure teach that success cannot?',
    'How can students build discipline without losing balance?',
  ],
  'Current Events': [
    'How should students evaluate news online?',
    'Should schools discuss current events more often?',
    'How do global events affect local communities?',
  ],
};

const emptyDraft = {
  id: null,
  title: '',
  topic: '',
  description: '',
  category: 'Education',
  difficulty: 'Medium',
  essayType: 'Argumentative',
  content: '',
  feedback: null,
  scores: null,
  wordCount: 0,
  estimatedMinutes: 25,
};

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const countParagraphs = (text) => text.split(/\n\s*\n/).map(item => item.trim()).filter(Boolean).length;
const readingMinutes = (words) => Math.max(1, Math.ceil(words / 220));
const writingTarget = (difficulty) => difficulty === 'Easy' ? 180 : difficulty === 'Hard' ? 500 : 320;
const writingTime = (difficulty) => difficulty === 'Easy' ? 20 : difficulty === 'Hard' ? 50 : 35;
const writingMoods = ['Natural', 'Formal', 'Confident', 'Reflective', 'Persuasive', 'Simple'];
const editorSizes = [14, 16, 18, 20, 22];

const makePrompt = ({ category, difficulty, essayType }) => {
  const options = promptSeeds[category] || promptSeeds.Education;
  const topic = options[Math.floor(Math.random() * options.length)];
  return {
    title: `${essayType} Essay: ${category}`,
    topic,
    description: `Practice a ${essayType.toLowerCase()} essay about ${category.toLowerCase()}. Focus on a clear introduction, organized body paragraphs, and a thoughtful conclusion.`,
    category,
    difficulty,
    essayType,
    estimatedMinutes: writingTime(difficulty),
    suggestedWords: writingTarget(difficulty),
  };
};

const scoreEssay = (content, prompt) => {
  const words = countWords(content);
  const paragraphs = countParagraphs(content);
  const sentences = content.split(/[.!?]+/).map(item => item.trim()).filter(Boolean);
  const avgSentenceLength = sentences.length ? words / sentences.length : 0;
  const uniqueWords = new Set(content.toLowerCase().match(/[a-z']+/g) || []).size;
  const target = writingTarget(prompt.difficulty);

  const grammar = Math.min(98, Math.max(55, 72 + (sentences.length * 2) - (avgSentenceLength > 28 ? 8 : 0)));
  const vocabulary = Math.min(98, Math.max(58, 64 + Math.round((uniqueWords / Math.max(words, 1)) * 48)));
  const organization = Math.min(98, Math.max(52, 58 + paragraphs * 10 + (words >= target ? 8 : 0)));
  const clarity = Math.min(98, Math.max(55, 82 - Math.max(0, avgSentenceLength - 22)));
  const coherence = Math.min(98, Math.max(54, 60 + paragraphs * 8 + (content.toLowerCase().includes('therefore') || content.toLowerCase().includes('however') ? 8 : 0)));
  const argument = Math.min(98, Math.max(52, 62 + (/\b(because|evidence|reason|example|should|must)\b/i.test(content) ? 18 : 0)));
  const conclusion = Math.min(98, Math.max(50, /\b(in conclusion|overall|to summarize|finally)\b/i.test(content) ? 88 : 68));
  const overall = Math.round((grammar + vocabulary + organization + clarity + coherence + argument + conclusion) / 7);

  const strengths = [
    paragraphs >= 3 ? 'Your essay has a visible paragraph structure.' : 'You started building a focused response.',
    words >= target ? 'You met the suggested word count for this prompt.' : 'Your answer has a clear starting point for expansion.',
    vocabulary >= 82 ? 'Your word choice shows variety.' : 'Your vocabulary is understandable and easy to follow.',
  ];
  const improvements = [
    paragraphs < 3 ? 'Add separate introduction, body, and conclusion paragraphs so the reader can follow your flow.' : 'Make each paragraph begin with a clear topic sentence.',
    avgSentenceLength > 28 ? 'Break long sentences into shorter ones to improve clarity.' : 'Add transition words to connect ideas more smoothly.',
    words < target ? `Develop your examples more. Aim for at least ${target} words for this difficulty.` : 'Add more specific evidence or examples to make your points stronger.',
    conclusion < 80 ? 'End with a stronger conclusion that restates your main idea without copying the introduction.' : 'Your conclusion works; make it more memorable with a final insight.',
  ];

  return {
    scores: {
      grammar: Math.round(grammar),
      vocabulary: Math.round(vocabulary),
      organization: Math.round(organization),
      clarity: Math.round(clarity),
      coherence: Math.round(coherence),
      argument: Math.round(argument),
      conclusion: Math.round(conclusion),
      overall,
    },
    feedback: {
      strengths,
      improvements,
      summary: 'This feedback is meant to guide revision. TaskRay will not rewrite the essay for you, but it points out where your writing can become clearer, stronger, and more organized.',
    },
  };
};

function EssayPractice({ currentUser, refreshToken = 0 }) {
  const [essays, setEssays] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [promptOptions, setPromptOptions] = useState({ difficulty: 'Medium', essayType: 'Argumentative', category: 'Education' });
  const [activePrompt, setActivePrompt] = useState(() => makePrompt(promptOptions));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [writingMood, setWritingMood] = useState('Natural');
  const [editorFontSize, setEditorFontSize] = useState(18);
  const editorRef = useRef(null);

  const words = countWords(draft.content);
  const chars = draft.content.length;
  const paragraphs = countParagraphs(draft.content);
  const readTime = readingMinutes(words);

  useEffect(() => {
    let active = true;
    setLoading(true);
    essayApi.list(currentUser.id)
      .then(items => {
        if (!active) return;
        setEssays(items);
        if (items[0]) setDraft({ ...emptyDraft, ...items[0] });
      })
      .catch(() => setStatus('Unable to load saved essays right now.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [currentUser.id, refreshToken]);

  useEffect(() => {
    if (!draft.content.trim() && !draft.topic.trim()) return undefined;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        const saved = await essayApi.save(currentUser.id, { ...draft, wordCount: words, writingMood, editorFontSize });
        setDraft(prev => (prev.id ? prev : { ...prev, id: saved.id, createdAt: saved.createdAt, updatedAt: saved.updatedAt }));
        setEssays(prev => [saved, ...prev.filter(item => item.id !== saved.id)]);
        setStatus('Auto-saved');
      } catch {
        setStatus('Auto-save failed. Try Save Draft.');
      } finally {
        setSaving(false);
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [currentUser.id, draft, words, writingMood, editorFontSize]);

  const stats = useMemo(() => {
    const scored = essays.filter(essay => essay.scores?.overall);
    const totalScore = scored.reduce((sum, essay) => sum + essay.scores.overall, 0);
    const categoryCounts = essays.reduce((acc, essay) => ({ ...acc, [essay.category]: (acc[essay.category] || 0) + 1 }), {});
    const favoriteCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No category yet';
    const averageWords = essays.length ? Math.round(essays.reduce((sum, essay) => sum + (essay.wordCount || countWords(essay.content || '')), 0) / essays.length) : 0;
    return {
      total: essays.length,
      averageScore: scored.length ? Math.round(totalScore / scored.length) : 0,
      favoriteCategory,
      averageWords,
      latest: essays.slice(0, 3),
    };
  }, [essays]);

  const monthlyBars = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString('en-US', { month: 'short' }), count: 0 };
    });
    essays.forEach(essay => {
      const date = new Date(essay.createdAt || essay.updatedAt || Date.now());
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const found = months.find(month => month.key === key);
      if (found) found.count += 1;
    });
    const max = Math.max(1, ...months.map(month => month.count));
    return months.map(month => ({ ...month, height: Math.max(8, (month.count / max) * 92) }));
  }, [essays]);

  const applyPrompt = (prompt) => {
    setActivePrompt(prompt);
    setDraft({
      ...emptyDraft,
      title: prompt.title,
      topic: prompt.topic,
      description: prompt.description,
      category: prompt.category,
      difficulty: prompt.difficulty,
      essayType: prompt.essayType,
      estimatedMinutes: prompt.estimatedMinutes,
    });
    setHistoryStack([]);
    setRedoStack([]);
    setStatus('New prompt ready');
  };

  const generatePrompt = () => applyPrompt(makePrompt(promptOptions));

  const updateContent = (value) => {
    setHistoryStack(prev => [...prev.slice(-24), draft.content]);
    setRedoStack([]);
    setDraft(prev => ({ ...prev, content: value, feedback: null, scores: null }));
  };

  const handleUndo = () => {
    if (!historyStack.length) return;
    const previous = historyStack[historyStack.length - 1];
    setRedoStack(prev => [draft.content, ...prev]);
    setHistoryStack(prev => prev.slice(0, -1));
    setDraft(prev => ({ ...prev, content: previous }));
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[0];
    setHistoryStack(prev => [...prev, draft.content]);
    setRedoStack(prev => prev.slice(1));
    setDraft(prev => ({ ...prev, content: next }));
  };

  const wrapSelection = (prefix, suffix = prefix) => {
    const editor = editorRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = draft.content.slice(start, end) || 'your text';
    const next = `${draft.content.slice(0, start)}${prefix}${selected}${suffix}${draft.content.slice(end)}`;
    updateContent(next);
    window.requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const saved = await essayApi.save(currentUser.id, { ...draft, wordCount: words, writingMood, editorFontSize });
      setDraft(prev => ({ ...prev, id: saved.id, createdAt: saved.createdAt, updatedAt: saved.updatedAt }));
      setEssays(prev => [saved, ...prev.filter(item => item.id !== saved.id)]);
      setStatus('Draft saved');
    } catch {
      setStatus('Unable to save essay.');
    } finally {
      setSaving(false);
    }
  };

  const submitForFeedback = async () => {
    if (words < 30) {
      setStatus('Write at least 30 words before requesting feedback.');
      return;
    }
    const result = scoreEssay(draft.content, draft);
    if (writingMood !== 'Natural') {
      result.feedback.summary = `${result.feedback.summary} Current writing mood: ${writingMood}. Keep revisions aligned with that tone while preserving your own ideas.`;
    }
    const nextDraft = { ...draft, ...result, wordCount: words, writingMood, editorFontSize };
    setDraft(nextDraft);
    setSaving(true);
    try {
      const saved = await essayApi.save(currentUser.id, nextDraft);
      setEssays(prev => [saved, ...prev.filter(item => item.id !== saved.id)]);
      setStatus('Feedback ready');
    } catch {
      setStatus('Feedback created, but saving failed.');
    } finally {
      setSaving(false);
    }
  };

  const openEssay = (essay) => {
    setDraft({ ...emptyDraft, ...essay });
    setWritingMood(essay.writingMood || 'Natural');
    setEditorFontSize(essay.editorFontSize || 18);
    setActivePrompt({
      title: essay.title,
      topic: essay.topic,
      description: essay.description,
      category: essay.category,
      difficulty: essay.difficulty,
      essayType: essay.essayType,
      estimatedMinutes: essay.estimatedMinutes,
      suggestedWords: writingTarget(essay.difficulty),
    });
    setHistoryStack([]);
    setRedoStack([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const duplicateEssay = async (essay) => {
    const copy = {
      ...essay,
      id: null,
      title: `${essay.title} Copy`,
      feedback: null,
      scores: null,
      createdAt: null,
      updatedAt: null,
    };
    const saved = await essayApi.save(currentUser.id, copy);
    setEssays(prev => [saved, ...prev]);
    setStatus('Essay duplicated');
  };

  const deleteEssay = async (id) => {
    await essayApi.delete(currentUser.id, id);
    setEssays(prev => prev.filter(essay => essay.id !== id));
    if (draft.id === id) setDraft(emptyDraft);
    setStatus('Essay deleted');
  };

  const exportEssay = (essay = draft) => {
    const blob = new Blob([
      `${essay.title || 'TaskRay Essay'}\n\nPrompt: ${essay.topic}\nCategory: ${essay.category}\nDifficulty: ${essay.difficulty}\nType: ${essay.essayType}\n\n${essay.content || ''}`,
    ], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(essay.title || 'taskray-essay').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const scoreRows = draft.scores ? [
    ['Grammar', draft.scores.grammar],
    ['Vocabulary', draft.scores.vocabulary],
    ['Organization', draft.scores.organization],
    ['Clarity', draft.scores.clarity],
    ['Coherence', draft.scores.coherence],
    ['Argument', draft.scores.argument],
    ['Conclusion', draft.scores.conclusion],
  ] : [];

  return (
    <section className={`essay-layout${fullscreen ? ' essay-fullscreen' : ''}`}>
      <article className="essay-hero-card">
        <div>
          <span className="metric-label">Essay Practice</span>
          <h2>Practice writing, then improve with guided feedback.</h2>
          <p>Generate a topic, write your own essay, and get constructive suggestions. TaskRay does not write the essay for you.</p>
        </div>
        <button className="dash-submit-btn" type="button" onClick={generatePrompt}><Sparkles size={16} /> Start Practice</button>
      </article>

      <div className="essay-dashboard-grid">
        <div className="essay-stat-card"><span>Total essays</span><strong>{stats.total}</strong><p>{saving ? 'Saving...' : status || 'Ready to write'}</p></div>
        <div className="essay-stat-card"><span>Average score</span><strong>{stats.averageScore || '-'}</strong><p>Based on submitted essays</p></div>
        <div className="essay-stat-card"><span>Favorite category</span><strong>{stats.favoriteCategory}</strong><p>Most practiced topic area</p></div>
        <div className="essay-stat-card"><span>Average words</span><strong>{stats.averageWords}</strong><p>Writing length trend</p></div>
      </div>

      <article className="essay-panel essay-generator-card">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">AI Topic Generator</span>
            <h2>Prompt setup</h2>
          </div>
          <button className="dashboard-link-btn" type="button" onClick={generatePrompt}><RefreshCw size={15} /> Random Topic</button>
        </div>
        <div className="essay-option-grid">
          <label>Difficulty<select className="dash-select" value={promptOptions.difficulty} onChange={event => setPromptOptions(prev => ({ ...prev, difficulty: event.target.value }))}>{difficulties.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Essay type<select className="dash-select" value={promptOptions.essayType} onChange={event => setPromptOptions(prev => ({ ...prev, essayType: event.target.value }))}>{essayTypes.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Category<select className="dash-select" value={promptOptions.category} onChange={event => setPromptOptions(prev => ({ ...prev, category: event.target.value }))}>{categories.map(item => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="essay-prompt-card">
          <span>{activePrompt.difficulty} | {activePrompt.essayType}</span>
          <h3>{activePrompt.topic}</h3>
          <p>{activePrompt.description}</p>
          <div>
            <small>{activePrompt.suggestedWords || writingTarget(activePrompt.difficulty)}+ words</small>
            <small>{activePrompt.estimatedMinutes} min</small>
            <small>{activePrompt.category}</small>
          </div>
        </div>
      </article>

      <article className="essay-panel essay-editor-card">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">Writing Editor</span>
            <h2>{draft.title || 'Untitled essay'}</h2>
          </div>
          <div className="essay-toolbar">
            <button type="button" onClick={handleUndo} disabled={!historyStack.length} title="Undo">Undo</button>
            <button type="button" onClick={handleRedo} disabled={!redoStack.length} title="Redo">Redo</button>
            <button type="button" onClick={() => editorRef.current?.focus()} title="Focus editor"><PenLine size={14} /></button>
            <button type="button" onClick={() => setFullscreen(value => !value)} title="Fullscreen"><Expand size={14} /></button>
          </div>
        </div>
        <div className="essay-title-row">
          <input className="dash-input" value={draft.title} onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))} placeholder="Essay title" />
          <input className="dash-input" value={draft.topic} onChange={event => setDraft(prev => ({ ...prev, topic: event.target.value }))} placeholder="Prompt or topic" />
        </div>
        <div className="essay-format-toolbar" aria-label="Essay formatting tools">
          <label className="essay-format-control">
            <span>Writing mood</span>
            <select className="dash-select" value={writingMood} onChange={event => setWritingMood(event.target.value)}>
              {writingMoods.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="essay-format-control">
            <span>Text size</span>
            <select className="dash-select" value={editorFontSize} onChange={event => setEditorFontSize(Number(event.target.value))}>
              {editorSizes.map(size => <option key={size} value={size}>{size}px</option>)}
            </select>
          </label>
          <div className="essay-mark-buttons">
            <button type="button" onClick={() => wrapSelection('**', '**')}><Bold size={14} /> Bold</button>
            <button type="button" onClick={() => wrapSelection('<u>', '</u>')}><Underline size={14} /> Underline</button>
            <button type="button" onClick={() => wrapSelection('\n### ', '')}><Type size={14} /> Heading</button>
          </div>
        </div>
        <textarea
          ref={editorRef}
          className="essay-writing-area"
          style={{ fontSize: `${editorFontSize}px` }}
          value={draft.content}
          onChange={event => updateContent(event.target.value)}
          placeholder={`Start writing your essay here. Mood: ${writingMood}. Build your own ideas; TaskRay will guide your revision after you submit.`}
          spellCheck="true"
        />
        <div className="essay-writing-stats">
          <span>{words} words</span>
          <span>{chars} characters</span>
          <span>{paragraphs} paragraphs</span>
          <span>{readTime} min read</span>
          <span>Auto-save on</span>
        </div>
        <div className="essay-actions">
          <button className="dash-submit-btn" type="button" onClick={submitForFeedback}><Lightbulb size={16} /> Get Feedback</button>
          <button className="dashboard-link-btn" type="button" onClick={saveDraft}><Save size={15} /> Save Draft</button>
          <button className="dash-cancel-btn" type="button" onClick={() => exportEssay()}><Download size={15} /> Export</button>
        </div>
      </article>

      <article className="essay-panel essay-feedback-card">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">AI Feedback</span>
            <h2>{draft.scores ? `Overall ${draft.scores.overall}/100` : 'Submit essay for feedback'}</h2>
          </div>
          <CheckCircle2 size={24} />
        </div>
        {draft.scores ? (
          <>
            <div className="essay-score-grid">
              {scoreRows.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}/100</strong>
                  <i style={{ width: `${value}%` }} />
                </div>
              ))}
            </div>
            <div className="essay-feedback-lists">
              <div><h3>Strengths</h3>{draft.feedback.strengths.map(item => <p key={item}>{item}</p>)}</div>
              <div><h3>Improve next</h3>{draft.feedback.improvements.map(item => <p key={item}>{item}</p>)}</div>
            </div>
            <p className="essay-feedback-note">{draft.feedback.summary}</p>
          </>
        ) : (
          <div className="essay-empty-state"><FileText size={28} /><p>Write your essay and click Get Feedback to see grammar, clarity, organization, vocabulary, flow, argument strength, and conclusion notes.</p></div>
        )}
      </article>

      <article className="essay-panel essay-history-card">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">Essay History</span>
            <h2>Recent essays</h2>
          </div>
          <strong className="essay-count-pill">{essays.length}</strong>
        </div>
        {loading ? <div className="essay-empty-state">Loading essays...</div> : essays.length ? (
          <div className="essay-history-list">
            {essays.map(essay => (
              <div className="essay-history-item" key={essay.id}>
                <button type="button" onClick={() => openEssay(essay)}>
                  <strong>{essay.title || 'Untitled essay'}</strong>
                  <span>{essay.category} | {essay.difficulty} | {essay.wordCount || countWords(essay.content || '')} words</span>
                  <small>{new Date(essay.updatedAt || essay.createdAt || Date.now()).toLocaleDateString()}</small>
                </button>
                <div>
                  <button type="button" onClick={() => openEssay(essay)} title="Open"><BookOpen size={14} /></button>
                  <button type="button" onClick={() => duplicateEssay(essay)} title="Duplicate"><ClipboardCopy size={14} /></button>
                  <button type="button" onClick={() => exportEssay(essay)} title="Export"><Download size={14} /></button>
                  <button type="button" onClick={() => deleteEssay(essay.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="essay-empty-state"><Edit3 size={28} /><p>No essays yet. Generate a prompt and start your first practice session.</p></div>}
      </article>

      <article className="essay-panel essay-progress-card">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">Progress Dashboard</span>
            <h2>Writing improvement</h2>
          </div>
          <BarChart3 size={24} />
        </div>
        <div className="essay-bars">
          {monthlyBars.map(month => (
            <div key={month.key}>
              <i style={{ height: `${month.height}px` }} />
              <span>{month.label}</span>
              <small>{month.count}</small>
            </div>
          ))}
        </div>
        <div className="essay-progress-metrics">
          <span>Grammar avg <strong>{Math.round(essays.reduce((sum, essay) => sum + (essay.scores?.grammar || 0), 0) / Math.max(1, essays.filter(essay => essay.scores).length)) || 0}</strong></span>
          <span>Vocabulary avg <strong>{Math.round(essays.reduce((sum, essay) => sum + (essay.scores?.vocabulary || 0), 0) / Math.max(1, essays.filter(essay => essay.scores).length)) || 0}</strong></span>
          <span>Avg words <strong>{stats.averageWords}</strong></span>
        </div>
      </article>
    </section>
  );
}

export default EssayPractice;
