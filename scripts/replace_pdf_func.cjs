const fs = require('fs');
const file = 'c:/Users/SPODY/OneDrive/Desktop/projects/dental project/src/pages/PatientDetailPage.tsx';
let txt = fs.readFileSync(file, 'utf8');

const startStr = 'const handleExportReport = () => {';
const endStr = '  return (\r\n    <div className=\"min-h-screen';

const startIndex = txt.indexOf(startStr);
let endIndex = txt.indexOf(endStr);
if (endIndex === -1) {
  endIndex = txt.indexOf('  return (\n    <div className=\"min-h-screen');
}
if (endIndex === -1) {
  endIndex = txt.indexOf('  return (');
}

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find start or end block');
  console.log('startIndex:', startIndex, 'endIndex:', endIndex);
  process.exit(1);
}

// Ensure aiPayload is extracted
if (!txt.includes('aiPayload } = useTreatmentStore();')) {
  txt = txt.replace('const { setTreatments, scanDetections, treatments: treatmentMap } = useTreatmentStore();', 
                    'const { setTreatments, scanDetections, treatments: treatmentMap, aiPayload } = useTreatmentStore();');
}

const newFunc = `  const handleExportReport = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const marginL = 20;
    const marginR = 20;
    const contentW = pageW - marginL - marginR;
    let y = 0;
    let currentPage = 1;
    const today = new Date();

    const formatDate = (input) => {
      if (!input) return '-';
      const d = typeof input === 'string' ? new Date(input) : (input instanceof Date ? input : new Date(String(input)));
      if (isNaN(d.getTime())) return '-';
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return \`\${day} \${months[d.getMonth()]} \${d.getFullYear()}\`;
    };

    const formatRupee = (amount) => {
      return \`Rs. \${amount.toLocaleString('en-IN')}\`;
    };

    const checkY = (needed) => {
      if (y + needed > 260) {
        doc.addPage();
        currentPage++;
        y = 20;
      }
    };

    const addSectionHeading = (title) => {
      checkY(20);
      doc.setFillColor(239, 246, 255);
      doc.rect(0, y, pageW, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(title, marginL, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39);
      y += 14; 
    };

    const addFooter = (pageNum, totalPages) => {
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(marginL, 280, marginL + contentW, 280);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text('DentalAI Planner', marginL, 285);
      doc.text(\`Generated on \${formatDate(today)}\`, pageW / 2, 285, { align: 'center' });
      doc.text(\`Page \${pageNum} of \${totalPages}\`, marginL + contentW, 285, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text('This report is generated for clinical reference purposes only.', pageW / 2, 290, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(10);
    };

    // --- HEADER ---
    y = 20;
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('DentalAI Planner', marginL, y);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Patient Clinical Report', marginL, y + 6);

    // Right Column
    doc.setFontSize(10);
    doc.text('Apex Dental Clinic', pageW - marginR, y, { align: 'right' });
    doc.text(formatDate(today), pageW - marginR, y + 5, { align: 'right' });
    doc.text('Dr. Smith', pageW - marginR, y + 10, { align: 'right' });

    y += 16;
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.7);
    doc.line(0, y, pageW, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    y += 10;

    // --- PATIENT INFORMATION ---
    addSectionHeading('Patient Information');
    const colHalfX = marginL + contentW / 2;

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('NAME', marginL, y);
    doc.text('AGE & GENDER', colHalfX, y);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(patient.name || '-', marginL, y + 5);
    doc.text(\`\${patient.age ?? '-'} yrs, \${patient.gender || '-'}\`, colHalfX, y + 5);
    y += 14;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('PATIENT ID', marginL, y);
    doc.text('PHONE', colHalfX, y);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(patient.id || '-', marginL, y + 5);
    doc.text(patient.phone || '-', colHalfX, y + 5);
    y += 14;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('RISK LEVEL', marginL, y);
    doc.text('LATEST VISIT', colHalfX, y);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    const riskLabel = patient.diseaseScore >= 60 ? 'High Risk' : patient.diseaseScore >= 30 ? 'Moderate' : 'Low Risk';
    doc.text(\`\${patient.diseaseScore ?? '0'}% - \${riskLabel}\`, marginL, y + 5);
    doc.text(formatDate(patient.lastVisit), colHalfX, y + 5);
    y += 16;

    // --- AI SCAN RESULTS ---
    addSectionHeading('AI Scan Results');
    if (!scanDetections || scanDetections.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text('No AI scan performed for this patient.', marginL, y);
      y += 12;
    } else {
      const c1 = 15, c2 = 30, c3 = 22, c4 = 22, c5 = contentW - 89;
      const x1 = marginL, x2 = x1 + c1, x3 = x2 + c2, x4 = x3 + c3, x5 = x4 + c4;
      
      doc.setFillColor(243, 244, 246);
      doc.rect(marginL, y, contentW, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('TOOTH', x1 + 2, y + 5.5);
      doc.text('CONDITION', x2 + 2, y + 5.5);
      doc.text('SEVERITY', x3 + 2, y + 5.5);
      doc.text('CONFIDENCE', x4 + 2, y + 5.5);
      doc.text('RECOMMENDED ACTION', x5 + 2, y + 5.5);
      y += 10;

      scanDetections.forEach((det, idx) => {
        const actionText = det.recommendedAction || det.notes || '-';
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const wrappedAction = doc.splitTextToSize(actionText, c5 - 4);
        const rowH = Math.max(9, wrappedAction.length * 4.5 + 3);
        checkY(rowH + 2);

        doc.setFillColor(idx % 2 === 1 ? 249 : 255, idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 251 : 255);
        doc.rect(marginL, y - 2, contentW, rowH, 'F');

        doc.setTextColor(17, 24, 39);
        doc.text(String(det.tooth_number ?? '-'), x1 + 2, y + 3);

        const cond = doc.splitTextToSize(det.class || '-', c2 - 4);
        doc.text(cond, x2 + 2, y + 3);

        const sev = (det.severity || '').toUpperCase();
        doc.setFont('helvetica', 'bold');
        if (sev === 'HIGH') doc.setTextColor(220, 38, 38);
        else if (sev === 'MEDIUM') doc.setTextColor(217, 119, 6);
        else if (sev === 'LOW') doc.setTextColor(22, 163, 74);
        else doc.setTextColor(17, 24, 39);
        doc.text(sev || '-', x3 + 2, y + 3);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        const rawConf = det.confidence ?? 0;
        const pct = (Number(rawConf) * 100).toFixed(1);
        doc.text(\`\${pct}%\`, x4 + 2, y + 3);

        doc.text(wrappedAction, x5 + 2, y + 3);
        y += rowH;
      });
      y += 6;
    }

    // --- TREATMENT PLAN & HISTORY ---
    addSectionHeading('Treatment Plan & History');
    
    // Exact variables requested from PatientProgress tab equivalent
    const findings = aiPayload ? aiPayload.findings : [];
    const historyFindings = findings.filter((f) => f.class !== 'Healthy');
    const manualTreatments = Array.from(treatmentMap.values());
    
    const combinedTreatments = historyFindings.length > 0 ? historyFindings : manualTreatments;

    if (combinedTreatments.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text('No treatments recorded yet.', marginL, y);
      y += 12;
    } else {
      const t1 = 50, t2 = 25, t3 = 35, t4 = 35, t5 = contentW - 145;
      const tx1 = marginL, tx2 = tx1 + t1, tx3 = tx2 + t2, tx4 = tx3 + t3, tx5 = tx4 + t4;

      doc.setFillColor(243, 244, 246);
      doc.rect(marginL, y, contentW, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('TREATMENT / ISSUE', tx1 + 2, y + 5.5);
      doc.text('TOOTH', tx2 + 2, y + 5.5);
      doc.text('DATE', tx3 + 2, y + 5.5);
      doc.text('DOCTOR', tx4 + 2, y + 5.5);
      doc.text('STATUS', tx5 + 2, y + 5.5);
      y += 10;

      combinedTreatments.forEach((t, idx) => {
        const isAi = t.class !== undefined;
        let treatmentName = isAi ? t.class : String(t.mode || '-');
        let toothNo = String(isAi ? t.tooth_number : t.toothNumber ?? '-');
        let dateObj = isAi ? (aiPayload?.timestamp || today) : t.date;
        let cName = doc.splitTextToSize(treatmentName, t1 - 4);

        const rowH = Math.max(9, cName.length * 4.5 + 3);
        checkY(rowH + 2);

        doc.setFillColor(idx % 2 === 1 ? 249 : 255, idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 251 : 255);
        doc.rect(marginL, y - 2, contentW, rowH, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        doc.text(cName, tx1 + 2, y + 3);
        doc.text(toothNo, tx2 + 2, y + 3);
        doc.text(formatDate(dateObj), tx3 + 2, y + 3);
        doc.text('By AI/Clinic', tx4 + 2, y + 3);

        let statusText = isAi ? (t.severity?.toUpperCase() || '-') : (t.status || 'PLANNED').toUpperCase();
        doc.setFont('helvetica', 'bold');
        if (statusText === 'HIGH') doc.setTextColor(220, 38, 38);
        else if (statusText === 'MEDIUM' || statusText.includes('PROGRESS')) doc.setTextColor(217, 119, 6);
        else if (statusText === 'LOW' || statusText === 'COMPLETED') doc.setTextColor(22, 163, 74);
        else doc.setTextColor(37, 99, 235);
        
        doc.text(statusText, tx5 + 2, y + 3);
        y += rowH;
      });
      y += 6;
    }

    // --- ACTIVE PRESCRIPTIONS ---
    addSectionHeading('Active Prescriptions');
    if (!prescriptions || prescriptions.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text('No active prescriptions.', marginL, y);
      y += 12;
    } else {
      const p1 = 45, p2 = 25, p3 = 35, p4 = 35, p5 = contentW - 140;
      const px1 = marginL, px2 = px1 + p1, px3 = px2 + p2, px4 = px3 + p3, px5 = px4 + p4;

      doc.setFillColor(243, 244, 246);
      doc.rect(marginL, y, contentW, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text('MEDICINE', px1 + 2, y + 5.5);
      doc.text('DOSE', px2 + 2, y + 5.5);
      doc.text('FREQUENCY', px3 + 2, y + 5.5);
      doc.text('DOCTOR', px4 + 2, y + 5.5);
      doc.text('DURATION', px5 + 2, y + 5.5);
      y += 10;

      prescriptions.forEach((p, idx) => {
        let medStr = doc.splitTextToSize(String(p.medicineName || p.medicine_name || p.name || '-'), p1 - 4);
        let freqStr = doc.splitTextToSize(String(p.frequency || '-'), p3 - 4);
        const rowH = Math.max(9, Math.max(medStr.length, freqStr.length) * 4.5 + 3);
        checkY(rowH + 2);

        doc.setFillColor(idx % 2 === 1 ? 249 : 255, idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 251 : 255);
        doc.rect(marginL, y - 2, contentW, rowH, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(17, 24, 39);
        
        doc.text(medStr, px1 + 2, y + 3);
        doc.text(String(p.dosage || '-'), px2 + 2, y + 3);
        doc.text(freqStr, px3 + 2, y + 3);
        doc.text(String(p.doctor || 'Dr. Smith'), px4 + 2, y + 3);
        doc.text(String(p.duration || p.schedule || '-'), px5 + 2, y + 3);
        
        y += rowH;
      });
      y += 6;
    }

    // --- BILLING SUMMARY ---
    addSectionHeading('Billing Summary');
    let totalOutstanding = 0;
    manualTreatments.forEach((t) => {
      if (t.status === 'planned' || t.status === 'PLANNED') {
        totalOutstanding += (t.cost || 0);
      }
    });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Outstanding Balance:', marginL, y);
    if (totalOutstanding > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(formatRupee(totalOutstanding), marginL + contentW, y, { align: 'right' });
    } else {
      doc.setTextColor(22, 163, 74);
      doc.text('No Outstanding Balance', marginL + contentW, y, { align: 'right' });
    }
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Recent Payments', marginL, y);
    y += 8;

    const b1 = 70, b2 = 35, b3 = 40, b4 = contentW - 145;
    const bx1 = marginL, bx2 = bx1 + b1, bx3 = bx2 + b2, bx4 = bx3 + b3;
    
    doc.setFillColor(243, 244, 246);
    doc.rect(marginL, y, contentW, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text('TREATMENT', bx1 + 2, y + 5.5);
    doc.text('AMOUNT', bx2 + 2, y + 5.5);
    doc.text('METHOD', bx3 + 2, y + 5.5);
    doc.text('DATE', bx4 + 2, y + 5.5);
    y += 10;

    const completedT = manualTreatments.filter((t) => t.status?.toLowerCase() === 'completed');
    const payRows = completedT.length > 0
      ? completedT.map((t) => ({ name: String(t.mode || '-'), amount: t.cost ?? 0, method: 'UPI', date: t.date }))
      : [{ name: 'Initial Consultation', amount: 0, method: '-', date: '' }];

    let totalPaid = 0;
    payRows.forEach((pay, idx) => {
      let tName = doc.splitTextToSize(pay.name, b1 - 4);
      const rowH = Math.max(9, tName.length * 4.5 + 3);
      checkY(rowH + 2);

      doc.setFillColor(idx % 2 === 1 ? 249 : 255, idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 251 : 255);
      doc.rect(marginL, y - 2, contentW, rowH, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(17, 24, 39);
      
      doc.text(tName, bx1 + 2, y + 3);
      doc.text(formatRupee(pay.amount), bx2 + 2, y + 3);
      doc.text(String(pay.method || '-'), bx3 + 2, y + 3);
      doc.text(pay.date ? formatDate(pay.date) : '-', bx4 + 2, y + 3);
      
      totalPaid += pay.amount;
      y += rowH;
    });

    y += 4;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, marginL + contentW, y);
    y += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('Total Paid:', marginL, y);
    doc.text(formatRupee(totalPaid), marginL + contentW, y, { align: 'right' });

    // Build Footers
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      addFooter(p, totalPages);
    }

    const dateTag = today.toISOString().split('T')[0];
    doc.save(\`PatientReport-\${patient.id}-\${dateTag}.pdf\`);
  };

`;

txt = txt.substring(0, startIndex) + newFunc + '\n' + txt.substring(endIndex);
fs.writeFileSync(file, txt);
console.log('Successfully replaced export function');
