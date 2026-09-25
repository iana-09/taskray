import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { gwaApi } from '../api/gwaApi';
import {
  calculateGwa,
  createGwaSummary,
  findDuplicateGradeKeys,
  GRADE_MAX,
  GRADE_MIN,
  makeGradeRecord,
  normalizeNumber,
  parseGradeText,
  validateGradeRecord,
} from '../utils/gwaCalculator';

const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const maxImageSize = 8 * 1024 * 1024;

const defaultSemesterInfo = () => ({
  academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  semester: '1st Term',
  program: '',
  yearLevel: '1st Year',
});

const statusLabels = {
  confirmed: 'Confirmed',
  'needs-review': 'Needs Review',
  invalid: 'Invalid',
  'manually-added': 'Manually Added',
};

const topPerformingTarget = 3.4;
const reversedTopPerformingTarget = 1.6;
const gradeScaleOptions = {
  higherBetter: {
    label: '4.0 highest',
    shortLabel: '4.0 highest',
    description: 'Use this when 4.0 is the best grade and 1.0 is the lowest passing grade.',
    helper: 'TPS qualifies at 3.40 and above.',
    target: topPerformingTarget,
    direction: 'above',
  },
  lowerBetter: {
    label: '1.0 highest',
    shortLabel: '1.0 highest',
    description: 'Use this when 1.0 is the best grade and 4.0 is the lowest passing grade.',
    helper: 'TPS qualifies at 1.60 and below.',
    target: reversedTopPerformingTarget,
    direction: 'below',
  },
};
const uploadHistoryLimit = 8;
const currentAcademicStartYear = new Date().getMonth() >= 5 ? new Date().getFullYear() : new Date().getFullYear() - 1;
const academicYearOptions = Array.from({ length: 11 }, (_, index) => {
  const startYear = currentAcademicStartYear - 5 + index;
  return `${startYear}-${startYear + 1}`;
});
const termOptions = ['1st Term', '2nd Term', '3rd Term', '4th Term'];
const yearLevelOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const termOrder = { '1st Term': 1, '2nd Term': 2, '3rd Term': 3, '4th Term': 4 };
const yearOrder = { '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4 };

const normalizeKeyPart = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const makeTermKey = (info) => [
  normalizeKeyPart(info.academicYear),
  normalizeKeyPart(info.yearLevel),
  normalizeKeyPart(info.semester),
].join('_');

const makeYearKey = (info) => [
  normalizeKeyPart(info.academicYear),
  normalizeKeyPart(info.yearLevel),
].join('_');

const isHigherBetterScale = (gradeScaleMode) => gradeScaleMode !== 'lowerBetter';

const getDefaultTpsTarget = (gradeScaleMode, academicPreferences = null) => (
  Number(academicPreferences?.tpsTarget) || gradeScaleOptions[gradeScaleMode]?.target || topPerformingTarget
);

const qualifiesForScale = (gwa, target, gradeScaleMode) => {
  const current = Number(gwa || 0);
  return isHigherBetterScale(gradeScaleMode) ? current >= target : current <= target;
};

const getTpsDetails = (gwa, target = topPerformingTarget, gradeScaleMode = 'higherBetter') => {
  const current = Number(gwa || 0);
  const higherBetter = isHigherBetterScale(gradeScaleMode);
  const difference = higherBetter ? current - target : target - current;
  const qualified = qualifiesForScale(current, target, gradeScaleMode);
  return {
    qualified,
    current,
    required: target,
    difference,
    scaleMode: gradeScaleMode,
    label: qualified ? 'Qualified for Top Performing Student' : 'Not yet qualified for Top Performing Student',
    helper: qualified
      ? higherBetter
        ? `${difference.toFixed(2)} above the ${target.toFixed(2)} TPS requirement.`
        : `${difference.toFixed(2)} better than the ${target.toFixed(2)} TPS requirement.`
      : higherBetter
        ? `You need an additional ${Math.abs(difference).toFixed(2)} to meet the TPS requirement.`
        : `You need to lower your GWA by ${Math.abs(difference).toFixed(2)} to meet the TPS requirement.`,
  };
};

const getUploadHistoryKey = (userId) => `taskray:gwa-upload-history:${userId}`;

const readUploadHistory = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(getUploadHistoryKey(userId)) || '[]');
  } catch {
    return [];
  }
};

const writeUploadHistory = (userId, records) => {
  localStorage.setItem(getUploadHistoryKey(userId), JSON.stringify(records.slice(0, uploadHistoryLimit)));
};

const getUploadScoreDetails = (upload) => {
  const subjects = upload.subjects || [];
  const fallback = calculateGwa(subjects, upload.calculationMethod || 'weighted');
  const hasStoredScore = upload.finalGWA !== null && upload.finalGWA !== undefined && upload.displayGWA;
  const source = hasStoredScore ? upload : fallback.ok ? fallback : null;

  return {
    ok: Boolean(source),
    displayGWA: hasStoredScore ? upload.displayGWA : source?.displayGWA || '',
    finalGWA: hasStoredScore ? upload.finalGWA : source?.finalGWA ?? null,
    subjectCount: upload.subjectCount ?? source?.subjectCount ?? subjects.length,
    totalUnits: upload.totalUnits ?? source?.totalUnits ?? 0,
    totalWeightedPoints: upload.totalWeightedPoints ?? source?.totalWeightedPoints ?? 0,
    excludedCount: upload.excludedCount ?? source?.excludedCount ?? 0,
    method: upload.calculationMethod || source?.method || 'weighted',
  };
};

const preprocessImage = async (file) => {
  const bitmap = await createImageBitmap(file);
  const maxSide = 2400;
  const upscale = Math.max(bitmap.width, bitmap.height) < 1400 ? 1.7 : 1;
  const scale = Math.min(upscale, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < imageData.data.length; index += 4) {
    const gray = imageData.data[index] * 0.299 + imageData.data[index + 1] * 0.587 + imageData.data[index + 2] * 0.114;
    const contrast = gray > 150 ? 255 : gray < 90 ? 0 : gray * 1.18;
    imageData.data[index] = contrast;
    imageData.data[index + 1] = contrast;
    imageData.data[index + 2] = contrast;
  }
  context.putImageData(imageData, 0, 0);
  return canvas;
};

const readImageWithTesseract = async (canvas, onProgress = () => {}) => {
  let worker;
  try {
    worker = await createWorker('eng', 1, {
      logger: status => {
        if (status.status === 'recognizing text') {
          onProgress(52 + Math.round((status.progress || 0) * 38), 'Reading grade text...');
        }
      },
    });
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,-/()',
      preserve_interword_spaces: '1',
    });
    const { data } = await worker.recognize(canvas);
    return data?.text || '';
  } finally {
    if (worker) await worker.terminate();
  }
};

const detectTextFromImage = async (file, onProgress = () => {}) => {
  const canvas = await preprocessImage(file);
  if ('TextDetector' in window) {
    try {
      const detector = new window.TextDetector();
      const detections = await detector.detect(canvas);
      const detectedText = detections
        .map(item => item.rawValue)
        .filter(Boolean)
        .join('\n');
      if (detectedText.trim()) return detectedText;
    } catch {
      // Fall back to bundled OCR below.
    }
  }
  onProgress(50, 'Running TaskRay OCR...');
  return readImageWithTesseract(canvas, onProgress);
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Unable to preview this image.'));
  reader.readAsDataURL(file);
});

function GwaCalculator({ currentUser, Icons, academicPreferences = {}, gwaPreferences = {} }) {
  const fileInputRef = useRef(null);
  const [semesterInfo, setSemesterInfo] = useState(() => ({
    ...defaultSemesterInfo(),
    academicYear: academicPreferences.academicYear || defaultSemesterInfo().academicYear,
    semester: academicPreferences.currentTerm || '1st Term',
    program: currentUser.program || '',
    yearLevel: academicPreferences.yearLevel === 'Custom'
      ? academicPreferences.customYearLevel || 'Custom'
      : academicPreferences.yearLevel || '1st Year',
  }));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedImageData, setUploadedImageData] = useState('');
  const [showImageReview, setShowImageReview] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [scanPreview, setScanPreview] = useState(null);
  const [showScanGwaReveal, setShowScanGwaReveal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [subjects, setSubjects] = useState([makeGradeRecord({ subjectName: '', status: 'manually-added' })]);
  const [calculationMethod, setCalculationMethod] = useState(gwaPreferences.weighted === false ? 'simple' : 'weighted');
  const [sameUnits, setSameUnits] = useState('');
  const [result, setResult] = useState(null);
  const [showTpsReveal, setShowTpsReveal] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [targetGwa, setTargetGwa] = useState((Number(academicPreferences.tpsTarget) || topPerformingTarget).toFixed(2));
  const [futureUnits, setFutureUnits] = useState('15');
  const [remainingSubjects, setRemainingSubjects] = useState('3');
  const [remainingSubjectUnits, setRemainingSubjectUnits] = useState('3');
  const [uploadHistory, setUploadHistory] = useState(() => readUploadHistory(currentUser.id));
  const [uploadHistoryQuery, setUploadHistoryQuery] = useState('');
  const [selectedUploadId, setSelectedUploadId] = useState('');
  const [gradeScaleMode, setGradeScaleMode] = useState(() => {
    try {
      return localStorage.getItem(`taskray:gwa-grade-scale:${currentUser.id}`) || 'higherBetter';
    } catch {
      return 'higherBetter';
    }
  });
  const selectedGradeScale = gradeScaleOptions[gradeScaleMode] || gradeScaleOptions.higherBetter;
  const displayPrecision = Number(gwaPreferences.rounding) === 3 ? 3 : 2;
  const predictionsEnabled = gwaPreferences.predictions !== false;
  const activeTermOptions = useMemo(() => (
    termOptions.slice(0, Math.max(1, Math.min(4, Number(academicPreferences.terms) || 3)))
  ), [academicPreferences.terms]);

  useEffect(() => {
    setSemesterInfo(prev => ({
      ...prev,
      academicYear: academicPreferences.academicYear || prev.academicYear,
      semester: academicPreferences.currentTerm || prev.semester,
      yearLevel: academicPreferences.yearLevel === 'Custom'
        ? academicPreferences.customYearLevel || prev.yearLevel
        : academicPreferences.yearLevel || prev.yearLevel,
    }));
    if (Number(academicPreferences.tpsTarget)) {
      setTargetGwa(Number(academicPreferences.tpsTarget).toFixed(2));
    }
  }, [
    academicPreferences.academicYear,
    academicPreferences.currentTerm,
    academicPreferences.yearLevel,
    academicPreferences.customYearLevel,
    academicPreferences.tpsTarget,
  ]);

  useEffect(() => {
    setCalculationMethod(gwaPreferences.weighted === false ? 'simple' : 'weighted');
  }, [gwaPreferences.weighted]);

  useEffect(() => {
    try {
      localStorage.setItem(`taskray:gwa-grade-scale:${currentUser.id}`, gradeScaleMode);
    } catch {
      // Local storage can be unavailable in strict browser modes.
    }
  }, [currentUser.id, gradeScaleMode]);

  useEffect(() => {
    setTargetGwa(getDefaultTpsTarget(gradeScaleMode, academicPreferences).toFixed(2));
    setResult(prev => prev ? {
      ...prev,
      tps: getTpsDetails(prev.finalGWA, getDefaultTpsTarget(gradeScaleMode, academicPreferences), gradeScaleMode),
      gradeScaleMode,
    } : prev);
    setShowTpsReveal(false);
    setShowScanGwaReveal(false);
  }, [gradeScaleMode, academicPreferences]);

  useEffect(() => {
    let alive = true;
    setLoadingHistory(true);
    gwaApi.list(currentUser.id)
      .then(records => {
        if (alive) setHistory(records);
      })
      .catch(() => {
        if (alive) setError('Unable to load saved GWA records.');
      })
      .finally(() => {
        if (alive) setLoadingHistory(false);
      });
    return () => {
      alive = false;
    };
  }, [currentUser.id]);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    setUploadHistory(readUploadHistory(currentUser.id));
  }, [currentUser.id]);

  const duplicateKeys = useMemo(() => findDuplicateGradeKeys(subjects), [subjects]);
  const rowErrors = useMemo(() => {
    const errors = {};
    subjects.forEach(subject => {
      const subjectErrors = validateGradeRecord(subject);
      const duplicateKey = String(subject.subjectCode || subject.subjectName || '').trim().toLowerCase();
      if (duplicateKey && duplicateKeys.has(duplicateKey)) subjectErrors.duplicate = 'Duplicate subject.';
      errors[subject.id] = subjectErrors;
    });
    return errors;
  }, [subjects, duplicateKeys]);

  const missingUnitsCount = subjects.filter(subject => subject.grade !== '' && !normalizeNumber(subject.units)).length;
  const requiredInfoComplete = Boolean(
    semesterInfo.academicYear.trim()
    && semesterInfo.yearLevel.trim()
    && semesterInfo.semester.trim()
  );
  const currentTermKey = makeTermKey(semesterInfo);
  const existingTermRecord = history.find(record => makeTermKey(record) === currentTermKey);
  const sortedHistory = useMemo(() => [...history].sort((a, b) => {
    const yearCompare = String(a.academicYear || '').localeCompare(String(b.academicYear || ''));
    if (yearCompare) return yearCompare;
    const levelCompare = (yearOrder[a.yearLevel] || 99) - (yearOrder[b.yearLevel] || 99);
    if (levelCompare) return levelCompare;
    return (termOrder[a.semester] || 99) - (termOrder[b.semester] || 99);
  }), [history]);
  const yearSummaries = useMemo(() => {
    const groups = new Map();
    sortedHistory.forEach(record => {
      const key = makeYearKey(record);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          academicYear: record.academicYear,
          yearLevel: record.yearLevel,
          records: [],
        });
      }
      groups.get(key).records.push(record);
    });
    return [...groups.values()].map(group => {
      const uniqueTerms = new Map();
      group.records.forEach(record => {
        if (!uniqueTerms.has(record.semester)) uniqueTerms.set(record.semester, record);
      });
      const records = activeTermOptions.map(term => uniqueTerms.get(term)).filter(Boolean);
      const isComplete = activeTermOptions.every(term => uniqueTerms.has(term));
      const completeYearGwa = isComplete
        ? activeTermOptions.reduce((sum, term) => sum + Number(uniqueTerms.get(term).finalGWA || 0), 0) / activeTermOptions.length
        : null;
      const totalUnits = records.reduce((sum, record) => sum + Number(record.totalUnits || 0), 0);
      const totalWeightedPoints = records.reduce((sum, record) => sum + Number(record.totalWeightedPoints || 0), 0);
      const weightedYearGwa = totalUnits > 0 ? totalWeightedPoints / totalUnits : null;
      return {
        ...group,
        records,
        isComplete,
        completeYearGwa,
        weightedYearGwa,
        missingTerms: activeTermOptions.filter(term => !uniqueTerms.has(term)),
      };
    });
  }, [activeTermOptions, sortedHistory]);
  const activeYearSummary = yearSummaries.find(summary => summary.key === makeYearKey(semesterInfo));
  const yearPrediction = (() => {
    const records = activeYearSummary?.records || [];
    const completedTerms = records.length;
    const remainingTerms = activeTermOptions.length - completedTerms;
    if (!completedTerms || remainingTerms <= 0) return null;
    const currentTotal = records.reduce((sum, record) => sum + Number(record.finalGWA || 0), 0);
    const target = getDefaultTpsTarget(gradeScaleMode, academicPreferences);
    const higherBetter = isHigherBetterScale(gradeScaleMode);
    const requiredAverage = (target * activeTermOptions.length - currentTotal) / remainingTerms;
    return {
      completedTerms,
      remainingTerms,
      target,
      higherBetter,
      requiredAverage,
      impossible: higherBetter ? requiredAverage > GRADE_MAX : requiredAverage < GRADE_MIN,
      alreadySafe: higherBetter ? requiredAverage <= GRADE_MIN : requiredAverage >= GRADE_MAX,
      missingTerms: activeYearSummary?.missingTerms || [],
    };
  })();
  const currentTermPrediction = (() => {
    if (!result) return null;
    const remainingCount = Math.max(0, Math.floor(normalizeNumber(remainingSubjects) || 0));
    const unitsEach = Math.max(0, normalizeNumber(remainingSubjectUnits) || 0);
    if (!remainingCount) return null;
    const currentUnits = calculationMethod === 'weighted'
      ? Number(result.totalUnits || 0)
      : Number(result.subjectCount || result.records.length || 0);
    const futureUnitsTotal = calculationMethod === 'weighted' && unitsEach > 0 ? remainingCount * unitsEach : remainingCount;
    const currentPoints = calculationMethod === 'weighted'
      ? Number(result.totalWeightedPoints || 0)
      : Number(result.finalGWA || 0) * currentUnits;
    const target = getDefaultTpsTarget(gradeScaleMode, academicPreferences);
    const higherBetter = isHigherBetterScale(gradeScaleMode);
    const requiredAverage = (target * (currentUnits + futureUnitsTotal) - currentPoints) / futureUnitsTotal;
    return {
      remainingCount,
      unitsEach,
      target,
      higherBetter,
      requiredAverage,
      impossible: higherBetter ? requiredAverage > GRADE_MAX : requiredAverage < GRADE_MIN,
      alreadySafe: higherBetter ? requiredAverage <= GRADE_MIN : requiredAverage >= GRADE_MAX,
    };
  })();

  const rememberUpload = ({ source, file, text, parsed, calculated }) => {
    const uploadOnlyCalculation = calculateGwa(parsed, calculationMethod);
    const scoreDetails = uploadOnlyCalculation.ok ? uploadOnlyCalculation : calculated;
    const record = {
      id: `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      source,
      fileName: file?.name || (source === 'paste' ? 'Pasted grade rows' : 'Grade upload'),
      createdAt: new Date().toISOString(),
      detectedRows: parsed.length,
      text: text.slice(0, 12000),
      subjects: parsed,
      calculationMethod,
      gradeScaleMode,
      gradeScaleLabel: selectedGradeScale.label,
      academicYear: semesterInfo.academicYear,
      semester: semesterInfo.semester,
      program: semesterInfo.program,
      yearLevel: semesterInfo.yearLevel,
      termKey: currentTermKey,
      yearKey: makeYearKey(semesterInfo),
      uploadedImageUri: uploadedImageData,
      imagePreview: uploadedImageData,
      finalGWA: scoreDetails?.finalGWA ?? null,
      displayGWA: scoreDetails?.displayGWA ?? '',
      subjectCount: scoreDetails?.subjectCount ?? parsed.length,
      totalUnits: scoreDetails?.totalUnits ?? 0,
      totalWeightedPoints: scoreDetails?.totalWeightedPoints ?? 0,
      excludedCount: scoreDetails?.excludedCount ?? 0,
    };
    setUploadHistory(prev => {
      const next = [record, ...prev].slice(0, uploadHistoryLimit);
      writeUploadHistory(currentUser.id, next);
      return next;
    });
    setSelectedUploadId(record.id);
  };

  const goalPlan = useMemo(() => {
    if (!result) return null;

    const target = Math.min(GRADE_MAX, Math.max(GRADE_MIN, normalizeNumber(targetGwa) || getDefaultTpsTarget(gradeScaleMode, academicPreferences)));
    const plannedUnits = Math.max(0, normalizeNumber(futureUnits) || 0);
    const currentGwa = Number(result.finalGWA || 0);
    const currentUnits = Number(result.totalUnits || 0);
    const currentPoints = Number(result.totalWeightedPoints || 0);
    const higherBetter = isHigherBetterScale(gradeScaleMode);
    const qualified = qualifiesForScale(currentGwa, target, gradeScaleMode);
    const gap = higherBetter ? target - currentGwa : currentGwa - target;
    const progress = higherBetter
      ? Math.max(0, Math.min(100, (currentGwa / target) * 100))
      : Math.max(0, Math.min(100, ((GRADE_MAX - currentGwa) / Math.max(0.01, GRADE_MAX - target)) * 100));

    if (!plannedUnits) {
      return {
        target,
        plannedUnits,
        currentGwa,
        gap,
        progress,
        requiredAverage: null,
        higherBetter,
        qualified,
        status: qualified ? 'good' : 'warning',
        summary: 'Add remaining future units to predict what average final grade you need next.',
      };
    }

    const requiredAverage = (target * (currentUnits + plannedUnits) - currentPoints) / plannedUnits;
    let status = 'warning';
    let summary = higherBetter
      ? `Aim for at least ${requiredAverage.toFixed(2)} average final grade across your next ${plannedUnits.toFixed(2)} units.`
      : `Aim for at most ${requiredAverage.toFixed(2)} average final grade across your next ${plannedUnits.toFixed(2)} units.`;

    if (higherBetter && requiredAverage <= GRADE_MIN) {
      status = 'good';
      summary = `You are strongly above the ${target.toFixed(2)} goal. Any valid future average should keep you on track.`;
    } else if (!higherBetter && requiredAverage >= GRADE_MAX) {
      status = 'good';
      summary = `You are strongly below the ${target.toFixed(2)} goal. Any valid future average should keep you on track.`;
    } else if (qualified) {
      status = 'good';
      summary = higherBetter
        ? `You are currently above the ${target.toFixed(2)} goal. Keep at least ${requiredAverage.toFixed(2)} average in your next ${plannedUnits.toFixed(2)} units to stay there.`
        : `You are currently below the ${target.toFixed(2)} goal. Keep at most ${requiredAverage.toFixed(2)} average in your next ${plannedUnits.toFixed(2)} units to stay there.`;
    } else if (higherBetter && requiredAverage > GRADE_MAX) {
      status = 'danger';
      summary = `This target is not reachable with only ${plannedUnits.toFixed(2)} future units because it would require above ${GRADE_MAX.toFixed(2)}. Add more future units or set a smaller step goal first.`;
    } else if (!higherBetter && requiredAverage < GRADE_MIN) {
      status = 'danger';
      summary = `This target is not reachable with only ${plannedUnits.toFixed(2)} future units because it would require below ${GRADE_MIN.toFixed(2)}. Add more future units or set a smaller step goal first.`;
    }

    return {
      target,
      plannedUnits,
      currentGwa,
      gap,
      progress,
      requiredAverage,
      higherBetter,
      qualified,
      status,
      summary,
    };
  }, [academicPreferences, futureUnits, gradeScaleMode, result, targetGwa]);

  const filteredUploadHistory = useMemo(() => {
    const query = uploadHistoryQuery.trim().toLowerCase();
    if (!query) return uploadHistory;

    return uploadHistory.filter(upload => {
      const details = getUploadScoreDetails(upload);
      const searchable = [
        upload.fileName,
        upload.source,
        upload.academicYear,
        upload.semester,
        upload.yearLevel,
        upload.program,
        details.displayGWA,
        String(details.subjectCount || ''),
        ...(upload.subjects || []).flatMap(subject => [
          subject.subjectCode,
          subject.subjectName,
          subject.section,
          subject.grade,
          subject.units,
        ]),
      ]
        .filter(value => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [uploadHistory, uploadHistoryQuery]);

  const setSemesterField = (field, value) => {
    setSemesterInfo(prev => ({ ...prev, [field]: value }));
    setMessage('');
  };

  const updateSubject = (id, field, value) => {
    setSubjects(prev => prev.map(subject => {
      if (subject.id !== id) return subject;
      const next = { ...subject, [field]: value };
      const errors = validateGradeRecord(next);
      return {
        ...next,
        status: Object.keys(errors).length ? 'invalid' : subject.status === 'invalid' ? 'needs-review' : subject.status,
      };
    }));
    setResult(null);
    setShowTpsReveal(false);
    setMessage('');
  };

  const addSubject = () => {
    setSubjects(prev => [...prev, makeGradeRecord({ source: 'manual', status: 'manually-added' })]);
  };

  const deleteSubject = (id) => {
    setSubjects(prev => prev.filter(subject => subject.id !== id));
    setResult(null);
    setShowTpsReveal(false);
  };

  const confirmSubject = (id) => {
    setSubjects(prev => prev.map(subject => (
      subject.id === id ? { ...subject, status: Object.keys(validateGradeRecord(subject)).length ? 'invalid' : 'confirmed' } : subject
    )));
  };

  const clearAll = () => {
    setSubjects([]);
    setResult(null);
    setShowTpsReveal(false);
    setMessage('Subject table cleared.');
  };

  const handleImage = async (file) => {
    setError('');
    setMessage('');
    if (!file) return;
    if (!requiredInfoComplete) {
      setError('Enter Academic Year, Year Level, and Term before uploading grades.');
      return;
    }
    if (existingTermRecord && !window.confirm(`${semesterInfo.academicYear} - ${semesterInfo.yearLevel} - ${semesterInfo.semester} already exists. Replace it after confirming the new scan?`)) {
      setError('Upload cancelled to prevent a duplicate term record.');
      return;
    }
    if (!imageTypes.includes(file.type)) {
      setError('Unsupported image. Please upload PNG, JPG, JPEG, or WEBP.');
      return;
    }
    if (file.size > maxImageSize) {
      setError('Image is too large. Please upload an image under 8 MB.');
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    const dataUrl = await readFileAsDataUrl(file);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadedImageData(dataUrl);
    setScanPreview(null);
    setShowScanGwaReveal(false);
    setResult(null);
    setShowTpsReveal(false);
    setOcrStatus('Image uploaded. Scanning automatically...');
    setOcrProgress(12);
    window.setTimeout(() => {
      scanGrades(file, { autoCalculate: true, fromUpload: true });
    }, 0);
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
    setUploadedImageData('');
    setShowImageReview(false);
    setZoomImage(null);
    setScanPreview(null);
    setShowScanGwaReveal(false);
    setOcrStatus('');
    setOcrProgress(0);
  };

  const mergeParsedSubjects = (currentSubjects, parsedSubjects) => {
    const currentRows = currentSubjects.filter(item => item.subjectCode || item.subjectName || item.grade || item.units);
    const existingKeys = new Set(currentRows
      .map(item => String(item.subjectCode || item.subjectName).toLowerCase().trim())
      .filter(Boolean));
    const nextParsed = parsedSubjects.filter(item => !existingKeys.has(String(item.subjectCode || item.subjectName).toLowerCase().trim()));
    return [...currentRows, ...nextParsed];
  };

  const calculateSubjects = (records, options = {}) => {
    const { auto = false } = options;
    const calculated = calculateGwa(records, calculationMethod);
    if (!calculated.ok) {
      setResult(null);
      setShowTpsReveal(false);
      setError(auto ? `${calculated.error} Review detected rows or paste clearer grade text.` : calculated.error);
      return null;
    }
    const nextDuplicateKeys = findDuplicateGradeKeys(records);
    if (nextDuplicateKeys.size) {
      setMessage('Duplicate subjects were found. The calculation uses valid rows, but review duplicates before saving.');
    } else if (calculated.excludedCount) {
      setMessage(`${calculated.excludedCount} invalid row${calculated.excludedCount === 1 ? '' : 's'} excluded. Final-grade GWA calculated from valid rows.`);
    } else {
      setMessage(auto ? 'Image scanned and GWA calculated automatically. Review the rows before saving.' : 'Calculation ready. Review the result before saving.');
    }
    const nextResult = {
      ...calculated,
      academicYear: semesterInfo.academicYear,
      semester: semesterInfo.semester,
      program: semesterInfo.program,
      yearLevel: semesterInfo.yearLevel,
      termKey: currentTermKey,
      yearKey: makeYearKey(semesterInfo),
      uploadedImageUri: uploadedImageData,
      gradeScaleMode,
      gradeScaleLabel: selectedGradeScale.label,
      tps: getTpsDetails(calculated.finalGWA, getDefaultTpsTarget(gradeScaleMode, academicPreferences), gradeScaleMode),
      dateCalculated: new Date().toISOString(),
    };
    setResult(nextResult);
    setShowTpsReveal(false);
    return nextResult;
  };

  const scanGrades = async (fileOverride = null, options = {}) => {
    const fileToScan = fileOverride instanceof File ? fileOverride : imageFile;
    const { autoCalculate = true, fromUpload = false } = options;
    setError('');
    setMessage('');
    if (!requiredInfoComplete) {
      setError('Academic Year, Year Level, and Term are required before scanning or uploading grades.');
      return;
    }
    setOcrProgress(18);
    setOcrStatus(fileToScan ? 'Preparing image...' : 'Reading pasted grade rows...');
    try {
      let detectedText = ocrText.trim();
      if (fileToScan) {
        setOcrProgress(48);
        setOcrStatus('Scanning grade image...');
        detectedText = await detectTextFromImage(fileToScan, (progress, status) => {
          setOcrProgress(progress);
          setOcrStatus(status);
        });
        setOcrText(detectedText);
      }
      setOcrProgress(78);
      setOcrStatus('Parsing subjects...');
      const parsed = parseGradeText(detectedText);
      if (!parsed.length) {
        setOcrStatus('');
        setOcrProgress(0);
        setError('No subject rows were detected. Paste the grade text or add subjects manually.');
        return;
      }
      const nextSubjects = mergeParsedSubjects(subjects, parsed);
      setSubjects(nextSubjects);
      setOcrProgress(100);
      setOcrStatus(`${parsed.length} possible subject${parsed.length === 1 ? '' : 's'} detected.`);
      const calculated = autoCalculate ? calculateSubjects(nextSubjects, { auto: true }) : null;
      if (calculated) {
        setShowScanGwaReveal(false);
        setScanPreview(calculated);
      }
      rememberUpload({
        source: fileToScan ? 'image' : 'paste',
        file: fileToScan,
        text: detectedText,
        parsed,
        calculated,
      });
    } catch (scanError) {
      setOcrStatus('');
      setOcrProgress(0);
      const pastedText = ocrText.trim();
      if (pastedText) {
        const parsed = parseGradeText(pastedText);
        if (parsed.length) {
          const nextSubjects = mergeParsedSubjects(subjects, parsed);
          setSubjects(nextSubjects);
          setOcrProgress(100);
          setOcrStatus(`${parsed.length} pasted subject${parsed.length === 1 ? '' : 's'} detected.`);
          const calculated = autoCalculate ? calculateSubjects(nextSubjects, { auto: true }) : null;
          if (calculated) {
            setShowScanGwaReveal(false);
            setScanPreview(calculated);
          }
          rememberUpload({
            source: 'paste',
            file: null,
            text: pastedText,
            parsed,
            calculated,
          });
          return;
        }
      }
      if (fromUpload) {
        setMessage(scanError.message || 'Image uploaded, but TaskRay could not read it automatically. Paste copied grade rows below to calculate.');
      } else {
        setError(scanError.message || 'Unable to scan this image.');
      }
    }
  };

  const applySameUnits = () => {
    const units = normalizeNumber(sameUnits);
    if (!units || units <= 0) {
      setError('Enter units greater than 0 before applying to all subjects.');
      return;
    }
    setSubjects(prev => prev.map(subject => ({ ...subject, units })));
    setError('');
    setResult(null);
    setShowTpsReveal(false);
  };

  const calculate = () => {
    setError('');
    calculateSubjects(subjects);
  };

  const makeSavePayload = () => ({
    id: editingRecordId || undefined,
    academicYear: semesterInfo.academicYear,
    semester: semesterInfo.semester,
    program: semesterInfo.program,
    yearLevel: semesterInfo.yearLevel,
    termKey: currentTermKey,
    yearKey: makeYearKey(semesterInfo),
    uploadedImageUri: uploadedImageData,
    gradeScaleMode,
    gradeScaleLabel: selectedGradeScale.label,
    tps: getTpsDetails(result.finalGWA, getDefaultTpsTarget(gradeScaleMode, academicPreferences), gradeScaleMode),
    subjects: result.records.map(subject => ({
      ...subject,
      grade: normalizeNumber(subject.grade),
      units: normalizeNumber(subject.units),
      status: subject.status === 'invalid' ? 'needs-review' : subject.status,
    })),
    totalUnits: result.totalUnits,
    totalWeightedPoints: result.totalWeightedPoints,
    finalGWA: result.finalGWA,
    calculationMethod: result.method,
  });

  const saveResult = async () => {
    if (!result) {
      setError('Calculate the GWA first before saving.');
      return;
    }
    if (!requiredInfoComplete) {
      setError('Academic Year, Year Level, and Term are required before saving.');
      return;
    }
    const duplicate = history.find(record => makeTermKey(record) === currentTermKey && record.id !== editingRecordId);
    if (duplicate && !window.confirm(`Replace the saved record for ${semesterInfo.academicYear} - ${semesterInfo.yearLevel} - ${semesterInfo.semester}?`)) {
      setError('Save cancelled to prevent a duplicate term record.');
      return;
    }
    try {
      if (duplicate) await gwaApi.delete(currentUser.id, duplicate.id);
      const saved = await gwaApi.save(currentUser.id, makeSavePayload());
      setHistory(prev => [saved, ...prev.filter(item => item.id !== saved.id && item.id !== duplicate?.id)]);
      setEditingRecordId(null);
      setScanPreview(null);
      setShowScanGwaReveal(false);
      setMessage('Saved to Academic Performance.');
      setError('');
    } catch {
      setError('Unable to save this GWA record.');
    }
  };

  const loadRecord = (record) => {
    setSemesterInfo({
      academicYear: record.academicYear || '',
      semester: record.semester || '',
      program: record.program || '',
      yearLevel: record.yearLevel || '',
    });
    setSubjects((record.subjects || []).map(subject => makeGradeRecord({ ...subject, id: subject.id || `grade-${Date.now()}` })));
    setCalculationMethod(record.calculationMethod || 'weighted');
    setGradeScaleMode(record.gradeScaleMode || 'higherBetter');
    setUploadedImageData(record.uploadedImageUri || '');
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(record.uploadedImageUri || '');
    setShowImageReview(false);
    setEditingRecordId(record.id);
    setResult(null);
    setShowTpsReveal(false);
    setMessage('Record loaded. Edit or recalculate before saving.');
  };

  const loadUpload = (upload) => {
    const uploadSubjects = (upload.subjects || []).map(subject => makeGradeRecord({
      ...subject,
      id: `grade-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      status: subject.status || 'needs-review',
    }));
    setSubjects(uploadSubjects.length ? uploadSubjects : [makeGradeRecord({ subjectName: '', status: 'manually-added' })]);
    setOcrText(upload.text || '');
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(upload.uploadedImageUri || upload.imagePreview || '');
    setUploadedImageData(upload.uploadedImageUri || upload.imagePreview || '');
    setGradeScaleMode(upload.gradeScaleMode || 'higherBetter');
    setResult(null);
    setShowTpsReveal(false);
    setMessage(`Loaded ${upload.detectedRows || uploadSubjects.length} detected row${(upload.detectedRows || uploadSubjects.length) === 1 ? '' : 's'} from upload history.`);
    setError('');
    setSelectedUploadId(upload.id);
  };

  const deleteUpload = (id) => {
    setSelectedUploadId(prev => prev === id ? '' : prev);
    setUploadHistory(prev => {
      const next = prev.filter(upload => upload.id !== id);
      writeUploadHistory(currentUser.id, next);
      return next;
    });
  };

  const clearUploadHistory = () => {
    setUploadHistory([]);
    writeUploadHistory(currentUser.id, []);
    setSelectedUploadId('');
    setMessage('Upload history cleared.');
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Delete this saved GWA record?')) return;
    try {
      await gwaApi.delete(currentUser.id, id);
      setHistory(prev => prev.filter(record => record.id !== id));
      if (editingRecordId === id) setEditingRecordId(null);
    } catch {
      setError('Unable to delete this GWA record.');
    }
  };

  const recalculateRecord = (record) => {
    loadRecord(record);
    window.setTimeout(() => {
      const calculated = calculateGwa(record.subjects || [], record.calculationMethod || 'weighted');
      if (calculated.ok) setResult({
        ...calculated,
        academicYear: record.academicYear,
        semester: record.semester,
        program: record.program,
        yearLevel: record.yearLevel,
        gradeScaleMode: record.gradeScaleMode || gradeScaleMode,
        gradeScaleLabel: gradeScaleOptions[record.gradeScaleMode || gradeScaleMode]?.label || selectedGradeScale.label,
        tps: getTpsDetails(
          calculated.finalGWA,
          getDefaultTpsTarget(record.gradeScaleMode || gradeScaleMode, academicPreferences),
          record.gradeScaleMode || gradeScaleMode
        ),
        dateCalculated: new Date().toISOString(),
      });
    }, 0);
  };

  const exportCsv = () => {
    const rows = [
      ['Subject Code', 'Subject Name', 'Final Grade', 'Units', 'Status'],
      ...subjects.map(subject => [subject.subjectCode, subject.subjectName, subject.grade, subject.units, statusLabels[subject.status] || subject.status]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskray-gwa-${semesterInfo.academicYear || 'records'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = async () => {
    if (!result) return;
    const summary = createGwaSummary(makeSavePayload());
    await navigator.clipboard?.writeText(summary);
    setMessage('Summary copied.');
  };

  const printResult = () => {
    window.print();
  };

  const validRowCount = subjects.filter(subject => !Object.keys(validateGradeRecord(subject)).length).length;

  return (
    <section className="gwa-layout">
      <div className="gwa-hero-card">
        <div>
          <span className="metric-label">Academic performance</span>
          <h2>GWA Calculator</h2>
          <p>Upload your grades or manually enter them to calculate your General Weighted Average. TaskRay uses the Final grade column only for the computation.</p>
        </div>
        <div className="gwa-hero-metrics">
          <span>{subjects.length} rows</span>
          <span>{validRowCount} valid</span>
          <span>{history.length} saved</span>
          <span>{uploadHistory.length} uploads</span>
        </div>
      </div>

      <section className="tool-card gwa-scale-panel">
        <div>
          <span className="metric-label">Important grade note</span>
          <h2>Only final grades are computed</h2>
          <p>
            Midterm grades are ignored. The accepted grade range is {GRADE_MIN.toFixed(1)} to {GRADE_MAX.toFixed(1)}.
            Choose the grading direction your school uses before scanning or calculating.
          </p>
        </div>
        <div className="gwa-scale-toggle" role="radiogroup" aria-label="Grade scale direction">
          {Object.entries(gradeScaleOptions).map(([mode, option]) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={gradeScaleMode === mode}
              className={gradeScaleMode === mode ? 'active' : ''}
              onClick={() => setGradeScaleMode(mode)}
            >
              <strong>{option.shortLabel}</strong>
              <span>{option.helper}</span>
            </button>
          ))}
        </div>
      </section>

      {(error || message) && (
        <div className={`gwa-notice ${error ? 'error' : 'success'}`}>
          {error || message}
        </div>
      )}

      <div className="gwa-grid">
        <section className="tool-card gwa-panel">
          <span className="metric-label">Semester information</span>
          <div className="gwa-form-grid">
            <label>
              Academic year
              <select className="dash-select" required value={semesterInfo.academicYear} onChange={event => setSemesterField('academicYear', event.target.value)}>
                <option value="">Select academic year</option>
                {academicYearOptions.map(year => <option key={year}>{year}</option>)}
              </select>
            </label>
            <label>
              Term
              <select className="dash-select" value={semesterInfo.semester} onChange={event => setSemesterField('semester', event.target.value)}>
                <option value="">Select term</option>
                {activeTermOptions.map(term => <option key={term}>{term}</option>)}
              </select>
            </label>
            <label>
              Program or course
              <input className="dash-input" value={semesterInfo.program} onChange={event => setSemesterField('program', event.target.value)} placeholder="BSIT, BSEd, etc." />
            </label>
            <label>
              Year level
              <select className="dash-select" value={semesterInfo.yearLevel} onChange={event => setSemesterField('yearLevel', event.target.value)}>
                <option value="">Select year level</option>
                {yearLevelOptions.map(level => <option key={level}>{level}</option>)}
              </select>
            </label>
          </div>
          {!requiredInfoComplete && <p className="gwa-warning">Academic Year, Year Level, and Term are required before uploading or scanning grades.</p>}
          {existingTermRecord && <p className="gwa-warning">A saved record already exists for this Academic Year, Year Level, and Term. New confirmed scans will ask before replacing it.</p>}
        </section>

        <section
          className="tool-card gwa-upload-card"
          onDragOver={event => event.preventDefault()}
          onDrop={event => {
            event.preventDefault();
            if (requiredInfoComplete) handleImage(event.dataTransfer.files?.[0]);
          }}
        >
          <div className="dashboard-card-head">
            <div>
              <span className="metric-label">Grade image upload</span>
              <h2>Scan grades</h2>
            </div>
            <button className="dashboard-link-btn" type="button" onClick={() => fileInputRef.current?.click()} disabled={!requiredInfoComplete}>
              Choose Image
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            hidden
            onChange={event => handleImage(event.target.files?.[0])}
          />
          {imagePreview ? (
            <div className="gwa-image-preview">
              <button className="gwa-image-zoom-btn" type="button" onClick={() => setZoomImage({ src: imagePreview, title: imageFile?.name || 'Uploaded grade screenshot' })}>
                <img src={imagePreview} alt="Uploaded grade preview" />
                <span>Click to zoom image</span>
              </button>
              <button className="dash-cancel-btn" type="button" onClick={removeImage}>Remove Image</button>
            </div>
          ) : (
            <div className="gwa-drop-zone">
              <Icons.Clipboard />
              <strong>Drop a grade screenshot here</strong>
              <p>PNG, JPG, JPEG, or WEBP under 8 MB.</p>
            </div>
          )}
          <div className="gwa-guidelines">
            <span className="metric-label">Upload guidelines</span>
            <ul>
              <li>Upload a clear screenshot that includes the full table headers.</li>
              <li>Best format: Course Code, Course Title, Section, Units, Midterm, Final.</li>
              <li>TaskRay computes only the Final grade. Midterm grades are ignored for GWA.</li>
              <li>Make sure the Units and Final columns are visible and not cropped.</li>
              <li>Review detected rows before calculating because OCR can misread text or numbers.</li>
            </ul>
          </div>
          <p className="gwa-warning">Only Final grades are computed. The automatically detected grades may contain errors, so review all information before calculating your GWA.</p>
          <textarea
            className="dash-textarea"
            rows="5"
            value={ocrText}
            onChange={event => setOcrText(event.target.value)}
            placeholder="Optional: paste OCR text or copied grade rows here, then click Scan Grades."
          />
          <div className="gwa-actions">
            <button className="dash-submit-btn" type="button" onClick={scanGrades} disabled={!requiredInfoComplete || (!imageFile && !ocrText.trim())}>
              <Icons.Search /> Scan Grades
            </button>
            <button className="dash-cancel-btn" type="button" onClick={() => setOcrText('')}>
              Clear OCR Text
            </button>
          </div>
          {ocrStatus && (
            <div className="gwa-progress">
              <span>{ocrStatus}</span>
              <div className="progress-track mini"><i style={{ width: `${ocrProgress}%` }} /></div>
            </div>
          )}
        </section>
      </div>

      <section className="tool-card gwa-upload-history-card">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">Upload history</span>
            <h2>Recent grade scans</h2>
            <p>Reload detected rows from your latest image uploads or pasted grade text.</p>
          </div>
          <div className="gwa-actions">
            <strong className="nav-badge">{uploadHistory.length}</strong>
            {uploadHistory.length > 0 && (
              <button className="dash-cancel-btn" type="button" onClick={clearUploadHistory}>Clear history</button>
            )}
          </div>
        </div>
        {uploadHistory.length === 0 ? (
          <div className="dash-empty compact"><p>No grade uploads remembered yet.</p></div>
        ) : (
          <>
            <div className="gwa-upload-history-search">
              <label className="dash-search-wrap" aria-label="Search grade uploads">
                <Icons.Search className="search-icon" />
                <input
                  className="dash-search"
                  type="search"
                  value={uploadHistoryQuery}
                  onChange={event => setUploadHistoryQuery(event.target.value)}
                  placeholder="Search year, term, subject, filename, or GWA..."
                />
              </label>
              {uploadHistoryQuery && (
                <button className="dash-cancel-btn" type="button" onClick={() => setUploadHistoryQuery('')}>
                  Clear search
                </button>
              )}
            </div>
            {filteredUploadHistory.length === 0 ? (
              <div className="dash-empty compact"><p>No uploads match your search.</p></div>
            ) : (
              <div className="gwa-upload-history-list">
                {filteredUploadHistory.map(upload => {
              const details = getUploadScoreDetails(upload);
              const previewSubjects = (upload.subjects || []).slice(0, 3);
              const historyAcademicYear = upload.academicYear || semesterInfo.academicYear;
              const historyTerm = upload.semester || semesterInfo.semester;
              const historyYearLevel = upload.yearLevel || semesterInfo.yearLevel;
              const isSelectedUpload = selectedUploadId === upload.id;

              return (
                <article className={`gwa-upload-history-item${isSelectedUpload ? ' selected' : ''}`} key={upload.id}>
                  <div className="gwa-upload-history-score">
                    <span>GWA</span>
                    <strong>{details.displayGWA || '--'}</strong>
                  </div>
                  <div className="gwa-upload-history-main">
                    <span className="metric-label">{upload.source === 'image' ? 'Image upload' : 'Pasted rows'}</span>
                    <div className="gwa-upload-title-row">
                      <h3>{historyAcademicYear} - {historyYearLevel} - {historyTerm}</h3>
                      {isSelectedUpload && <span className="gwa-selected-scan-pill">Current scan</span>}
                    </div>
                    {upload.fileName && <p className="gwa-upload-file-name">{upload.fileName}</p>}
                    <div className="gwa-upload-history-meta">
                      <span>{historyAcademicYear}</span>
                      <span>{historyTerm}</span>
                      <span>{details.subjectCount} subject{details.subjectCount === 1 ? '' : 's'}</span>
                      <span>{Number(details.totalUnits || 0).toFixed(2)} units</span>
                      <span>{Number(details.totalWeightedPoints || 0).toFixed(2)} points</span>
                    </div>
                    {previewSubjects.length > 0 && (
                      <p>
                        {previewSubjects.map(subject => (
                          `${subject.subjectCode || subject.subjectName || 'Subject'}: ${subject.grade}`
                        )).join(' | ')}
                        {(upload.subjects || []).length > previewSubjects.length ? ' | ...' : ''}
                      </p>
                    )}
                    <small>
                      {upload.detectedRows} detected row{upload.detectedRows === 1 ? '' : 's'}
                      {details.excludedCount ? `, ${details.excludedCount} excluded` : ''}
                      {' - '}
                      {new Date(upload.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <div className="gwa-actions">
                    <button className="dashboard-link-btn" type="button" onClick={() => loadUpload(upload)}>
                      {isSelectedUpload ? 'Loaded' : 'Load rows'}
                    </button>
                    <button className="dash-btn-delete" type="button" onClick={() => deleteUpload(upload.id)}><Icons.Trash /> Delete</button>
                  </div>
                </article>
              );
                })}
              </div>
            )}
          </>
        )}
      </section>

      <section className="tool-card gwa-panel">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">Editable subject table</span>
            <h2>Review detected subjects</h2>
          </div>
          <div className="gwa-actions">
            <button className="dashboard-link-btn" type="button" onClick={addSubject}><Icons.Plus /> Add subject</button>
            {imagePreview && (
              <button className="dashboard-link-btn" type="button" onClick={() => setShowImageReview(true)}>
                Review image
              </button>
            )}
            <button className="dash-cancel-btn" type="button" onClick={clearAll}>Clear all</button>
            <button className="dash-cancel-btn" type="button" onClick={scanGrades} disabled={!imageFile && !ocrText.trim()}>Rescan image</button>
          </div>
        </div>
        <div className="gwa-units-tools">
          <label>
            Calculation method
            <select className="dash-select" value={calculationMethod} onChange={event => { setCalculationMethod(event.target.value); setResult(null); }}>
              <option value="weighted">Weighted GWA</option>
              <option value="unweighted">Unweighted Average</option>
            </select>
          </label>
          <label>
            Same units for all
            <input className="dash-input" type="number" min="0.1" step="0.1" value={sameUnits} onChange={event => setSameUnits(event.target.value)} placeholder="e.g. 3" />
          </label>
          <button className="dashboard-link-btn" type="button" onClick={applySameUnits}>Apply units</button>
          {missingUnitsCount > 0 && <p>{missingUnitsCount} subject{missingUnitsCount === 1 ? '' : 's'} missing units. Enter units or use unweighted average.</p>}
        </div>
        <div className="gwa-table-wrap">
          <table className="gwa-table">
            <thead>
              <tr>
                <th>Subject code</th>
                <th>Subject name</th>
                <th>Final grade</th>
                <th>Units</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr><td colSpan="6" className="gwa-empty-cell">No subjects yet. Add one manually or scan an image.</td></tr>
              ) : subjects.map(subject => {
                const errors = rowErrors[subject.id] || {};
                return (
                  <tr key={subject.id} className={Object.keys(errors).length ? 'invalid' : ''}>
                    <td>
                      <input className={`dash-input ${errors.subject || errors.duplicate ? 'invalid' : ''}`} value={subject.subjectCode} onChange={event => updateSubject(subject.id, 'subjectCode', event.target.value)} placeholder="IT101" />
                    </td>
                    <td>
                      <input className={`dash-input ${errors.subject || errors.duplicate ? 'invalid' : ''}`} value={subject.subjectName} onChange={event => updateSubject(subject.id, 'subjectName', event.target.value)} placeholder="Programming" />
                    </td>
                    <td>
                      <input className={`dash-input ${errors.grade ? 'invalid' : ''}`} type="number" min={GRADE_MIN} max={GRADE_MAX} step="0.1" value={subject.grade} onChange={event => updateSubject(subject.id, 'grade', event.target.value)} />
                    </td>
                    <td>
                      <input className={`dash-input ${errors.units && calculationMethod === 'weighted' ? 'invalid' : ''}`} type="number" min="0.1" step="0.1" value={subject.units} onChange={event => updateSubject(subject.id, 'units', event.target.value)} />
                    </td>
                    <td>
                      <span className={`gwa-status ${Object.keys(errors).length ? 'invalid' : subject.status}`}>{Object.keys(errors).length ? 'Invalid' : statusLabels[subject.status] || subject.status}</span>
                    </td>
                    <td>
                      <div className="gwa-row-actions">
                        <button type="button" onClick={() => confirmSubject(subject.id)} title="Confirm row"><Icons.Check /></button>
                        <button type="button" onClick={() => deleteSubject(subject.id)} title="Delete row"><Icons.Trash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="gwa-actions">
          <button className="dash-submit-btn" type="button" onClick={calculate}><Icons.Chart /> Calculate</button>
          <button className="dash-cancel-btn" type="button" onClick={() => setResult(null)}>Recalculate</button>
          <button className="dash-cancel-btn" type="button" onClick={exportCsv}>Export CSV</button>
        </div>
      </section>

      {result && (
        <section className="tool-card gwa-result-card">
          <div className="gwa-result-header">
            <div>
              <span className="metric-label">Result</span>
              <h2>{showTpsReveal ? result.label : 'Your GWA is ready'}</h2>
              <p>
                {showTpsReveal ? (result.method === 'weighted'
                  ? 'Computed using Final grade only: grade x units, divided by total units.'
                  : 'Computed using Final grade only: sum of valid grades divided by number of subjects.')
                  : 'Reveal your computed GWA and check if you qualify for Top Performing Student.'}
              </p>
            </div>
            <div className="gwa-score-badge">
              <span>{showTpsReveal ? 'Final GWA' : 'Hidden result'}</span>
              <strong>{showTpsReveal ? Number(result.finalGWA).toFixed(displayPrecision) : 'Ready'}</strong>
            </div>
          </div>
          {showTpsReveal ? (
            <div className="gwa-formula-card">
              <span>Formula</span>
              <strong>
                {result.method === 'weighted'
                  ? `${result.totalWeightedPoints.toFixed(displayPrecision)} weighted points / ${result.totalUnits.toFixed(displayPrecision)} units = ${Number(result.finalGWA).toFixed(displayPrecision)}`
                  : `${result.totalWeightedPoints.toFixed(displayPrecision)} grade points / ${result.subjectCount} subjects = ${Number(result.finalGWA).toFixed(displayPrecision)}`}
              </strong>
            </div>
          ) : (
            <div className="gwa-tps-card suspense">
              <div>
                <span className="metric-label">Suspense check</span>
                <h3>Click to reveal your GWA</h3>
                <p>TaskRay will show your exact GWA and whether it reaches the {getDefaultTpsTarget(gradeScaleMode, academicPreferences).toFixed(2)} TPS requirement for the {selectedGradeScale.shortLabel} scale.</p>
              </div>
              <button className="dash-submit-btn" type="button" onClick={() => setShowTpsReveal(true)}>
                Reveal GWA and TPS status
              </button>
            </div>
          )}
          <div className="gwa-result-grid">
            <span>Academic year <strong>{result.academicYear || 'Not set'}</strong></span>
            <span>Term <strong>{result.semester || 'Not set'}</strong></span>
            <span>Year level <strong>{result.yearLevel || 'Not set'}</strong></span>
            <span>Subjects <strong>{result.subjectCount}</strong></span>
            <span>Total units <strong>{result.totalUnits.toFixed(displayPrecision)}</strong></span>
            <span>Weighted points <strong>{result.totalWeightedPoints.toFixed(displayPrecision)}</strong></span>
            <span>Date calculated <strong>{new Date(result.dateCalculated).toLocaleDateString()}</strong></span>
          </div>
          {result.tps && showTpsReveal && (
            <div className={`gwa-tps-card ${result.tps.qualified ? 'qualified' : 'not-qualified'}`}>
              <div>
                <span className="metric-label">TPS detector</span>
                <h3>{result.tps.label}</h3>
                <p>{result.tps.helper}</p>
              </div>
              <div className="gwa-tps-stats">
                <span>Current GWA <strong>{result.tps.current.toFixed(displayPrecision)}</strong></span>
                <span>Required GWA <strong>{result.tps.required.toFixed(displayPrecision)}</strong></span>
                <span>Difference <strong>{result.tps.difference >= 0 ? '+' : ''}{result.tps.difference.toFixed(displayPrecision)}</strong></span>
              </div>
            </div>
          )}
          {predictionsEnabled && goalPlan && (
            <div className="gwa-goal-card">
              <div className="gwa-goal-head">
                <div>
                  <span className="metric-label">Standards and goals</span>
                  <h3>Top Performing Student</h3>
                  <p>{selectedGradeScale.helper} Only final grades are included in this goal.</p>
                </div>
                <strong className={`gwa-goal-pill ${goalPlan.status}`}>
                  {goalPlan.qualified ? 'On track' : 'Needs boost'}
                </strong>
              </div>
              <div className="gwa-goal-inputs">
                <label>
                  Target GWA
                  <input
                    min={GRADE_MIN}
                    max={GRADE_MAX}
                    step="0.01"
                    type="number"
                    value={targetGwa}
                    onChange={event => setTargetGwa(event.target.value)}
                  />
                </label>
                <label>
                  Remaining future units
                  <input
                    min="0"
                    step="0.5"
                    type="number"
                    value={futureUnits}
                    onChange={event => setFutureUnits(event.target.value)}
                  />
                </label>
              </div>
              <div className="gwa-goal-meter" aria-label={`Current progress toward ${goalPlan.target.toFixed(2)} target`}>
                <span style={{ width: `${goalPlan.progress}%` }} />
              </div>
              <div className="gwa-goal-grid">
                <span>Current GWA <strong>{goalPlan.currentGwa.toFixed(displayPrecision)}</strong></span>
                <span>Target standard <strong>{goalPlan.higherBetter ? `${goalPlan.target.toFixed(displayPrecision)}+` : `${goalPlan.target.toFixed(displayPrecision)} or lower`}</strong></span>
                <span>
                  Gap
                  <strong>{goalPlan.qualified ? `${Math.abs(goalPlan.gap).toFixed(displayPrecision)} safe` : `${goalPlan.gap.toFixed(displayPrecision)} short`}</strong>
                </span>
                <span>
                  Needed future average
                  <strong>{goalPlan.requiredAverage === null ? 'Add units' : goalPlan.higherBetter && goalPlan.requiredAverage <= GRADE_MIN ? `${GRADE_MIN.toFixed(displayPrecision)}+` : !goalPlan.higherBetter && goalPlan.requiredAverage >= GRADE_MAX ? `${GRADE_MAX.toFixed(displayPrecision)} or lower` : goalPlan.requiredAverage.toFixed(displayPrecision)}</strong>
                </span>
              </div>
              <p className={`gwa-goal-status ${goalPlan.status}`}>{goalPlan.summary}</p>
            </div>
          )}
          {predictionsEnabled && <div className="gwa-goal-card">
            <div className="gwa-goal-head">
              <div>
                <span className="metric-label">TPS grade predictor</span>
                <h3>Estimate the grades you still need</h3>
                <p>These are estimates only. TaskRay does not guarantee qualification.</p>
              </div>
            </div>
            <div className="gwa-goal-inputs">
              <label>
                Remaining subjects this term
                <input type="number" min="0" step="1" value={remainingSubjects} onChange={event => setRemainingSubjects(event.target.value)} />
              </label>
              <label>
                Units per remaining subject
                <input type="number" min="0" step="0.5" value={remainingSubjectUnits} onChange={event => setRemainingSubjectUnits(event.target.value)} />
              </label>
            </div>
            {currentTermPrediction ? (
              <p className={`gwa-goal-status ${currentTermPrediction.impossible ? 'danger' : currentTermPrediction.alreadySafe ? 'good' : ''}`}>
                {currentTermPrediction.impossible
                  ? currentTermPrediction.higherBetter
                    ? `To reach ${currentTermPrediction.target.toFixed(2)} this term, the remaining subjects would need an average above ${GRADE_MAX.toFixed(2)}, so this estimate is mathematically impossible.`
                    : `To reach ${currentTermPrediction.target.toFixed(2)} this term, the remaining subjects would need an average below ${GRADE_MIN.toFixed(2)}, so this estimate is mathematically impossible.`
                  : currentTermPrediction.alreadySafe
                    ? currentTermPrediction.higherBetter
                      ? `You are already safely above the TPS target. Keep valid scores in the remaining ${currentTermPrediction.remainingCount} subject${currentTermPrediction.remainingCount === 1 ? '' : 's'}.`
                      : `You are already safely below the TPS target. Keep valid scores in the remaining ${currentTermPrediction.remainingCount} subject${currentTermPrediction.remainingCount === 1 ? '' : 's'}.`
                    : currentTermPrediction.higherBetter
                      ? `You need about ${currentTermPrediction.requiredAverage.toFixed(2)} average in the remaining ${currentTermPrediction.remainingCount} subject${currentTermPrediction.remainingCount === 1 ? '' : 's'} to reach a ${currentTermPrediction.target.toFixed(2)} term GWA.`
                      : `You need about ${currentTermPrediction.requiredAverage.toFixed(2)} or lower average in the remaining ${currentTermPrediction.remainingCount} subject${currentTermPrediction.remainingCount === 1 ? '' : 's'} to reach a ${currentTermPrediction.target.toFixed(2)} term GWA.`}
              </p>
            ) : (
              <p className="gwa-goal-status">Enter remaining subjects to estimate the average grade needed for this term.</p>
            )}
            {yearPrediction && (
              <p className={`gwa-goal-status ${yearPrediction.impossible ? 'danger' : yearPrediction.alreadySafe ? 'good' : ''}`}>
                {yearPrediction.impossible
                  ? yearPrediction.higherBetter
                    ? `For ${semesterInfo.academicYear} - ${semesterInfo.yearLevel}, the remaining term average would need to be ${yearPrediction.requiredAverage.toFixed(2)}, which is above ${GRADE_MAX.toFixed(2)}.`
                    : `For ${semesterInfo.academicYear} - ${semesterInfo.yearLevel}, the remaining term average would need to be ${yearPrediction.requiredAverage.toFixed(2)}, which is below ${GRADE_MIN.toFixed(2)}.`
                  : yearPrediction.alreadySafe
                    ? `Based on saved terms, the remaining ${yearPrediction.remainingTerms} term${yearPrediction.remainingTerms === 1 ? '' : 's'} can stay valid and still keep you around the TPS target.`
                    : yearPrediction.higherBetter
                      ? `For ${semesterInfo.academicYear} - ${semesterInfo.yearLevel}, aim for about ${yearPrediction.requiredAverage.toFixed(2)} average GWA across ${yearPrediction.missingTerms.join(' and ')}.`
                      : `For ${semesterInfo.academicYear} - ${semesterInfo.yearLevel}, aim for about ${yearPrediction.requiredAverage.toFixed(2)} or lower average GWA across ${yearPrediction.missingTerms.join(' and ')}.`}
              </p>
            )}
          </div>}
          <div className="gwa-breakdown-card">
            <div className="dashboard-card-head compact">
              <div>
                <span className="metric-label">Calculation breakdown</span>
                <h3>Subjects used</h3>
              </div>
              <strong className="nav-badge">{result.records.length}</strong>
            </div>
            <div className="gwa-breakdown-table" role="table" aria-label="GWA calculation breakdown">
              <div className="gwa-breakdown-row head" role="row">
                <span role="columnheader">Subject</span>
                <span role="columnheader">Final</span>
                <span role="columnheader">Units</span>
                <span role="columnheader">Points</span>
              </div>
              {result.records.map(subject => {
                const grade = normalizeNumber(subject.grade);
                const units = normalizeNumber(subject.units);
                const points = units ? grade * units : grade;
                return (
                  <div className="gwa-breakdown-row" role="row" key={subject.id}>
                    <span className="subject" role="cell">
                      <strong>{subject.subjectName || subject.subjectCode}</strong>
                      {subject.subjectCode && <small>{subject.subjectCode}</small>}
                    </span>
                    <span role="cell">{grade.toFixed(2)}</span>
                    <span role="cell">{units ? units.toFixed(2) : '-'}</span>
                    <span role="cell">{points.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="gwa-actions gwa-result-actions">
            <button className="dash-submit-btn" type="button" onClick={saveResult}><Icons.Save /> Save to Academic Performance</button>
            <button className="dash-cancel-btn" type="button" onClick={printResult}>Print Result</button>
            <button className="dash-cancel-btn" type="button" onClick={copySummary}>Copy Summary</button>
          </div>
        </section>
      )}

      <section className="tool-card gwa-panel">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">GWA history</span>
            <h2>Saved calculations</h2>
          </div>
          <strong className="nav-badge">{history.length}</strong>
        </div>
        {loadingHistory ? (
          <div className="dash-empty"><p>Loading saved GWA records...</p></div>
        ) : history.length === 0 ? (
          <div className="dash-empty"><p>No saved GWA records yet.</p></div>
        ) : (
          <div className="gwa-history-list">
            {yearSummaries.map(summary => {
              const summaryScaleMode = summary.records.find(record => record.gradeScaleMode)?.gradeScaleMode || gradeScaleMode;
              const summaryTps = summary.isComplete ? getTpsDetails(summary.completeYearGwa, getDefaultTpsTarget(summaryScaleMode, academicPreferences), summaryScaleMode) : null;
              return (
                <div className="gwa-year-group" key={summary.key}>
                  <div className="gwa-year-group-head">
                    <div>
                      <span className="metric-label">Academic record group</span>
                      <h3>{summary.academicYear} - {summary.yearLevel}</h3>
                      <p>{summary.records.length}/{Number(academicPreferences.terms) || 3} terms uploaded{summary.missingTerms.length ? ` - missing ${summary.missingTerms.join(', ')}` : ''}</p>
                    </div>
                    {summary.isComplete && (
                      <div className="gwa-year-complete">
                        <span>Complete Year GWA</span>
                        <strong>{summary.completeYearGwa.toFixed(2)}</strong>
                        <small>{summaryTps.label}</small>
                      </div>
                    )}
                  </div>
                  {summary.isComplete && (
                    <div className="gwa-complete-year-card">
                      <div className="gwa-result-grid">
                        {activeTermOptions.map(term => {
                          const record = summary.records.find(item => item.semester === term);
                          return <span key={term}>{term} GWA <strong>{Number(record?.finalGWA || 0).toFixed(2)}</strong></span>;
                        })}
                        <span>Simple average <strong>{summary.completeYearGwa.toFixed(2)}</strong></span>
                        {summary.weightedYearGwa !== null && <span>Unit-weighted year GWA <strong>{summary.weightedYearGwa.toFixed(2)}</strong></span>}
                        <span>TPS status <strong>{summaryTps.qualified ? 'Qualified' : 'Not yet qualified'}</strong></span>
                      </div>
                    </div>
                  )}
                  {summary.records.map(record => {
                    const recordScaleMode = record.gradeScaleMode || gradeScaleMode;
                    const tps = getTpsDetails(record.finalGWA, getDefaultTpsTarget(recordScaleMode, academicPreferences), recordScaleMode);
                    return (
                      <article className="gwa-history-card" key={record.id}>
                        <div>
                          <span className="metric-label">{record.academicYear} - {record.yearLevel} - {record.semester}</span>
                          <h3>{Number(record.finalGWA).toFixed(2)}</h3>
                          <p>{record.subjects?.length || 0} subjects - {Number(record.totalUnits || 0).toFixed(2)} units - Saved {new Date(record.createdAt).toLocaleDateString()}</p>
                          <p>{tps.label}</p>
                        </div>
                        <div className="gwa-actions">
                          <button className="dashboard-link-btn" type="button" onClick={() => setSelectedRecord(record)}>Open details</button>
                          <button className="dashboard-link-btn" type="button" onClick={() => loadRecord(record)}>Edit/Replace</button>
                          <button className="dash-cancel-btn" type="button" onClick={() => recalculateRecord(record)}>Recalculate</button>
                          <button className="dash-btn-delete" type="button" onClick={() => deleteRecord(record.id)}><Icons.Trash /> Delete</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </section>
      {scanPreview && (
        <div className="gwa-image-review-overlay" role="dialog" aria-modal="true" aria-label="Computed GWA preview">
          <div className="gwa-scan-preview-modal">
            <div className="dashboard-card-head">
              <div>
                <span className="metric-label">Scan preview</span>
                <h2>{showScanGwaReveal ? `Your computed GWA is: ${scanPreview.displayGWA}` : 'Your GWA is ready'}</h2>
                <p>{semesterInfo.academicYear} - {semesterInfo.yearLevel} - {semesterInfo.semester}</p>
              </div>
              <button className="modal-close-btn" type="button" onClick={() => setScanPreview(null)} aria-label="Close scan preview">
                <Icons.X />
              </button>
            </div>
            {showScanGwaReveal ? (
              <div className={`gwa-tps-card ${scanPreview.tps?.qualified ? 'qualified' : 'not-qualified'}`}>
                <div>
                  <span className="metric-label">Top Performing Student status</span>
                  <h3>{scanPreview.tps?.label}</h3>
                  <p>{scanPreview.tps?.helper}</p>
                </div>
                <div className="gwa-tps-stats">
                  <span>Current <strong>{scanPreview.finalGWA.toFixed(2)}</strong></span>
                  <span>Required <strong>{getDefaultTpsTarget(gradeScaleMode, academicPreferences).toFixed(2)}</strong></span>
                </div>
              </div>
            ) : (
              <div className="gwa-tps-card suspense">
                <div>
                  <span className="metric-label">Suspense check</span>
                  <h3>Click to reveal your GWA</h3>
                  <p>See your computed result and check if it qualifies for Top Performing Student status.</p>
                </div>
                <button className="dash-submit-btn" type="button" onClick={() => setShowScanGwaReveal(true)}>
                  Reveal GWA and TPS status
                </button>
              </div>
            )}
            <div className="gwa-preview-grid">
              <div className="gwa-preview-subjects">
                <span className="metric-label">Extracted subjects</span>
                <div className="gwa-breakdown-table" role="table" aria-label="Scanned grade preview">
                  <div className="gwa-breakdown-row head" role="row">
                    <span role="columnheader">Subject</span>
                    <span role="columnheader">Final</span>
                    <span role="columnheader">Units</span>
                    <span role="columnheader">Status</span>
                  </div>
                  {scanPreview.records.map(subject => (
                    <div className="gwa-breakdown-row" role="row" key={subject.id}>
                      <span className="subject" role="cell">
                        <strong>{subject.subjectName || subject.subjectCode}</strong>
                        {subject.subjectCode && <small>{subject.subjectCode}</small>}
                      </span>
                      <span role="cell">{Number(subject.grade).toFixed(2)}</span>
                      <span role="cell">{normalizeNumber(subject.units)?.toFixed(2) || '-'}</span>
                      <span role="cell">{statusLabels[subject.status] || subject.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              {uploadedImageData && (
                <div className="gwa-preview-image">
                  <span className="metric-label">Uploaded image</span>
                  <button className="gwa-image-zoom-btn" type="button" onClick={() => setZoomImage({ src: uploadedImageData, title: 'Uploaded grade report preview' })}>
                    <img src={uploadedImageData} alt="Uploaded grade report preview" />
                    <span>Click image to zoom and review</span>
                  </button>
                </div>
              )}
            </div>
            <div className="gwa-actions gwa-result-actions">
              <button className="dash-submit-btn" type="button" onClick={saveResult}><Icons.Save /> Confirm and Save</button>
              <button className="dashboard-link-btn" type="button" onClick={() => setScanPreview(null)}>Review Grades</button>
              <button className="dashboard-link-btn" type="button" onClick={() => setScanPreview(null)}>Edit Grades</button>
              <button className="dash-cancel-btn" type="button" onClick={() => { setScanPreview(null); fileInputRef.current?.click(); }}>Upload Again</button>
              <button className="dash-cancel-btn" type="button" onClick={() => setScanPreview(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {selectedRecord && (
        <div className="gwa-image-review-overlay" role="dialog" aria-modal="true" aria-label="Saved GWA record details">
          <div className="gwa-scan-preview-modal">
            <div className="dashboard-card-head">
              <div>
                <span className="metric-label">Academic record</span>
                <h2>{selectedRecord.academicYear} - {selectedRecord.yearLevel} - {selectedRecord.semester}</h2>
                <p>Uploaded {new Date(selectedRecord.createdAt || selectedRecord.updatedAt || Date.now()).toLocaleString()}</p>
              </div>
              <button className="modal-close-btn" type="button" onClick={() => setSelectedRecord(null)} aria-label="Close record details">
                <Icons.X />
              </button>
            </div>
            {(() => {
              const selectedScaleMode = selectedRecord.gradeScaleMode || gradeScaleMode;
              const tps = getTpsDetails(selectedRecord.finalGWA, getDefaultTpsTarget(selectedScaleMode, academicPreferences), selectedScaleMode);
              return (
                <div className={`gwa-tps-card ${tps.qualified ? 'qualified' : 'not-qualified'}`}>
                  <div>
                    <span className="metric-label">Term GWA</span>
                    <h3>{Number(selectedRecord.finalGWA).toFixed(2)} - {tps.label}</h3>
                    <p>{tps.helper}</p>
                  </div>
                  <div className="gwa-tps-stats">
                    <span>Subjects <strong>{selectedRecord.subjects?.length || 0}</strong></span>
                    <span>Units <strong>{Number(selectedRecord.totalUnits || 0).toFixed(2)}</strong></span>
                    <span>Required <strong>{getDefaultTpsTarget(selectedScaleMode, academicPreferences).toFixed(2)}</strong></span>
                  </div>
                </div>
              );
            })()}
            <div className="gwa-preview-grid">
              <div className="gwa-preview-subjects">
                <span className="metric-label">Saved grades</span>
                <div className="gwa-breakdown-table" role="table" aria-label="Saved grade details">
                  <div className="gwa-breakdown-row head" role="row">
                    <span role="columnheader">Subject</span>
                    <span role="columnheader">Final</span>
                    <span role="columnheader">Units</span>
                    <span role="columnheader">Points</span>
                  </div>
                  {(selectedRecord.subjects || []).map(subject => {
                    const grade = normalizeNumber(subject.grade);
                    const units = normalizeNumber(subject.units);
                    return (
                      <div className="gwa-breakdown-row" role="row" key={subject.id || `${subject.subjectCode}-${subject.subjectName}`}>
                        <span className="subject" role="cell">
                          <strong>{subject.subjectName || subject.subjectCode}</strong>
                          {subject.subjectCode && <small>{subject.subjectCode}</small>}
                        </span>
                        <span role="cell">{grade?.toFixed(2) || '-'}</span>
                        <span role="cell">{units?.toFixed(2) || '-'}</span>
                        <span role="cell">{grade && units ? (grade * units).toFixed(2) : '-'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {selectedRecord.uploadedImageUri && (
                <div className="gwa-preview-image">
                  <span className="metric-label">Original uploaded image</span>
                  <button className="gwa-image-zoom-btn" type="button" onClick={() => setZoomImage({ src: selectedRecord.uploadedImageUri, title: 'Saved uploaded grade report' })}>
                    <img src={selectedRecord.uploadedImageUri} alt="Saved uploaded grade report" />
                    <span>Click image to zoom and review</span>
                  </button>
                </div>
              )}
            </div>
            <div className="gwa-actions gwa-result-actions">
              <button className="dashboard-link-btn" type="button" onClick={() => { loadRecord(selectedRecord); setSelectedRecord(null); }}>Edit or replace</button>
              <button className="dash-btn-delete" type="button" onClick={() => { const id = selectedRecord.id; setSelectedRecord(null); deleteRecord(id); }}><Icons.Trash /> Delete</button>
              <button className="dash-cancel-btn" type="button" onClick={() => setSelectedRecord(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {showImageReview && imagePreview && (
        <div className="gwa-image-review-overlay" role="dialog" aria-modal="true" aria-label="Review uploaded grade image">
          <div className="gwa-image-review-modal">
            <div className="dashboard-card-head">
              <div>
                <span className="metric-label">Review your image</span>
                <h2>{imageFile?.name || 'Uploaded grade screenshot'}</h2>
              </div>
              <button className="modal-close-btn" type="button" onClick={() => setShowImageReview(false)} aria-label="Close image preview">
                <Icons.X />
              </button>
            </div>
            <button className="gwa-image-zoom-btn large" type="button" onClick={() => setZoomImage({ src: imagePreview, title: imageFile?.name || 'Uploaded grade screenshot' })}>
              <img src={imagePreview} alt="Uploaded grade screenshot for review" />
              <span>Click image to zoom closer</span>
            </button>
            <div className="gwa-actions">
              <button className="dash-cancel-btn" type="button" onClick={() => setShowImageReview(false)}>Close</button>
              <button className="dashboard-link-btn" type="button" onClick={scanGrades} disabled={!imageFile && !ocrText.trim()}>Rescan image</button>
            </div>
          </div>
        </div>
      )}
      {zoomImage && (
        <div className="gwa-image-review-overlay image-zoom-overlay" role="dialog" aria-modal="true" aria-label="Zoomed grade image">
          <div className="gwa-image-zoom-modal">
            <div className="dashboard-card-head">
              <div>
                <span className="metric-label">Image preview</span>
                <h2>{zoomImage.title}</h2>
                <p>Zoomed view for checking the scanned grade details.</p>
              </div>
              <button className="modal-close-btn" type="button" onClick={() => setZoomImage(null)} aria-label="Close zoomed image preview">
                <Icons.X />
              </button>
            </div>
            <div className="gwa-image-zoom-frame">
              <img src={zoomImage.src} alt={zoomImage.title} />
            </div>
            <div className="gwa-actions">
              <button className="dash-cancel-btn" type="button" onClick={() => setZoomImage(null)}>Close preview</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default GwaCalculator;
