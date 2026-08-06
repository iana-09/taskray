import { supabase } from '../config/supabase';

const storageKey = (userId) => `taskray-essay-practice:${userId}`;

const readLocal = (userId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const writeLocal = (userId, essays) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(essays));
};

const toRow = (essay, userId) => {
  const row = {
    user_id: userId,
    title: essay.title,
    topic: essay.topic,
    description: essay.description || null,
    category: essay.category,
    difficulty: essay.difficulty,
    essay_type: essay.essayType,
    content: essay.content || '',
    feedback: essay.feedback || null,
    scores: essay.scores || null,
    word_count: essay.wordCount || 0,
    estimated_minutes: essay.estimatedMinutes || null,
    is_favorite: Boolean(essay.isFavorite),
    updated_at: essay.updatedAt,
  };
  if (essay.id && !String(essay.id).startsWith('essay-')) row.id = essay.id;
  return row;
};

const fromRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  topic: row.topic,
  description: row.description,
  category: row.category,
  difficulty: row.difficulty,
  essayType: row.essay_type,
  content: row.content || '',
  feedback: row.feedback,
  scores: row.scores,
  wordCount: row.word_count || 0,
  estimatedMinutes: row.estimated_minutes,
  isFavorite: Boolean(row.is_favorite),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const shouldUseLocalFallback = (error) => {
  const message = `${error?.message || ''} ${error?.code || ''}`.toLowerCase();
  return message.includes('essay_practice') || message.includes('does not exist') || message.includes('schema cache');
};

export const essayApi = {
  async list(userId) {
    try {
      const { data, error } = await supabase
        .from('essay_practice')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(fromRow);
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      return readLocal(userId);
    }
  },

  async save(userId, essay) {
    const now = new Date().toISOString();
    const payload = {
      ...essay,
      id: essay.id || `essay-${Date.now()}`,
      userId,
      createdAt: essay.createdAt || now,
      updatedAt: now,
    };

    try {
      const { data, error } = await supabase
        .from('essay_practice')
        .upsert(toRow(payload, userId), { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return fromRow(data);
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      const essays = readLocal(userId);
      const next = [payload, ...essays.filter(item => item.id !== payload.id)];
      writeLocal(userId, next);
      return payload;
    }
  },

  async delete(userId, id) {
    try {
      const { error } = await supabase
        .from('essay_practice')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      writeLocal(userId, readLocal(userId).filter(essay => essay.id !== id));
    }
  },
};
