import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { ActivityReport, User, Warning } from '../types';

export function exportReportsToExcel(reports: ActivityReport[], filename = 'Caspian_Team_Activity_Report.xlsx') {
  const exportData = reports.map((r) => ({
    'Report ID': r.id,
    Date: r.date,
    Year: r.year,
    Month: r.month,
    Username: r.username,
    'Full Name': `${r.firstName} ${r.lastName}`,
    Role: r.role,
    'Login Time': r.loginTime,
    'Logout Time': r.logoutTime,
    'Total Hours': r.totalHours,
    Status: r.status,
    'Reviewed By': r.reviewerName || 'N/A',
    'Reviewer Comment': r.reviewerComment || 'N/A',
    Description: r.description,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Log');
  XLSX.writeFile(workbook, filename);
}

export function exportUserSummaryToPDF(user: User, reports: ActivityReport[], warnings: Warning[]) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(56, 189, 248); // sky-400
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CASPIAN TEAM ACTIVITY REPORT', 14, 22);

  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Confidential`, 14, 30);

  // User Profile Summary
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(14, 48, 182, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Member Profile: ${user.firstName} ${user.lastName} (@${user.username})`, 20, 58);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Role: ${user.role}  |  Level: ${user.permissionLevel}  |  TS Name: ${user.teamspeakName}`, 20, 68);
  doc.text(`Status: ${user.status}  |  Joined: ${user.registrationDate}`, 20, 76);

  // Statistics
  const totalHours = reports.reduce((acc, r) => acc + r.totalHours, 0);
  const approved = reports.filter((r) => r.status === 'Approved').length;

  doc.setFontSize(14);
  doc.setTextColor(56, 189, 248);
  doc.text('Activity Overview', 14, 98);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Shift Submissions: ${reports.length}`, 14, 108);
  doc.text(`Approved Shifts: ${approved}`, 14, 115);
  doc.text(`Total Online Duty Hours: ${totalHours.toFixed(1)} hrs`, 14, 122);
  doc.text(`Registered Warnings: ${warnings.length}`, 14, 129);

  // Activity List
  doc.setFontSize(14);
  doc.setTextColor(56, 189, 248);
  doc.text('Recent Daily Shift Reports', 14, 145);

  let y = 155;
  reports.slice(0, 8).forEach((r, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 16, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. [${r.date}] - ${r.totalHours} hrs (${r.loginTime} - ${r.logoutTime})`, 18, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(r.status === 'Approved' ? 16 : 180, r.status === 'Approved' ? 120 : 50, 50);
    doc.text(`Status: ${r.status}`, 150, y);

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(71, 85, 105);
    const shortDesc = r.description.length > 70 ? r.description.substring(0, 67) + '...' : r.description;
    doc.text(`Details: ${shortDesc}`, 18, y + 6);

    y += 20;
  });

  doc.save(`Caspian_Report_${user.username}.pdf`);
}
