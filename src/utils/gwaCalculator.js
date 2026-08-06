export const GRADE_MIN = 1.0;
export const GRADE_MAX = 4.0;

const subjectCodePattern = /^[A-Z]{2,}[A-Z0-9-]*\s?\d{1,4}[A-Z0-9-]*$/i;

export const makeGradeRecord = (overrides = {}) => ({
  id: overrides.id || `grade-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  subjectCode: overrides.subjectCode || '',
  subjectName: overrides.subjectName || '',
  grade: overrides.grade ?? '',
  units: overrides.units ?? '',
  source: overrides.source || 'manual',
  confidence: overrides.confidence ?? 0,
  status: overrides.status || 'manually-added',
});

export const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(String(value).replace(/,/g, '.').trim());
  return Number.isFinite(parsed) ? parsed : null;
};

export const isValidGrade = (grade) => {
  const value = normalizeNumber(grade);
  return value !== null && value >= GRADE_MIN && value <= GRADE_MAX;
};

export const isValidUnits = (units) => {
  const value = normalizeNumber(units);
  return value !== null && value > 0;
};

export const validateGradeRecord = (record) => {
  const errors = {};
  if (!String(record.subjectCode || '').trim() && !String(record.subjectName || '').trim()) {
    errors.subject = 'Subject name or code is required.';
  }
  if (!isValidGrade(record.grade)) {
    errors.grade = 'Grade must be from 1.0 to 4.0.';
  }
  if (record.units !== '' && record.units !== null && record.units !== undefined && !isValidUnits(record.units)) {
    errors.units = 'Units must be greater than 0.';
  }
  return errors;
};

export const validateGradeRecords = (records) => records.map(record => ({
  id: record.id,
  errors: validateGradeRecord(record),
}));

export const findDuplicateGradeKeys = (records) => {
  const seen = new Map();
  const duplicates = new Set();
  records.forEach(record => {
    const key = String(record.subjectCode || record.subjectName || '').trim().toLowerCase();
    if (!key) return;
    if (seen.has(key)) duplicates.add(key);
    seen.set(key, true);
  });
  return duplicates;
};

export const calculateGwa = (records, method = 'weighted') => {
  const rowValidations = validateGradeRecords(records);
  const validRecords = records.filter(record => {
    const errors = validateGradeRecord(record);
    if (Object.keys(errors).length) return false;
    if (method === 'weighted' && !isValidUnits(record.units)) return false;
    return true;
  });

  if (!validRecords.length) {
    return {
      ok: false,
      error: 'Add at least one valid subject before calculating.',
      rowValidations,
      excludedCount: records.length,
    };
  }

  if (method === 'weighted') {
    const totalUnits = validRecords.reduce((sum, record) => sum + normalizeNumber(record.units), 0);
    if (totalUnits <= 0) {
      return {
        ok: false,
        error: 'Weighted GWA needs units greater than 0.',
        rowValidations,
        excludedCount: records.length - validRecords.length,
      };
    }
    const totalWeightedPoints = validRecords.reduce((sum, record) => (
      sum + normalizeNumber(record.grade) * normalizeNumber(record.units)
    ), 0);
    const finalGWA = totalWeightedPoints / totalUnits;
    return {
      ok: true,
      method: 'weighted',
      label: 'Weighted GWA',
      records: validRecords,
      rowValidations,
      subjectCount: validRecords.length,
      totalUnits,
      totalWeightedPoints,
      finalGWA,
      displayGWA: finalGWA.toFixed(2),
      excludedCount: records.length - validRecords.length,
    };
  }

  const totalGradePoints = validRecords.reduce((sum, record) => sum + normalizeNumber(record.grade), 0);
  const finalGWA = totalGradePoints / validRecords.length;
  return {
    ok: true,
    method: 'unweighted',
    label: 'Unweighted Average',
    records: validRecords,
    rowValidations,
    subjectCount: validRecords.length,
    totalUnits: validRecords.reduce((sum, record) => sum + (normalizeNumber(record.units) || 0), 0),
    totalWeightedPoints: totalGradePoints,
    finalGWA,
    displayGWA: finalGWA.toFixed(2),
    excludedCount: records.length - validRecords.length,
  };
};

const isIgnoredLine = (line) => {
  const lower = line.toLowerCase();
  return /\b(name|student|number|date|page|average|gwa|semester|school|college|department)\b/.test(lower)
    || /%/.test(line)
    || /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(line);
};

const uniqueBySubject = (records) => {
  const seen = new Set();
  return records.filter(record => {
    const key = String(record.subjectCode || record.subjectName).toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isSectionToken = (token) => /^[A-Z]{1,4}\d{1,4}$/i.test(token || '');

export const parseGradeText = (rawText) => {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map(line => line.replace(/[^\w\s.|()/-]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(line => line.length >= 4 && !isIgnoredLine(line));

  const records = lines.flatMap(line => {
    const pipeParts = line.split('|').map(part => part.trim()).filter(Boolean);
    const tokens = line.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
    const numbers = tokens
      .map((token, index) => ({ token, index, value: normalizeNumber(token.replace(/[^\d.]/g, '')) }))
      .filter(item => item.value !== null);

    const gradeCandidates = numbers.filter(item => item.value >= GRADE_MIN && item.value <= GRADE_MAX);
    const unitCandidates = numbers.filter(item => item.value > 0 && item.value <= 12);
    const explicitUnitsItem = unitCandidates.find(item => (
      /units?/i.test(tokens[item.index - 1] || '') || /units?/i.test(tokens[item.index + 1] || '')
    ));
    const significantNumbers = numbers.filter(item => item.value > 0 && item.value <= 12);
    const lastThreeSignificant = significantNumbers.slice(-3);
    const sectionIndex = (lastThreeSignificant[0]?.index ?? 0) - 1;
    const sectionBeforeUnits = isSectionToken(tokens[sectionIndex]);
    const tableRowUnitsMidtermFinal = lastThreeSignificant.length === 3
      && sectionBeforeUnits
      && Number.isInteger(lastThreeSignificant[0].value)
      && lastThreeSignificant[0].value > 0
      && lastThreeSignificant[2].value >= GRADE_MIN
      && lastThreeSignificant[2].value <= GRADE_MAX
      && !explicitUnitsItem;
    const trailingGradeThenUnits = numbers.length >= 2
      && Number.isInteger(numbers[numbers.length - 1].value)
      && numbers[numbers.length - 1].value <= 12
      && numbers[numbers.length - 2].value >= GRADE_MIN
      && numbers[numbers.length - 2].value <= GRADE_MAX
      && !explicitUnitsItem
      && !tableRowUnitsMidtermFinal;
    const unitsItem = explicitUnitsItem
      || (tableRowUnitsMidtermFinal ? lastThreeSignificant[0] : null)
      || (trailingGradeThenUnits ? numbers[numbers.length - 1] : null);
    const possibleGradeItems = gradeCandidates.filter(item => item.index !== unitsItem?.index);
    const gradeItem = tableRowUnitsMidtermFinal
      ? lastThreeSignificant[2]
      : trailingGradeThenUnits
      ? numbers[numbers.length - 2]
      : possibleGradeItems[possibleGradeItems.length - 1];
    if (!gradeItem) return [];

    const resolvedUnitsItem = unitsItem || [...unitCandidates].reverse().find(item => item.index !== gradeItem.index && Number.isInteger(item.value));
    const subjectCodeIndex = tokens.findIndex(token => subjectCodePattern.test(token));
    const subjectCodeToken = subjectCodeIndex >= 0 ? tokens[subjectCodeIndex] : '';
    const subjectCode = subjectCodeToken || '';

    let subjectName = '';
    if (pipeParts.length >= 3) {
      const nonNumericParts = pipeParts.filter(part => !/^\d+(\.\d+)?(\s*units?)?$/i.test(part));
      subjectName = nonNumericParts.find(part => part !== subjectCode) || '';
    }
    if (!subjectName) {
      const excludedTokenIndexes = new Set([
        gradeItem.index,
        resolvedUnitsItem?.index,
        subjectCodeIndex,
      ].filter(index => index !== undefined && index >= 0));

      if (tableRowUnitsMidtermFinal) {
        lastThreeSignificant.forEach(item => excludedTokenIndexes.add(item.index));
        if (sectionIndex >= 0) excludedTokenIndexes.add(sectionIndex);
      }

      subjectName = tokens
        .filter((token, index) => !excludedTokenIndexes.has(index))
        .filter(token => !/^(units?|grade|subject|code|section|midterm|final)$/i.test(token))
        .join(' ')
        .trim();
    }

    const status = subjectName && resolvedUnitsItem ? 'needs-review' : 'invalid';
    return [makeGradeRecord({
      subjectCode,
      subjectName,
      grade: gradeItem.value,
      units: resolvedUnitsItem?.value ?? '',
      source: 'ocr',
      confidence: resolvedUnitsItem && subjectName ? 0.72 : 0.38,
      status,
    })];
  });

  return uniqueBySubject(records);
};

export const createGwaSummary = (record) => {
  if (!record) return '';
  const lines = [
    `${record.calculationMethod === 'weighted' ? 'Weighted GWA' : 'Unweighted Average'}: ${Number(record.finalGWA).toFixed(2)}`,
    `${record.academicYear} - ${record.semester}`,
    `${record.subjects.length} subjects, ${Number(record.totalUnits || 0).toFixed(2)} units`,
    ...record.subjects.map(subject => {
      const units = normalizeNumber(subject.units);
      const grade = normalizeNumber(subject.grade);
      const points = units ? ` = ${(grade * units).toFixed(2)} weighted points` : '';
      return `${subject.subjectCode ? `${subject.subjectCode} ` : ''}${subject.subjectName}: Final grade ${grade}${units ? ` x ${units} units${points}` : ''}`;
    }),
  ];
  return lines.join('\n');
};
