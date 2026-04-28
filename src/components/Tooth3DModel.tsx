import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Tooth Component
function Tooth({ position, rotation, condition, index }: { position: [number, number, number], rotation: [number, number, number], condition?: string, index: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Color based on condition
    const color = useMemo(() => {
        const c = (condition || '').toLowerCase();
        if (c.includes('caries') || c.includes('cavity') || c.includes('decay')) return '#ef4444'; // Red
        if (c.includes('filling')) return '#3b82f6'; // Blue
        if (c.includes('missing')) return '#1e293b'; // Dark
        if (c.includes('crown')) return '#f59e0b'; // Amber
        return '#f8fafc'; // Healthy White
    }, [condition]);

    return (
        <group position={position} rotation={rotation}>
            <mesh ref={meshRef} castShadow>
                <boxGeometry args={[0.8, 1.2, 0.8]} />
                <meshStandardMaterial 
                    color={color} 
                    roughness={0.2} 
                    metalness={0.1}
                    transparent={condition?.includes('missing')}
                    opacity={condition?.includes('missing') ? 0.1 : 1}
                />
            </mesh>
            {/* Crown Detail */}
            {!condition?.includes('missing') && (
                <mesh position={[0, 0.7, 0]} castShadow>
                    <sphereGeometry args={[0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={color} roughness={0.1} />
                </mesh>
            )}
        </group>
    );
}

interface Tooth3DModelProps {
    issues?: any[];
}

export default function Tooth3DModel({ issues = [] }: Tooth3DModelProps) {
    // Arrange teeth in an arch
    const upperTeeth = useMemo(() => {
        const arr = [];
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = (i / (count - 1)) * Math.PI - Math.PI / 2;
            const radius = 4.5;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Map index to real tooth IDs (1-16)
            const toothId = i + 1;
            const issue = issues.find(iss => iss.toothId === toothId || iss.id === toothId);
            
            arr.push({
                position: [x, 1, z] as [number, number, number],
                rotation: [Math.PI, -angle, 0] as [number, number, number],
                condition: issue?.condition || issue?.type || 'Healthy',
                index: toothId
            });
        }
        return arr;
    }, [issues]);

    const lowerTeeth = useMemo(() => {
        const arr = [];
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = (i / (count - 1)) * Math.PI - Math.PI / 2;
            const radius = 4.2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Map index to real tooth IDs (17-32)
            const toothId = 32 - i;
            const issue = issues.find(iss => iss.toothId === toothId || iss.id === toothId);
            
            arr.push({
                position: [x, -1, z] as [number, number, number],
                rotation: [0, -angle, 0] as [number, number, number],
                condition: issue?.condition || issue?.type || 'Healthy',
                index: toothId
            });
        }
        return arr;
    }, [issues]);

    return (
        <div style={{ 
            width: '100%', 
            height: '450px', 
            background: 'linear-gradient(to bottom, #0f172a, #1e293b)', 
            borderRadius: '20px', 
            overflow: 'hidden', 
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
            <Canvas shadows gl={{ antialias: true }}>
                <PerspectiveCamera makeDefault position={[0, 4, 12]} fov={45} />
                <OrbitControls 
                    enableZoom={true} 
                    enablePan={false} 
                    minPolarAngle={Math.PI/6} 
                    maxPolarAngle={Math.PI/1.5} 
                    autoRotate={true}
                    autoRotateSpeed={0.5}
                />
                
                <ambientLight intensity={0.6} />
                <spotLight position={[10, 15, 10]} angle={0.25} penumbra={1} intensity={1.5} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
                
                <group position={[0, 0, 0]}>
                    {upperTeeth.map((t) => (
                        <Tooth key={t.index} {...t} />
                    ))}
                    {lowerTeeth.map((t) => (
                        <Tooth key={t.index} {...t} />
                    ))}
                    <ContactShadows 
                        position={[0, -2.5, 0]} 
                        opacity={0.5} 
                        scale={15} 
                        blur={2.5} 
                        far={4} 
                    />
                </group>

                <Environment preset="night" />
            </Canvas>
            
            {/* UI Overlay */}
            <div className="absolute top-6 left-6 p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 text-white pointer-events-none transition-all hover:bg-black/60">
                <div className="flex items-center gap-3 mb-1">
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-50" />
                    </div>
                    <h3 className="text-sm font-bold tracking-tight">3D Digital Twin</h3>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">Real-time Clinical Arch Mapping</p>
                <div className="mt-3 flex gap-4 text-[9px] uppercase tracking-wider font-bold text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Caries</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Restored</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-200" /> Healthy</span>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
                 <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    v1.4.0 Interactive Arch
                 </div>
            </div>
        </div>
    );
}
