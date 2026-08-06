import {
  calculateGwa,
  findDuplicateGradeKeys,
  isValidGrade,
  parseGradeText,
} from './gwaCalculator';

const rows = [
  { id: '1', subjectName: 'Programming', grade: 4.0, units: 3 },
  { id: '2', subjectName: 'Mathematics', grade: 3.5, units: 3 },
  { id: '3', subjectName: 'Networking', grade: 3.8, units: 4 },
];

test('accepts grade boundary values', () => {
  expect(isValidGrade(1.0)).toBe(true);
  expect(isValidGrade(4.0)).toBe(true);
});

test('rejects invalid grade values', () => {
  expect(isValidGrade(0.5)).toBe(false);
  expect(isValidGrade(4.1)).toBe(false);
});

test('calculates weighted GWA', () => {
  const result = calculateGwa(rows, 'weighted');
  expect(result.ok).toBe(true);
  expect(result.totalUnits).toBe(10);
  expect(result.totalWeightedPoints).toBeCloseTo(37.7);
  expect(result.displayGWA).toBe('3.77');
});

test('calculates unweighted average', () => {
  const result = calculateGwa(rows, 'unweighted');
  expect(result.ok).toBe(true);
  expect(result.displayGWA).toBe('3.77');
});

test('rejects empty subject list', () => {
  const result = calculateGwa([], 'weighted');
  expect(result.ok).toBe(false);
});

test('weighted calculation rejects missing units', () => {
  const result = calculateGwa([{ id: '1', subjectName: 'Programming', grade: 4.0, units: '' }], 'weighted');
  expect(result.ok).toBe(false);
});

test('detects duplicate subjects', () => {
  const duplicates = findDuplicateGradeKeys([
    { subjectCode: 'IT101', subjectName: 'Programming' },
    { subjectCode: 'IT101', subjectName: 'Intro to Computing' },
  ]);
  expect(duplicates.has('it101')).toBe(true);
});

test('parses OCR text rows', () => {
  const parsed = parseGradeText('IT101 Introduction to Computing 3.5 3\nMATH101 | Calculus | 3 Units | 4.0');
  expect(parsed).toHaveLength(2);
  expect(parsed[0].grade).toBe(3.5);
});

test('parses TaskRay grade table rows using final grades', () => {
  const parsed = parseGradeText(`
    COURSE CODE COURSE TITLE SECTION UNITS MIDTERM FINAL
    CS0027 CS PROJECT MANAGEMENT AN33 3 9.0 3.0
    CS0031 SOFTWARE ENGINEERING 2 AN32 3 4.0 3.5
    CS0035 PROGRAMMING LANGUAGES AN32 3 4.0 4.0
    CS0057 CS SPECIALIZATION 3 AN32 3 3.5 4.0
    GED0019 UNDERSTANDING THE SELF AN33 3 4.0 4.0
    GED0059 MATHEMATICAL METHODS AN32 3 0.5 2.5
  `);
  const result = calculateGwa(parsed, 'weighted');
  expect(parsed).toHaveLength(6);
  expect(parsed.map(row => row.subjectName)).toEqual([
    'CS PROJECT MANAGEMENT',
    'SOFTWARE ENGINEERING 2',
    'PROGRAMMING LANGUAGES',
    'CS SPECIALIZATION 3',
    'UNDERSTANDING THE SELF',
    'MATHEMATICAL METHODS',
  ]);
  expect(parsed.map(row => row.grade)).toEqual([3.0, 3.5, 4.0, 4.0, 4.0, 2.5]);
  expect(parsed.every(row => row.units === 3)).toBe(true);
  expect(result.totalWeightedPoints).toBe(63);
  expect(result.totalUnits).toBe(18);
  expect(result.displayGWA).toBe('3.50');
});

test('ignores invalid OCR values', () => {
  const parsed = parseGradeText('Student Number 20261234\nRandom 99 100');
  expect(parsed).toHaveLength(0);
});
