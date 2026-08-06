import { supabase } from '../config/supabase';

const storageKey = (userId) => `taskray-gwa-records:${userId}`;

const readLocal = (userId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const writeLocal = (userId, records) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(records));
};

const toRow = (record, userId) => {
  const row = {
    user_id: userId,
    academic_year: record.academicYear,
    semester: record.semester,
    program: record.program || null,
    year_level: record.yearLevel || null,
    term_key: record.termKey || null,
    year_key: record.yearKey || null,
    uploaded_image_uri: record.uploadedImageUri || null,
    tps: record.tps || null,
    subjects: record.subjects,
    total_units: record.totalUnits,
    total_weighted_points: record.totalWeightedPoints,
    final_gwa: record.finalGWA,
    calculation_method: record.calculationMethod,
    grade_scale_mode: record.gradeScaleMode || 'higherBetter',
    grade_scale_label: record.gradeScaleLabel || null,
    updated_at: record.updatedAt,
  };
  if (record.id && !String(record.id).startsWith('gwa-')) row.id = record.id;
  return row;
};

const fromRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  academicYear: row.academic_year,
  semester: row.semester,
  program: row.program,
  yearLevel: row.year_level,
  termKey: row.term_key,
  yearKey: row.year_key,
  uploadedImageUri: row.uploaded_image_uri,
  tps: row.tps,
  subjects: row.subjects || [],
  totalUnits: row.total_units,
  totalWeightedPoints: row.total_weighted_points,
  finalGWA: row.final_gwa,
  calculationMethod: row.calculation_method,
  gradeScaleMode: row.grade_scale_mode || 'higherBetter',
  gradeScaleLabel: row.grade_scale_label || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const shouldUseLocalFallback = (error) => {
  const message = `${error?.message || ''} ${error?.code || ''}`.toLowerCase();
  return message.includes('gwa_records') || message.includes('does not exist') || message.includes('schema cache');
};

export const gwaApi = {
  async list(userId) {
    try {
      const { data, error } = await supabase
        .from('gwa_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const remote = (data || []).map(fromRow);
      const local = readLocal(userId);
      const seen = new Set(local.map(record => record.id));
      return [...local, ...remote.filter(record => !seen.has(record.id))];
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      return readLocal(userId);
    }
  },

  async save(userId, record) {
    const now = new Date().toISOString();
    const payload = {
      ...record,
      id: record.id || `gwa-${Date.now()}`,
      userId,
      createdAt: record.createdAt || now,
      updatedAt: now,
    };
    const localRecords = readLocal(userId);
    writeLocal(userId, [payload, ...localRecords.filter(item => item.id !== payload.id)]);

    try {
      const { data, error } = await supabase
        .from('gwa_records')
        .upsert(toRow(payload, userId), { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return {
        ...payload,
        ...fromRow(data),
        termKey: payload.termKey,
        yearKey: payload.yearKey,
        uploadedImageUri: payload.uploadedImageUri,
        tps: payload.tps,
      };
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      return payload;
    }
  },

  async delete(userId, id) {
    writeLocal(userId, readLocal(userId).filter(record => record.id !== id));
    try {
      const { error } = await supabase
        .from('gwa_records')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      if (!shouldUseLocalFallback(error)) throw error;
      writeLocal(userId, readLocal(userId).filter(record => record.id !== id));
    }
  },
};
