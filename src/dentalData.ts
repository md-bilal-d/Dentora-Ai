import type { Treatment, ToothCondition, TreatmentMode } from './types/dental';

export const MOCK_TREATMENTS: Treatment[] = [
    { id: '1', toothId: 'tooth_06', toothNumber: 6, mode: 'CROWN', cost: 850, status: 'completed', date: '2023-10-15' },
    { id: '2', toothId: 'tooth_14', toothNumber: 14, mode: 'FILLING', cost: 200, status: 'completed', date: '2023-11-02' },
    { id: '3', toothId: 'tooth_09', toothNumber: 9, mode: 'CROWN', cost: 850, status: 'completed', date: '2023-12-10' },
    { id: '4', toothId: 'tooth_30', toothNumber: 30, mode: 'ROOT_CANAL', cost: 950, status: 'in-progress', date: '2024-03-10' },
    { id: '5', toothId: 'tooth_30', toothNumber: 30, mode: 'CROWN', cost: 800, status: 'planned', date: '2024-04-15' },
];

export const TOOTH_CONDITIONS: Record<string, ToothCondition> = {
    'tooth_06': 'CROWN',
    'tooth_14': 'FILLING',
    'tooth_09': 'CROWN',
    'tooth_30': 'ROOT_CANAL',
    'tooth_18': 'MISSING',
    'tooth_19': 'IMPLANT',
    'tooth_03': 'CARIES',
};

export const CONDITION_COLORS: Record<string, string> = {
    'HEALTHY': '#FFFFFF',
    'CROWN': '#F59E0B',
    'FILLING': '#9CA3AF',
    'ROOT_CANAL': '#4B5563',
    'MISSING': 'transparent',
    'IMPLANT': '#00D4FF',
    'CARIES': '#EF4444',
    'EXTRACTION': '#EF4444',
    'NONE': '#FFFFFF',
};
