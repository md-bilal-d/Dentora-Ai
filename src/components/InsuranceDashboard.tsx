import { useState, useEffect, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CreditCard, IndianRupee, Landmark, QrCode, Clock, CheckCircle2, AlertTriangle, Calculator, X, Info, Copy, Pencil, Trash2, Plus, Share2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTreatmentStore } from '../store/useTreatmentStore';

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = 'http://localhost:5001/api';

const formatINR = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
    return '₹' + amount.toLocaleString('en-IN');
};

const DEFAULT_PRICES = [
    { treatmentName: 'Teeth Cleaning', treatmentCode: 'D0110', minPrice: 1500, maxPrice: 3000 },
    { treatmentName: 'Root Canal (Single)', treatmentCode: 'D3310', minPrice: 8000, maxPrice: 15000 },
    { treatmentName: 'Root Canal (Molar)', treatmentCode: 'D3330', minPrice: 15000, maxPrice: 25000 },
    { treatmentName: 'Ceramic Crown', treatmentCode: 'D2740', minPrice: 8000, maxPrice: 20000 },
    { treatmentName: 'Zirconia Crown', treatmentCode: 'D2740Z', minPrice: 12000, maxPrice: 25000 },
    { treatmentName: 'Dental Implant', treatmentCode: 'D6010', minPrice: 25000, maxPrice: 50000 },
    { treatmentName: 'Teeth Whitening', treatmentCode: 'D9972', minPrice: 5000, maxPrice: 15000 },
    { treatmentName: 'Wisdom Tooth Extraction', treatmentCode: 'D7240', minPrice: 5000, maxPrice: 12000 },
];

const DEFAULT_INSURANCE = {
    providerName: 'Add Insurance Provider',
    policyNumber: '-',
    memberID: '-',
    groupNumber: '-',
    annualMaximum: 0,
    annualMaximumUsed: 0,
    deductible: 0,
    deductibleMet: 0,
    validThrough: '',
    status: 'active' as const
};

type PaymentModal = 'upi' | 'card' | 'netbanking' | 'cash' | null;

interface PriceItem {
    _id?: string;
    treatmentName: string;
    treatmentCode: string;
    minPrice: number;
    maxPrice: number;
    doctorName?: string;
    isCustom?: boolean;
}

export const InsuranceDashboard = () => {
    const { patientInfo } = useTreatmentStore();
    const patientId = patientInfo?.id || 'PT-9819';

    const [showEstimator, setShowEstimator] = useState(false);
    const [activePayModal, setActivePayModal] = useState<PaymentModal>(null);
    const [copied, setCopied] = useState(false);
    const [toastType, setToastType] = useState<'success' | 'warning'>('success');

    // Pricing state
    const [prices, setPrices] = useState<PriceItem[]>([]);
    const [editPrices, setEditPrices] = useState<PriceItem[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [pricingLoading, setPricingLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const doctorName = 'Dr. Smith';
    
    // Live Data State
    const [billingRecords, setBillingRecords] = useState<any[]>([]);
    const [insurance, setInsurance] = useState<any>(DEFAULT_INSURANCE);
    const [billingLoading, setBillingLoading] = useState(true);

    const showToast = (msg: string, type: 'success' | 'warning' = 'success') => { 
        setToast(msg); 
        setToastType(type);
        setTimeout(() => setToast(null), 3000); 
    };

    const remaining = Math.max(0, (insurance.annualMaximum || 0) - (insurance.annualMaximumUsed || 0));
    const usedPercent = insurance.annualMaximum > 0 ? Math.round(((insurance.annualMaximumUsed || 0) / insurance.annualMaximum) * 100) : 0;
    const outstanding = billingRecords.filter(p => p.status === 'Pending').reduce((s, p) => s + (p.totalAmount || 0), 0);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Fetch prices on mount
    const fetchPrices = useCallback(async () => {
        setPricingLoading(true);
        try {
            const res = await fetch(`${API_BASE}/clinic-pricing`);
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    setPrices(data.map((d: any) => ({ ...d, isCustom: true })));
                } else {
                    setPrices(DEFAULT_PRICES.map(d => ({ ...d, isCustom: false })));
                }
            } else {
                setPrices(DEFAULT_PRICES.map(d => ({ ...d, isCustom: false })));
            }
        } catch {
            setPrices(DEFAULT_PRICES.map(d => ({ ...d, isCustom: false })));
        } finally {
            setPricingLoading(false);
        }
    }, []);

    // Fetch all data
    const fetchAllData = useCallback(async () => {
        setBillingLoading(true);
        try {
            // Fetch Pricing
            fetchPrices();

            // Fetch Billing
            const bRes = await fetch(`${API_BASE}/billing/${patientId}`);
            if (bRes.ok) setBillingRecords(await bRes.json());

            // Fetch Insurance
            const iRes = await fetch(`${API_BASE}/insurance/${patientId}`);
            if (iRes.ok) {
                const iData = await iRes.json();
                if (iData) setInsurance(iData);
            }
        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            setBillingLoading(false);
        }
    }, [patientId, fetchPrices]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleAddBilling = async (treatmentName: string, totalAmount: number) => {
        const tempId = `temp-${Date.now()}`;
        const newRecord = { 
            _id: tempId, 
            patientId, 
            treatmentName, 
            totalAmount, 
            patientPaid: 0, 
            insurancePaid: 0, 
            status: 'Pending', 
            date: new Date().toISOString(),
            paymentMethod: '-'
        };
        setBillingRecords(prev => [newRecord, ...prev]); 
        
        try {
            const res = await fetch(`${API_BASE}/billing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId, treatmentName, totalAmount, patientPaid: 0, date: new Date().toISOString() })
            });
            if (!res.ok) throw new Error();
            const saved = await res.json();
            setBillingRecords(prev => prev.map(r => r._id === tempId ? saved : r));
            showToast('Billing record created');
        } catch (e) {
            showToast('Could not connect to server. Record saved locally.', 'warning');
        }
    };

    // Enter edit mode
    const startEdit = () => {
        setEditPrices(prices.map(p => ({ ...p })));
        setEditMode(true);
    };

    // Save prices
    const handleSavePrices = async () => {
        const payload = editPrices.map(p => ({
            treatmentName: p.treatmentName,
            treatmentCode: p.treatmentCode,
            minPrice: p.minPrice,
            maxPrice: p.maxPrice,
            doctorName,
            lastUpdated: new Date(),
        }));
        try {
            const res = await fetch(`${API_BASE}/clinic-pricing/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prices: payload }),
            });
            if (res.ok) {
                const saved = await res.json();
                setPrices(saved.map((d: any) => ({ ...d, isCustom: true })));
                setEditMode(false);
                showToast('Prices saved successfully!');
            } else {
                showToast('Failed to save prices.');
            }
        } catch {
            showToast('Network error. Is the server running?');
        }
    };

    // Add new treatment row
    const addTreatmentRow = () => {
        setEditPrices(prev => [...prev, { treatmentName: '', treatmentCode: '', minPrice: 0, maxPrice: 0 }]);
    };

    // Delete treatment row
    const confirmDelete = (idx: number) => {
        const updated = editPrices.filter((_, i) => i !== idx);
        setEditPrices(updated);
        setDeleteConfirm(null);
    };

    // Share price list
    const sharePriceList = () => {
        const lines = ['Apex Dental Clinic — Price List', ''];
        prices.forEach(p => {
            lines.push(`${p.treatmentName}: ${formatINR(p.minPrice)} – ${formatINR(p.maxPrice)}`);
        });
        navigator.clipboard.writeText(lines.join('\n'));
        showToast('Copied to clipboard! Paste into WhatsApp to share.');
    };

    const doughnutData = {
        labels: ['Used', 'Remaining'],
        datasets: [{
            data: [insurance.usedAmount, remaining],
            backgroundColor: ['#2F81F7', '#21262D'],
            borderColor: ['#2F81F7', '#30363D'],
            borderWidth: 2,
            cutout: '75%'
        }]
    };

    const deductibleData = {
        labels: ['Met', 'Remaining'],
        datasets: [{
            data: [insurance.deductibleMet, Math.max(0, insurance.deductible - insurance.deductibleMet)],
            backgroundColor: ['#3FB950', '#21262D'],
            borderColor: ['#3FB950', '#30363D'],
            borderWidth: 2,
            cutout: '75%'
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => formatINR(ctx.raw) } } }
    };

    return (
        <div className="w-full h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar" style={{ fontFamily: 'var(--font-sans)' }}>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
                        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3"
                        style={{ 
                            backgroundColor: '#1C2128', 
                            borderLeft: `4px solid ${toastType === 'success' ? '#3FB950' : '#D29922'}`, 
                            borderRadius: '10px', 
                            padding: '14px 20px', 
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)', 
                            minWidth: '300px' 
                        }}
                    >
                        {toastType === 'success' ? (
                            <CheckCircle2 size={18} className="text-[#3FB950] shrink-0" />
                        ) : (
                            <AlertTriangle size={18} className="text-[#D29922] shrink-0" />
                        )}
                        <span className="text-white text-sm font-medium flex-1">{toast}</span>
                        <button onClick={() => setToast(null)} className="text-[#8B949E] hover:text-white"><X size={14} /></button>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Outstanding Balance Banner */}
            {outstanding > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-xl border shrink-0"
                    style={{ backgroundColor: 'rgba(248,81,73,0.06)', borderColor: 'rgba(248,81,73,0.2)' }}
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-danger" />
                        <div>
                            <span className="text-sm font-bold text-danger">Outstanding Balance</span>
                            <p className="text-xs text-text-secondary mt-0.5">Payment pending for upcoming procedures</p>
                        </div>
                    </div>
                    <span className="text-2xl font-black text-danger font-mono">{formatINR(outstanding)}</span>
                </motion.div>
            )}

            {/* Top Row: Insurance Card + Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
                {/* Insurance Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-6 text-white relative overflow-hidden shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #1F6FEB 0%, #2F81F7 40%, #3FB950 100%)' }}
                >
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -mr-12 -mt-12" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 -ml-8 -mb-8" />
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Dental Insurance</p>
                                <h3 className="text-xl font-bold tracking-tight">{insurance.providerName}</h3>
                            </div>
                            <div className="px-2.5 py-1 bg-white/15 backdrop-blur text-[10px] font-black rounded-lg uppercase tracking-wider text-blue-50">Active</div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-[10px] text-blue-200 font-bold uppercase">Policy #</p><p className="text-sm font-bold font-mono mt-0.5">{insurance.policyNumber}</p></div>
                                <div><p className="text-[10px] text-blue-200 font-bold uppercase">Member ID</p><p className="text-sm font-bold font-mono mt-0.5">{insurance.memberID}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-[10px] text-blue-200 font-bold uppercase">Group</p><p className="text-sm font-bold mt-0.5">{insurance.groupNumber}</p></div>
                                <div><p className="text-[10px] text-blue-200 font-bold uppercase">Valid Through</p><p className="text-sm font-bold mt-0.5">
                                    {insurance.validThrough ? new Date(insurance.validThrough).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (insurance.validTill || '-')}
                                </p></div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Annual Maximum */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-border p-6 flex flex-col items-center justify-center"
                    style={{ backgroundColor: '#161B22' }}
                >
                    <h3 className="text-sm text-text-muted font-bold uppercase tracking-wider mb-4">Annual Maximum</h3>
                    <div className="w-36 h-36 relative">
                        <Doughnut data={doughnutData} options={chartOptions} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-primary font-mono">{usedPercent}%</span>
                            <span className="text-[10px] text-text-muted font-bold">Used</span>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between w-full text-xs font-bold">
                        <span className="text-primary">Used: {formatINR(insurance.usedAmount)}</span>
                        <span className="text-text-muted">Remain: {formatINR(remaining)}</span>
                    </div>
                </motion.div>

                {/* Deductible */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-border p-6 flex flex-col items-center justify-center"
                    style={{ backgroundColor: '#161B22' }}
                >
                    <h3 className="text-sm text-text-muted font-bold uppercase tracking-wider mb-4">Deductible</h3>
                    <div className="w-36 h-36 relative">
                        <Doughnut data={deductibleData} options={chartOptions} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-success font-mono">100%</span>
                            <span className="text-[10px] text-text-muted font-bold">Met</span>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between w-full text-xs font-bold">
                        <span className="text-success">Paid: {formatINR(insurance.deductibleMet)}</span>
                        <span className="text-text-muted">Total: {formatINR(insurance.deductible)}</span>
                    </div>
                </motion.div>
            </div>

            {/* Middle Row: Payment Methods & Cost Estimator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
                {/* Payment Methods — Redesigned */}
                <div className="rounded-2xl border border-border p-6" style={{ backgroundColor: '#161B22' }}>
                    <h2 className="text-lg text-white font-bold mb-1" style={{ fontFamily: 'var(--font-serif)' }}>How Would You Like to Pay?</h2>
                    <p className="text-sm text-[#8B949E] mb-5">Choose your preferred payment method and we'll guide you.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => setActivePayModal('upi')} className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(47,129,247,0.15)]" style={{ backgroundColor: '#1C2128', borderColor: '#30363D' }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#2F81F7')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#30363D')}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(47,129,247,0.12)' }}><QrCode size={22} className="text-primary" /></div>
                            <h4 className="font-bold text-white text-sm">UPI Payment</h4>
                            <p className="text-xs text-[#8B949E] mt-1">Pay instantly using GPay, PhonePe or Paytm</p>
                        </div>
                        <div onClick={() => setActivePayModal('card')} className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(47,129,247,0.15)]" style={{ backgroundColor: '#1C2128', borderColor: '#30363D' }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#2F81F7')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#30363D')}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(47,129,247,0.12)' }}><CreditCard size={22} className="text-primary" /></div>
                            <h4 className="font-bold text-white text-sm">Card Payment</h4>
                            <p className="text-xs text-[#8B949E] mt-1">Visa, Mastercard, RuPay accepted</p>
                        </div>
                        <div onClick={() => setActivePayModal('netbanking')} className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(47,129,247,0.15)]" style={{ backgroundColor: '#1C2128', borderColor: '#30363D' }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#2F81F7')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#30363D')}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(47,129,247,0.12)' }}><Landmark size={22} className="text-primary" /></div>
                            <h4 className="font-bold text-white text-sm">Net Banking</h4>
                            <p className="text-xs text-[#8B949E] mt-1">NEFT or IMPS transfer to clinic account</p>
                        </div>
                        <div onClick={() => setActivePayModal('cash')} className="p-6 rounded-xl border cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(47,129,247,0.15)]" style={{ backgroundColor: '#1C2128', borderColor: '#30363D' }} onMouseEnter={e => (e.currentTarget.style.borderColor = '#2F81F7')} onMouseLeave={e => (e.currentTarget.style.borderColor = '#30363D')}>
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(47,129,247,0.12)' }}><IndianRupee size={22} className="text-primary" /></div>
                            <h4 className="font-bold text-white text-sm">Cash at Clinic</h4>
                            <p className="text-xs text-[#8B949E] mt-1">Pay directly at the reception counter</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-5 p-3 rounded-lg" style={{ backgroundColor: 'rgba(63,185,80,0.08)', borderLeft: '4px solid #3FB950' }}>
                        <Info size={16} className="text-[#3FB950] shrink-0" />
                        <span className="text-xs text-[#8B949E]">All payments are collected directly at the clinic. Online payment integration coming soon.</span>
                    </div>
                </div>

                {/* Cost Estimator — Redesigned */}
                <div className="rounded-2xl border border-border p-6" style={{ backgroundColor: '#161B22' }}>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg text-text" style={{ fontFamily: 'var(--font-serif)' }}>Cost Estimator</h2>
                        <div className="flex items-center gap-2">
                            {!editMode && (
                                <>
                                    <button onClick={sharePriceList} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition">
                                        <Share2 size={13} /> Share
                                    </button>
                                    <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition">
                                        <Pencil size={13} /> Edit Prices
                                    </button>
                                    <button onClick={() => setShowEstimator(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition">
                                        <Calculator size={13} /> View All
                                    </button>
                                </>
                            )}
                            {editMode && (
                                <button onClick={() => setEditMode(false)} className="flex items-center gap-1.5 px-3 py-1.5 text-text-muted text-xs font-bold rounded-lg hover:bg-[#21262D] border border-[#30363D] transition">
                                    <X size={13} /> Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {pricingLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="text-primary animate-spin" /></div>
                    ) : editMode ? (
                        /* ─── EDIT MODE ─── */
                        <div className="space-y-3">
                            {editPrices.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-[#30363D]" style={{ backgroundColor: '#0D1117' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            {item.treatmentCode ? (
                                                <div>
                                                    <h4 className="text-sm font-bold text-text truncate">{item.treatmentName}</h4>
                                                    <span className="text-[10px] text-text-muted font-mono">{item.treatmentCode}</span>
                                                </div>
                                            ) : (
                                                <input
                                                    value={item.treatmentName}
                                                    onChange={e => { const u = [...editPrices]; u[idx].treatmentName = e.target.value; setEditPrices(u); }}
                                                    placeholder="Treatment name..."
                                                    className="text-sm font-bold text-white w-full bg-transparent border-b border-[#30363D] focus:border-primary outline-none pb-1"
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border focus-within:border-primary transition-colors" style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
                                                <span className="text-xs text-[#8B949E]">₹</span>
                                                <input type="number" value={item.minPrice || ''} onChange={e => { const u = [...editPrices]; u[idx].minPrice = Number(e.target.value); setEditPrices(u); }}
                                                    className="w-20 text-sm font-bold text-white bg-transparent outline-none" placeholder="Min" />
                                            </div>
                                            <span className="text-[#8B949E] text-xs">to</span>
                                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border focus-within:border-primary transition-colors" style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
                                                <span className="text-xs text-[#8B949E]">₹</span>
                                                <input type="number" value={item.maxPrice || ''} onChange={e => { const u = [...editPrices]; u[idx].maxPrice = Number(e.target.value); setEditPrices(u); }}
                                                    className="w-20 text-sm font-bold text-white bg-transparent outline-none" placeholder="Max" />
                                            </div>
                                            <button onClick={() => setDeleteConfirm(idx)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[#484F58] mt-2 italic">Your custom price will be shown to patients.</p>
                                </div>
                            ))}
                            <button onClick={addTreatmentRow} className="w-full py-3 border border-dashed border-[#30363D] rounded-xl text-sm font-bold text-text-muted hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
                                <Plus size={16} /> Add Treatment
                            </button>
                            <button onClick={handleSavePrices} className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-[0_0_15px_rgba(47,129,247,0.3)] transition-colors text-sm mt-2">
                                Save My Prices
                            </button>
                        </div>
                    ) : (
                        /* ─── VIEW MODE ─── */
                        <div className="space-y-3">
                            {prices.slice(0, 4).map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-xl hover:border-primary/20 transition" style={{ backgroundColor: '#0D1117' }}>
                                    <div>
                                        <h4 className="text-sm font-bold text-text">{item.treatmentName}</h4>
                                        {item.treatmentCode && <span className="text-[10px] text-text-muted font-mono">{item.treatmentCode}</span>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white font-mono">{formatINR(item.minPrice)} – {formatINR(item.maxPrice)}</p>
                                        {item.isCustom ? (
                                            <div className="flex items-center gap-2 justify-end mt-1">
                                                <span className="text-[9px] px-1.5 py-0.5 bg-success/15 text-success font-bold rounded">Your Clinic Price</span>
                                                <span className="text-[10px] text-text-muted">Set by {doctorName}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-[#484F58] italic">Default price. Click Edit Prices to set your own.</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Billing History */}
            <div className="rounded-2xl border border-border overflow-hidden shrink-0" style={{ backgroundColor: '#161B22' }}>
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg text-text" style={{ fontFamily: 'var(--font-serif)' }}>Billing History</h2>
                    <button 
                        onClick={() => handleAddBilling('Consultation', 1500)}
                        className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition flex items-center gap-2"
                    >
                        <Plus size={14} /> Record Entry
                    </button>
                </div>
                <div className="overflow-x-auto">
                    {billingRecords.length === 0 && !billingLoading ? (
                        <div className="p-12 text-center">
                            <Clock size={32} className="text-[#30363D] mx-auto mb-3" />
                            <p className="text-text-muted text-sm font-bold tracking-tight">No billing records yet</p>
                            <p className="text-[10px] text-[#484F58] mt-1">Add a treatment to see it here</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-bold uppercase text-text-muted" style={{ backgroundColor: '#0D1117' }}>
                                    <th className="py-3 px-6">Date</th>
                                    <th className="py-3 px-6">Description</th>
                                    <th className="py-3 px-6">Amount</th>
                                    <th className="py-3 px-6">Method</th>
                                    <th className="py-3 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billingRecords.map((p) => (
                                    <tr key={p._id || p.id} className="border-t border-border hover:bg-surface-elevated/50 transition-colors">
                                        <td className="py-4 px-6 text-sm text-text-secondary font-mono">{new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-text">{p.treatmentName}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-text font-mono">{formatINR(p.totalAmount)}</td>
                                        <td className="py-4 px-6 text-sm text-text-secondary">{p.paymentMethod || '-'}</td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${p.status === 'Paid' ? 'bg-success/15 text-success border-success/30' : 'bg-warning/15 text-warning border-warning/30'}`}>
                                                {p.status === 'Paid' ? <CheckCircle2 size={12}/> : <Clock size={12}/>} {p.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Full Cost Estimator Modal (View All) */}
            <AnimatePresence>
                {showEstimator && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowEstimator(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-h-[80vh] rounded-2xl shadow-2xl z-50 border border-[#30363D] flex flex-col overflow-hidden" style={{ backgroundColor: '#1C2128' }}>
                            <div className="p-6 border-b border-[#30363D] flex items-center justify-between shrink-0" style={{ backgroundColor: '#0D1117' }}>
                                <h2 className="text-xl font-bold text-text flex items-center gap-2" style={{ fontFamily: 'var(--font-serif)' }}><Calculator size={20} className="text-primary"/> Full Cost Estimator</h2>
                                <button onClick={() => setShowEstimator(false)} className="w-8 h-8 rounded-full bg-[#30363D] flex items-center justify-center hover:bg-[#484F58] transition-colors"><X size={16} className="text-white" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                {prices.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border border-[#30363D] rounded-xl" style={{ backgroundColor: '#0D1117' }}>
                                        <div>
                                            <h4 className="font-bold text-text">{item.treatmentName}</h4>
                                            {item.treatmentCode && <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">{item.treatmentCode}</span>}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-white font-mono">{formatINR(item.minPrice)} – {formatINR(item.maxPrice)}</p>
                                            {item.isCustom ? (
                                                <div className="flex items-center gap-2 justify-end mt-1">
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-success/15 text-success font-bold rounded">Your Clinic Price</span>
                                                    <span className="text-[10px] text-text-muted">Set by {doctorName}</span>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-[#484F58] italic">Default price</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm !== null && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setDeleteConfirm(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] rounded-2xl shadow-2xl z-[61] border border-[#30363D] overflow-hidden" style={{ backgroundColor: '#1C2128' }}>
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(248,81,73,0.12)' }}><Trash2 size={20} className="text-danger" /></div>
                                    <h3 className="text-lg font-bold text-white">Delete Treatment?</h3>
                                </div>
                                <p className="text-sm text-[#8B949E] leading-relaxed">Are you sure you want to remove <strong className="text-white">{editPrices[deleteConfirm]?.treatmentName || 'this treatment'}</strong> from your price list?</p>
                            </div>
                            <div className="flex gap-3 p-4 border-t border-[#30363D]" style={{ backgroundColor: '#0D1117' }}>
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-[#30363D] text-[#8B949E] rounded-xl text-sm font-bold hover:bg-[#21262D] transition-colors" style={{ backgroundColor: '#161B22' }}>Cancel</button>
                                <button onClick={() => confirmDelete(deleteConfirm)} className="flex-1 py-2.5 bg-danger hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">Delete</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Payment Method Modals */}
            <AnimatePresence>
                {activePayModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => { setActivePayModal(null); setCopied(false); }} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] rounded-2xl shadow-2xl z-50 border overflow-hidden"
                            style={{ backgroundColor: '#1C2128', borderColor: '#30363D' }}
                        >
                            {activePayModal === 'upi' && (
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(47,129,247,0.12)' }}><QrCode size={22} className="text-primary" /></div>
                                        <h3 className="text-lg font-bold text-white">UPI Payment</h3>
                                    </div>
                                    <div className="w-full flex flex-col items-center py-6 rounded-xl border border-[#30363D] mb-4" style={{ backgroundColor: '#0D1117' }}>
                                        <div className="w-40 h-40 rounded-xl border-2 border-dashed border-[#30363D] flex items-center justify-center mb-4" style={{ backgroundColor: '#161B22' }}>
                                            <QrCode size={64} className="text-[#484F58]" />
                                        </div>
                                        <p className="text-sm text-[#8B949E]">Scan with any UPI app</p>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-[#30363D]" style={{ backgroundColor: '#0D1117' }}>
                                        <div>
                                            <p className="text-[10px] text-[#8B949E] font-bold uppercase">UPI ID</p>
                                            <p className="text-sm font-bold text-white font-mono">dental@upi</p>
                                        </div>
                                        <button onClick={() => handleCopy('dental@upi')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors" style={{ backgroundColor: copied ? 'rgba(63,185,80,0.15)' : 'rgba(47,129,247,0.12)', color: copied ? '#3FB950' : '#2F81F7' }}>
                                            {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy UPI ID</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {activePayModal === 'card' && (
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(47,129,247,0.12)' }}><CreditCard size={22} className="text-primary" /></div>
                                        <h3 className="text-lg font-bold text-white">Card Payment</h3>
                                    </div>
                                    <div className="p-5 rounded-xl border border-[#30363D] text-center" style={{ backgroundColor: '#0D1117' }}>
                                        <p className="text-sm text-[#C9D1D9] leading-relaxed">Please visit the clinic reception to pay by card or call us at</p>
                                        <p className="text-lg font-bold text-primary font-mono mt-2">+91 98765 43210</p>
                                    </div>
                                </div>
                            )}
                            {activePayModal === 'netbanking' && (
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(47,129,247,0.12)' }}><Landmark size={22} className="text-primary" /></div>
                                        <h3 className="text-lg font-bold text-white">Net Banking</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Bank Name', value: 'State Bank of India' },
                                            { label: 'Account Number', value: '1234567890' },
                                            { label: 'IFSC Code', value: 'SBIN0001234' },
                                            { label: 'Account Name', value: 'Apex Dental Clinic' },
                                        ].map(item => (
                                            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-[#30363D]" style={{ backgroundColor: '#0D1117' }}>
                                                <div>
                                                    <p className="text-[10px] text-[#8B949E] font-bold uppercase">{item.label}</p>
                                                    <p className="text-sm font-bold text-white font-mono">{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => handleCopy('1234567890')} className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors" style={{ backgroundColor: copied ? 'rgba(63,185,80,0.15)' : 'rgba(47,129,247,0.12)', color: copied ? '#3FB950' : '#2F81F7' }}>
                                        {copied ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy Account Number</>}
                                    </button>
                                </div>
                            )}
                            {activePayModal === 'cash' && (
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(47,129,247,0.12)' }}><IndianRupee size={22} className="text-primary" /></div>
                                        <h3 className="text-lg font-bold text-white">Cash at Clinic</h3>
                                    </div>
                                    <div className="p-5 rounded-xl border border-[#30363D]" style={{ backgroundColor: '#0D1117' }}>
                                        <p className="text-sm text-[#C9D1D9] leading-relaxed">Please bring exact change or we can accept any amount and provide change.</p>
                                        <p className="text-sm text-[#C9D1D9] leading-relaxed mt-3">Our reception is open <strong className="text-white">Monday to Saturday, 9 AM to 7 PM</strong>.</p>
                                    </div>
                                </div>
                            )}
                            <div className="p-4 border-t border-[#30363D]" style={{ backgroundColor: '#0D1117' }}>
                                <button onClick={() => { setActivePayModal(null); setCopied(false); }} className="w-full py-2.5 border border-[#30363D] text-[#8B949E] font-bold rounded-xl text-sm hover:bg-[#21262D] transition-colors" style={{ backgroundColor: '#161B22' }}>
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
