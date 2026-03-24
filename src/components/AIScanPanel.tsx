import { useState, useEffect, useRef, useCallback } from 'react';
import { useTreatmentStore } from '../store/useTreatmentStore';
import type { ScanResult, ScanDetection } from '../types/dental';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    Sparkles, 
    X, 
    Activity,
    Grid,
    LayoutList,
    RotateCcw
} from 'lucide-react';

/* ─── Standard OPG Tooth Map ─────────────────────────────────────────
   Anatomically accurate OPG tooth positions (Universal Numbering System)
   ──────────────────────────────────────────────────────────────────── */
export interface ToothMapEntry {
    id: number;
    name: string;
    region: 'upper-right' | 'upper-left' | 'lower-left' | 'lower-right';
    bbox: [number, number, number, number]; // [x%, y%, w%, h%]
}

export const OPG_TOOTH_MAP: ToothMapEntry[] = [
    // Upper Jaw (UR -> UL): Stretched across 15-85%
    // Formula roughly: y = 0.3 * (x - 0.5)^2 + 0.38
    { id: 1, name: 'UR Third Molar', region: 'upper-right', bbox: [0.15, 0.42, 0.05, 0.09] },
    { id: 2, name: 'UR Second Molar', region: 'upper-right', bbox: [0.21, 0.41, 0.05, 0.09] },
    { id: 3, name: 'UR First Molar', region: 'upper-right', bbox: [0.27, 0.40, 0.05, 0.09] },
    { id: 4, name: 'UR Second Premolar', region: 'upper-right', bbox: [0.33, 0.39, 0.04, 0.09] },
    { id: 5, name: 'UR First Premolar', region: 'upper-right', bbox: [0.38, 0.385, 0.04, 0.09] },
    { id: 6, name: 'UR Canine', region: 'upper-right', bbox: [0.42, 0.38, 0.035, 0.09] },
    { id: 7, name: 'UR Lateral Incisor', region: 'upper-right', bbox: [0.46, 0.38, 0.03, 0.09] },
    { id: 8, name: 'UR Central Incisor', region: 'upper-right', bbox: [0.495, 0.38, 0.035, 0.09] },
    { id: 9, name: 'UL Central Incisor', region: 'upper-left', bbox: [0.505, 0.38, 0.035, 0.09] },
    { id: 10, name: 'UL Lateral Incisor', region: 'upper-left', bbox: [0.54, 0.38, 0.03, 0.09] },
    { id: 11, name: 'UL Canine', region: 'upper-left', bbox: [0.58, 0.38, 0.035, 0.09] },
    { id: 12, name: 'UL First Premolar', region: 'upper-left', bbox: [0.62, 0.385, 0.04, 0.09] },
    { id: 13, name: 'UL Second Premolar', region: 'upper-left', bbox: [0.67, 0.39, 0.04, 0.09] },
    { id: 14, name: 'UL First Molar', region: 'upper-left', bbox: [0.73, 0.40, 0.05, 0.09] },
    { id: 15, name: 'UL Second Molar', region: 'upper-left', bbox: [0.79, 0.41, 0.05, 0.09] },
    { id: 16, name: 'UL Third Molar', region: 'upper-left', bbox: [0.85, 0.42, 0.05, 0.09] },

    // Lower Jaw (LL -> LR): Mirroring the arch
    // Formula roughly: y = -0.3 * (x - 0.5)^2 + 0.62
    { id: 17, name: 'LL Third Molar', region: 'lower-left', bbox: [0.85, 0.58, 0.05, 0.09] },
    { id: 18, name: 'LL Second Molar', region: 'lower-left', bbox: [0.79, 0.59, 0.05, 0.09] },
    { id: 19, name: 'LL First Molar', region: 'lower-left', bbox: [0.73, 0.60, 0.05, 0.09] },
    { id: 20, name: 'LL Second Premolar', region: 'lower-left', bbox: [0.67, 0.61, 0.04, 0.09] },
    { id: 21, name: 'LL First Premolar', region: 'lower-left', bbox: [0.62, 0.615, 0.04, 0.09] },
    { id: 22, name: 'LL Canine', region: 'lower-left', bbox: [0.58, 0.62, 0.035, 0.09] },
    { id: 23, name: 'LL Lateral Incisor', region: 'lower-left', bbox: [0.54, 0.62, 0.03, 0.09] },
    { id: 24, name: 'LL Central Incisor', region: 'lower-left', bbox: [0.505, 0.62, 0.035, 0.09] },
    { id: 25, name: 'LR Central Incisor', region: 'lower-right', bbox: [0.495, 0.62, 0.035, 0.09] },
    { id: 26, name: 'LR Lateral Incisor', region: 'lower-right', bbox: [0.46, 0.62, 0.03, 0.09] },
    { id: 27, name: 'LR Canine', region: 'lower-right', bbox: [0.42, 0.62, 0.035, 0.09] },
    { id: 28, name: 'LR First Premolar', region: 'lower-right', bbox: [0.38, 0.615, 0.04, 0.09] },
    { id: 29, name: 'LR Second Premolar', region: 'lower-right', bbox: [0.33, 0.61, 0.04, 0.09] },
    { id: 30, name: 'LR First Molar', region: 'lower-right', bbox: [0.27, 0.60, 0.05, 0.09] },
    { id: 31, name: 'LR Second Molar', region: 'lower-right', bbox: [0.21, 0.59, 0.05, 0.09] },
    { id: 32, name: 'LR Third Molar', region: 'lower-right', bbox: [0.15, 0.58, 0.05, 0.09] },
];

/* ─── AI Logic (Simulation) ────────────────────────────────────────── */
type Condition = 'Healthy' | 'Caries' | 'Missing' | 'Filling' | 'Root Canal Treatment' | 'Crown' | 'Implant' | 'Periapical lesion';

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

export function generateDetections(imageUrl: string): ScanDetection[] {
    const detections: ScanDetection[] = [];
    
    // Simple hash function for seeding
    const seed = imageUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = (n: number) => {
        const x = Math.sin(seed + n) * 10000;
        return x - Math.floor(x);
    };

    OPG_TOOTH_MAP.forEach(tooth => {
        const rand = pseudoRandom(tooth.id);
        
        if (rand < 0.1) {
            // 10% chance of Caries
            const [x, y, w, h] = tooth.bbox;
            detections.push({
                tooth_number: tooth.id,
                class: 'Caries',
                confidence: 85 + Math.floor(rand * 10),
                bbox: [x + w * 0.15, y + h * 0.1, w * 0.7, h * 0.5],
                severity: 'high',
                notes: 'Radiolucency suggests decay.',
                description: 'Tooth decay detected.',
                recommendedAction: 'Schedule restoration.'
            });
        } else if (rand < 0.25) {
            // 15% chance of Filling
            const [x, y, w, h] = tooth.bbox;
            detections.push({
                tooth_number: tooth.id,
                class: 'Filling',
                confidence: 90 + Math.floor(rand * 5),
                bbox: [x + w * 0.1, y, w * 0.8, h * 0.6],
                severity: 'low',
                notes: 'Existing restoration visible.',
                description: 'Existing filling is stable.',
                recommendedAction: 'Monitor.'
            });
        } else if (rand < 0.3) {
            // 5% chance of Root Canal
            const [x, y, w, h] = tooth.bbox;
            detections.push({
                tooth_number: tooth.id,
                class: 'Root Canal Treatment',
                confidence: 95,
                bbox: [x, y + h * 0.3, w, h * 0.7],
                severity: 'medium',
                notes: 'Endodontic filling visible.',
                description: 'Previous root canal treatment.',
                recommendedAction: 'Monitor crown margin.'
            });
        } else if ([1, 16, 17, 32].includes(tooth.id) && rand < 0.7) {
            // High chance of wisdom teeth missing
            detections.push({
                tooth_number: tooth.id,
                class: 'Missing',
                confidence: 99,
                bbox: tooth.bbox,
                severity: 'medium',
                notes: 'Structure absent.',
                description: 'Tooth is missing.',
                recommendedAction: 'No action needed.'
            });
        } else {
            // Healthy core teeth
            detections.push({
                tooth_number: tooth.id,
                class: 'Healthy',
                confidence: 92 + Math.floor(rand * 7),
                bbox: tooth.bbox,
                severity: 'low',
                notes: 'Normal structure.',
                description: 'Tooth appears healthy.',
                recommendedAction: 'Continue routine care.'
            });
        }
    });
    return detections;
}

const getClassColor = (cls: string) => CONDITION_COLORS[cls as Condition] || '#8B949E';

const getRiskStyle = (severity: string) => {
    if (severity === 'high') return { color: '#F85149', bg: 'rgba(248,81,73,0.12)', text: '#F85149' };
    if (severity === 'medium') return { color: '#D29922', bg: 'rgba(210,153,34,0.12)', text: '#D29922' };
    return { color: '#3FB950', bg: 'rgba(63,185,80,0.12)', text: '#3FB950' };
};

const LOG_LINES = [
    '✦ Initializing dental radiograph analysis',
    '✦ Loading panoramic X-ray model',
    '✦ Detecting jaw anatomy and tooth positions',
    '✦ Scanning upper arch teeth 1 through 16',
    '✦ Scanning lower arch teeth 17 through 32',
    '✦ Analyzing bone density and periodontal status',
    '✦ Checking for caries and decay',
    '✦ Identifying existing restorations',
    '✦ Detecting periapical pathology',
    '✦ Calculating risk assessment',
    '✦ Generating clinical report',
];

type FilterMode = 'all' | 'issues' | 'healthy';
type ViewMode = 'grid' | 'list';

export const AIScanPanel = () => {
    const { setScanDetections, setAiPayload, patientInfo } = useTreatmentStore();
    const [preview, setPreview] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [logIndex, setLogIndex] = useState(0);
    const [scanProgress, setScanProgress] = useState(0);
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [hoveredDetection, setHoveredDetection] = useState<number | null>(null);
    const [selectedDetection, setSelectedDetection] = useState<ScanDetection | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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
        if (result) {
            // Tiny timeout to ensure DOM has rendered the image element
            const timer = setTimeout(updateDimensions, 100);
            return () => {
                window.removeEventListener('resize', handleResize);
                clearTimeout(timer);
            };
        }
        return () => window.removeEventListener('resize', handleResize);
    }, [updateDimensions, result]);

    const handleFile = (file: File | string) => {
        setScanning(false);
        if (typeof file === 'string') {
            setPreview(file);
            setUploadedFile(null); // Demo scan — no File object
        } else {
            setPreview(URL.createObjectURL(file));
            setUploadedFile(file); // Store actual File for API upload
        }
        setResult(null);
        setError(null);
        setLogIndex(0);
        setScanProgress(0);
        setFilterMode('all');
        setSelectedDetection(null);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFile(file);
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }, []);

    const handleScan = async () => {
        if (!preview) return;
        setScanning(true);
        setError(null);
        setLogIndex(0);
        setScanProgress(0);

        const logInterval = setInterval(() => {
            setLogIndex(prev => (prev < LOG_LINES.length - 1 ? prev + 1 : prev));
        }, 1500);

        const progressInterval = setInterval(() => {
            setScanProgress(prev => (prev < 95 ? prev + Math.random() * 8 + 2 : prev));
        }, 300);

        try {
            let scanResult: ScanResult;

            let fileToUpload = uploadedFile;
            if (!fileToUpload && typeof preview === 'string') {
                try {
                    const res = await fetch(preview);
                    const blob = await res.blob();
                    fileToUpload = new File([blob], 'demo_scan.jpg', { type: blob.type });
                } catch (e) {
                    console.warn("Could not load demo image string into a File object.", e);
                }
            }

            if (fileToUpload) {
                const formData = new FormData();
                formData.append("image", fileToUpload!);

                const response = await fetch('/ai/api/scan', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server returned ${response.status}: ${errorText}`);
                }

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }

                // Map YOLO format to existing UI format
                const mappedDetections: ScanDetection[] = (data.detections || []).map((f: any) => {
                    let recommendation = `Evaluate ${f.class}`;
                    if (f.class === 'Caries') recommendation = "Schedule minimally invasive restoration. Consider fluoride varnish application on adjacent teeth.";
                    else if (f.class === 'Healthy') recommendation = "No intervention required. Maintain current hygiene protocol.";
                    else if (f.class === 'Root Canal Treatment' || f.class === 'Crown') recommendation = "Monitor structural integrity. Ensure proper marginal seal in subsequent checkups.";

                    return {
                        tooth_number: f.tooth_number || 0,
                        class: f.class || 'Unknown',
                        severity: f.severity || 'info',
                        confidence: typeof f.confidence === 'number' && f.confidence <= 1 ? f.confidence * 100 : parseFloat(f.confidence),
                        bbox: [f.bbox[0], f.bbox[1], f.bbox[2], f.bbox[3]],
                        description: f.class === 'Healthy' ? 'Tooth appears healthy.' : `Detected ${f.class} - ${f.severity} severity.`,
                        recommendedAction: recommendation,
                        notes: `AI detected ${f.class} with ${f.confidence}% confidence.`
                    };
                });
                
                const diseaseScore = data.disease_score || 0;

                scanResult = {
                    scan_id: data.scan_id || `scan_${Date.now()}`,
                    original_image: data.original_image ? `/ai${data.original_image}` : preview,
                    annotated_image: data.annotated_image ? `/ai${data.annotated_image}` : preview,
                    disease_score: diseaseScore,
                    total_detections: mappedDetections.length,
                    detections: mappedDetections
                };
            } else {
                throw new Error("No image available for scanning.");
            }

            setResult(scanResult!);
            const issues = scanResult!.detections.filter(d => d.class !== 'Healthy');
            setScanDetections(issues);
            
            // Save full payload to shared state for Progress tab
            const payload: import('../types/dental').AIPayload = {
                timestamp: new Date().toISOString(),
                patientId: patientInfo.id,
                summary: {
                    teethAnalyzed: scanResult!.detections.length,
                    issuesFound: issues.length,
                    highRiskCount: scanResult!.detections.filter(d => d.severity === 'high').length,
                    healthyCount: scanResult!.detections.filter(d => d.class === 'Healthy').length
                },
                findings: scanResult!.detections,
                imageUrl: preview // Store the image URL in the payload
            };
            setAiPayload(payload);

            setScanProgress(100);
            clearInterval(logInterval);
            clearInterval(progressInterval);
        } catch (err: any) {
            setError(err.message || 'Analysis failed');
            clearInterval(logInterval);
            clearInterval(progressInterval);
        } finally {
            setScanning(false);
        }
    };

    const handleReset = () => {
        setPreview(null);
        setResult(null);
        setScanProgress(0);
        setError(null);
    };

    const allDetections = result?.detections || [];
    const filteredDetections = allDetections.filter(d => {
        if (filterMode === 'issues') return d.class !== 'Healthy';
        if (filterMode === 'healthy') return d.class === 'Healthy';
        return true;
    });

    const issueCount = allDetections.filter(d => d.class !== 'Healthy').length;
    const highRisk = allDetections.filter(d => d.severity === 'high').length;
    const avgConfidence = allDetections.length > 0 
        ? Math.round(allDetections.reduce((s, d) => s + d.confidence, 0) / allDetections.length) : 0;

    return (
        <div className="w-full flex flex-col relative" style={{ fontFamily: 'var(--font-sans)', minHeight: 'calc(100vh - 240px)' }}>
            {!preview ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={`flex-1 m-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden
                        ${dragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                    style={{ backgroundColor: '#161B22', animation: dragActive ? 'none' : 'borderGlow 2.5s ease-in-out infinite' }}
                    onDrop={handleDrop} onDragOver={handleDrag} onDragEnter={handleDrag} onDragLeave={handleDrag}
                    onClick={() => inputRef.current?.click()}
                >
                    <input ref={inputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    <Brain size={48} className="text-primary mb-4" />
                    <h2 className="text-2xl font-bold text-text mb-2">Upload Dental X-Ray</h2>
                    <p className="text-text-muted text-sm mb-6">Panoramic X-rays (OPG) • Universal Tooth Mapping</p>
                    <button className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(47,129,247,0.4)]">Browse Files</button>
                    <button onClick={(e) => { e.stopPropagation(); handleFile('/demo_scan.jpg'); setTimeout(handleScan, 100); }} 
                        className="mt-4 text-primary font-bold hover:underline flex items-center gap-2">
                        <Sparkles size={16} /> Try Demo Scan
                    </button>
                </motion.div>

            ) : error ? (
                <div className="flex-1 flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                        className="p-8 rounded-2xl border border-red-500/20 bg-red-500/10 text-center max-w-lg shadow-2xl">
                        <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-black text-white mb-2">Scan Error</h3>
                        <p className="text-text-muted mb-8 leading-relaxed">{error}</p>
                        <button onClick={handleReset} className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(248,81,73,0.3)] transition-all">
                            Try Again
                        </button>
                    </motion.div>
                </div>
            ) : !result ? (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto lg:overflow-hidden pb-32 lg:pb-6">
                    {/* Image Area */}
                    <div className="flex-none lg:flex-[5] flex flex-col gap-4">
                        <div className="min-h-[350px] max-h-[50vh] lg:max-h-none rounded-2xl border border-border bg-surface relative flex items-center justify-center overflow-hidden shrink-0">
                            <img src={preview} alt="Scan" className="max-w-full max-h-full object-contain opacity-30 grayscale" />
                            {scanning && <div className="absolute inset-x-0 h-[2px] bg-primary z-10" style={{ animation: 'scanline 3s infinite linear' }} />}
                            <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px]" />
                        </div>

                        {/* MOBILE IN-FLOW CALL TO ACTION */}
                        {!scanning && (
                            <button 
                                onClick={handleScan}
                                className="lg:hidden w-full py-5 bg-primary text-white font-bold rounded-2xl shadow-[0_12px_32px_rgba(47,129,247,0.3)] text-lg flex items-center justify-center gap-3 active:scale-95 transition-all border border-primary-hover/30"
                            >
                                <Sparkles size={22} />
                                Start Full Diagnosis
                            </button>
                        )}
                    </div>

                    {/* Analysis Sidebar */}
                    <div className="flex-none lg:flex-[3] rounded-2xl border border-border bg-surface flex flex-col overflow-visible lg:overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-border bg-[#161B22]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-6 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                                <h3 className="font-bold flex items-center gap-2"><Brain size={18} className="text-primary"/> Analysis Mode</h3>
                            </div>
                            <span className="text-[10px] font-black tracking-widest uppercase text-primary">{scanning ? 'In Progress' : 'Ready'}</span>
                        </div>
                        
                        <div className="p-6 font-mono text-[10px] space-y-2 bg-[#0D1117] min-h-[150px] lg:flex-1 custom-scrollbar overflow-y-auto">
                            {scanning && LOG_LINES.slice(0, logIndex + 1).map((line, i) => (
                                <div key={i} className="text-success flex items-center gap-2">
                                    <span className="w-1 h-1 bg-success rounded-full" /> {line}
                                </div>
                            ))}
                            {!scanning && (
                                <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50 space-y-2 py-8">
                                    <Activity size={24} />
                                    <p className="font-bold">System Ready</p>
                                    <p className="text-[9px]">Click above to begin full clinical analysis</p>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar Area */}
                        <div className="p-6 border-t border-border bg-[#0D1117]">
                            <div className="flex justify-between mb-2"><span className="text-[10px] text-text-muted">SCAN PROGRESS</span><span className="font-bold text-primary">{Math.round(scanProgress)}%</span></div>
                            <div className="h-1 bg-border rounded-full overflow-hidden mb-6">
                                <motion.div className="h-full bg-primary" animate={{ width: `${scanProgress}%` }} />
                            </div>
                            
                            {/* Standard Button (Desktop/Tablet) */}
                            {!scanning && (
                                <button onClick={handleScan} className="hidden lg:block w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-hover transition-all">
                                    Start Full Diagnosis
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface shrink-0">
                        <div className="flex gap-6">
                            {[{ label: 'Findings', val: issueCount, c: '#F85149' }, { label: 'Risk', val: highRisk > 0 ? 'High' : 'Low', c: highRisk > 0 ? '#F85149' : '#3FB950' }, { label: 'Confidence', val: `${avgConfidence}%`, c: '#2F81F7' }].map(s => (
                                <div key={s.label}>
                                    <p className="text-[10px] text-text-muted font-bold uppercase mb-0.5">{s.label}</p>
                                    <p className="text-sm font-black" style={{ color: s.c }}>{s.val}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border sm:border-t-0">
                            <div className="flex bg-bg rounded-lg p-1 border border-border">
                                {(['all', 'issues', 'healthy'] as FilterMode[]).map(f => (
                                    <button key={f} onClick={() => setFilterMode(f)} className={`px-2 sm:px-3 py-1.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase transition-colors ${filterMode === f ? 'bg-primary text-white' : 'text-text-muted hover:text-text'}`}>{f}</button>
                                ))}
                            </div>
                            <div className="flex bg-bg rounded-lg p-1 border border-border shrink-0">
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'text-primary bg-surface' : 'text-text-muted hover:text-text'}`}><Grid size={14}/></button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'text-primary bg-surface' : 'text-text-muted hover:text-text'}`}><LayoutList size={14}/></button>
                            </div>
                            <button onClick={handleReset} className="p-2 bg-surface text-text-muted border border-border rounded-lg hover:text-text transition-colors shrink-0"><RotateCcw size={14}/></button>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
                        {/* LEFT: X-RAY IMAGE WITH INFERENCE BOXES */}
                        <div className="flex-[3] relative bg-[#0D1117] flex items-center justify-center p-4 lg:border-r border-border overflow-hidden min-h-[300px] lg:min-h-0">
                            <div className="relative inline-block max-w-full max-h-full">
                                <img 
                                    ref={imageRef}
                                    onLoad={updateDimensions}
                                    src={result?.annotated_image} 
                                    className="max-w-full max-h-[calc(100vh-320px)] rounded-lg contrast-110" 
                                />
                                
                                {/* Inference Bounding Boxes - YOLO Style */}
                                {(() => {
                                    if (imgDims.offsetW <= 1) return null;
                                    
                                    const renderedBoxes: any[] = [];
                                    
                                    return allDetections.map((det, i) => {
                                        if (det.confidence < 60) return null;
                                        if ((filterMode === 'issues' && det.class === 'Healthy') || 
                                            (filterMode === 'healthy' && det.class !== 'Healthy')) return null;

                                        const isNormalized = det.bbox.every((c: number) => c <= 1);
                                        const scaleX = isNormalized ? imgDims.offsetW : (imgDims.offsetW / imgDims.naturalW);
                                        const scaleY = isNormalized ? imgDims.offsetH : (imgDims.offsetH / imgDims.naturalH);
                                        
                                        const x = det.bbox[0] * scaleX;
                                        const y = det.bbox[1] * scaleY;
                                        const w = det.bbox[2] * scaleX;
                                        const h = det.bbox[3] * scaleY;

                                        let labelY = y - 18;
                                        let isBelow = false;
                                        if (labelY < 10) {
                                            labelY = y + h + 2;
                                            isBelow = true;
                                        }

                                        while (renderedBoxes.some(box => Math.abs(box.x - x) < 60 && Math.abs(box.labelY - labelY) < 20)) {
                                            labelY += isBelow ? 16 : -16;
                                        }
                                        
                                        renderedBoxes.push({ x, labelY });

                                        const isHovered = hoveredDetection === det.tooth_number;
                                        const isSelected = selectedDetection?.tooth_number === det.tooth_number;
                                        const color = getClassColor(det.class);
                                        const confDisplay = det.confidence.toFixed(1);

                                        return (
                                            <div key={`box-wrapper-${i}`}>
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: isHovered || isSelected ? 1.03 : 1, zIndex: isHovered || isSelected ? 30 : 20 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.02 }}
                                                    onClick={() => setSelectedDetection(det)}
                                                    onMouseEnter={() => setHoveredDetection(det.tooth_number)}
                                                    onMouseLeave={() => setHoveredDetection(null)}
                                                    className="absolute cursor-pointer"
                                                    style={{
                                                        left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`,
                                                        borderWidth: '2px', borderStyle: 'solid', borderColor: color, backgroundColor: isSelected ? `${color}20` : isHovered ? `${color}15` : 'transparent', borderRadius: '2px'
                                                    }}
                                                />
                                                {det.class !== 'Healthy' && (
                                                    <motion.div 
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1, zIndex: isHovered || isSelected ? 31 : 21 }}
                                                        className="absolute flex items-center whitespace-nowrap text-[8px] sm:text-[9px] font-bold leading-none pointer-events-none"
                                                        style={{
                                                            left: `${x}px`, top: `${labelY}px`, backgroundColor: color, color: (color === '#FFFFFF' || color === '#00FFFF' || color === '#D29922') ? '#000' : '#FFF', padding: '2px 4px', borderRadius: '1px'
                                                        }}
                                                    >
                                                        {det.class} {confDisplay}%
                                                    </motion.div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Clinical Pathway Recommendation (Overlay / Bottom Sheet) */}
                            {selectedDetection && (
                                <motion.div 
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto sm:w-80 space-y-2 sm:space-y-3 z-40"
                                >
                                    <p className="hidden sm:block text-[10px] text-text-muted font-bold uppercase tracking-widest">Clinical Pathway: Tooth #{selectedDetection.tooth_number}</p>
                                    <div className="space-y-2">
                                        {selectedDetection.class === 'Caries' && (
                                            <div className="p-3 sm:p-4 rounded-xl border border-red-500/20 bg-red-500/15 backdrop-blur-xl space-y-1.5 sm:space-y-2 shadow-2xl">
                                                <div className="flex items-center gap-2 text-red-400 font-bold text-[10px] sm:text-xs"><Sparkles size={14}/> Recommended Action: #{selectedDetection.tooth_number}</div>
                                                <p className="text-[10px] sm:text-xs text-text-muted leading-relaxed">Schedule minimally invasive restoration. Consider fluoride varnish application.</p>
                                                <button className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-colors border border-red-500/30">Book Priority</button>
                                            </div>
                                        )}
                                        {selectedDetection.class === 'Healthy' && (
                                            <div className="p-3 sm:p-4 rounded-xl border border-green-500/20 bg-green-500/15 backdrop-blur-xl space-y-1.5 sm:space-y-2 shadow-2xl text-[10px] sm:text-xs">
                                                <div className="flex items-center gap-2 text-green-400 font-bold"><Brain size={14}/> AI Insight: #{selectedDetection.tooth_number}</div>
                                                <p className="text-text-muted leading-relaxed">No intervention required. Maintain current hygiene protocol.</p>
                                            </div>
                                        )}
                                        {(selectedDetection.class === 'Root Canal Treatment' || selectedDetection.class === 'Crown') && (
                                            <div className="p-3 sm:p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/15 backdrop-blur-xl space-y-1.5 sm:space-y-2 shadow-2xl text-[10px] sm:text-xs">
                                                <div className="flex items-center gap-2 text-cyan-400 font-bold"><Sparkles size={14}/> Follow-up: #{selectedDetection.tooth_number}</div>
                                                <p className="text-text-muted leading-relaxed">Monitor structural integrity. Ensure proper marginal seal.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* RIGHT: LIST / GRID VIEW */}
                        <div className="flex-[2] flex flex-col bg-surface overflow-hidden border-t lg:border-t-0 lg:border-l border-border pb-20 sm:pb-0">
                            <div className="p-4 border-b border-border bg-[#161B22]/50">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-text-muted tracking-widest">{viewMode === 'grid' ? 'Dental Chart View' : 'Detection Stream'}</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[400px]">
                                {viewMode === 'grid' ? (
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[9px] font-bold text-text-muted uppercase mb-3 border-b border-border pb-1">Upper Jaw</p>
                                            <div className="grid grid-cols-8 gap-2">
                                                {Array.from({length: 16}, (_, i) => i + 1).map(toothNum => {
                                                    const det: any = allDetections.find((d: any) => d.tooth_number === toothNum) || { tooth_number: toothNum, class: 'Healthy', confidence: 100 };
                                                    return <ToothGridTile key={`u${toothNum}`} det={det} onHover={setHoveredDetection} onSelect={setSelectedDetection}
                                                        isActive={hoveredDetection === toothNum || selectedDetection?.tooth_number === toothNum}
                                                        isFiltered={(filterMode === 'issues' && det.class === 'Healthy') || (filterMode === 'healthy' && det.class !== 'Healthy')} />
                                                })}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-text-muted uppercase mb-3 border-b border-border pb-1">Lower Jaw</p>
                                            <div className="grid grid-cols-8 gap-2">
                                                {Array.from({length: 16}, (_, i) => 32 - i).map(toothNum => {
                                                    const det: any = allDetections.find((d: any) => d.tooth_number === toothNum) || { tooth_number: toothNum, class: 'Healthy', confidence: 100 };
                                                    return <ToothGridTile key={`l${toothNum}`} det={det} onHover={setHoveredDetection} onSelect={setSelectedDetection}
                                                        isActive={hoveredDetection === toothNum || selectedDetection?.tooth_number === toothNum}
                                                        isFiltered={(filterMode === 'issues' && det.class === 'Healthy') || (filterMode === 'healthy' && det.class !== 'Healthy')} />
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredDetections.map((det, i) => (
                                            <DetectionListItem key={i} det={det} onHover={setHoveredDetection} onSelect={setSelectedDetection} 
                                                isActive={hoveredDetection === det.tooth_number || selectedDetection?.tooth_number === det.tooth_number} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL DRAWER */}
            <AnimatePresence>
                {selectedDetection && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDetection(null)} className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-40" />
                        <motion.div 
                            initial={{ x: '100%' }} 
                            animate={{ x: 0 }} 
                            exit={{ x: '100%' }} 
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute top-0 right-0 bottom-0 w-full sm:w-[400px] max-w-full bg-surface border-l border-border shadow-2xl z-50 flex flex-col"
                        >
                            <div className="p-6 border-b border-border flex items-center justify-between bg-[#161B22]/50">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border" style={{ color: getClassColor(selectedDetection.class), borderColor: `${getClassColor(selectedDetection.class)}40`, backgroundColor: `${getClassColor(selectedDetection.class)}10` }}>{selectedDetection.tooth_number}</div>
                                    <div><h3 className="font-bold">Tooth #{selectedDetection.tooth_number}</h3><p className="text-[10px] text-text-muted uppercase tracking-widest">{OPG_TOOTH_MAP.find(t => t.id === selectedDetection.tooth_number)?.name}</p></div>
                                </div>
                                <button onClick={() => setSelectedDetection(null)} className="p-2 hover:bg-surface-elevated rounded-full"><X size={20}/></button>
                            </div>
                            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-text-muted font-bold uppercase mb-1">Diagnosis</p>
                                        <h4 className="text-2xl font-black" style={{ color: getClassColor(selectedDetection.class) }}>{selectedDetection.class}</h4>
                                    </div>
                                    <div className="px-2 py-1 rounded text-[10px] font-black uppercase" 
                                        style={{ backgroundColor: getRiskStyle(selectedDetection.severity).bg, color: getRiskStyle(selectedDetection.severity).text }}>
                                        {selectedDetection.severity}
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-bg border border-border">
                                    <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-text-secondary">AI Confidence</span><span className="font-mono font-bold" style={{ color: getClassColor(selectedDetection.class) }}>{selectedDetection.confidence}%</span></div>
                                    <div className="h-1 bg-surface-elevated rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${selectedDetection.confidence}%` }} className="h-full" style={{ backgroundColor: getClassColor(selectedDetection.class) }} /></div>
                                </div>
                                <div className="space-y-2"><p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Clinical Notes</p><p className="text-sm text-text-secondary leading-relaxed bg-bg p-4 rounded-xl border border-border italic">"{selectedDetection.notes}"</p></div>
                            </div>
                            <div className="p-6 border-t border-border bg-[#0D1117]"><button onClick={() => setSelectedDetection(null)} className="w-full py-4 bg-primary text-white font-bold rounded-xl">Dismiss</button></div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── HELPER COMPONENTS ─── */
const ToothGridTile = ({ det, isActive, isFiltered, onHover, onSelect }: any) => {
    const col = getClassColor(det.class);
    return (
        <div onMouseEnter={() => !isFiltered && onHover(det.tooth_number)} onMouseLeave={() => onHover(null)} onClick={() => !isFiltered && onSelect(det)}
            className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${isActive ? 'scale-110 z-10' : 'opacity-80'} ${isFiltered ? 'grayscale opacity-20' : ''}`}
            style={{ backgroundColor: isActive ? `${col}30` : '#0D1117', borderColor: isActive ? col : '#30363D' }}>
            <span className="text-[10px] font-bold" style={{ color: det.class === 'Healthy' ? '#8B949E' : col }}>{det.tooth_number}</span>
            <div className="w-1 h-1 rounded-full mt-1" style={{ backgroundColor: col }} />
        </div>
    );
};

const DetectionListItem = ({ det, isActive, onHover, onSelect }: any) => {
    const col = getClassColor(det.class);
    return (
        <div onMouseEnter={() => onHover(det.tooth_number)} onMouseLeave={() => onHover(null)} onClick={() => onSelect(det)}
            className={`flex items-center gap-4 p-3 border rounded-xl cursor-pointer transition-all ${isActive ? 'border-primary bg-primary/5' : 'bg-bg hover:border-primary/20'}`}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black border" style={{ color: col, borderColor: `${col}40`, backgroundColor: `${col}10` }}>{det.tooth_number}</div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">{det.class}</h4>
                <div className="h-1 bg-border rounded-full mt-2 overflow-hidden"><div className="h-full" style={{ width: `${det.confidence}%`, backgroundColor: col }} /></div>
            </div>
        </div>
    );
};
