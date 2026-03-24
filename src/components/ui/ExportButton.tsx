import { FileText } from 'lucide-react';
import { useTreatmentStore } from '../../store/useTreatmentStore';
import { usePatientStore } from '../../store/usePatientStore';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';

interface ExportButtonProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

const TREATMENT_PRICES: Record<string, number> = {
  CROWN: 800, FILLING: 150, IMPLANT: 2500, ROOT_CANAL: 900, EXTRACTION: 200,
};

export function ExportButton({ canvasRef }: ExportButtonProps) {
  const { treatments } = useTreatmentStore();
  const { id } = useParams<{ id: string }>();
  const { getPatient } = usePatientStore();
  const patient = getPatient(id || '');

  const handleExport = async () => {
    if (!patient) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();

    // Helper for background
    const addBg = () => {
      pdf.setFillColor(10, 15, 30);
      pdf.rect(0, 0, w, h, 'F');
    };

    // Helper for Header
    const addHeader = (title: string) => {
      pdf.setFillColor(15, 25, 45);
      pdf.rect(0, 0, w, 25, 'F');
      pdf.setTextColor(0, 212, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, w / 2, 16, { align: 'center' });
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Patient: ${patient.name} | ID: ${patient.id} | Date: ${new Date().toLocaleDateString()}`, w / 2, 22, { align: 'center' });
    };

    // ── PAGE 1: Cover ──
    addBg();
    pdf.setTextColor(0, 212, 255);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🦷 DENTAL REPORT', w / 2, 60, { align: 'center' });
    
    pdf.setDrawColor(0, 212, 255);
    pdf.setLineWidth(1);
    pdf.line(40, 70, w - 40, 70);

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('PREPARED FOR', w / 2, 100, { align: 'center' });
    pdf.setFontSize(22);
    pdf.text(patient.name.toUpperCase(), w / 2, 115, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Patient ID: ${patient.id}`, w / 2, 130, { align: 'center' });
    pdf.text(`Generated Date: ${new Date().toLocaleDateString()}`, w / 2, 140, { align: 'center' });

    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(10);
    pdf.text('Bright Smile Dental Clinic', w / 2, 260, { align: 'center' });
    pdf.setTextColor(0, 212, 255);
    pdf.text('www.dentalai-planner.com', w / 2, 268, { align: 'center' });

    // ── PAGE 2: 3D Model Screenshot ──
    if (canvasRef.current) {
      const canvas3d = canvasRef.current.querySelector('canvas');
      if (canvas3d) {
        pdf.addPage();
        addBg();
        addHeader('3D TREATMENT VISUALIZATION');
        
        const imgData = canvas3d.toDataURL('image/png');
        pdf.setDrawColor(30, 45, 75);
        pdf.rect(10, 35, w - 20, (w - 20) * 0.6 + 10, 'S');
        pdf.addImage(imgData, 'PNG', 15, 40, w - 30, (w - 30) * 0.6);
        
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(10);
        pdf.text('Figure 1.0: Virtual representation of planned dental modifications and restorations.', 20, 165);
      }
    }

    // ── PAGE 3: Proposed Treatment Plan ──
    pdf.addPage();
    addBg();
    addHeader('PROPOSED TREATMENT PLAN');

    const treatmentArr = Array.from(treatments.entries());
    let y = 45;
    let totalCost = 0;
    
    // Table Header
    pdf.setFillColor(25, 35, 60);
    pdf.rect(15, 35, w - 30, 8, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 212, 255);
    pdf.text('#', 20, 41);
    pdf.text('TOOTH ID', 35, 41);
    pdf.text('TREATMENT TYPE', 75, 41);
    pdf.text('ESTIMATED COST', 155, 41);

    pdf.setFont('helvetica', 'normal');
    treatmentArr.forEach(([tid, t], idx) => {
      const price = TREATMENT_PRICES[t.mode] || 0;
      totalCost += price;
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${idx + 1}`, 20, y);
      pdf.text(tid.replace('tooth_', 'Tooth #'), 35, y);
      pdf.text(t.mode, 75, y);
      pdf.setTextColor(0, 212, 255);
      pdf.text(`$${price.toLocaleString()}`, 155, y);
      
      pdf.setDrawColor(25, 35, 60);
      pdf.line(15, y + 2, w - 15, y + 2);
      y += 8;
    });

    y += 10;
    pdf.setFillColor(0, 212, 255, 0.1);
    pdf.rect(15, y - 5, w - 30, 12, 'F');
    pdf.setTextColor(0, 212, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`TOTAL ESTIMATED BUDGET`, 20, y + 2);
    pdf.text(`$${totalCost.toLocaleString()}.00`, 155, y + 2);

    // ── PAGE 4: Clinical History & Notes ──
    pdf.addPage();
    addBg();
    addHeader('CLINICAL HISTORY & NOTES');

    pdf.setTextColor(0, 212, 255);
    pdf.setFontSize(12);
    pdf.text('PATIENT NOTES', 20, 40);
    
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const splitNotes = pdf.splitTextToSize(patient.notes || 'No clinical notes recorded for this patient.', w - 40);
    pdf.text(splitNotes, 20, 50);

    // ── PAGE 5: Medical Information ──
    pdf.setTextColor(0, 212, 255);
    pdf.setFontSize(12);
    const midY = 160;
    pdf.text('MEDICAL CONTEXT', 20, midY);
    
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(10);
    const context = [
      `Allergies: ${patient.allergies || 'None reported'}`,
      `Medical History: ${patient.medicalHistory || 'No significant findings'}`,
      `Current Medications: ${patient.medications || 'None'}`,
      `Last Clinical Visit: ${patient.lastVisit}`,
    ];
    context.forEach((line, i) => {
      pdf.text(line, 20, midY + 10 + (i * 7));
    });

    // ── PAGE 6: Aftercare Instructions ──
    pdf.addPage();
    addBg();
    addHeader('POST-TREATMENT INSTRUCTIONS');
    
    pdf.setFontSize(10);
    pdf.setTextColor(200, 200, 200);
    const instructions = [
      '• Follow your dentist\'s post-treatment care instructions carefully.',
      '• Take prescribed medications as directed by your clinical provider.',
      '• Avoid hard, sticky or extremely hot/cold foods for 48 hours.',
      '• Maintain strict oral hygiene: gently brush and floss around new restorations.',
      '• Schedule follow-up appointments as recommended in this plan.',
      '• Contact our emergency line immediately if you experience persistent bleeding or severe pain.',
      '',
      '--- Emergency Contact ---',
      'Clinical Support: +1 (555) 900-3000',
      'Location: 102 Dental Lane, Medical District',
    ];
    instructions.forEach((line, i) => {
      pdf.text(line, 20, 45 + i * 8);
    });

    pdf.save(`DR_${patient.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-navy bg-gradient-to-r from-cyan to-cyan-dark hover:opacity-90 transition-opacity shadow-lg"
    >
      <FileText size={16} /> Export Treatment Plan
    </button>
  );
}
