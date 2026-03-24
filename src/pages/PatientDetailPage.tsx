import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatientStore } from '../store/usePatientStore';
import type { Patient } from '../store/usePatientStore';
import { Navbar } from '../components/layout/Navbar';
import { DentalApp } from '../components/DentalApp';
import { useTreatmentStore } from '../store/useTreatmentStore';
import { useTabStore } from '../store/useTabStore';
import { ArrowLeft, Edit3, Calendar, DownloadCloud, Phone, Hash, User, X, CheckCircle2, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getPatient = usePatientStore(state => state.getPatient);
  const patient = getPatient(id || '');
  const updatePatient = usePatientStore(state => state.updatePatient);
  const isLoading = usePatientStore(state => state.isLoading);
  const { setTreatments, setPatientInfo, scanDetections, treatments: treatmentMap, aiPayload } = useTreatmentStore();
  const { setActiveTab, setOpenScheduleBooking } = useTabStore();
  
  // Edit Case Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Patient>>({});

  // Prescription data for report
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    if (patient) {
      if (patient.treatments) {
        setTreatments(patient.treatments);
      }
      setPatientInfo({
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        lastVisit: patient.lastVisit,
        diseaseScore: patient.diseaseScore
      });
      
      // Fetch prescriptions for the export report
      fetch(`/api/prescriptions/${patient.id}`)
        .then(res => res.json())
        .then(data => setPrescriptions(data))
        .catch(err => console.error('Error fetching prescriptions for report:', err));
    }
  }, [patient, setTreatments, setPatientInfo]); 

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium tracking-wide animate-pulse">Syncing patient records...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text mb-2">Patient Not Found</h2>
            <p className="text-text-secondary mb-6">The patient you are looking for does not exist or has been deleted.</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors">
                Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getRiskStyle = (score: number) => {
    if (score >= 60) return { bg: 'bg-danger-light', text: 'text-danger', border: 'border-danger', label: 'High Risk' };
    if (score >= 30) return { bg: 'bg-warning-light', text: 'text-warning', border: 'border-warning', label: 'Moderate' };
    return { bg: 'bg-success-light', text: 'text-success', border: 'border-success', label: 'Low Risk' };
  };

  const risk = getRiskStyle(patient.diseaseScore);

  const handleEditCase = () => {
    setEditForm({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone === 'No phone' ? '' : patient.phone,
      lastVisit: patient.lastVisit,
      diseaseScore: patient.diseaseScore
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await updatePatient(patient.id, editForm);
      setIsSaving(false);
      setShowEditModal(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleSchedule = () => {
    setActiveTab('schedule');
    setOpenScheduleBooking(true);
  };

  const handleExportReport = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const marginL = 20;
    const marginR = 20;
    const contentW = pageW - marginL - marginR;
    let y = 0;
    let currentPage = 1;
    const today = new Date();

    const formatDate = (input: any) => {
      if (!input) return '-';
      const d = typeof input === 'string' ? new Date(input) : (input instanceof Date ? input : new Date(String(input)));
      if (isNaN(d.getTime())) return '-';
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    const formatRupee = (amount: number | string) => {
      const val = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
      return `Rs. ${val.toLocaleString('en-IN')}`;
    };

    const checkY = (needed: number) => {
      if (y + needed > 260) {
        doc.addPage();
        currentPage++;
        y = 20;
      }
    };

    const addSectionHeading = (title: string) => {
      checkY(20);
      doc.setFillColor(239, 246, 255);
      doc.rect(0, y, pageW, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(title, marginL, y + 5.5);
      y += 12;
    };

    const addFooter = (pNum: number, total: number) => {
      doc.setPage(pNum);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.line(marginL, 282, pageW - marginR, 282);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dentora - Internal Report`, marginL, 287);
      doc.text(`Page ${pNum} of ${total}`, pageW / 2, 287, { align: 'center' });
      doc.text(`Generated: ${formatDate(today)}`, pageW - marginR, 287, { align: 'right' });
      
      doc.setFontSize(7);
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
    doc.text('Dentora', marginL, y);
    doc.setFontSize(14);
    doc.setTextColor(47, 129, 247);
    doc.text('Clinical Intelligence Report', marginL, y + 6);

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
    doc.text(`${patient.age ?? '-'} yrs, ${patient.gender || '-'}`, colHalfX, y + 5);
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
    doc.text(`${patient.diseaseScore ?? '0'}% - ${riskLabel}`, marginL, y + 5);
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
        const actionText = String(det.recommendedAction || det.notes || '-');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const wrappedAction = doc.splitTextToSize(actionText, c5 - 4);
        const rowH = Math.max(9, wrappedAction.length * 4.5 + 3);
        checkY(rowH + 2);

        doc.setFillColor(idx % 2 === 1 ? 249 : 255, idx % 2 === 1 ? 250 : 255, idx % 2 === 1 ? 251 : 255);
        doc.rect(marginL, y - 2, contentW, rowH, 'F');

        doc.setTextColor(17, 24, 39);
        doc.text(String(det.tooth_number ?? '-'), x1 + 2, y + 3);

        const cond = doc.splitTextToSize(String(det.class || '-'), c2 - 4);
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
        const pct = (Number(rawConf)).toFixed(1);
        doc.text(`${pct}%`, x4 + 2, y + 3);

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
    
    // Combine both AI scan findings and manual treatment plan items
    const combinedTreatments = [...historyFindings, ...manualTreatments];

    if (combinedTreatments.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      doc.text('No treatments recorded yet.', marginL, y);
      y += 12;
    } else {
      const t1 = 50, t2 = 25, t3 = 35, t4 = 35;
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

      combinedTreatments.forEach((t: any, idx) => {
        const isAi = t.class !== undefined;
        let treatmentName = String(isAi ? t.class : (t.mode || '-'));
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
      const p1 = 45, p2 = 25, p3 = 35, p4 = 35;
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
    manualTreatments.forEach((t: any) => {
      if (t.status === 'planned') {
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

    const b1 = 70, b2 = 35, b3 = 40;
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

    const completedT = manualTreatments.filter((t: any) => t.status?.toLowerCase() === 'completed');
    const payRows = completedT.length > 0
      ? completedT.map((t: any) => ({ name: String(t.mode || '-'), amount: t.cost ?? 0, method: 'UPI', date: t.date }))
      : [{ name: 'Initial Consultation', amount: 0, method: '-', date: '' }];

    let totalPaid = 0;
    payRows.forEach((pay: any, idx: number) => {
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

    const safeName = String(patient?.name || 'Patient').replace(/\s+/g, '_');
    doc.save(`Dentora_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />

      <style>{`
        @keyframes headerSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heartbeatPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .header-detail-item { transition: color 0.2s ease; }
        .header-detail-item:hover span { color: #ffffff !important; }
        .header-detail-item:hover svg { color: #58a6ff !important; }
        .stat-card-premium { transition: all 0.2s ease; }
        .stat-card-premium:hover { border-color: #2F81F7 !important; box-shadow: 0 0 16px rgba(47,129,247,0.15); }
        .btn-outlined { transition: all 0.2s ease; }
        .btn-outlined:hover { background-color: #21262D !important; border-color: #8B949E !important; }
        .btn-hero { transition: all 0.2s ease; }
        .btn-hero:hover .shimmer-bar { animation: shimmerSweep 0.7s ease; }
      `}</style>

      <div className="shrink-0">
        <div className="px-6 md:px-8 py-4 max-w-7xl mx-auto w-full">
          <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D1117 0%, #161B22 100%)', borderRadius: '20px', padding: '28px 36px', borderTop: '1px solid rgba(47,129,247,0.4)', borderBottom: '1px solid #21262D', borderLeft: '1px solid #21262D', borderRight: '1px solid #21262D', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'headerSlideIn 0.4s ease-out' }}>
            <div className="absolute pointer-events-none" style={{ top: '-40px', left: '-40px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(47,129,247,0.06) 0%, transparent 70%)' }} />
            <button onClick={() => navigate('/dashboard')} className="relative z-10 flex items-center gap-1.5 px-[14px] py-[6px] rounded-[20px] text-[12px] text-[#8B949E] mb-5 transition-all hover:text-white" style={{ backgroundColor: '#21262D', border: '1px solid #30363D' }}>
              <ArrowLeft size={13} /> Back to Patients
            </button>
            <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-center justify-between">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-5 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[24px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #2F81F7, #7C3AED)', boxShadow: '0 0 0 3px #0D1117, 0 0 0 5px #2F81F7, 0 0 20px rgba(47,129,247,0.4)' }}>
                    {patient.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="absolute bottom-0.5 right-0.5 w-[14px] h-[14px] rounded-full border-[2.5px]" style={{ backgroundColor: '#3FB950', borderColor: '#0D1117', animation: 'heartbeatPulse 2s infinite' }} />
                </div>
                <div className="min-w-0 text-center md:text-left">
                  <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                    <h1 style={{ fontFamily: 'Playfair Display', letterSpacing: '-0.5px' }} className="text-[28px] font-bold text-white leading-tight">{patient.name}</h1>
                    <div className="flex items-center gap-2 px-[14px] py-[5px] rounded-[20px] text-[12px] font-semibold" style={{ backgroundColor: patient.diseaseScore >= 60 ? 'rgba(248,81,73,0.12)' : patient.diseaseScore >= 30 ? 'rgba(210,153,34,0.12)' : 'rgba(63,185,80,0.12)', backdropFilter: 'blur(8px)', border: `1px solid ${patient.diseaseScore >= 60 ? 'rgba(248,81,73,0.3)' : patient.diseaseScore >= 30 ? 'rgba(210,153,34,0.3)' : 'rgba(63,185,80,0.3)'}`, color: patient.diseaseScore >= 60 ? '#F85149' : patient.diseaseScore >= 30 ? '#D29922' : '#3FB950' }}>
                      <div className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: patient.diseaseScore >= 60 ? '#F85149' : patient.diseaseScore >= 30 ? '#D29922' : '#3FB950', animation: 'heartbeatPulse 2s infinite' }} />
                      {patient.diseaseScore}% — {risk.label}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 justify-center md:justify-start">
                    <span className="header-detail-item flex items-center gap-1.5 text-[13px] cursor-default">
                      <Hash size={13} style={{ color: '#2F81F7' }} />
                      <span className="font-mono text-[#8B949E]">{patient.id}</span>
                    </span>
                    <span style={{ color: '#30363D', fontSize: '13px' }}>│</span>
                    <span className="header-detail-item flex items-center gap-1.5 text-[13px] cursor-default">
                      <User size={13} style={{ color: '#2F81F7' }} />
                      <span className="text-[#8B949E]">{patient.age} yrs · {patient.gender}</span>
                    </span>
                    <span style={{ color: '#30363D', fontSize: '13px' }}>│</span>
                    <span className="header-detail-item flex items-center gap-1.5 text-[13px] cursor-default">
                      <Phone size={13} style={{ color: patient.phone && patient.phone !== 'No phone' ? '#2F81F7' : '#F85149' }} />
                      <span className={patient.phone && patient.phone !== 'No phone' ? 'text-[#8B949E]' : 'text-[#F85149]'}>{patient.phone || 'No phone'}</span>
                    </span>
                    <span style={{ color: '#30363D', fontSize: '13px' }}>│</span>
                    <span className="header-detail-item flex items-center gap-1.5 text-[13px] cursor-default">
                      <Calendar size={13} style={{ color: '#2F81F7' }} />
                      <span className="text-[#8B949E]">Visit: {patient.lastVisit}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 overflow-x-auto">
                <div className="stat-card-premium relative overflow-hidden min-w-[100px]" style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid #30363D', borderRadius: '12px', padding: '14px 20px', backdropFilter: 'blur(4px)', textAlign: 'center' }}>
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: patient.diseaseScore >= 60 ? '#F85149' : patient.diseaseScore >= 30 ? '#D29922' : '#3FB950', borderRadius: '12px 12px 0 0' }} />
                  <p className="text-[22px] font-bold font-mono" style={{ color: patient.diseaseScore >= 60 ? '#F85149' : patient.diseaseScore >= 30 ? '#D29922' : '#3FB950' }}>{patient.diseaseScore}%</p>
                  <p className="text-[10px] font-bold uppercase mt-1" style={{ color: '#8B949E', letterSpacing: '1px' }}>AI Risk</p>
                </div>
                <div className="stat-card-premium relative overflow-hidden min-w-[100px]" style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid #30363D', borderRadius: '12px', padding: '14px 20px', backdropFilter: 'blur(4px)', textAlign: 'center' }}>
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: '#2F81F7', borderRadius: '12px 12px 0 0' }} />
                  <p className="text-[22px] font-bold font-mono" style={{ color: '#2F81F7' }}>{patient.appointments?.length || 3}</p>
                  <p className="text-[10px] font-bold uppercase mt-1" style={{ color: '#8B949E', letterSpacing: '1px' }}>Visits</p>
                </div>
                <div className="stat-card-premium relative overflow-hidden min-w-[100px]" style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid #30363D', borderRadius: '12px', padding: '14px 20px', backdropFilter: 'blur(4px)', textAlign: 'center' }}>
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: '#DB61FF', borderRadius: '12px 12px 0 0' }} />
                  <p className="text-[14px] font-bold font-mono" style={{ color: '#8B949E' }}>{patient.lastVisit || 'Never'}</p>
                  <p className="text-[10px] font-bold uppercase mt-1" style={{ color: '#8B949E', letterSpacing: '1px' }}>Last Scan</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0 w-full lg:w-auto">
                <button onClick={handleEditCase} className="btn-outlined flex items-center justify-center gap-2 px-[22px] py-[10px] rounded-[10px] text-[13px] font-semibold text-white" style={{ backgroundColor: 'transparent', border: '1px solid #30363D' }}>
                  <Edit3 size={15} /> Edit Case
                </button>
                <button onClick={handleSchedule} className="btn-outlined flex items-center justify-center gap-2 px-[22px] py-[10px] rounded-[10px] text-[13px] font-semibold text-white" style={{ backgroundColor: 'transparent', border: '1px solid #30363D' }}>
                  <Calendar size={15} /> Schedule
                </button>
                <button onClick={handleExportReport} className="btn-hero group relative flex items-center justify-center gap-2 px-[22px] py-[10px] rounded-[10px] text-[13px] font-bold text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #2F81F7, #1D6FE8)', boxShadow: '0 4px 16px rgba(47,129,247,0.4)' }}>
                  <div className="shimmer-bar absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', transform: 'translateX(-100%)' }} />
                  <DownloadCloud size={15} className="relative z-10" /> <span className="relative z-10">Export Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-lg bg-[#161B22] border border-[#30363D] rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
            <h2 style={{ fontFamily: 'Playfair Display' }} className="text-2xl font-bold text-white mb-6">Edit Patient Case</h2>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Patient Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-white outline-none focus:border-[#2F81F7] transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Age</label>
                  <input type="number" value={editForm.age} onChange={e => setEditForm({...editForm, age: parseInt(e.target.value)})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-white outline-none focus:border-[#2F81F7] transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Gender</label>
                  <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value as any})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-white outline-none focus:border-[#2F81F7] transition-all">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Phone Number</label>
                <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="e.g. +91 98765 43210" className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-white outline-none focus:border-[#2F81F7] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Visit Date</label>
                <input type="date" value={editForm.lastVisit} onChange={e => setEditForm({...editForm, lastVisit: e.target.value})} className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl p-3 text-white outline-none focus:border-[#2F81F7] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Risk Level (AI Score %)</label>
                <input type="range" min="0" max="100" value={editForm.diseaseScore} onChange={e => setEditForm({...editForm, diseaseScore: parseInt(e.target.value)})} className="w-full h-2 bg-[#0D1117] rounded-lg appearance-none cursor-pointer accent-[#2F81F7]" />
                <div className="flex justify-between text-[10px] font-bold text-[#8B949E]">
                  <span>LOW (0%)</span> <span className="text-[#2F81F7]">{editForm.diseaseScore}%</span> <span>HIGH (100%)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-6 py-3 border border-[#30363D] text-[#8B949E] rounded-xl font-bold hover:bg-[#21262D] hover:text-white transition-all">Cancel</button>
              <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 px-6 py-3 bg-[#2F81F7] text-white rounded-xl font-bold hover:bg-[#1D6FE8] transition-all flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[1000] bg-[#161B22] border border-[#3FB950] rounded-xl p-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-[#3FB950]/10 flex items-center justify-center text-[#3FB950]"><CheckCircle2 size={20} /></div>
          <div><p className="text-white font-bold text-sm">Patient Updated</p><p className="text-[#8B949E] text-xs">Case details have been synced to MongoDB.</p></div>
          <button onClick={() => setShowToast(false)} className="ml-2 text-[#8B949E] hover:text-white"><X size={16} /></button>
        </div>
      )}

      <div className="flex-1 relative pb-10">
        <DentalApp />
      </div>
    </div>
  );
}
