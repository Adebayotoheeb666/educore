const XLSX = require('xlsx');
const {
  generateBroadsheetXLSX,
  buildSubjectColumns,
  termsMatch,
  studentLabel,
} = require('../../services/result/reportCardGenerator');

describe('generateBroadsheetXLSX', () => {
  const school = { name: 'Demo High School' };
  const classInfo = {
    name: 'JSS 1',
    arm: 'A',
    subjects: [
      { _id: 'sub1', name: 'Mathematics' },
      { _id: 'sub2', name: 'English' },
    ],
  };

  const results = [
    {
      term: 'first',
      session: '2024/2025',
      overallPercentage: 72,
      positionInClass: 1,
      principalComment: 'Excellent',
      student: { firstName: 'Ada', lastName: 'Okafor', admissionNumber: 'STU001' },
      subjects: [
        { subject: { _id: 'sub1', name: 'Mathematics' }, caScore: 18, examScore: 55, totalScore: 73, grade: 'A' },
        { subject: { _id: 'sub2', name: 'English' }, caScore: 16, examScore: 50, totalScore: 66, grade: 'B' },
      ],
    },
    {
      term: 'first',
      session: '2024/2025',
      overallPercentage: 58,
      positionInClass: 2,
      student: { firstName: 'Chidi', lastName: 'Eze' },
      subjects: [
        { subject: { _id: 'sub1', name: 'Mathematics' }, caScore: 12, examScore: 40, totalScore: 52, grade: 'C' },
        { subject: { _id: 'sub2', name: 'English' }, caScore: 14, examScore: 38, totalScore: 52, grade: 'C' },
      ],
    },
  ];

  it('builds subject columns from class and results', () => {
    const cols = buildSubjectColumns(results, classInfo.subjects);
    expect(cols.map((c) => c.name)).toEqual(['English', 'Mathematics']);
  });

  it('matches term variants', () => {
    expect(termsMatch('First Term', 'first')).toBe(true);
    expect(termsMatch('Second Term', 'first')).toBe(false);
  });

  it('formats student names', () => {
    expect(studentLabel({ firstName: 'Ada', lastName: 'Okafor' })).toBe('Ada Okafor');
    expect(studentLabel({ name: 'Full Name' })).toBe('Full Name');
  });

  it('returns a valid xlsx buffer with student rows', () => {
    const buffer = generateBroadsheetXLSX(results, classInfo, school, {
      term: 'First Term',
      session: '2024/2025',
    });
    expect(Buffer.isBuffer(buffer)).toBe(true);

    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets.Broadsheet;
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    expect(data[0][0]).toContain('Demo High School');
    const headerRow = data.find((row) => row[0] === 'S/N');
    expect(headerRow).toBeTruthy();
    const adaRow = data.find((row) => row[2] === 'Ada Okafor');
    const chidiRow = data.find((row) => row[2] === 'Chidi Eze');
    expect(adaRow).toBeTruthy();
    expect(chidiRow).toBeTruthy();
    expect(String(data[data.length - 1][2])).toContain('Class average');
  });
});
