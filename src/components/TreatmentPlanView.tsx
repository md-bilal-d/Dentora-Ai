import React, { useMemo } from 'react';
import { FileText, Download, Printer, ShieldCheck, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface TreatmentPlanViewProps {
    detections: any[];
    userReports: any[];
    onClose: () => void;
}

export default function TreatmentPlanView({ detections, userReports, onClose }: TreatmentPlanViewProps) {
    const planItems = useMemo(() => {
        const items: any[] = [];
        
        // Process AI detections
        detections.forEach(det => {
            if (det.class.toLowerCase().includes('healthy')) return;
            
            let priority = 'Low';
            if (det.severity === 'high') priority = 'Emergency';
            else if (det.severity === 'medium') priority = 'Priority';

            items.push({
                toothId: det.tooth_number,
                diagnosis: det.class,
                source: 'AI-Vision',
                priority,
                recommendation: det.recommendedAction || `Clinical evaluation of ${det.class}`,
                estimatedCost: priority === 'Emergency' ? '$800 - $1,200' : '$200 - $450'
            });
        });

        // Process User reports
        userReports.forEach(rep => {
            if (rep.resolved) return;
            
            // Check if AI already covered this tooth to avoid duplication
            if (items.some(it => it.toothId === rep.toothNumber)) return;

            items.push({
                toothId: rep.toothNumber,
                diagnosis: 'Patient Reported Pain',
                source: 'Symptom Log',
                priority: rep.level >= 7 ? 'Priority' : 'Monitor',
                recommendation: 'Visual and percussion testing required for differential diagnosis.',
                estimatedCost: 'TBD'
            });
        });

        return items;
    }, [detections, userReports]);

    const totalEstimate = planItems.reduce((acc, item) => {
        if (item.estimatedCost === 'TBD') return acc;
        const val = parseInt(item.estimatedCost.replace(/[^0-9]/g, '')) || 0;
        return acc + val;
    }, 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-4xl max-h-full overflow-hidden rounded-[32px] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
                
                {/* Header */}
                <div className="bg-[#0D1117] p-8 text-white shrink-0">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                <FileText className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight mb-1">AI Clinical Treatment Plan</h2>
                                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Diagnostic ID: DENTORA-2026-X492</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-slate-300"><Download size={18} /></button>
                            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-slate-300"><Printer size={18} /></button>
                            <button onClick={onClose} className="ml-2 p-3 bg-white/5 hover:bg-red-500/20 rounded-xl transition-all border border-white/10 text-slate-300 hover:text-red-400">
                                <ArrowRight size={18} className="rotate-180" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/5">
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold block mb-2">Patient Name</span>
                            <span className="text-sm font-bold text-slate-200">Johnathan Doe</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold block mb-2">Assigned Doctor</span>
                            <span className="text-sm font-bold text-slate-200">Dr. Sarah Miller</span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold block mb-2">Scan Integrity</span>
                            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                                <CheckCircle size={14} /> 99.4% Match
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-bold block mb-2">Generated On</span>
                            <span className="text-sm font-bold text-slate-200">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">
                    <div className="flex items-center gap-3 mb-8">
                        <ShieldCheck className="text-emerald-500" size={24} />
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">AI-Verified Diagnostic Path</h3>
                    </div>

                    <div className="grid gap-4">
                        {planItems.length === 0 ? (
                            <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                                <CheckCircle size={40} className="text-emerald-400 mx-auto mb-4" />
                                <h4 className="font-bold text-slate-800 mb-1">Perfect Dental Health</h4>
                                <p className="text-sm text-slate-500">No clinical interventions detected in current scan cycle.</p>
                            </div>
                        ) : (
                            planItems.map((item, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-3xl border border-slate-200 hover:border-blue-300 transition-all group shadow-sm">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center shadow-inner shrink-0 self-start md:self-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tooth</span>
                                        <span className="text-xl font-black text-slate-800">T{item.toothId}</span>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h4 className="font-black text-slate-800 text-lg">{item.diagnosis}</h4>
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                item.priority === 'Emergency' ? 'bg-red-500 text-white' : 
                                                item.priority === 'Priority' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                                            }`}>
                                                {item.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed mb-4 font-medium">{item.recommendation}</p>
                                        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Verification Source</span>
                                                <span className="text-[11px] font-bold text-slate-700">{item.source} Engine</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Estimated Cost</span>
                                                <span className="text-[11px] font-bold text-blue-600">{item.estimatedCost}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-10 p-6 bg-amber-50 rounded-2xl border border-amber-200/50">
                        <div className="flex gap-4 items-start">
                            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                            <div>
                                <h4 className="text-[10px] font-black text-amber-700 mb-1 uppercase tracking-widest">Mandatory Professional Review</h4>
                                <p className="text-[11px] text-amber-800/70 leading-relaxed font-medium">
                                    This treatment plan is synthesized via computer vision neural networks. It is a decision-support tool only. 
                                    A dental surgeon must validate these findings against clinical examination and patient history prior to surgical execution.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Total */}
                <div className="bg-white p-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
                    <div className="text-center md:text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Total Estimated Investment</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-900">${totalEstimate.toLocaleString()}</span>
                            <span className="text-sm font-bold text-slate-400">USD</span>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={onClose} className="flex-1 md:flex-none px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all uppercase tracking-widest text-xs">
                            Cancel
                        </button>
                        <button className="flex-1 md:flex-none px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                            <CheckCircle size={18} />
                            Finalize & Sign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
