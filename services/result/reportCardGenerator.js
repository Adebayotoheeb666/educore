const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

const generateReportCardPDF = async (result, student, school, classInfo) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.fontSize(25).text(`\${school.name} - Report Card`, { align: 'center' });
      doc.fontSize(16).text(`Student: \${student.name}`);
      doc.end();
    } catch (err) { reject(err); }
  });
};

const generateBroadsheetXLSX = (results, classInfo, school) => {
  const ws = XLSX.utils.json_to_sheet(results.map(r => ({
    Student: r.student.name, OverallPercentage: r.overallPercentage, Position: r.positionInClass
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Broadsheet");
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = { generateReportCardPDF, generateBroadsheetXLSX };
