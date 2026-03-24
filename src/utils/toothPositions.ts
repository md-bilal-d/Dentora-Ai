import type { ToothPosition } from '../types/dental';

const TOOTH_NAMES: Record<number, string> = {
    1: 'Upper Right Third Molar', 2: 'Upper Right Second Molar', 3: 'Upper Right First Molar',
    4: 'Upper Right Second Premolar', 5: 'Upper Right First Premolar', 6: 'Upper Right Canine',
    7: 'Upper Right Lateral Incisor', 8: 'Upper Right Central Incisor',
    9: 'Upper Left Central Incisor', 10: 'Upper Left Lateral Incisor', 11: 'Upper Left Canine',
    12: 'Upper Left First Premolar', 13: 'Upper Left First Premolar', 14: 'Upper Left First Molar',
    15: 'Upper Left Second Molar', 16: 'Upper Left Third Molar',
    17: 'Lower Left Third Molar', 18: 'Lower Left Second Molar', 19: 'Lower Left First Molar',
    20: 'Lower Left Second Premolar', 21: 'Lower Left First Premolar', 22: 'Lower Left Canine',
    23: 'Lower Left Lateral Incisor', 24: 'Lower Left Central Incisor',
    25: 'Lower Right Central Incisor', 26: 'Lower Right Lateral Incisor', 27: 'Lower Right Canine',
    28: 'Lower Right First Premolar', 29: 'Lower Right Second Premolar', 30: 'Lower Right First Molar',
    31: 'Lower Right Second Molar', 32: 'Lower Right Third Molar',
};

function generateArchPositions(
    startTooth: number,
    arch: 'upper' | 'lower'
): ToothPosition[] {
    const positions: ToothPosition[] = [];
    const count = 16;
    
    // CALIBRATED ARCH PARAMETERS
    const archWidth = 5.6; // ARCH_R 2.8 * 2
    const a = -0.25; // Parabolic curvature
    const archDepth = 1.6; // ARCH_DEPTH 1.6

    for (let i = 0; i < count; i++) {
        const toothNum = startTooth + i;
        const t = i / (count - 1); 
        
        const x = t * archWidth - (archWidth / 2);
        const z = a * Math.pow(x, 2) + archDepth;

        const slope = 2 * a * x;
        const tangentAngle = Math.atan(slope);
        
        const rotY = arch === 'upper' ? -tangentAngle : tangentAngle + Math.PI;

        positions.push({
            id: `tooth_${String(toothNum).padStart(2, '0')}`,
            name: TOOTH_NAMES[toothNum] || `Tooth ${toothNum}`,
            position: [x, 0, z],
            rotation: [0, rotY, 0],
            scale: [1, 1, 1],
            arch,
            toothNumber: toothNum,
        });
    }

    return positions;
}

export const toothPositions: ToothPosition[] = [
    ...generateArchPositions(1, 'upper'),
    ...generateArchPositions(17, 'lower'),
];

export function getToothById(id: string): ToothPosition | undefined {
    return toothPositions.find((t) => t.id === id);
}
