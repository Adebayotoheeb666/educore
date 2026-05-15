const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

const generateReportCardPDF = async (result, student, school, classInfo) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.fontSize(25).text(`${school.name} - Report Card`, { align: 'center' });
      doc.fontSize(16).text(`Student: ${student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim()}`);
      doc.end();
    } catch (err) { reject(err); }
  });
};

const studentLabel = (student) => {
  if (!student) return '';
  if (student.name) return student.name;
  return `${student.firstName || ''} ${student.lastName || ''}`.trim();
};

const subjectIdOf = (entry) => {
  const sub = entry?.subject;
  if (!sub) return '';
  return (sub._id ?? sub).toString();
};

const normalizeTermKey = (term) => (term || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const termsMatch = (a, b) => {
  const na = normalizeTermKey(a);
  const nb = normalizeTermKey(b);
  if (!na || !nb) return true;
  return na === nb || na.includes(nb) || nb.includes(na);
};

const buildSubjectColumns = (results, classSubjects = []) => {
  const map = new Map();
  for (const s of classSubjects) {
    const id = (s._id ?? s).toString();
    map.set(id, s.name || 'Subject');
  }
  for (const result of results) {
    for (const entry of result.subjects || []) {
      const id = subjectIdOf(entry);
      if (!id) continue;
      const name = entry.subject?.name || map.get(id) || 'Subject';
      map.set(id, name);
    }
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

const getSubjectScore = (result, subjectId) =>
  (result.subjects || []).find((entry) => subjectIdOf(entry) === subjectId) || {};

const generateBroadsheetXLSX = (results, classInfo, school, meta = {}) => {
  const subjects = buildSubjectColumns(results, classInfo?.subjects || []);
  const className = `${classInfo?.name || ''}${classInfo?.arm ? ` ${classInfo.arm}` : ''}`.trim();
  const schoolName = school?.name || 'School';
  const term = meta.term || results[0]?.term || '';
  const session = meta.session || results[0]?.session || '';

  const headerRow = ['S/N', 'Admission No', 'Student Name'];
  for (const sub of subjects) {
    headerRow.push(`${sub.name} (CA)`, `${sub.name} (Exam)`, `${sub.name} (Total)`, `${sub.name} (Grade)`);
  }
  headerRow.push('Overall %', 'Position', 'Remarks');

  const rows = [
    [`${schoolName} — Term Results Broadsheet`],
    [`Class: ${className}`, `Term: ${term}`, `Session: ${session}`, `Students: ${results.length}`],
    [],
    headerRow,
  ];

  const sorted = [...results].sort((a, b) => {
    const posA = a.positionInClass ?? 9999;
    const posB = b.positionInClass ?? 9999;
    if (posA !== posB) return posA - posB;
    return (b.overallPercentage || 0) - (a.overallPercentage || 0);
  });

  sorted.forEach((result, idx) => {
    const row = [
      idx + 1,
      result.student?.admissionNumber ?? '',
      studentLabel(result.student),
    ];
    for (const sub of subjects) {
      const entry = getSubjectScore(result, sub.id);
      row.push(
        entry.caScore ?? '',
        entry.examScore ?? '',
        entry.totalScore ?? '',
        entry.grade ?? ''
      );
    }
    row.push(
      result.overallPercentage != null ? Number(result.overallPercentage) : '',
      result.positionInClass ?? '',
      result.principalComment ?? ''
    );
    rows.push(row);
  });

  if (sorted.length > 0) {
    const avg =
      sorted.reduce((sum, r) => sum + (Number(r.overallPercentage) || 0), 0) / sorted.length;
    const summaryPad = subjects.length * 4;
    rows.push([]);
    rows.push([
      '',
      '',
      'Class average (%)',
      ...Array(summaryPad).fill(''),
      Math.round(avg * 10) / 10,
      '',
      '',
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const colWidths = [
    { wch: 5 },
    { wch: 14 },
    { wch: 28 },
    ...subjects.flatMap(() => [{ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 8 }]),
    { wch: 12 },
    { wch: 10 },
    { wch: 32 },
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Broadsheet');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  generateReportCardPDF,
  generateBroadsheetXLSX,
  studentLabel,
  buildSubjectColumns,
  termsMatch,
  normalizeTermKey,
};
