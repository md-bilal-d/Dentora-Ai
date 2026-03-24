import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Calendar, Check, CheckCircle2, AlertCircle, UploadCloud, Activity, Sparkles, ArrowRight, Eye, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTreatmentStore } from '../store/useTreatmentStore';
import type { ScanResult, ScanDetection } from '../types/dental';

const generateArch = (isUpper: boolean, isChild: boolean = false) => {
    const count = isChild ? 10 : 16;
    const teeth = [];
    const radiusX = 140; 
    const radiusY = 80; // Flatten the arch for better fit
    const centerX = 200;
    const centerY = isUpper ? 140 : 260; // Spread them more

    for (let i = 0; i < count; i++) {
        const angleStr = (i / (count - 1)) * Math.PI;
        let x, y;
        if (isUpper) {
            const angle = Math.PI - angleStr;
            x = centerX + radiusX * Math.cos(angle);
            y = centerY - radiusY * Math.sin(angle);
        } else {
            const angleBottom = Math.PI - angleStr;
            x = centerX + radiusX * Math.cos(angleBottom);
            y = centerY + radiusY * Math.sin(angleBottom);
        }
        let toothId: string | number;
        if (isChild) {
            toothId = isUpper ? String.fromCharCode(74 - i) : String.fromCharCode(75 + i);
        } else {
            // Standard OPG: Left Image = Patient Right (1, 32), Right Image = Patient Left (16, 17)
            toothId = isUpper ? 1 + i : 32 - i;
        }
        teeth.push({ id: toothId, x, y, width: isChild ? 20 : 22, height: isChild ? 22 : 26, isUpper });
    }
    return teeth;
};

const getToothPath = (x: number, y: number, w: number, h: number, isUpper: boolean) => {
    const r = 6;
    const halfW = w / 2;
    const halfH = h / 2;
    const topY = y - halfH;
    const bottomY = y + halfH;
    const leftX = x - halfW;
    const rightX = x + halfW;
    
    // Tapered shape: slightly narrower at the root
    const taper = 4;
    if (isUpper) {
        // Upper tooth: root is at top, crown is at bottom
        return `M ${leftX + taper},${topY + r} 
                Q ${leftX + taper},${topY} ${leftX + taper + r},${topY}
                L ${rightX - taper - r},${topY}
                Q ${rightX - taper},${topY} ${rightX - taper},${topY + r}
                L ${rightX},${bottomY - r}
                Q ${rightX},${bottomY} ${rightX - r},${bottomY}
                L ${leftX + r},${bottomY}
                Q ${leftX},${bottomY} ${leftX},${bottomY - r}
                Z`;
    } else {
        // Lower tooth: crown is at top, root is at bottom
        return `M ${leftX + r},${topY} 
                L ${rightX - r},${topY}
                Q ${rightX},${topY} ${rightX},${topY + r}
                L ${rightX - taper},${bottomY - r}
                Q ${rightX - taper},${bottomY} ${rightX - taper - r},${bottomY}
                L ${leftX + taper + r},${bottomY}
                Q ${leftX + taper},${bottomY} ${leftX + taper},${bottomY - r}
                L ${leftX},${topY + r}
                Q ${leftX},${topY} ${leftX + r},${topY}
                Z`;
    }
};

const TEETH_ADULT = [...generateArch(true, false), ...generateArch(false, false)];
const TEETH_CHILD = [...generateArch(true, true), ...generateArch(false, true)];

type ConditionType = 'MISSING' | 'CARIES' | 'ROOT_CANAL' | 'CROWN' | 'FILLING' | 'BONE_LOSS' | 'INFECTION' | 'IMPACTED' | 'PERIAPICAL_LESION' | 'HEALTHY';

const identifyCondition = (cls: string): ConditionType => {
    if (!cls) return 'HEALTHY';
    const c = cls.toLowerCase();
    if (c.includes('missing')) return 'MISSING';
    if (c.includes('caries') || c.includes('cavity') || c.includes('decay')) return 'CARIES';
    if (c.includes('root') || c.includes('canal')) return 'ROOT_CANAL';
    if (c.includes('crown')) return 'CROWN';
    if (c.includes('filling') || c.includes('restoration')) return 'FILLING';
    if (c.includes('bone') || c.includes('loss')) return 'BONE_LOSS';
    if (c.includes('periapical') || c.includes('lesion') || c.includes('retained root')) return 'PERIAPICAL_LESION';
    if (c.includes('infection') || c.includes('abscess')) return 'INFECTION';
    if (c.includes('impacted')) return 'IMPACTED';
    return 'HEALTHY';
};

const CONDITION_COLORS: Record<string, string> = {
    'Healthy': '#3FB950',              // green
    'Caries': '#F85149',               // red
    'Missing': '#8B949E',              // gray
    'Filling': '#FFFFFF',              // white (like reference)
    'Root Canal Treatment': '#FF00FF', // magenta/pink (like reference)
    'Crown': '#00FFFF',               // cyan (like reference)
    'Implant': '#D29922',             // amber/gold
    'Periapical lesion': '#7F1D1D',    // dark red
};

const getClassColor = (cls: string) => CONDITION_COLORS[cls] || '#8B949E';

const getStyleForCondition = (condition: ConditionType, isPulse: boolean = false) => {
    switch(condition) {
        case 'MISSING': return { fill: 'transparent', stroke: '#8B949E', dash: '4 4', glow: 'none', grad: 'none' };
        case 'CARIES': return { fill: 'url(#grad-caries)', stroke: '#F85149', dash: 'none', glow: '0 0 15px rgba(248,81,73,0.5)', grad: 'grad-caries' };
        case 'ROOT_CANAL': return { fill: 'url(#grad-root-canal)', stroke: '#D29922', dash: 'none', glow: '0 0 15px rgba(210,153,34,0.5)', grad: 'grad-root-canal' };
        case 'CROWN': return { fill: 'url(#grad-crown)', stroke: '#2F81F7', dash: 'none', glow: '0 0 15px rgba(47,129,247,0.5)', grad: 'grad-crown' };
        case 'FILLING': return { fill: 'url(#grad-filling)', stroke: '#0891B2', dash: 'none', glow: '0 0 15px rgba(8,145,178,0.5)', grad: 'grad-filling' };
        case 'BONE_LOSS': return { fill: 'url(#grad-bone-loss)', stroke: '#A371F7', dash: 'none', glow: '0 0 12px rgba(163,113,247,0.4)', grad: 'grad-bone-loss' };
        case 'PERIAPICAL_LESION': return { fill: '#7F1D1D', stroke: '#DC2626', dash: 'none', glow: '0 0 12px rgba(220,38,38,0.6)', pulse: true, grad: 'none' };
        case 'INFECTION': return { fill: '#FF0000', stroke: '#FF0000', dash: 'none', glow: isPulse ? '0 0 24px rgba(255,0,0,1)' : '0 0 12px rgba(255,0,0,0.6)', pulse: true, grad: 'none' };
        case 'IMPACTED': return { fill: 'url(#grad-impacted)', stroke: '#E3B341', dash: 'none', glow: '0 0 15px rgba(227,179,65,0.5)', grad: 'grad-impacted' };
        case 'HEALTHY': return { fill: 'url(#grad-healthy)', stroke: '#484F58', dash: 'none', glow: 'none', grad: 'grad-healthy' };
        default: return { fill: 'url(#grad-healthy)', stroke: '#484F58', dash: 'none', glow: 'none', grad: 'grad-healthy' };
    }
};

const RenderSymbol = ({ condition, x, y }: { condition: ConditionType, x: number, y: number }) => {
    switch(condition) {
        case 'MISSING': return (
            <g stroke="#8B949E" strokeWidth="1.5" strokeLinecap="round">
                <line x1={x-4} y1={y-4} x2={x+4} y2={y+4} />
                <line x1={x+4} y1={y-4} x2={x-4} y2={y+4} />
            </g>
        );
        case 'CARIES': return <circle cx={x} cy={y} r="4" fill="#FFFFFF" shadow-sm />;
        case 'ROOT_CANAL': return (
            <g transform={`translate(${x}, ${y})`}>
                <path d="M-1,-6 L-1,6 M2,-6 L2,6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                <path d="M-4,0 L5,0" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </g>
        );
        case 'CROWN': return (
            <g transform={`translate(${x-5}, ${y-4})`}>
                <path d="M0,0 L10,0 L8,8 L2,8 Z" fill="#FFFFFF" />
            </g>
        );
        case 'FILLING': return <rect x={x-3.5} y={y-3.5} width="7" height="7" fill="#FFFFFF" rx="1.5" />;
        case 'BONE_LOSS': return (
            <path d={`M${x-5},${y-2} L${x},${y+5} L${x+5},${y-2}`} fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        );
        case 'PERIAPICAL_LESION': return (
            <circle cx={x} cy={y+10} r="4" fill="#F85149" fillOpacity="0.8">
                <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
            </circle>
        );
        case 'INFECTION': return (
            <g transform={`translate(${x}, ${y})`}>
                <circle r="5" fill="#FF0000" />
                <text y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="black">!</text>
            </g>
        );
        case 'IMPACTED': return (
            <rect x={x-4} y={y-5} width="8" height="10" fill="none" stroke="#FFFFFF" strokeWidth="2" rx="2" transform={`rotate(45 ${x} ${y})`} />
        );
        case 'HEALTHY': return (
            <circle cx={x} cy={y} r="3" fill="#3FB950" fillOpacity="0.5" />
        );
        default: return null;
    }
};

export const ToothPainLocator = () => {
    const { 
        scanDetections, 
        aiPayload,
        painReports, 
        addPainReport, 
        resolvePainReport, 
        treatments, 
        setTreatments,
        setScanDetections,
        setAiPayload,
        patientInfo
    } = useTreatmentStore();

    const [showAIVision, setShowAIVision] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanError, setScanError] = useState<string | null>(null);
    const [logIndex, setLogIndex] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [imgDims, setImgDims] = useState({ naturalW: 1, naturalH: 1, offsetW: 1, offsetH: 1 });

    const updateDimensions = useCallback(() => {
        if (imageRef.current) {
            setImgDims({
                naturalW: imageRef.current.naturalWidth || 1,
                naturalH: imageRef.current.naturalHeight || 1,
                offsetW: imageRef.current.offsetWidth || 1,
                offsetH: imageRef.current.offsetHeight || 1,
            });
        }
    }, []);

    useEffect(() => {
        const handleResize = () => updateDimensions();
        window.addEventListener('resize', handleResize);
        if (aiPayload) {
            const timer = setTimeout(updateDimensions, 100);
            return () => {
                window.removeEventListener('resize', handleResize);
                clearTimeout(timer);
            };
        }
        return () => window.removeEventListener('resize', handleResize);
    }, [updateDimensions, aiPayload]);

    const LOG_LINES = [
        "Initializing neural network...",
        "Preprocessing OPG image...",
        "Identifying anatomical landmarks...",
        "Running YOLO inferences...",
        "Analyzing periapical regions...",
        "Detecting carious lesions...",
        "Finalizing diagnostic report..."
    ];

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    };

    const handleFile = (fileOrUrl: File | string) => {
        setScanError(null);
        if (typeof fileOrUrl === 'string') {
            setPreview(fileOrUrl);
            setUploadedFile(null);
        } else {
            setPreview(URL.createObjectURL(fileOrUrl));
            setUploadedFile(fileOrUrl);
        }
    };

    const handleScan = async () => {
        if (!preview) return;
        setIsScanning(true);
        setScanError(null);
        setLogIndex(0);
        setScanProgress(0);

        const logInterval = setInterval(() => {
            setLogIndex(prev => (prev < LOG_LINES.length - 1 ? prev + 1 : prev));
        }, 1500);

        const progressInterval = setInterval(() => {
            setScanProgress(prev => (prev < 95 ? prev + Math.random() * 8 + 2 : prev));
        }, 300);

        try {
            let scanResult: ScanResult = null as any;
            let fileToUpload = uploadedFile;
            if (!fileToUpload && preview.startsWith('http')) {
                try {
                    const res = await fetch(preview);
                    const blob = await res.blob();
                    fileToUpload = new File([blob], 'demo_scan.jpg', { type: blob.type });
                } catch (e) { }
            } else if (!fileToUpload && preview.startsWith('/')) {
                try {
                    const res = await fetch(preview);
                    const blob = await res.blob();
                    fileToUpload = new File([blob], 'demo_scan.jpg', { type: blob.type });
                } catch(e) {}
            }

            if (fileToUpload) {
                // Remove the nested try-catch so errors propagate to the outer catch
                const formData = new FormData();
                formData.append("image", fileToUpload);
                const response = await fetch('/ai/api/scan', { method: 'POST', body: formData });
                if (!response.ok) throw new Error("Server error");
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                const mappedDetections: ScanDetection[] = (data.detections || []).map((f: any) => ({
                    tooth_number: f.tooth_number || 0,
                    class: f.class || 'Unknown',
                    severity: f.severity || 'info',
                    confidence: typeof f.confidence === 'number' && f.confidence <= 1 ? f.confidence * 100 : parseFloat(f.confidence),
                    bbox: [f.bbox[0], f.bbox[1], f.bbox[2], f.bbox[3]],
                    description: `Detected ${f.class}`,
                    recommendedAction: `Evaluate ${f.class}`,
                    notes: `AI detected ${f.class} with ${f.confidence}% confidence.`
                }));

                scanResult = {
                    scan_id: data.scan_id || `scan_${Date.now()}`,
                    original_image: data.original_image ? `/ai${data.original_image}` : preview,
                    annotated_image: data.annotated_image ? `/ai${data.annotated_image}` : preview,
                    disease_score: data.disease_score || 0,
                    total_detections: mappedDetections.length,
                    detections: mappedDetections
                };
            } else {
                throw new Error("No image available for scanning.");
            }

            setScanDetections(scanResult.detections);
            const issues = scanResult.detections.filter(d => d.class !== 'Healthy');
            
            setAiPayload({
                timestamp: new Date().toISOString(),
                patientId: patientInfo?.id || "patient",
                summary: {
                    teethAnalyzed: scanResult.detections.length,
                    issuesFound: issues.length,
                    highRiskCount: scanResult.detections.filter(d => d.severity === 'high').length,
                    healthyCount: scanResult.detections.filter(d => d.class === 'Healthy').length
                },
                findings: scanResult.detections,
                imageUrl: scanResult.annotated_image
            });

            setScanProgress(100);
            clearInterval(logInterval);
            clearInterval(progressInterval);
        } catch (err: any) {
            setScanError(err.message || 'Analysis failed');
            clearInterval(logInterval);
            clearInterval(progressInterval);
        } finally {
            setIsScanning(false);
        }
    };
    
    const [chartType, setChartType] = useState<'adult' | 'child'>('adult');
    const [hoveredTooth, setHoveredTooth] = useState<number | string | null>(null);
    const [selectedTooth, setSelectedTooth] = useState<number | string | null>(null);
    const [aiDetailTooth, setAiDetailTooth] = useState<number | string | null>(null);
    const [filter, setFilter] = useState<'all' | 'severe' | 'resolved'>('all');

    const [painLevel, setPainLevel] = useState(5);
    const [painTypes, setPainTypes] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const [toast, setToast] = useState<string | null>(null);
    const [litUpTeeth, setLitUpTeeth] = useState<Set<number | string>>(new Set());
    const [pulseGlow, setPulseGlow] = useState(false);
    const [resolvedFindings, setResolvedFindings] = useState<string[]>([]);
    const [addedSuccessTooth, setAddedSuccessTooth] = useState<string | number | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    // Continuous pulse for infection urgency
    useEffect(() => {
        const int = setInterval(() => setPulseGlow(p => !p), 800);
        return () => clearInterval(int);
    }, []);

    const activeTeeth = chartType === 'adult' ? TEETH_ADULT : TEETH_CHILD;

    // Staggered Animation for AI Scan load
    useEffect(() => {
        if (!scanDetections || scanDetections.length === 0) {
            setLitUpTeeth(new Set(activeTeeth.map(t => t.id))); // instantly show all as default if no scan
            return;
        }

        const findings = scanDetections.filter(d => d.class && !d.class.toLowerCase().includes('healthy'));
        if (findings.length === 0) {
            setLitUpTeeth(new Set(activeTeeth.map(t => t.id)));
            return;
        }

        const sorted = [...findings].sort((a,b) => a.tooth_number - b.tooth_number);
        let delay = 0;
        
        // Start animation clear
        setLitUpTeeth(new Set());
        
        const timeouts: any[] = [];
        const newSet = new Set<string | number>();
        
        sorted.forEach((f, idx) => {
            const t = setTimeout(() => {
                newSet.add(f.tooth_number);
                setLitUpTeeth(new Set(newSet));
                if (idx === sorted.length - 1) {
                    showToast(`Tooth chart updated from AI scan with ${findings.length} findings detected.`);
                    // Also light up the healthy ones after findings
                    const allTeethIds = activeTeeth.map(tooth => tooth.id);
                    setLitUpTeeth(new Set(allTeethIds));
                }
            }, delay);
            timeouts.push(t);
            delay += 100; // staggered delay
        });

        return () => timeouts.forEach(clearTimeout);
    }, [aiPayload, chartType]);

    const handleSave = () => {
        if (!selectedTooth) return;
        addPainReport({
            id: crypto.randomUUID(),
            toothNumber: selectedTooth,
            level: painLevel,
            types: painTypes,
            date: startDate,
            notes,
            resolved: false
        });
        setSelectedTooth(null);
        setPainLevel(5); setPainTypes([]); setNotes('');
    };

    const handleAddToPlan = (toothNumber: string | number, level: number, forcedMode?: string) => {
        const existingMap = new Map(treatments);
        const toothIdStr = `tooth_${String(toothNumber).padStart(2, '0')}`;
        existingMap.set(toothIdStr, {
            id: crypto.randomUUID(),
            toothId: toothIdStr,
            toothNumber: typeof toothNumber === 'number' ? toothNumber : parseInt(String(toothNumber)) || 0,
            mode: (forcedMode || (level >= 7 ? 'ROOT_CANAL' : 'FILLING')) as any,
            crownVariant: 'PORCELAIN',
            fillingVariant: 'COMPOSITE',
            status: 'planned',
            cost: level >= 7 ? 800 : 200,
            date: new Date().toISOString().split('T')[0]
        });
        setTreatments(Array.from(existingMap.values()));
        showToast('Added to treatment plan successfully');
    };

    const getAIDetection = (toothId: number | string) => {
        return scanDetections.find(d => d.tooth_number === toothId);
    };

    // Derived AI Stats
    const scannedFindings = scanDetections.filter(d => d.confidence >= 40 && d.class && !d.class.toLowerCase().includes('healthy'));
    
    const missingCount = scannedFindings.filter(d => identifyCondition(d.class) === 'MISSING').length;
    const cariesCount = scannedFindings.filter(d => identifyCondition(d.class) === 'CARIES').length;
    const restoCount = scannedFindings.filter(d => {
        const cond = identifyCondition(d.class);
        return cond === 'CROWN' || cond === 'FILLING';
    }).length;
    const impactedCount = scannedFindings.filter(d => identifyCondition(d.class) === 'IMPACTED').length;
    const boneLossCount = scannedFindings.filter(d => identifyCondition(d.class) === 'BONE_LOSS').length;
    const urgentCount = scannedFindings.filter(d => d.severity === 'high' || identifyCondition(d.class) === 'PERIAPICAL_LESION').length;

    // Chart Click Handler
    const handleToothClick = (tId: string | number) => {
        const aiDet = getAIDetection(tId);
        if (aiDet && !aiDet.class.toLowerCase().includes('healthy')) {
            // Show AI overlay detail
            setAiDetailTooth(tId);
            setSelectedTooth(null);
        } else {
            // Show manual pain modal
            const exist = painReports.find(r => r.toothNumber === tId && !r.resolved);
            if (exist) { setPainLevel(exist.level); setPainTypes(exist.types); setStartDate(exist.date); setNotes(exist.notes); }
            else { setPainLevel(5); setPainTypes([]); setNotes(''); }
            setSelectedTooth(tId);
            setAiDetailTooth(null);
        }
    };

    // History Log Processing — stable IDs (no array index) + deduplication
    const rawAiFindings = (aiPayload?.findings || [])
        .filter(d => d.class && !d.class.toLowerCase().includes('healthy'));

    // Deduplicate: keep highest-confidence entry per tooth+class
    const deduped = new Map<string, typeof rawAiFindings[number]>();
    for (const det of rawAiFindings) {
        const key = `${det.tooth_number}-${det.class}`;
        const existing = deduped.get(key);
        if (!existing || det.confidence > existing.confidence) {
            deduped.set(key, det);
        }
    }

    const aiEntries = Array.from(deduped.values()).map(det => {
        const entryId = `ai-${det.tooth_number}-${det.class}`;
        return {
            id: entryId,
            isAI: true,
            toothNumber: det.tooth_number,
            level: det.severity?.toLowerCase() === 'high' ? 8 : det.severity?.toLowerCase() === 'medium' ? 5 : 2,
            diseaseName: det.class,
            severity: det.severity,
            confidence: det.confidence,
            types: [det.class],
            date: aiPayload?.timestamp || '',
            notes: det.description || det.notes || '',
            resolved: resolvedFindings.includes(entryId)
        };
    });

    const userEntries = painReports.map(r => ({ 
        ...r, 
        isAI: false, 
        diseaseName: '', 
        severity: r.level >= 7 ? 'high' : r.level >= 4 ? 'medium' : 'low', 
        confidence: 100 
    }));
    
    const allEntries = [...userEntries, ...aiEntries].sort((a, b) => {
        if (a.resolved && !b.resolved) return 1;
        if (!a.resolved && b.resolved) return -1;
        return 0;
    });

    const totalReportsCount = allEntries.length;
    const severeCount = allEntries.filter(e => e.severity?.toLowerCase() === 'high' && !e.resolved).length;
    const resolvedCount = allEntries.filter(e => e.resolved).length;

    const filteredEntries = allEntries.filter(e => {
        if (filter === 'severe') return e.severity?.toLowerCase() === 'high' && !e.resolved;
        if (filter === 'resolved') return e.resolved;
        return true; // for 'all' or any other state
    });

    const handleResolveAI = (id: string) => {
        setResolvedFindings(prev => [...prev, id]);
    };

    const toggleType = (type: string) => setPainTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

    return (
        <div className="w-full lg:h-[calc(100vh-220px)] flex flex-col lg:flex-row gap-6 overflow-y-auto lg:overflow-hidden relative custom-scrollbar" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
            
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, x: 100 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 100, transition: { duration: 0.3, ease: 'easeOut' } }}
                        className="fixed bottom-[24px] right-[24px] z-[9999] flex items-center justify-between"
                        style={{
                            backgroundColor: '#1C2128',
                            borderLeft: '4px solid #3FB950',
                            borderRadius: '10px',
                            padding: '14px 20px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                            minWidth: '320px',
                            maxWidth: '400px'
                        }}
                    >
                        <div className="flex items-center gap-3 flex-1 mr-4">
                            <CheckCircle2 size={18} className="text-[#3FB950] shrink-0" />
                            <span className="text-white text-[14px] font-medium leading-snug">{toast}</span>
                        </div>
                        <button onClick={() => setToast(null)} className="shrink-0 text-[#8B949E] hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left: SVG Interactive Chart */}
            <div className="flex-[1.5] flex flex-col rounded-2xl border border-border overflow-hidden bg-[#161B22]">
                
                {/* AI Summary Bar Overlay */}
                {scanDetections.length > 0 ? (
                    <div className="w-full shrink-0 flex items-center gap-1.5 p-1.5 border-b border-border bg-[#0D1117] overflow-x-auto no-scrollbar">
                        <div className="px-3 py-1.5 rounded-lg border border-border bg-[#161B22] flex items-center gap-2 shrink-0">
                            <Activity size={14} className="text-text-muted"/>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Total Analyzed</span>
                            <span className="text-sm font-black text-white">{scanDetections.length > 0 ? 32 : 0}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-border bg-[#161B22] flex items-center gap-2 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8B949E]"></span>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Missing</span>
                            <span className="text-sm font-black text-[#8B949E]">{missingCount}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-border bg-[#161B22] flex items-center gap-2 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F85149]"></span>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Cavities</span>
                            <span className="text-sm font-black text-[#F85149]">{cariesCount}</span>
                        </div>
                        <div className="px-2 py-1 rounded-md border border-border bg-[#161B22] flex items-center gap-1.5 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-[#2F81F7]"></span>
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wide">Restorations</span>
                            <span className="text-sm font-black text-[#2F81F7]">{restoCount}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-border bg-[#161B22] flex items-center gap-2 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#E3B341]"></span>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Impacted</span>
                            <span className="text-sm font-black text-[#E3B341]">{impactedCount}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg border border-border bg-[#161B22] flex items-center gap-2 shrink-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#A371F7]"></span>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Bone Loss</span>
                            <span className="text-sm font-black text-[#A371F7]">{boneLossCount}</span>
                        </div>
                        <div className="px-2 py-1 rounded-md border border-danger/30 bg-danger/5 flex items-center gap-1.5 shrink-0">
                            <AlertCircle size={12} className="text-danger"/>
                            <span className="text-[9px] font-bold text-danger uppercase tracking-wide">Urgent</span>
                            <span className="text-sm font-black text-danger">{urgentCount}</span>
                        </div>
                    </div>
                ) : null}

                {/* Sub-header Controls */}
                <div className="w-full flex justify-between items-center px-6 py-3 shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-text" style={{ fontFamily: 'var(--font-serif)' }}>AI Tooth Map</h2>
                        {scanDetections.length === 0 && !isScanning && !preview && (
                             <div className="flex gap-2">
                                 <input ref={inputRef} type="file" accept="image/*" className="hidden"
                                     onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); setTimeout(handleScan, 100); } }} />
                                 <button onClick={() => inputRef.current?.click()} className="px-3 py-1.5 bg-surface border border-border rounded-md text-xs font-bold text-text hover:text-primary transition-colors flex items-center gap-2">
                                     <UploadCloud size={14} /> Upload X-Ray
                                 </button>
                                 <button onClick={() => { handleFile('/scan_results/647a29da_input.jpg'); setTimeout(handleScan, 100); }} className="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-bold shadow-sm hover:shadow-[0_0_10px_rgba(47,129,247,0.4)] transition-all flex items-center gap-2">
                                     <Sparkles size={14} /> Demo Scan
                                 </button>
                             </div>
                        )}
                    </div>
                    <div className="flex gap-2 p-1 rounded-lg bg-[#0D1117]">
                        {aiPayload && (
                            <button 
                                onClick={() => setShowAIVision(!showAIVision)} 
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${showAIVision ? 'bg-[#BC8CFF] text-white shadow-[0_0_12px_rgba(188,140,255,0.4)]' : 'text-text-secondary hover:text-text'}`}
                            >
                                <Brain size={14} /> {showAIVision ? 'Back to Map' : 'AI Vision'}
                            </button>
                        )}
                        <button onClick={() => setChartType('adult')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${chartType === 'adult' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'}`}>Adult</button>
                        <button onClick={() => setChartType('child')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${chartType === 'child' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'}`}>Child</button>
                    </div>
                </div>

                {/* Interactive SVG Group OR Scanning Animation */}
                <div 
                    className="flex-1 w-full flex items-center justify-center relative min-h-0 bg-[#0D1117]/30 backdrop-blur-[2px] rounded-b-2xl"
                    onDrop={handleDrop} onDragOver={handleDrag} onDragEnter={handleDrag} onDragLeave={handleDrag}
                    style={dragActive ? { border: '2px dashed #2F81F7', backgroundColor: 'rgba(47,129,247,0.1)' } : {}}
                >
                    {isScanning ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#0D1117] rounded-b-2xl">
                            <div className="w-full max-w-sm relative flex items-center justify-center overflow-hidden rounded-xl border border-border shadow-2xl">
                                <img src={preview!} alt="Scanning" className="w-full h-auto max-h-[300px] object-contain opacity-30 grayscale" />
                                <div className="absolute inset-x-0 h-[2px] bg-primary z-10" style={{ animation: 'scanline 3s infinite linear' }} />
                                <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px]" />
                            </div>
                            <div className="w-full max-w-sm mt-8">
                                <div className="flex justify-between mb-2"><span className="text-[10px] text-text-muted font-bold tracking-widest uppercase">SCAN PROGRESS</span><span className="font-bold text-primary text-xs">{Math.round(scanProgress)}%</span></div>
                                <div className="h-1 bg-border rounded-full overflow-hidden mb-4">
                                    <motion.div className="h-full bg-primary shadow-[0_0_10px_rgba(47,129,247,0.8)]" animate={{ width: `${scanProgress}%` }} />
                                </div>
                                <div className="font-mono text-[10px] text-success flex items-center gap-2 justify-center">
                                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-[0_0_5px_#3FB950]" /> {LOG_LINES[logIndex]}
                                </div>
                            </div>
                        </div>
                    ) : scanError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#0D1117] rounded-b-2xl">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 border border-red-500/20 bg-red-500/10 rounded-2xl max-w-sm">
                                <X size={32} className="text-red-500 mx-auto mb-4" />
                                <p className="text-red-500 font-bold mb-6 text-sm leading-relaxed">{scanError}</p>
                                <button onClick={() => { setScanError(null); setPreview(null); }} className="px-6 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold hover:bg-red-500/30 transition-colors">Try Again</button>
                            </motion.div>
                        </div>
                    ) : showAIVision && aiPayload ? (
                        /* AI VISION IMAGE VIEW - REPLICATED FROM SCANNER */
                        <div className="w-full h-full flex items-center justify-center p-4 relative overflow-hidden bg-[#0D1117]">
                            <div className="relative inline-block max-w-full max-h-full">
                                <img 
                                    ref={imageRef}
                                    onLoad={updateDimensions}
                                    src={aiPayload.imageUrl} 
                                    className="max-w-full max-h-[calc(100vh-320px)] rounded-lg shadow-2xl contrast-110" 
                                    alt="Annotated X-ray"
                                />
                                
                                {/* Inference Bounding Boxes */}
                                {(() => {
                                    if (imgDims.offsetW <= 1) return null;
                                    const renderedBoxes: any[] = [];
                                    
                                    return (aiPayload.findings || []).map((det, i) => {
                                        // Skip healthy boxes to keep it focused on issues in the locator
                                        if (det.class.toLowerCase().includes('healthy')) return null;

                                        const isNormalized = det.bbox.every((c: number) => c <= 1); 
                                        const scaleX = isNormalized ? imgDims.offsetW : (imgDims.offsetW / imgDims.naturalW);
                                        const scaleY = isNormalized ? imgDims.offsetH : (imgDims.offsetH / imgDims.naturalH);
                                        
                                        const x = det.bbox[0] * scaleX;
                                        const y = det.bbox[1] * scaleY;
                                        const w = det.bbox[2] * scaleX;
                                        const h = det.bbox[3] * scaleY;

                                        let labelY = y - 18;
                                        let isBelow = false;
                                        if (labelY < 10) { labelY = y + h + 2; isBelow = true; }
                                        while (renderedBoxes.some(box => Math.abs(box.x - x) < 60 && Math.abs(box.labelY - labelY) < 20)) {
                                            labelY += isBelow ? 16 : -16;
                                        }
                                        renderedBoxes.push({ x, labelY });

                                        const isHovered = hoveredTooth === det.tooth_number;
                                        const isSelected = aiDetailTooth === det.tooth_number;
                                        const color = getClassColor(det.class);

                                        return (
                                            <div key={`box-wrapper-${i}`}>
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: isHovered || isSelected ? 1.05 : 1, zIndex: isHovered || isSelected ? 30 : 20 }}
                                                    onClick={() => setAiDetailTooth(det.tooth_number)}
                                                    onMouseEnter={() => setHoveredTooth(det.tooth_number)}
                                                    onMouseLeave={() => setHoveredTooth(null)}
                                                    className="absolute cursor-pointer"
                                                    style={{
                                                        left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`,
                                                        borderWidth: '2px', borderStyle: 'solid', borderColor: color, 
                                                        backgroundColor: isSelected ? `${color}40` : isHovered ? `${color}20` : 'transparent', 
                                                        borderRadius: '2px',
                                                        boxShadow: isHovered || isSelected ? `0 0 15px ${color}` : 'none'
                                                    }}
                                                />
                                                <motion.div 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1, zIndex: isHovered || isSelected ? 31 : 21 }}
                                                    className="absolute flex items-center whitespace-nowrap text-[9px] font-black leading-none pointer-events-none uppercase tracking-tighter"
                                                    style={{
                                                        left: `${x}px`, top: `${labelY}px`, backgroundColor: color, 
                                                        color: (color === '#FFFFFF' || color === '#00FFFF' || color === '#D29922') ? '#000' : '#FFF', 
                                                        padding: '2px 5px', borderRadius: '2px'
                                                    }}
                                                >
                                                    T{det.tooth_number} {det.class}
                                                </motion.div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    ) : (
                        <svg viewBox="0 20 400 360" className="w-full max-h-full pointer-events-auto filter drop-shadow-[0_0_30px_rgba(47,129,247,0.05)]">
                        <defs>
                            <linearGradient id="grad-healthy" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#30363D" />
                                <stop offset="100%" stopColor="#21262D" />
                            </linearGradient>
                            <linearGradient id="grad-caries" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#F85149" />
                                <stop offset="100%" stopColor="#7F1D1D" />
                            </linearGradient>
                            <linearGradient id="grad-root-canal" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#D29922" />
                                <stop offset="100%" stopColor="#9A6700" />
                            </linearGradient>
                            <linearGradient id="grad-crown" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#2F81F7" />
                                <stop offset="100%" stopColor="#1D4ED8" />
                            </linearGradient>
                            <linearGradient id="grad-filling" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#0891B2" />
                                <stop offset="100%" stopColor="#0E7490" />
                            </linearGradient>
                            <linearGradient id="grad-bone-loss" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#A371F7" />
                                <stop offset="100%" stopColor="#6E40C9" />
                            </linearGradient>
                            <linearGradient id="grad-impacted" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#E3B341" />
                                <stop offset="100%" stopColor="#B08800" />
                            </linearGradient>
                            <linearGradient id="grad-arch" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#2F81F7" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>

                        <path d="M 60 140 Q 200 10 340 140" fill="none" stroke="url(#grad-arch)" strokeWidth="40" strokeLinecap="round" />
                        <path d="M 60 260 Q 200 390 340 260" fill="none" stroke="url(#grad-arch)" strokeWidth="40" strokeLinecap="round" />

                        {activeTeeth.map(t => {
                            const aiDet = getAIDetection(t.id);
                            // Visual condition based purely on AI scan
                            let condition: ConditionType = 'HEALTHY';
                            if (aiDet) condition = identifyCondition(aiDet.class);
                            
                            const style = getStyleForCondition(condition, pulseGlow);
                            
                            if (aiDet && condition !== 'HEALTHY') {
                                const exactColor = getClassColor(aiDet.class);
                                style.stroke = exactColor;
                                style.glow = pulseGlow && (aiDet.severity === 'high' || condition === 'PERIAPICAL_LESION') 
                                    ? `0 0 24px ${exactColor}` 
                                    : `0 0 12px ${exactColor}CC`;
                            }

                            const isLit = litUpTeeth.has(t.id);
                            
                            // User reports overlay logic purely on Stroke if the tooth was otherwise healthy to the AI
                            const userReport = painReports.find(r => r.toothNumber === t.id && !r.resolved);
                            if (!aiDet && userReport) {
                                style.stroke = userReport.level >= 7 ? '#F85149' : userReport.level >= 4 ? '#D29922' : '#3FB950';
                                style.fill = '#161B22'; // distinct un-scanned looking fill
                            }
                            if (!aiDet && condition === 'HEALTHY' && !userReport) {
                                style.stroke = '#484F58';
                                style.fill = '#30363D';
                            } else if (aiDet && condition === 'HEALTHY') {
                                // Explicitly designated healthy by AI
                                style.stroke = '#3FB950';
                                style.fill = '#30363D';
                            }

                            return (
                                <g 
                                    key={t.id} 
                                    className="cursor-pointer transition-transform duration-300"
                                    style={{ 
                                        transformOrigin: `${t.x}px ${t.y}px`, 
                                        transform: (hoveredTooth === t.id || selectedTooth === t.id || aiDetailTooth === t.id) ? 'scale(1.3)' : 'scale(1)',
                                        opacity: isLit ? 1 : 0.15,
                                        transition: 'opacity 0.6s ease-out, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                    }}
                                    onMouseEnter={() => setHoveredTooth(t.id)}
                                    onMouseLeave={() => setHoveredTooth(null)}
                                    onClick={() => handleToothClick(t.id)}
                                >
                                    {/* Glassmorphic Tooth Base */}
                                    <path 
                                        d={getToothPath(t.x, t.y, t.width, t.height, t.isUpper)}
                                        fill={style.fill} 
                                        stroke={style.stroke} 
                                        strokeWidth="1.5"
                                        strokeDasharray={style.dash}
                                        style={style.glow !== 'none' ? { filter: `drop-shadow(${style.glow})` } : {}}
                                        className="transition-all duration-500"
                                    />

                                    {/* External Tooth Number Label */}
                                    <text 
                                        x={t.x} 
                                        y={t.isUpper ? t.y - t.height/2 - 12 : t.y + t.height/2 + 15} 
                                        textAnchor="middle" 
                                        fontSize="10" 
                                        fontWeight="900" 
                                        fill={condition === 'MISSING' || !isLit ? '#485058' : (hoveredTooth === t.id ? '#FFFFFF' : '#8B949E')}
                                        style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                                    >
                                        {t.id}
                                    </text>
                                    
                                    {/* Render inner symbol ONLY for findings */}
                                    {aiDet && (
                                        <RenderSymbol condition={condition} x={t.x} y={t.y} />
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                    )}

                    {/* AI Detail Modal Overlay */}
                    <AnimatePresence>
                        {aiDetailTooth && (() => {
                            const det = getAIDetection(aiDetailTooth);
                            if (!det) return null;
                            
                            const conditionRaw = identifyCondition(det.class);
                            let badgeBg = '#484F58';
                            if (conditionRaw === 'CARIES') badgeBg = '#F85149';
                            if (conditionRaw === 'ROOT_CANAL') badgeBg = '#D29922';
                            if (conditionRaw === 'CROWN') badgeBg = '#2F81F7';
                            if (conditionRaw === 'FILLING') badgeBg = '#0891B2';
                            if (conditionRaw === 'PERIAPICAL_LESION') badgeBg = '#7F1D1D';

                            let sevColor = '#3FB950'; // MILD
                            if (det.severity === 'high' || conditionRaw === 'PERIAPICAL_LESION') sevColor = '#F85149';
                            if (det.severity === 'medium') sevColor = '#D29922';

                            const isAdded = addedSuccessTooth === aiDetailTooth;

                            return (
                                <div className="fixed inset-0 z-50 flex flex-col items-center justify-end md:justify-center px-[16px] pb-[16px] md:p-0 pointer-events-none">
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm pointer-events-auto"
                                        onClick={() => setAiDetailTooth(null)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full md:w-[380px] bg-[#1C2128] border border-[#30363D] rounded-[16px] p-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col relative z-10 pointer-events-auto"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-[28px] font-bold text-white tracking-wide" style={{ fontFamily: '"Playfair Display", serif' }}>
                                                T-{aiDetailTooth}
                                            </h2>
                                            <button onClick={() => setAiDetailTooth(null)} className="w-[32px] h-[32px] rounded-full bg-[#30363D] flex items-center justify-center hover:bg-[#484F58] transition-colors shrink-0">
                                                <X size={16} className="text-white" />
                                            </button>
                                        </div>
                                        
                                        <div className="w-full h-[1px] bg-[#30363D] mb-5"></div>
                                        
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-[14px] py-[6px] rounded-[20px] text-[12px] font-bold text-white uppercase tracking-wider" style={{ backgroundColor: badgeBg }}>
                                                {det.class}
                                            </span>
                                            <span className="px-[14px] py-[6px] rounded-[20px] text-[12px] font-bold uppercase tracking-wider border bg-transparent" style={{ color: sevColor, borderColor: sevColor }}>
                                                {det.severity}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-4">
                                            <Sparkles size={14} className="text-[#8B949E]" />
                                            <span className="text-[13px] font-bold text-[#8B949E]">AI Confidence: {det.confidence.toFixed(1)}%</span>
                                        </div>

                                        <p className="text-white text-[15px] font-normal leading-[1.6] py-[12px] mb-2">
                                            {det.description || det.notes || `AI successfully detected ${det.class} present at position T-${aiDetailTooth}.`}
                                        </p>

                                        {det.recommendedAction && (
                                            <div className="bg-[#0D1117] rounded-[10px] p-[16px] mb-6">
                                                <span className="text-[11px] uppercase text-[#8B949E] tracking-[0.05em] font-bold block mb-2">
                                                    Recommended Action
                                                </span>
                                                <div className="flex items-start gap-2.5">
                                                    <ArrowRight size={16} className="text-[#2F81F7] shrink-0 mt-0.5" />
                                                    <span className="text-white text-[14px] font-medium leading-snug">
                                                        {det.recommendedAction}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-[10px] mt-auto">
                                            <button 
                                                onClick={() => {
                                                    handleAddToPlan(aiDetailTooth, det.severity==='high'?8:3, 'FILLING');
                                                    setAddedSuccessTooth(aiDetailTooth);
                                                    setTimeout(() => setAddedSuccessTooth(null), 2000);
                                                }}
                                                className={`w-full h-[48px] rounded-[10px] flex items-center justify-center gap-2 font-bold text-[14px] transition-colors ${isAdded ? 'bg-[#3FB950] text-white shadow-[0_0_20px_rgba(63,185,80,0.4)]' : 'bg-[#2F81F7] hover:bg-[#1D6FE8] text-white shadow-md'}`}
                                            >
                                                {isAdded ? (
                                                    <><Check size={18} /> Added Successfully</>
                                                ) : (
                                                    <><Plus size={18} /> Add to Treatment Plan</>
                                                )}
                                            </button>
                                            <button 
                                                onClick={() => setAiDetailTooth(null)}
                                                className="w-full h-[48px] rounded-[10px] bg-transparent border border-[#30363D] hover:border-[#8B949E] hover:bg-[#21262D] text-white font-medium text-[14px] flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Eye size={18} /> Mark as Monitored
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })()}
                    </AnimatePresence>
                </div>

                {/* Legend Below Chart */}
                <div className="w-full border-t border-border p-4 bg-[#0D1117] flex justify-center gap-x-6 gap-y-3 flex-wrap shrink-0">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3FB950]"></div><span className="text-[11px] font-bold text-text-muted">Healthy</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#F85149]"></div><span className="text-[11px] font-bold text-text-muted">Caries</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-dashed border-[#8B949E] flex items-center justify-center"><X size={8} className="text-[#8B949E]" /></div><span className="text-[11px] font-bold text-text-muted">Missing</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FFFFFF]"></div><span className="text-[11px] font-bold text-text-muted">Filling</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FF00FF]"></div><span className="text-[11px] font-bold text-text-muted">Root Canal Treatment</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#00FFFF]"></div><span className="text-[11px] font-bold text-text-muted">Crown</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#D29922]"></div><span className="text-[11px] font-bold text-text-muted">Implant</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#7F1D1D] shadow-[0_0_8px_rgba(127,29,29,0.5)]"></div><span className="text-[11px] font-bold text-text-muted">Periapical Lesion</span></div>
                </div>
            </div>

            <div className="flex-1 w-full lg:max-w-[420px] rounded-2xl border border-border p-5 flex flex-col overflow-hidden bg-[#161B22]">
                    <div className="mb-5 shrink-0 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-text" style={{ fontFamily: 'var(--font-serif)' }}>Symptom History</h2>
                        <div className="flex bg-[#0D1117] p-1 rounded-lg border border-border">
                            <button onClick={() => setFilter('all')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'}`}>All</button>
                            <button onClick={() => setFilter('severe')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filter === 'severe' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'}`}>Severe</button>
                            <button onClick={() => setFilter('resolved')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filter === 'resolved' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'}`}>Resolved</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-[#0D1117] p-2.5 rounded-xl border border-border mb-4 shrink-0">
                        <div className="flex flex-col items-center flex-1 border-r border-border">
                            <span className="text-text font-black text-lg">{totalReportsCount}</span>
                            <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Total Reports</span>
                        </div>
                        <div className="flex flex-col items-center flex-1 border-r border-border">
                            <span className="text-danger font-black text-lg">{severeCount}</span>
                            <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Severe</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                            <span className="text-success font-black text-lg">{resolvedCount}</span>
                            <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Resolved</span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[400px] lg:min-h-0 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-2">
                        {filteredEntries.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-60 min-h-[200px]">
                                <div className="text-4xl mb-3">🦷</div>
                                <p className="font-bold text-text-secondary text-sm">No symptoms reported yet.</p>
                                <p className="text-xs">Click on any tooth above to report pain.</p>
                            </div>
                        ) : (
                            filteredEntries.map(entry => (
                                <div 
                                    key={entry.id} 
                                    className={`p-2 border rounded-lg transition-all ${entry.resolved ? 'border-border opacity-50 bg-[#0D1117]' : 'border-border hover:border-border/80 bg-[#0D1117] shadow-sm'}`}
                                >
                                    <div className="flex justify-between items-center mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-1.5 py-0.5 bg-[#161B22] text-text border border-border font-bold text-[10px] rounded shadow-inner">
                                                T-{entry.toothNumber}
                                            </span>
                                            {entry.resolved ? (
                                                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded text-success bg-success/10 border border-success/20 flex items-center gap-1">
                                                    <Check size={10}/> Resolved
                                                </span>
                                            ) : (
                                                <span className={`px-1.5 py-0.5 text-[9px] font-bold tracking-wide rounded text-white ${entry.level >= 7 ? 'bg-[#F85149]' : entry.level >= 4 ? 'bg-[#D29922]' : 'bg-[#3FB950]'}`}>
                                                    {entry.level >= 7 ? 'Severe' : entry.level >= 4 ? 'Moderate' : 'Mild'}
                                                </span>
                                            )}
                                        </div>

                                        {entry.isAI ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="px-1.5 py-0.5 bg-[#BC8CFF]/15 text-[#BC8CFF] border border-[#BC8CFF]/30 text-[9px] font-black uppercase tracking-widest rounded">
                                                    AI DETECTED
                                                </span>
                                                <span className="text-[10px] font-bold text-[#2F81F7]">
                                                    {entry.confidence?.toFixed(1)}% Conf.
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-text-muted font-bold flex items-center gap-1">
                                                <Calendar size={10}/>
                                                {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col gap-1">
                                        <div className={`flex flex-wrap gap-1 ${entry.resolved && 'opacity-70'}`}>
                                            {entry.types.map((t, idx) => (
                                                <span key={idx} className="px-1.5 py-0.5 border border-border text-text-secondary text-[9px] font-bold rounded bg-[#161B22]">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                        {entry.notes && (
                                            <p className={`text-[11px] text-text-secondary leading-snug mt-0.5 ${entry.resolved && 'line-through decoration-text-muted'}`}>
                                                "{entry.notes}"
                                            </p>
                                        )}
                                    </div>

                                    {!entry.resolved && (
                                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
                                            <button 
                                                onClick={() => handleAddToPlan(entry.toothNumber, entry.level)}
                                                className="flex-1 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-[10px] rounded transition-colors border border-primary/20 flex items-center justify-center gap-1.5" 
                                            >
                                                <Plus size={12} /> Add to Plan
                                            </button>
                                            <button 
                                                onClick={() => entry.isAI ? handleResolveAI(entry.id) : resolvePainReport(entry.id)}
                                                className="flex-1 py-1 bg-[#161B22] text-text-secondary hover:text-text font-bold text-[10px] rounded transition-colors border border-border flex items-center justify-center gap-1.5"
                                            >
                                                Mark Resolved
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            {/* Pain Assessment Modal */}
            <AnimatePresence>
                {selectedTooth && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setSelectedTooth(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border border-border"
                            style={{ backgroundColor: '#161B22', fontFamily: 'var(--font-sans)' }}
                        >
                            <div className="p-5 border-b border-border flex items-center justify-between bg-[#0D1117]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 shadow-sm border border-border rounded-xl flex items-center justify-center text-text font-black text-lg bg-[#161B22]">
                                        {selectedTooth}
                                    </div>
                                    <h2 className="text-xl font-bold text-text" style={{ fontFamily: 'var(--font-serif)' }}>Pain Assessment</h2>
                                </div>
                                <button onClick={() => setSelectedTooth(null)} className="p-2 text-text-muted hover:bg-surface-elevated rounded-full transition-colors"><X size={20}/></button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-bold text-text-secondary">Pain Level (1-10)</label>
                                        <span className={`text-xl font-black ${painLevel >= 7 ? 'text-danger' : painLevel >= 4 ? 'text-warning' : 'text-warning/70'}`}>{painLevel}</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="10" 
                                        value={painLevel} 
                                        onChange={(e) => setPainLevel(parseInt(e.target.value))}
                                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
                                        style={{ background: `linear-gradient(to right, #3FB950, #D29922, #F85149)` }}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-text-secondary block mb-3">Pain Symptoms</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Sharp', 'Dull', 'Throbbing', 'Sensitivity', 'Pressure'].map(type => (
                                            <button 
                                                key={type}
                                                onClick={() => toggleType(type)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${painTypes.includes(type) ? 'bg-primary border-primary text-white shadow-[0_0_10px_rgba(47,129,247,0.3)]' : 'border-border text-text-secondary hover:border-text-muted'}`}
                                                style={{ backgroundColor: painTypes.includes(type) ? undefined : '#0D1117' }}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-text-secondary block mb-2">When did it start?</label>
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" style={{ backgroundColor: '#0D1117', color: 'white', padding: '8px 12px', border: '1px solid #30363D', borderRadius: '8px' }} />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-text-secondary block mb-2">Clinical Notes</label>
                                    <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe triggers, duration..." className="w-full resize-none custom-scrollbar p-3" style={{ backgroundColor: '#0D1117', color: 'white', border: '1px solid #30363D', borderRadius: '8px' }}></textarea>
                                </div>
                            </div>

                            <div className="p-5 border-t border-border flex gap-3 bg-[#0D1117]">
                                <button onClick={() => setSelectedTooth(null)} className="flex-1 py-3 border border-border text-text-secondary font-bold rounded-xl transition-colors hover:bg-surface-elevated bg-[#161B22]">Cancel</button>
                                <button onClick={handleSave} className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-[0_0_15px_rgba(47,129,247,0.3)] transition-colors">Save Report</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
