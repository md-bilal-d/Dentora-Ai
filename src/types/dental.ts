export type TreatmentMode = 'NONE' | 'CROWN' | 'FILLING' | 'IMPLANT' | 'ROOT_CANAL' | 'EXTRACTION' | 'CARIES' | 'HEALTHY' | 'MISSING';
export type CrownVariant = 'GOLD' | 'PORCELAIN';
export type FillingVariant = 'COMPOSITE' | 'AMALGAM';
export type Arch = 'upper' | 'lower';

export type ToothCondition = 'HEALTHY' | 'CROWN' | 'FILLING' | 'ROOT_CANAL' | 'MISSING' | 'IMPLANT' | 'CARIES';

export interface ToothPosition {
    id: string;
    name: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    arch: Arch;
    toothNumber: number;
}

export interface Treatment {
    id: string;
    toothId: string;
    toothNumber: number;
    mode: TreatmentMode;
    crownVariant?: CrownVariant;
    fillingVariant?: FillingVariant;
    cost: number;
    status: 'completed' | 'in-progress' | 'planned';
    date: string;
}

export interface PatientInfo {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    lastVisit: string;
    diseaseScore: number;
    notes: string;
    treatments: Treatment[];
}

// ─── AI Scan Types ───────────────────────────────────────────────────
export interface ScanDetection {
    class: string;
    confidence: number;
    severity: string;
    bbox: number[];
    tooth_number: number;
    notes: string;
    description?: string;
    recommendedAction?: string;
}

export interface ScanResult {
    scan_id: string;
    detections: ScanDetection[];
    total_detections: number;
    disease_score: number;
    annotated_image: string;
    original_image: string;
}

export interface AIScanSummary {
    teethAnalyzed: number;
    issuesFound: number;
    highRiskCount: number;
    healthyCount: number;
}

export interface AIPayload {
    timestamp: string;
    patientId: string;
    summary: AIScanSummary;
    findings: ScanDetection[];
    imageUrl?: string;
}
