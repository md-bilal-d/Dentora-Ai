import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore, type Patient } from '../store/usePatientStore';
import { Navbar } from '../components/layout/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Users, Calendar, Stethoscope, DollarSign,
  Eye, Trash2, X, TrendingUp, TrendingDown, ArrowUpDown
} from 'lucide-react';

/* ── STATS BAR ── */
function StatsBar() {
  const { patients } = usePatientStore();
  const stats = [
    { label: 'Total Patients', value: patients.length, icon: Users, color: '#2563EB', trend: '+12%', isPositive: true },
    { label: 'Appointments Today', value: 3, icon: Calendar, color: '#10B981', trend: '+2', isPositive: true },
    { label: 'Treatments This Month', value: 12, icon: Stethoscope, color: '#F59E0B', trend: '-1', isPositive: false },
    { label: 'Revenue This Month', value: '$8,400', icon: DollarSign, color: '#8B5CF6', trend: '+15%', isPositive: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="relative bg-surface rounded-xl p-5 flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] border border-border-light overflow-hidden group hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: s.color }} />
          <div className="flex items-center gap-4 ml-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '12', color: s.color }}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{s.value}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${s.isPositive ? 'text-success bg-success-light' : 'text-danger bg-danger-light'}`}>
            {s.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {s.trend}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── HELPER: Disease Color ── */
function getScoreColor(score: number) {
  if (score >= 60) return 'text-danger';
  if (score >= 30) return 'text-warning';
  if (score > 0) return 'text-success';
  return 'text-text-muted';
}
function getScoreBgColor(score: number) {
  if (score >= 60) return '#EF4444';
  if (score >= 30) return '#F59E0B';
  if (score > 0) return '#10B981';
  return '#9CA3AF';
}

/* ── PATIENT CARD ── */
function PatientCard({ patient, onDelete }: { patient: Patient; onDelete: () => void }) {
  const navigate = useNavigate();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="bg-surface border border-border-light rounded-xl p-5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all group flex flex-col"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-text group-hover:text-primary transition-colors">{patient.name}</h3>
            <p className="text-xs text-text-muted font-mono">{patient.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary mb-4 bg-bg p-3 rounded-lg">
        <p className="flex justify-between"><span>Age:</span> <span className="text-text font-medium">{patient.age}</span></p>
        <p className="flex justify-between"><span>Gender:</span> <span className="text-text font-medium">{patient.gender}</span></p>
        <p className="col-span-2 flex justify-between"><span>Last Visit:</span> <span className="text-text font-medium">{patient.lastVisit}</span></p>
      </div>

      {/* Mini Disease Score Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-text-muted font-medium">Disease Score</span>
          <span className={`font-bold ${getScoreColor(patient.diseaseScore)}`}>
            {patient.diseaseScore}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${patient.diseaseScore}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: getScoreBgColor(patient.diseaseScore) }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={() => navigate(`/patient/${patient.id}`)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-primary bg-primary-light hover:bg-primary hover:text-white transition-colors"
        >
          <Eye size={16} /> View Patient
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

/* ── ADD MODAL ── */
function AddPatientModal({ onClose }: { onClose: () => void }) {
  const { addPatient } = usePatientStore();
  const [form, setForm] = useState({
    name: '', age: 25, gender: 'Male' as const, phone: '', email: '',
    medicalHistory: '', allergies: '', medications: '', lastVisit: new Date().toISOString().split('T')[0],
    diseaseScore: 0, notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    addPatient(form);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-border-light rounded-2xl p-6 w-full max-w-lg shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h2 className="text-xl font-bold text-text flex items-center gap-2">
             <Plus className="text-primary"/> Add New Patient
          </h2>
          <button onClick={onClose} className="p-2 bg-bg rounded-lg text-text-muted hover:text-text transition-colors"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5 block">Full Name</label>
            <input placeholder="Ex: John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5 block">Age</label>
              <input type="number" value={form.age} onChange={e => setForm({...form, age: +e.target.value})} className="w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5 block">Gender</label>
              <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as any})} className="w-full">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5 block">Last Visit</label>
            <input type="date" value={form.lastVisit} onChange={e => setForm({...form, lastVisit: e.target.value})} className="w-full" />
          </div>

          <button type="submit" className="w-full py-3 mt-6 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover transition-colors shadow-sm">
            Create Patient Profile
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── MAIN PAGE ── */
export default function DashboardPage() {
  const { patients, deletePatient } = usePatientStore();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'High Risk' | 'Medium Risk' | 'Healthy'>('All');
  const [sortBy, setSortBy] = useState<'Name' | 'Last Visit' | 'Disease Score'>('Name');

  const processedPatients = useMemo(() => {
    let result = [...patients];
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query));
    }
    if (activeFilter === 'High Risk') result = result.filter(p => p.diseaseScore >= 60);
    else if (activeFilter === 'Medium Risk') result = result.filter(p => p.diseaseScore >= 30 && p.diseaseScore < 60);
    else if (activeFilter === 'Healthy') result = result.filter(p => p.diseaseScore < 30);

    result.sort((a, b) => {
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      if (sortBy === 'Last Visit') return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      if (sortBy === 'Disease Score') return b.diseaseScore - a.diseaseScore;
      return 0;
    });
    return result;
  }, [patients, search, activeFilter, sortBy]);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)' }} className="text-3xl font-bold text-text mb-1">Patient Dashboard</h1>
            <p className="text-text-secondary">Manage your clinic's patients, treatments, and analytics.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary-hover transition-colors shadow-sm shrink-0"
          >
            <Plus size={20} /> Add New Patient
          </button>
        </div>

        <StatsBar />

        {/* Controls Bar */}
        <div className="bg-surface border border-border-light rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <div className="relative w-full lg:w-96">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 py-2.5"
            />
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            {/* Segmented Control */}
            <div className="flex bg-bg border border-border rounded-lg p-1 shrink-0">
              {(['All', 'High Risk', 'Medium Risk', 'Healthy'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap
                    ${activeFilter === f ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'}
                  `}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative shrink-0 flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-1.5">
              <ArrowUpDown size={14} className="text-text-muted"/>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-sm font-medium text-text outline-none border-none py-1 appearance-none cursor-pointer pr-4"
              >
                <option value="Name">Sort: Name</option>
                <option value="Disease Score">Sort: Risk</option>
                <option value="Last Visit">Sort: Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patient Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {processedPatients.map(patient => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onDelete={() => setDeleteConfirm(patient.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {processedPatients.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-text-muted py-20 border-2 border-dashed border-border rounded-2xl bg-surface mt-6">
            <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mb-6 border border-border">
              <Search size={28} className="text-primary opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">No patients found</h3>
            <p className="max-w-md text-center text-text-secondary">We couldn't find any patients matching your current filters and search query.</p>
            {(search || activeFilter !== 'All') && (
              <button 
                onClick={() => { setSearch(''); setActiveFilter('All'); }}
                className="mt-6 px-6 py-2 bg-bg border border-border rounded-xl text-text hover:text-primary transition-colors"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && <AddPatientModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-surface border border-border-light rounded-2xl p-6 w-full max-w-sm shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-danger-light flex items-center justify-center mb-4 text-danger">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">Delete Patient?</h3>
              <p className="text-sm text-text-secondary mb-6">This action cannot be undone. All patient data will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-bg border border-border text-text hover:bg-border-light font-medium transition-colors">Cancel</button>
                <button
                  onClick={() => { deletePatient(deleteConfirm); setDeleteConfirm(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-danger text-white hover:bg-red-600 font-bold transition-colors"
                >Yes, Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
