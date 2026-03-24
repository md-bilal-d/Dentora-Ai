import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, AlertTriangle, Plus, X, Search, Pill, Activity, Calendar, FileText, ChevronRight, Stethoscope, Clock as ClockIcon, Loader2, Sparkles, Ban, Trash2, Repeat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTreatmentStore } from '../store/useTreatmentStore';

type RxStatus = 'Active' | 'Completed' | 'Refill Due' | 'Overdue';

interface Prescription {
    _id?: string;
    prescriptionId: string;
    patientId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    schedule: string[];
    startDate: string;
    endDate: string;
    doctorName: string;
    instructions: string;
    status: RxStatus;
}

const API_BASE = '/api';

const MEDICINE_DB = [
    'Amoxicillin', 'Metronidazole', 'Ibuprofen', 'Paracetamol', 'Clindamycin',
    'Diclofenac', 'Chlorhexidine Mouthwash', 'Tramadol', 'Omeprazole', 'Cetirizine'
];

const INTERACTION_LIST = [
    { drug1: 'Metronidazole', drug2: 'Ibuprofen', risk: 'Increased bleeding risk' },
    { drug1: 'Amoxicillin', drug2: 'Metronidazole', risk: 'Nausea and GI disturbance' },
    { drug1: 'Ibuprofen', drug2: 'Clindamycin', risk: 'Stomach irritation' },
    { drug1: 'Diclofenac', drug2: 'Ibuprofen', risk: 'Dangerous NSAID overdose risk' },
];

interface AISuggestion {
    medicine: string;
    dosage: string;
    frequency: string;
    duration: number;
    reason: string;
}

const getAISuggestions = (detections: any[]): AISuggestion[] => {
    const suggestions: AISuggestion[] = [];
    const seen = new Set<string>();
    detections.forEach(d => {
        const cls = (d.class || '').toLowerCase();
        if (cls.includes('healthy')) return;
        if ((cls.includes('caries') || cls.includes('cavity')) && !seen.has('caries')) {
            seen.add('caries');
            suggestions.push({ medicine: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: 5, reason: `Caries detected at T-${d.tooth_number}` });
            suggestions.push({ medicine: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily', duration: 3, reason: `Pain management for cavity at T-${d.tooth_number}` });
        }
        if ((cls.includes('infection') || cls.includes('abscess')) && !seen.has('infection')) {
            seen.add('infection');
            suggestions.push({ medicine: 'Metronidazole', dosage: '400mg', frequency: 'Three times daily', duration: 7, reason: `Infection/abscess detected at T-${d.tooth_number}` });
            suggestions.push({ medicine: 'Clindamycin', dosage: '150mg', frequency: 'Four times daily', duration: 5, reason: `Severe infection at T-${d.tooth_number}` });
        }
        if ((cls.includes('root') || cls.includes('canal')) && !seen.has('rootcanal')) {
            seen.add('rootcanal');
            suggestions.push({ medicine: 'Amoxicillin', dosage: '500mg', frequency: 'Three times daily', duration: 7, reason: `Root canal treatment needed at T-${d.tooth_number}` });
            suggestions.push({ medicine: 'Diclofenac', dosage: '50mg', frequency: 'Twice daily', duration: 5, reason: `Post-root canal pain management` });
        }
        if ((cls.includes('gum') || cls.includes('periodontal')) && !seen.has('gum')) {
            seen.add('gum');
            suggestions.push({ medicine: 'Chlorhexidine Mouthwash', dosage: '10ml', frequency: 'Twice daily', duration: 14, reason: `Gum disease treatment` });
        }
    });
    return suggestions;
};

const computeStatus = (startDate: string, endDate: string): RxStatus => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (today > end) return 'Completed';

    const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3 && daysLeft >= 0) return 'Refill Due';

    if (today >= start && today <= end) return 'Active';

    return 'Active';
};

const STATUS_STYLES: Record<RxStatus, string> = {
    'Active': 'bg-success/15 text-success border-success/30',
    'Completed': 'bg-border text-text-muted border-border',
    'Refill Due': 'bg-warning/15 text-warning border-warning/30',
    'Overdue': 'bg-danger/15 text-danger border-danger/30',
};

const getStatusIcon = (s: RxStatus) => {
    if (s === 'Active') return <CheckCircle2 size={12} />;
    if (s === 'Refill Due') return <Activity size={12} />;
    if (s === 'Overdue') return <AlertTriangle size={12} />;
    return <CheckCircle2 size={12} />;
};

// ─── Form default state ───
const defaultForm = () => ({
    medicineName: '',
    dosage: '',
    frequency: 'Once daily',
    schedule: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    duration: 5,
    doctorName: '',
    instructions: '',
});

export const PrescriptionManager = () => {
    const { scanDetections, patientInfo } = useTreatmentStore();
    const patientId = patientInfo?.id || 'PT-2026-001';

    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [allergies, setAllergies] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showInteraction, setShowInteraction] = useState(false);
    const [filter, setFilter] = useState<'all' | 'Active' | 'Completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [autoResults, setAutoResults] = useState<string[]>([]);
    const [form, setForm] = useState(defaultForm());
    const [formAllergyWarn, setFormAllergyWarn] = useState('');
    const [addingAllergy, setAddingAllergy] = useState(false);
    const [newAllergy, setNewAllergy] = useState('');
    const [toast, setToast] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'warning'>('success');

    const showToast = (msg: string, type: 'success' | 'warning' = 'success') => { 
        setToast(msg); 
        setToastType(type);
        setTimeout(() => setToast(null), 3000); 
    };

    // ─── Fetch prescriptions + allergies on mount ───
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [rxRes, allergyRes] = await Promise.all([
                fetch(`${API_BASE}/prescriptions/${patientId}`),
                fetch(`${API_BASE}/patients/${patientId}/allergies`),
            ]);
            if (rxRes.ok) {
                const rxData = await rxRes.json();
                const withStatus = rxData.map((rx: any) => ({
                    ...rx,
                    status: computeStatus(rx.startDate, rx.endDate),
                }));
                setPrescriptions(withStatus);
            }
            if (allergyRes.ok) {
                const allergyData = await allergyRes.json();
                setAllergies(allergyData.allergies || []);
            }
        } catch (err) {
            console.error('Failed to fetch Rx data:', err);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ─── Medicine autocomplete ───
    const handleMedSearch = (val: string) => {
        setForm(f => ({ ...f, medicineName: val }));
        setAutoResults(val ? MEDICINE_DB.filter(m => m.toLowerCase().includes(val.toLowerCase())).slice(0, 5) : []);
        // Allergy check
        const match = allergies.find(a => val.toLowerCase().includes(a.toLowerCase()));
        setFormAllergyWarn(match ? `⚠️ WARNING: ${val} may conflict with known allergy "${match}"!` : '');
    };

    // ─── Compute end date from start + duration ───
    const computedEndDate = () => {
        const d = new Date(form.startDate);
        d.setDate(d.getDate() + form.duration);
        return d.toISOString().split('T')[0];
    };

    // ─── Save prescription ───
    const handleSavePrescription = async () => {
        if (!form.medicineName || !form.dosage || !form.doctorName) {
            showToast('Please fill in Medicine Name, Dosage, and Doctor Name.', 'warning');
            return;
        }
        
        const newId = `rx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const payload: Prescription = {
            prescriptionId: newId,
            patientId,
            medicineName: form.medicineName,
            dosage: form.dosage,
            frequency: form.frequency,
            schedule: form.schedule,
            startDate: form.startDate,
            endDate: computedEndDate(),
            doctorName: form.doctorName,
            instructions: form.instructions,
            status: 'Active' // Will be recomputed
        };

        // STEP 6: Immediate local state update
        const localPrescription = { ...payload, status: computeStatus(payload.startDate, payload.endDate) };
        setPrescriptions(prev => [localPrescription, ...prev]);
        setShowForm(false);
        const tempMedName = form.medicineName;
        setForm(defaultForm());

        try {
            const res = await fetch(`${API_BASE}/prescriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                showToast(`${tempMedName} prescribed successfully!`);
            } else {
                showToast('Failed to save prescription to server.', 'warning');
            }
        } catch (e) {
            // STEP 11: Amber warning toast instead of error
            showToast('Could not connect to server. Your data is saved locally for now.', 'warning');
        }
    };

    // ─── Delete prescription ───
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/prescriptions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPrescriptions(prev => prev.filter(p => p.prescriptionId !== id));
                showToast('Prescription deleted.');
            }
        } catch (e) {
            showToast('Failed to delete.');
        }
    };

    // ─── Add allergy ───
    const handleAddAllergy = async () => {
        if (!newAllergy.trim()) return;
        const updated = [...allergies, newAllergy.trim()];
        try {
            await fetch(`${API_BASE}/patients/${patientId}/allergies`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allergies: updated }),
            });
            setAllergies(updated);
            setNewAllergy('');
            setAddingAllergy(false);
            showToast(`Allergy "${newAllergy.trim()}" added.`);
        } catch (e) {
            showToast('Failed to save allergy.');
        }
    };

    // ─── AI suggestions ───
    const aiSuggestions = getAISuggestions(scanDetections);

    const prefillFromSuggestion = (s: AISuggestion) => {
        setForm({
            medicineName: s.medicine,
            dosage: s.dosage,
            frequency: s.frequency,
            schedule: ['morning', 'evening'],
            startDate: new Date().toISOString().split('T')[0],
            duration: s.duration,
            doctorName: '',
            instructions: s.reason,
        });
        setShowForm(true);
    };

    // ─── Interaction check ───
    const checkInteractions = () => {
        const activeMeds = prescriptions.filter(p => p.status === 'Active').map(p => p.medicineName.split(' ')[0]);
        const found: typeof INTERACTION_LIST = [];
        INTERACTION_LIST.forEach(pair => {
            if (activeMeds.some(m => m.includes(pair.drug1)) && activeMeds.some(m => m.includes(pair.drug2))) {
                found.push(pair);
            }
        });
        return found;
    };

    // ─── Filters ───
    const filteredRx = prescriptions
        .filter(r => {
            if (filter === 'Active') return r.status === 'Active' || r.status === 'Refill Due' || r.status === 'Overdue';
            if (filter === 'Completed') return r.status === 'Completed';
            return true;
        })
        .filter(r => r.medicineName.toLowerCase().includes(searchQuery.toLowerCase()));

    // ─── Today's schedule ───
    const todayMeds = prescriptions.filter(p => {
        const s = computeStatus(p.startDate, p.endDate);
        return s === 'Active' || s === 'Refill Due';
    });
    const timingSlots = ['morning', 'afternoon', 'evening', 'night'] as const;

    const interactions = showInteraction ? checkInteractions() : [];

    return (
        <div className="w-full h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar" style={{ fontFamily: 'var(--font-sans)' }}>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                        className="fixed bottom-[24px] right-[24px] z-[9999] flex items-center justify-between"
                        style={{ 
                            backgroundColor: '#1C2128', 
                            borderLeft: `4px solid ${toastType === 'success' ? '#3FB950' : '#D29922'}`, 
                            borderRadius: '10px', 
                            padding: '14px 20px', 
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)', 
                            minWidth: '320px', 
                            maxWidth: '400px' 
                        }}
                    >
                        <div className="flex items-center gap-3 flex-1 mr-4">
                            {toastType === 'success' ? (
                                <CheckCircle2 size={18} className="text-[#3FB950] shrink-0" />
                            ) : (
                                <AlertTriangle size={18} className="text-[#D29922] shrink-0" />
                            )}
                            <span className="text-white text-[14px] font-medium">{toast}</span>
                        </div>
                        <button onClick={() => setToast(null)} className="shrink-0 text-[#8B949E] hover:text-white transition-colors"><X size={16} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Spinner */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="text-primary animate-spin" />
                </div>
            )}

            {!loading && (
                <>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
                        <div>
                            <h1 className="text-2xl text-text" style={{ fontFamily: 'var(--font-serif)' }}>Rx & Medications</h1>
                            <p className="text-sm text-text-secondary mt-1">Manage prescriptions, schedule medication, and track interactions.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <button onClick={() => setShowInteraction(true)} className="flex-1 md:flex-none justify-center items-center flex gap-2 px-4 py-2.5 border border-danger/30 text-danger rounded-xl text-sm font-bold hover:bg-danger/10 transition-colors" style={{ backgroundColor: 'rgba(248,81,73,0.06)' }}>
                                <ShieldAlert size={16} /> <span className="whitespace-nowrap">Interaction Check</span>
                            </button>
                            <button onClick={() => { setForm(defaultForm()); setShowForm(true); }} className="flex-1 md:flex-none justify-center flex flex-nowrap whitespace-nowrap items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors shadow-[0_0_15px_rgba(47,129,247,0.2)]">
                                <Plus size={16} /> New Rx
                            </button>
                        </div>
                    </div>

                    {/* AI Suggestion Banner */}
                    {aiSuggestions.length > 0 && (
                        <div className="rounded-xl border p-5 shrink-0" style={{ backgroundColor: 'rgba(210,153,34,0.08)', borderColor: 'rgba(210,153,34,0.25)' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={18} className="text-[#D29922]" />
                                <h3 className="text-sm font-bold text-[#D29922]">AI Suggested Medicines Based on Your Scan</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {aiSuggestions.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-[#D29922]/20" style={{ backgroundColor: '#161B22' }}>
                                        <div>
                                            <p className="text-sm font-bold text-text">{s.medicine} {s.dosage}</p>
                                            <p className="text-xs text-text-muted">{s.frequency} · {s.duration} days · {s.reason}</p>
                                        </div>
                                        <button onClick={() => prefillFromSuggestion(s)} className="px-3 py-1.5 bg-[#D29922]/15 text-[#D29922] border border-[#D29922]/30 rounded-lg text-xs font-bold hover:bg-[#D29922]/25 transition-colors shrink-0">
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Allergy Banner */}
                    <div className="flex items-center gap-3 p-4 border rounded-xl shrink-0 flex-wrap" style={{ backgroundColor: 'rgba(248,81,73,0.06)', borderColor: allergies.length > 0 ? 'rgba(248,81,73,0.2)' : 'var(--border)' }}>
                        <Ban size={18} className="text-danger shrink-0" />
                        <span className="text-sm font-bold text-danger">Known Allergies:</span>
                        {allergies.length === 0 && <span className="text-xs text-text-muted italic">None recorded</span>}
                        {allergies.map(a => (
                            <span key={a} className="px-2 py-1 bg-danger/15 text-danger font-bold text-xs rounded-md border border-danger/30">{a}</span>
                        ))}
                        {addingAllergy ? (
                            <div className="flex items-center gap-2">
                                <input value={newAllergy} onChange={e => setNewAllergy(e.target.value)} placeholder="e.g. Penicillin" className="text-xs px-2 py-1 rounded-md border border-border" style={{ backgroundColor: '#0D1117', color: 'white', width: '140px' }} onKeyDown={e => e.key === 'Enter' && handleAddAllergy()} />
                                <button onClick={handleAddAllergy} className="text-xs font-bold text-success hover:underline">Save</button>
                                <button onClick={() => setAddingAllergy(false)} className="text-xs text-text-muted hover:underline">Cancel</button>
                            </div>
                        ) : (
                            <button onClick={() => setAddingAllergy(true)} className="w-6 h-6 rounded-full bg-danger/15 text-danger flex items-center justify-center text-sm font-bold hover:bg-danger/25 transition-colors border border-danger/30">+</button>
                        )}
                    </div>

                    {/* Daily Schedule — Responsive Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                        {timingSlots.map(slot => {
                            const slotMeds = todayMeds.filter(m => m.schedule?.includes(slot));
                            const icon = slot === 'morning' ? '🌅' : slot === 'afternoon' ? '☀️' : slot === 'evening' ? '🌆' : '🌙';
                            return (
                                <div key={slot} className="rounded-xl border border-border p-4 min-h-[120px]" style={{ backgroundColor: '#161B22' }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-lg">{icon}</span>
                                        <h3 className="text-sm font-bold text-text capitalize">{slot}</h3>
                                        <span className="ml-auto text-[10px] font-bold text-text-muted bg-bg px-2 py-0.5 rounded">{slotMeds.length} meds</span>
                                    </div>
                                    <div className="space-y-2">
                                        {slotMeds.map(m => (
                                            <div key={m.prescriptionId} className="flex items-center gap-2 p-2 rounded-lg border border-border text-xs" style={{ backgroundColor: '#0D1117' }}>
                                                <Pill size={12} className="text-primary shrink-0" />
                                                <span className="font-bold text-text truncate">{m.medicineName.split(' ')[0]}</span>
                                                <span className="ml-auto text-text-muted font-bold">{m.dosage}</span>
                                            </div>
                                        ))}
                                        {slotMeds.length === 0 && <p className="text-xs text-text-muted italic">No medicines scheduled</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row items-center gap-4 shrink-0">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input type="text" placeholder="Search prescriptions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10" />
                        </div>
                        <div className="flex p-1 rounded-lg" style={{ backgroundColor: '#0D1117' }}>
                            {(['all', 'Active', 'Completed'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors capitalize ${filter === f ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prescription Cards Grid or Empty State */}
                    {filteredRx.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-60">
                            <Pill size={48} className="text-text-muted mb-4" />
                            <h3 className="text-lg font-bold text-text-secondary">No Prescriptions Yet</h3>
                            <p className="text-sm text-text-muted mt-1">Click <strong>New Prescription</strong> to add the first medicine for this patient.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                            {filteredRx.map((rx, idx) => (
                                <motion.div
                                    key={rx.prescriptionId}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                    className="rounded-xl border border-border p-5 hover:border-primary/30 transition-all group relative"
                                    style={{ backgroundColor: '#161B22' }}
                                >
                                    <button onClick={() => handleDelete(rx.prescriptionId)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-all" title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="flex justify-between items-start mb-3 pr-6">
                                        <div>
                                            <h3 className="font-bold text-text text-lg">{rx.medicineName}</h3>
                                            <p className="text-xs text-primary font-bold mt-0.5">{rx.doctorName}</p>
                                        </div>
                                        <span className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${STATUS_STYLES[rx.status]}`}>
                                            {getStatusIcon(rx.status)} {rx.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-lg" style={{ backgroundColor: '#0D1117' }}>
                                        <div>
                                            <p className="text-[10px] text-text-muted font-bold uppercase">Dose</p>
                                            <p className="text-sm font-bold text-text">{rx.dosage}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-text-muted font-bold uppercase">Freq.</p>
                                            <p className="text-sm font-bold text-text">{rx.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-text-muted font-bold uppercase">Schedule</p>
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {(rx.schedule || []).map(t => (
                                                    <span key={t} className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary font-bold rounded capitalize">{t.slice(0, 3)}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-xs text-text-muted font-medium">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(rx.startDate).toLocaleDateString()} → {new Date(rx.endDate).toLocaleDateString()}</span>
                                    </div>
                                    {rx.instructions && <p className="text-xs text-text-secondary italic mt-2 border-l-2 border-border pl-2">{rx.instructions}</p>}

                                    {rx.status === 'Refill Due' && (
                                        <button className="mt-4 w-full py-2.5 bg-warning/15 text-warning border border-warning/30 rounded-xl text-xs font-bold hover:bg-warning/20 transition flex items-center justify-center gap-2">
                                            <Repeat size={14} /> Request Refill
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* New Prescription Modal */}
            <AnimatePresence>
                {showForm && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowForm(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 30 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-h-[90vh] rounded-2xl shadow-2xl z-50 flex flex-col border border-[#30363D] overflow-hidden"
                            style={{ backgroundColor: '#1C2128' }}
                        >
                            <div className="p-6 border-b border-[#30363D] flex items-center justify-between" style={{ backgroundColor: '#0D1117' }}>
                                <h2 className="text-xl text-text" style={{ fontFamily: 'var(--font-serif)' }}>New Prescription</h2>
                                <button onClick={() => setShowForm(false)} className="w-[32px] h-[32px] rounded-full bg-[#30363D] flex items-center justify-center hover:bg-[#484F58] transition-colors"><X size={16} className="text-white" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                                {/* Allergy Warning */}
                                {formAllergyWarn && (
                                    <div className="p-3 rounded-lg border border-danger/30 flex items-center gap-2" style={{ backgroundColor: 'rgba(248,81,73,0.08)' }}>
                                        <AlertCircle size={16} className="text-danger shrink-0" />
                                        <span className="text-xs font-bold text-danger">{formAllergyWarn}</span>
                                    </div>
                                )}
                                {/* Medicine Name */}
                                <div className="relative">
                                    <label className="text-sm font-bold text-text-secondary mb-1.5 block">Medicine Name *</label>
                                    <input type="text" value={form.medicineName} onChange={e => handleMedSearch(e.target.value)} placeholder="Start typing..." className="w-full" style={{ backgroundColor: '#0D1117', color: 'white', padding: '10px 14px', border: '1px solid #30363D', borderRadius: '10px' }} />
                                    {autoResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 border border-[#30363D] rounded-xl overflow-hidden shadow-xl z-10" style={{ backgroundColor: '#161B22' }}>
                                            {autoResults.map(m => (
                                                <button key={m} onClick={() => { handleMedSearch(m); setAutoResults([]); }} className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-surface-elevated transition-colors font-medium">{m}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Dosage + Frequency */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-text-secondary mb-1.5 block">Dosage *</label>
                                        <input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="500mg" className="w-full" style={{ backgroundColor: '#0D1117', color: 'white', padding: '10px 14px', border: '1px solid #30363D', borderRadius: '10px' }} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-text-secondary mb-1.5 block">Frequency</label>
                                        <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} className="w-full" style={{ backgroundColor: '#0D1117', color: 'white', padding: '10px 14px', border: '1px solid #30363D', borderRadius: '10px' }}>
                                            <option>Once daily</option>
                                            <option>Twice daily</option>
                                            <option>Three times daily</option>
                                            <option>Four times daily</option>
                                            <option>As needed</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Schedule checkboxes */}
                                <div>
                                    <label className="text-sm font-bold text-text-secondary mb-2 block">Schedule</label>
                                    <div className="flex gap-3">
                                        {(['morning', 'afternoon', 'evening', 'night'] as const).map(slot => (
                                            <label key={slot} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${form.schedule.includes(slot) ? 'bg-primary/15 border-primary/40 text-primary' : 'border-[#30363D] text-text-muted hover:border-text-muted'}`}>
                                                <input type="checkbox" checked={form.schedule.includes(slot)} onChange={() => setForm(f => ({ ...f, schedule: f.schedule.includes(slot) ? f.schedule.filter(s => s !== slot) : [...f.schedule, slot] }))} className="sr-only" />
                                                <span className="capitalize">{slot}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {/* Start Date + Duration */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-bold text-text-secondary mb-1.5 block">Start Date</label>
                                        <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full" style={{ backgroundColor: '#0D1117', color: 'white', padding: '10px 14px', border: '1px solid #30363D', borderRadius: '10px' }} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-text-secondary mb-1.5 block">Duration (days)</label>
                                        <input type="number" min={1} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 1 }))} className="w-full" style={{ backgroundColor: '#0D1117', color: 'white', padding: '10px 14px', border: '1px solid #30363D', borderRadius: '10px' }} />
                                        <p className="text-[10px] text-text-muted mt-1">End date: {computedEndDate()}</p>
                                    </div>
                                </div>
                                {/* Doctor Name */}
                                <div>
                                    <label className="text-sm font-bold text-text-secondary mb-1.5 block">Doctor Name *</label>
                                    <input value={form.doctorName} onChange={e => setForm(f => ({ ...f, doctorName: e.target.value }))} placeholder="Dr. ..." className="w-full" style={{ backgroundColor: '#0D1117', color: 'white', padding: '10px 14px', border: '1px solid #30363D', borderRadius: '10px' }} />
                                </div>
                                {/* Instructions */}
                                <div>
                                    <label className="text-sm font-bold text-text-secondary mb-1.5 block">Special Instructions</label>
                                    <textarea rows={3} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Take after meals..." className="w-full resize-none" style={{ backgroundColor: '#0D1117', color: 'white', padding: '10px 14px', border: '1px solid #30363D', borderRadius: '10px' }} />
                                </div>
                            </div>
                            <div className="p-5 border-t border-[#30363D] flex gap-3" style={{ backgroundColor: '#0D1117' }}>
                                <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-[#30363D] text-text-secondary font-bold rounded-xl transition-colors hover:bg-[#21262D]" style={{ backgroundColor: '#161B22' }}>Cancel</button>
                                <button onClick={handleSavePrescription} className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-[0_0_15px_rgba(47,129,247,0.3)] transition-colors">Save Prescription</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Interaction Checker Modal */}
            <AnimatePresence>
                {showInteraction && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowInteraction(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] rounded-2xl shadow-2xl z-50 border border-[#30363D] overflow-hidden" style={{ backgroundColor: '#1C2128' }}>
                            <div className="p-6 border-b border-[#30363D] flex items-center justify-between" style={{ backgroundColor: '#0D1117' }}>
                                <h2 className="text-xl font-bold text-text flex items-center gap-2"><ShieldAlert size={20} className="text-danger" /> Interaction Report</h2>
                                <button onClick={() => setShowInteraction(false)} className="w-[32px] h-[32px] rounded-full bg-[#30363D] flex items-center justify-center hover:bg-[#484F58] transition-colors"><X size={16} className="text-white" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                {interactions.length > 0 ? (
                                    interactions.map((pair, i) => (
                                        <div key={i} className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(248,81,73,0.06)', borderColor: 'rgba(248,81,73,0.2)' }}>
                                            <div className="flex items-start gap-3">
                                                <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-bold text-danger text-sm">Dangerous Interaction</h4>
                                                    <p className="text-xs text-text-secondary mt-1"><strong className="text-text">{pair.drug1} + {pair.drug2}</strong> — {pair.risk}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 rounded-xl border border-success/20" style={{ backgroundColor: 'rgba(63,185,80,0.06)' }}>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-success text-sm">No Dangerous Interactions Detected</h4>
                                                <p className="text-xs text-text-secondary mt-1">All currently active medications are safe to take together based on our interaction database.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] text-text-muted italic text-center pt-2">This is a basic interaction check. Always verify with a pharmacist for clinical decisions.</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
