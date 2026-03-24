import { create } from 'zustand';
import type { TreatmentMode, CrownVariant, FillingVariant, Treatment, PatientInfo, ScanDetection } from '../types/dental';

interface TreatmentState {
    treatmentMode: TreatmentMode;
    crownVariant: CrownVariant;
    fillingVariant: FillingVariant;
    treatments: Map<string, Treatment>;
    showRestored: boolean;
    selectedTooth: string | null;
    hoveredTooth: string | null;
    patientInfo: PatientInfo;
    showScanPanel: boolean;
    splitScreenActive: boolean;

    // ─── AI Scan State ───
    scanDetections: ScanDetection[];
    aiPayload: import('../types/dental').AIPayload | null;
    xrayMode: boolean;
    focusedToothId: string | null;
    sliceMode: boolean;
    slicePosition: number; // 0 to 1
    sliceAxis: 'X' | 'Y' | 'Z';

    // ─── Pain Reports State ───
    painReports: Array<{ id: string; toothNumber: number | string; level: number; types: string[]; date: string; notes: string; resolved: boolean }>;

    setTreatmentMode: (mode: TreatmentMode) => void;
    setCrownVariant: (variant: CrownVariant) => void;
    setFillingVariant: (variant: FillingVariant) => void;
    applyTreatment: (toothId: string) => void;
    removeTreatment: (toothId: string) => void;
    toggleBeforeAfter: () => void;
    setSelectedTooth: (toothId: string | null) => void;
    setHoveredTooth: (toothId: string | null) => void;
    setPatientInfo: (info: Partial<PatientInfo>) => void;
    toggleScanPanel: () => void;
    setSplitScreenActive: (active: boolean) => void;

    // ─── AI Scan Actions ───
    setScanDetections: (detections: ScanDetection[]) => void;
    setAiPayload: (payload: import('../types/dental').AIPayload) => void;
    toggleXrayMode: () => void;
    setFocusedTooth: (toothId: string | null) => void;
    toggleSliceMode: () => void;
    setSlicePosition: (pos: number) => void;
    setSliceAxis: (axis: 'X' | 'Y' | 'Z') => void;
    applyDetectionsToTreatments: (detections: ScanDetection[]) => void;
    setTreatments: (treatments: any[]) => void;

    // ─── Pain Reports Actions ───
    addPainReport: (report: { id: string; toothNumber: number | string; level: number; types: string[]; date: string; notes: string; resolved: boolean }) => void;
    resolvePainReport: (id: string) => void;
}

export const useTreatmentStore = create<TreatmentState>((set, get) => ({
    treatmentMode: 'NONE',
    crownVariant: 'PORCELAIN',
    fillingVariant: 'COMPOSITE',
    treatments: new Map(),
    showRestored: true,
    showScanPanel: false,
    splitScreenActive: false,
    selectedTooth: null,
    hoveredTooth: null,
    patientInfo: {
        id: 'PT-2026-001',
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        phone: '+1 555-0123',
        lastVisit: '2026-03-10',
        diseaseScore: 25,
        notes: '',
        treatments: [],
    },

    // ─── AI Scan Defaults ───
    scanDetections: [],
    aiPayload: null,
    xrayMode: false,
    focusedToothId: null,
    sliceMode: false,
    slicePosition: 0.5,
    sliceAxis: 'X',

    setTreatmentMode: (mode) => set({ treatmentMode: mode }),
    setCrownVariant: (variant) => set({ crownVariant: variant }),
    setFillingVariant: (variant) => set({ fillingVariant: variant }),

    applyTreatment: (toothId) => {
        const state = get();
        if (state.treatmentMode === 'NONE') return;
        const newTreatments = new Map(state.treatments);
        newTreatments.set(toothId, {
            id: crypto.randomUUID(),
            toothId,
            toothNumber: parseInt(toothId.split('_')[1]),
            mode: state.treatmentMode,
            crownVariant: state.crownVariant,
            fillingVariant: state.fillingVariant,
            cost: state.treatmentMode === 'CROWN' ? 800 : state.treatmentMode === 'FILLING' ? 200 : state.treatmentMode === 'IMPLANT' ? 1500 : 0,
            status: 'planned',
            date: new Date().toISOString().split('T')[0],
        });
        set({ treatments: newTreatments, selectedTooth: toothId });

        // Auto-sync treatment additions to MongoDB
        fetch(`http://127.0.0.1:5000/api/patients/${state.patientInfo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ treatments: Array.from(newTreatments.values()) })
        }).catch(err => console.error('Failed to sync treatment to cloud:', err));
    },

    removeTreatment: (toothId) => {
        const state = get();
        const newTreatments = new Map(state.treatments);
        newTreatments.delete(toothId);
        set({ treatments: newTreatments });

        // Auto-sync treatment removals to MongoDB
        fetch(`http://127.0.0.1:5000/api/patients/${state.patientInfo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ treatments: Array.from(newTreatments.values()) })
        }).catch(err => console.error('Failed to sync treatment removal to cloud:', err));
    },

    toggleBeforeAfter: () => set((s) => ({ showRestored: !s.showRestored })),
    setSelectedTooth: (toothId) => set({ selectedTooth: toothId }),
    setHoveredTooth: (toothId) => set({ hoveredTooth: toothId }),
    setPatientInfo: (info) =>
        set((s) => ({ patientInfo: { ...s.patientInfo, ...info } })),
    toggleScanPanel: () => set((s) => ({ showScanPanel: !s.showScanPanel, splitScreenActive: false })), // Reset split screen on toggle
    setSplitScreenActive: (active) => set({ splitScreenActive: active }),

    // ─── AI Scan Actions ───
    setScanDetections: (detections) => set({ scanDetections: detections }),
    setAiPayload: (payload) => set({ aiPayload: payload }),
    toggleXrayMode: () => set((s) => ({ xrayMode: !s.xrayMode })),
    setFocusedTooth: (toothId) => set({ focusedToothId: toothId }),
    toggleSliceMode: () => set((s) => ({ sliceMode: !s.sliceMode })),
    setSlicePosition: (pos) => set({ slicePosition: pos }),
    setSliceAxis: (axis) => set({ sliceAxis: axis }),

    // ─── Pain Reports Actions ───
    painReports: [],
    addPainReport: (report) => set((s) => {
        // Remove existing report for same tooth if not resolved, or just append
        const filtered = s.painReports.filter(r => r.toothNumber !== report.toothNumber || r.resolved);
        return { painReports: [report, ...filtered] };
    }),
    resolvePainReport: (id) => set((s) => ({
        painReports: s.painReports.map(r => r.id === id ? { ...r, resolved: true } : r)
    })),

    applyDetectionsToTreatments: async (detections) => {
        get().setScanDetections(detections);
        
        // We'll process detections in order of tooth number to make the stagger look logical
        const sortedDetections = [...detections].sort((a, b) => a.tooth_number - b.tooth_number);

        for (const det of sortedDetections) {
            const toothId = `tooth_${String(det.tooth_number).padStart(2, '0')}`;
            
            const treatment: Treatment = {
                id: crypto.randomUUID(),
                toothId,
                toothNumber: det.tooth_number,
                mode: 'NONE',
                crownVariant: 'PORCELAIN',
                fillingVariant: 'COMPOSITE',
                cost: 0,
                status: 'planned',
                date: new Date().toISOString().split('T')[0],
            };

            let shouldApply = false;
            if (det.class === 'Caries' || det.class === 'Deep Caries' || det.class === 'Filling') {
                treatment.mode = 'FILLING';
                treatment.fillingVariant = det.class === 'Filling' ? 'AMALGAM' : 'COMPOSITE';
                shouldApply = true;
            } else if (det.class === 'Crown' || det.class === 'Root Canal') {
                treatment.mode = 'CROWN';
                shouldApply = true;
            } else if (det.class === 'Implant' || det.class === 'Missing teeth') {
                treatment.mode = 'IMPLANT';
                shouldApply = true;
            }

            if (shouldApply) {
                // Wait 0.2s for stagger as requested
                await new Promise(r => setTimeout(r, 200));
                
                const latestTreatments = new Map(get().treatments);
                latestTreatments.set(toothId, treatment);
                
                set({ treatments: latestTreatments });

                // Sync staggered detections locally to cloud 
                fetch(`/api/patients/${get().patientInfo.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ treatments: Array.from(latestTreatments.values()) })
                }).catch(e => null);
            }
        }
        
        // After toggle shows all teeth healthy and restored
        set({ 
            showRestored: true,
            xrayMode: true 
        });
    },

    setTreatments: (treatmentsList) => {
        const newMap = new Map<string, Treatment>();
        treatmentsList.forEach((t: any) => {
            newMap.set(t.toothId || t.tooth_id, {
                id: t.id || crypto.randomUUID(),
                toothId: t.toothId || t.tooth_id,
                toothNumber: t.toothNumber || (t.toothId ? parseInt(t.toothId.split('_')[1]) : 0),
                mode: (t.mode || t.type) as TreatmentMode,
                crownVariant: t.crownVariant || 'PORCELAIN',
                fillingVariant: t.fillingVariant || 'COMPOSITE',
                cost: t.cost || 0,
                status: t.status || 'planned',
                date: t.date || new Date().toISOString().split('T')[0],
            });
        });
        set({ treatments: newMap });
    },
}));
