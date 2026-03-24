import { useState } from 'react';
import { Check, UploadCloud, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTreatmentStore } from '../store/useTreatmentStore';

export const PatientProgress = () => {
    const aiPayload = useTreatmentStore(s => s.aiPayload);
    const [isExpanded, setIsExpanded] = useState(false);
    const [completedActions, setCompletedActions] = useState<string[]>([]);

    const getStatusStyle = (severity: string) => {
        if (severity === 'high') return { color: '#F85149', label: 'Urgent' };
        if (severity === 'medium') return { color: '#D29922', label: 'Review' };
        return { color: '#3FB950', label: 'Monitored' };
    };

    // Process AI Payload Data (Fallback to safe defaults if null)
    const formattedDate = aiPayload ? new Date(aiPayload.timestamp).toLocaleDateString() : '';
    const formattedDateTime = aiPayload ? new Date(aiPayload.timestamp).toLocaleString() : '';
    const findings = aiPayload ? aiPayload.findings : [];
    
    // VITALS LOGIC
    const highRiskCount = findings.filter(f => f.severity === 'high').length;
    const moderateCount = findings.filter(f => f.severity === 'medium').length;
    const lowCount = findings.filter(f => f.severity === 'low' && f.class !== 'Healthy').length;
    
    // Gum Health properly calculated
    let gumHealthNum = aiPayload ? Math.max(0, 100 - (highRiskCount * 15) - (moderateCount * 8) - (lowCount * 3)) : 82;
    let gumState = 'Good';
    let gumColor = 'text-success';
    let gumBg = 'bg-success';
    let gumMsg = 'Your gums are in good condition.';
    
    if (gumHealthNum <= 49) {
        gumState = 'Poor'; gumColor = 'text-danger'; gumBg = 'bg-danger'; gumMsg = 'Immediate dental care recommended.';
    } else if (gumHealthNum <= 74) {
        gumState = 'Fair'; gumColor = 'text-warning'; gumBg = 'bg-warning'; gumMsg = 'Some areas need attention.';
    }

    // Cavity Risk accurately mapped
    const cavities = findings.filter(f => f.class.toLowerCase().includes('caries'));
    const cavityCount = cavities.length;
    let cavityRiskStr = 'Low Risk - No cavities detected';
    let cavityRiskColor = 'bg-success/15 text-success border-success/30';
    if (cavityCount >= 3) {
        cavityRiskStr = `High Risk - ${cavityCount} cavities detected`;
        cavityRiskColor = 'bg-danger/15 text-danger border-danger/30';
    } else if (cavityCount > 0) {
        cavityRiskStr = `Medium Risk - ${cavityCount} cavity detected`;
        if (cavityCount > 1) cavityRiskStr = `Medium Risk - ${cavityCount} cavities detected`;
        cavityRiskColor = 'bg-warning/15 text-warning border-warning/30';
    } else if (!aiPayload) {
        cavityRiskStr = 'Unknown';
        cavityRiskColor = 'bg-[#161B22] text-text-muted border-border';
    }

    // Hygiene Index mapped correctly
    let hygieneStr = 'Excellent';
    let hygieneColor = 'bg-success/15 text-success border-success/30';
    if (!aiPayload) {
        hygieneStr = 'Unknown';
        hygieneColor = 'bg-[#161B22] text-text-muted border-border';
    } else if (gumHealthNum <= 49) {
        hygieneStr = 'Poor - See Dentist';
        hygieneColor = 'bg-danger/15 text-danger border-danger/30';
    } else if (gumHealthNum <= 75) {
        hygieneStr = 'Needs Improvement';
        hygieneColor = 'bg-warning/15 text-warning border-warning/30';
    }

    // Overall Status
    let overallStatus = 'Healthy';
    let overallColor = 'text-success font-black';
    if (!aiPayload) {
        overallStatus = 'Unknown';
        overallColor = 'text-text-muted font-bold';
    } else if (highRiskCount > 0) {
        overallStatus = 'See Dentist Soon';
        overallColor = 'text-danger font-black';
    } else if (moderateCount > 0 || lowCount > 0) {
        overallStatus = 'Needs Attention';
        overallColor = 'text-warning font-black';
    }

    // ACTIONS LOGIC
    const rawActions = findings
        .filter(f => f.recommendedAction && f.class !== 'Healthy')
        .map(f => {
            let priorityWeight = 3;
            let priorityLabel = 'ROUTINE';
            if (f.severity === 'high') { priorityWeight = 1; priorityLabel = 'URGENT'; }
            else if (f.severity === 'medium') { priorityWeight = 2; priorityLabel = 'SOON'; }

            let explanation = f.description || `Detected ${f.class.toLowerCase()} on tooth ${f.tooth_number}.`;
            let fullText = `${explanation} ${f.notes || ''}`.trim();

            return {
                id: `action_${f.tooth_number}_${f.class.replace(/\s+/g, '_')}`,
                title: f.recommendedAction,
                subtitle: fullText,
                priorityLabel,
                priorityWeight,
                toothNum: f.tooth_number,
                type: f.severity === 'high' ? 'overdue' : f.severity === 'medium' ? 'upcoming' : 'recommended'
            };
        })
        .sort((a, b) => a.priorityWeight - b.priorityWeight);

    const undoneActions = rawActions.filter(a => !completedActions.includes(a.id));
    const doneActions = rawActions.filter(a => completedActions.includes(a.id));
    
    // Sort logic requires undone URGENT first, then undone SOON, etc. Then done actions.
    const sortedActions = [...undoneActions.sort((a,b) => a.priorityWeight - b.priorityWeight), ...doneActions];
    const actionsCount = rawActions.length;
    const displayedActions = isExpanded ? sortedActions : sortedActions.slice(0, 3);

    // Filter out healthy findings for treatment history
    const historyFindings = findings.filter(f => f.class !== 'Healthy');

    const totalTreatments = historyFindings.length;
    const completed = 0; // Everything is coming from current AI scan, so none are completed yet
    const remaining = totalTreatments;

    return (
        <div className="w-full h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
            
            {/* Info Banner */}
            {aiPayload ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary w-full shrink-0">
                    <Info size={18} />
                    <span className="text-sm font-bold">Last updated from AI Scan at {formattedDateTime}</span>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-[#161B22]/50 text-text-secondary w-full shrink-0">
                    <Info size={18} className="text-primary" />
                    <span className="text-sm font-medium">No AI scan done yet. Upload an X-ray in the AI Scanner tab to see your progress here.</span>
                </div>
            )}
            
            {/* 1. Top Summary Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="shrink-0 rounded-2xl border border-border p-6 flex items-center justify-between"
                style={{ backgroundColor: '#161B22' }}
            >
                <div className="flex-1 text-center border-r border-border">
                    <p className="text-sm text-text-muted font-bold tracking-widest uppercase mb-1">Total Treatments</p>
                    <p className="text-4xl font-black text-text">{aiPayload ? totalTreatments : '-'}</p>
                </div>
                <div className="flex-1 text-center border-r border-border">
                    <p className="text-sm text-text-muted font-bold tracking-widest uppercase mb-1">Completed</p>
                    <p className="text-4xl font-black text-success">{aiPayload ? completed : '-'}</p>
                </div>
                <div className="flex-1 text-center">
                    <p className="text-sm text-text-muted font-bold tracking-widest uppercase mb-1">Remaining</p>
                    <p className="text-4xl font-black text-warning">{aiPayload ? remaining : '-'}</p>
                </div>
            </motion.div>

            {/* Main Layout: Two Column Grid (60% / 40%) */}
            <div className="flex flex-col lg:flex-row gap-6 shrink-0">
                
                {/* Left Column (60%): Treatment History */}
                <div className="lg:w-[60%] flex flex-col">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="rounded-2xl border border-border p-6 overflow-hidden flex flex-col flex-1"
                        style={{ backgroundColor: '#161B22' }}
                    >
                        <h2 className="text-xl font-bold text-text mb-6 shrink-0" style={{ fontFamily: 'var(--font-serif)' }}>Treatment History</h2>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            {!aiPayload ? (
                                <div className="p-8 mt-4 border border-dashed border-border/50 rounded-xl bg-[#0D1117] flex flex-col items-center justify-center h-full min-h-[200px]">
                                    <UploadCloud size={32} className="text-text-muted mb-3" />
                                    <h3 className="text-lg font-bold text-text mb-2">Waiting for AI Scan</h3>
                                    <p className="text-sm text-text-muted text-center max-w-xs">Go to AI Scanner tab to upload your X-ray.</p>
                                </div>
                            ) : historyFindings.length === 0 ? (
                                <div className="p-8 text-center text-text-muted">No treatments needed. Great job!</div>
                            ) : (
                                historyFindings.map((f, i) => {
                                    const style = getStatusStyle(f.severity);
                                    return (
                                        <motion.div 
                                            key={`history_${i}`} 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="border border-border rounded-xl p-5 flex justify-between items-center transition-colors hover:border-border/80" 
                                            style={{ backgroundColor: '#0D1117', borderLeftWidth: '4px', borderLeftColor: style.color }}
                                        >
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-text text-sm">{f.class}</h4>
                                                    <span className="text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider" 
                                                          style={{ color: style.color, backgroundColor: `${style.color}15` }}>
                                                        {style.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-medium text-text-secondary mt-1">
                                                    <span>Date: <strong className="text-text">{formattedDate}</strong></span>
                                                    <span className="text-border">|</span>
                                                    <span>Provider: <strong className="text-text">AI Scanner</strong></span>
                                                    <span className="text-border">|</span>
                                                    <span>Tooth: <strong className="text-text">#{f.tooth_number}</strong></span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column (40%): Vitals, What To Do Next, Quick Stats */}
                <div className="lg:w-[40%] flex flex-col gap-6">
                    
                    {/* Vitals & Health Score */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="rounded-2xl border border-border p-6"
                        style={{ backgroundColor: '#161B22' }}
                    >
                        <h2 className="text-lg font-bold text-text mb-5" style={{ fontFamily: 'var(--font-serif)' }}>Vitals & Health Score</h2>
                        {!aiPayload ? (
                            <div className="p-8 border border-dashed border-border/50 rounded-xl bg-[#0D1117] flex flex-col items-center justify-center mt-2">
                                <UploadCloud size={28} className="text-text-muted mb-2" />
                                <h3 className="text-md font-bold text-text mb-1">Waiting for AI Scan</h3>
                                <p className="text-xs text-text-muted text-center max-w-[200px]">Go to AI Scanner tab to upload your X-ray.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Gum Health */}
                                <div>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="text-sm font-bold text-text-secondary">Gum Health</span>
                                        <span className={`text-xl font-black ${gumColor} font-mono flex items-baseline gap-2`}>
                                            {gumHealthNum}/100 
                                            <span className="text-[10px] uppercase font-bold tracking-widest">{gumState}</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden mb-2">
                                        <div className={`h-full ${gumBg} rounded-full`} style={{ width: `${gumHealthNum}%` }}></div>
                                    </div>
                                    <p className="text-xs font-semibold text-text-muted">{gumMsg}</p>
                                </div>
                                
                                <hr className="border-border/50" />

                                {/* Cavity Risk */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-text-secondary">Cavity Risk</span>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 border rounded-md ${cavityRiskColor}`}>
                                        {cavityRiskStr}
                                    </span>
                                </div>

                                <hr className="border-border/50" />

                                {/* Hygiene Index */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-text-secondary">Hygiene Index</span>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 border rounded-md ${hygieneColor}`}>
                                        {hygieneStr}
                                    </span>
                                </div>

                                <hr className="border-border/50" />

                                {/* Last Deep Cleaning */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-text-secondary">Last Deep Cleaning</span>
                                    <span className="text-sm font-bold text-warning hover:underline cursor-pointer">Not on record - Please update</span>
                                </div>

                                <hr className="border-border/50" />

                                {/* Overall Status */}
                                <div className="flex justify-between items-center bg-[#0D1117] p-3 rounded-lg border border-border">
                                    <span className="text-sm font-bold text-text-secondary">Overall Status</span>
                                    <span className={`${overallColor} bg-[${overallColor.includes('success') ? '#3FB950' : overallColor.includes('warning') ? '#D29922' : '#F85149'}10] px-2 py-1 rounded`}>{overallStatus}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* What To Do Next */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="rounded-2xl border border-border p-6"
                        style={{ backgroundColor: '#161B22' }}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-bold text-text" style={{ fontFamily: 'var(--font-serif)' }}>What To Do Next</h2>
                            {aiPayload && actionsCount > 0 && (
                                <span className="bg-[#0D1117] text-text-secondary text-xs font-black min-w-6 text-center py-1 rounded-md border border-border/80">{actionsCount}</span>
                            )}
                        </div>
                        {!aiPayload ? (
                            <div className="p-8 border border-dashed border-border/50 rounded-xl bg-[#0D1117] flex flex-col items-center justify-center mt-2">
                                <UploadCloud size={28} className="text-text-muted mb-2" />
                                <h3 className="text-md font-bold text-text mb-1">Waiting for AI Scan</h3>
                                <p className="text-xs text-text-muted text-center max-w-[200px]">Go to AI Scanner tab to upload your X-ray.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayedActions.length === 0 && (
                                    <div className="text-text-muted text-sm text-center py-4">No recommended actions currently.</div>
                                )}
                                {displayedActions.map(action => {
                                    const isDone = completedActions.includes(action.id);
                                    const LabelColorClass = isDone ? 'text-text-muted' : action.priorityLabel === 'URGENT' ? 'text-danger' : action.priorityLabel === 'SOON' ? 'text-warning' : 'text-primary';
                                    const ActiveBorderClass = isDone ? 'border-border' : action.priorityLabel === 'URGENT' ? 'border-[#F85149]' : action.priorityLabel === 'SOON' ? 'border-[#D29922]' : 'border-[#2F81F7]';
                                    
                                    return (
                                        <div key={action.id} className={`flex justify-between items-start pt-3 pb-4 pl-4 pr-12 rounded-xl border border-border transition-all cursor-default relative overflow-hidden group hover:border-[#8B949E] ${isDone ? 'bg-[#161B22] opacity-60 grayscale' : 'bg-[#0D1117]'}`}>
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${ActiveBorderClass.replace('border-', 'bg-')}`}></div>
                                            <div className="flex flex-col ml-1">
                                                <span className={`text-[9px] font-black tracking-widest uppercase mb-1.5 ${LabelColorClass}`}>{action.priorityLabel}</span>
                                                <span className={`text-sm font-bold transition-colors mb-1 ${isDone ? 'text-text-muted line-through' : 'text-text'}`}>{action.title}</span>
                                                <span className={`text-xs leading-relaxed ${isDone ? 'text-text-muted line-through' : 'text-text-secondary'}`}>{action.subtitle}</span>
                                            </div>
                                            {!isDone && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setCompletedActions([...completedActions, action.id]); }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-border/50 hover:bg-border text-text-muted hover:text-success absolute right-3 top-1/2 -translate-y-1/2 z-10"
                                                    title="Mark as Done"
                                                >
                                                    <Check size={18} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                {actionsCount > 3 && (
                                    <button 
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="w-full py-2.5 mt-2 rounded-xl border border-border bg-[#0D1117] text-text-secondary text-sm font-bold hover:bg-border hover:text-text transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isExpanded ? 'Show Less' : `Show All (${actionsCount})`}
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="rounded-2xl border border-border p-6"
                        style={{ backgroundColor: '#161B22' }}
                    >
                        <h2 className="text-lg font-bold text-text mb-5" style={{ fontFamily: 'var(--font-serif)' }}>Quick Stats</h2>
                        {!aiPayload ? (
                            <div className="p-8 border border-dashed border-border/50 rounded-xl bg-[#0D1117] flex flex-col items-center justify-center mt-2">
                                <UploadCloud size={28} className="text-text-muted mb-2" />
                                <h3 className="text-md font-bold text-text mb-1">Waiting for AI Scan</h3>
                                <p className="text-xs text-text-muted text-center max-w-[200px]">Go to AI Scanner tab to upload your X-ray.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-text-secondary">Total Issues</span>
                                    <span className="text-sm font-bold text-text">{aiPayload.summary.issuesFound}</span>
                                </div>
                                <hr className="border-border/50" />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-text-secondary">High Risk</span>
                                    <span className="text-sm font-medium text-danger">{aiPayload.summary.highRiskCount}</span>
                                </div>
                                <hr className="border-border/50" />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-text-secondary">Teeth Analyzed</span>
                                    <span className="text-sm font-medium text-text">{aiPayload.summary.teethAnalyzed}</span>
                                </div>
                                <hr className="border-border/50" />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-text-secondary">Last Scan</span>
                                    <span className="text-sm font-medium text-text text-right" style={{ maxWidth: '140px' }}>{formattedDateTime}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>

                </div>
            </div>

        </div>
    );
};
