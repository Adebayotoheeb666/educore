import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const exportService = {
  /**
   * Export lesson note as PDF
   */
  async exportLessonAsPDF(topic: string, subject: string, level: string, content: string) {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(0, 150, 136); // Teal color
      pdf.text(`${level} ${subject}`, margin, currentY);
      currentY += 10;

      pdf.setFontSize(16);
      pdf.setTextColor(33, 33, 33);
      pdf.text(topic, margin, currentY);
      currentY += 15;

      // Metadata
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      const date = new Date().toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Generated on ${date}`, margin, currentY);
      currentY += 10;

      // Content
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      const lines = pdf.splitTextToSize(content.replace(/[#*_`]/g, ''), contentWidth);
      
      lines.forEach((line: string) => {
        if (currentY > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += 5;
      });

      pdf.save(`${subject}-${topic}-${Date.now()}.pdf`);
      return true;
    } catch (error) {
      console.error('Error exporting lesson:', error);
      throw new Error('Failed to export lesson as PDF');
    }
  },

  /**
   * Export exam questions as PDF
   */
  async exportExamAsPDF(title: string, questions: any[]) {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(0, 150, 136);
      pdf.text(title || 'Exam Paper', margin, currentY);
      currentY += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      const date = new Date().toLocaleDateString('en-NG');
      pdf.text(`Date: ${date} | Total Questions: ${questions.length}`, margin, currentY);
      currentY += 10;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;

      // Questions
      questions.forEach((q, idx) => {
        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('', 'bold');

        const questionNum = `Question ${idx + 1} [${q.type === 'mcq' ? 'MCQ - 2 marks' : 'Essay - 10 marks'}]`;
        pdf.text(questionNum, margin, currentY);
        currentY += 6;

        pdf.setFont('', 'normal');
        const questionLines = pdf.splitTextToSize(q.text, contentWidth);
        questionLines.forEach((line: string) => {
          pdf.text(line, margin, currentY);
          currentY += 5;
        });

        currentY += 3;

        // Options for MCQ
        if (q.type === 'mcq' && q.options) {
          q.options.forEach((opt: string) => {
            const optLines = pdf.splitTextToSize(opt, contentWidth - 5);
            optLines.forEach((line: string, idx: number) => {
              pdf.text(line, margin + 5, currentY);
              currentY += 4;
            });
          });
        } else if (q.type === 'essay') {
          // Space for answer
          pdf.setDrawColor(220, 220, 220);
          for (let i = 0; i < 3; i++) {
            pdf.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 5;
          }
        }

        currentY += 8;
      });

      pdf.save(`Exam-${title}-${Date.now()}.pdf`);
      return true;
    } catch (error) {
      console.error('Error exporting exam:', error);
      throw new Error('Failed to export exam as PDF');
    }
  },

  /**
   * Export grade report as PDF
   */
  async exportGradeReportAsPDF(studentName: string, results: any[]) {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(0, 150, 136);
      pdf.text(`Grade Report`, margin, currentY);
      currentY += 12;

      // Student Info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('', 'bold');
      pdf.text(`Student: ${studentName}`, margin, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      pdf.setFont('', 'normal');
      pdf.setTextColor(128, 128, 128);
      const date = new Date().toLocaleDateString('en-NG');
      pdf.text(`Report Generated: ${date}`, margin, currentY);
      currentY += 10;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      // Table Header
      pdf.setFont('', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(0, 150, 136);
      
      const col1 = margin;
      const col2 = margin + 80;
      const col3 = margin + 130;

      pdf.rect(col1, currentY - 5, 50, 8, 'F');
      pdf.rect(col2, currentY - 5, 30, 8, 'F');
      pdf.rect(col3, currentY - 5, 30, 8, 'F');

      pdf.text('Date', col1 + 2, currentY);
      pdf.text('Score', col2 + 2, currentY);
      pdf.text('Grade', col3 + 2, currentY);

      currentY += 10;

      // Results
      pdf.setFont('', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      const avgScore = results.length > 0 
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
        : 0;

      results.slice(0, 10).forEach((result, idx) => {
        const dateStr = result.createdAt?.toDate?.()?.toLocaleDateString('en-NG') || 'Unknown';
        const gradeLabel = this._getGradeLabel((result.score / 20) * 100);

        pdf.text(dateStr, col1 + 2, currentY);
        pdf.text(`${result.score}/20`, col2 + 2, currentY);
        pdf.text(gradeLabel, col3 + 2, currentY);
        currentY += 8;

        if (currentY > 250) {
          pdf.addPage();
          currentY = margin;
        }
      });

      // Summary
      currentY += 10;
      pdf.setFont('', 'bold');
      pdf.setFontSize(11);
      const avgGrade = this._getGradeLabel((avgScore / 20) * 100);
      pdf.text(`Average Score: ${(avgScore).toFixed(1)}/20 (Grade: ${avgGrade})`, margin, currentY);

      pdf.save(`Grade-Report-${studentName}-${Date.now()}.pdf`);
      return true;
    } catch (error) {
      console.error('Error exporting grade report:', error);
      throw new Error('Failed to export grade report');
    }
  },

  /**
   * Export as CSV (for easier data management)
   */
  exportAsCSV(filename: string, data: any[], headers: string[]) {
    try {
      let csv = headers.join(',') + '\n';
      
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if needed
          const stringValue = String(value || '');
          return `"${stringValue.replace(/"/g, '""')}"`;
        });
        csv += values.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw new Error('Failed to export CSV');
    }
  },

  _getGradeLabel(percentage: number): string {
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 45) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  }
};
