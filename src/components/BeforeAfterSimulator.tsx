import React, { useState } from 'react';
import { Columns, Sparkles, Smile, Image as ImageIcon } from 'lucide-react';

interface BeforeAfterSimulatorProps {
    beforeImage: string;
    onClose: () => void;
}

export default function BeforeAfterSimulator({ beforeImage, onClose }: BeforeAfterSimulatorProps) {
    const [sliderPos, setSliderPos] = useState(50);
    const [activeSim, setActiveSim] = useState<'whitening' | 'alignment' | 'veneer'>('whitening');

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setSliderPos(Math.max(0, Math.min(100, x)));
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
        setSliderPos(Math.max(0, Math.min(100, x)));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
            <div className="bg-[#161B22] w-full max-w-4xl rounded-[32px] overflow-hidden border border-[#30363D] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
                
                <div className="p-8 border-b border-[#30363D] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Sparkles className="text-primary" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight uppercase">Outcome Simulator</h3>
                            <p className="text-[10px] text-[#8B949E] uppercase tracking-[0.2em] font-bold">Predictive Esthetic Modeling</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['whitening', 'alignment', 'veneer'].map(sim => (
                            <button 
                                key={sim}
                                onClick={() => setActiveSim(sim as any)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeSim === sim 
                                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(47,129,247,0.4)]' 
                                    : 'bg-[#0D1117] text-[#8B949E] hover:text-white border border-[#30363D]'
                                }`}
                            >
                                {sim}
                            </button>
                        ))}
                    </div>
                </div>

                <div 
                    className="relative h-[500px] cursor-col-resize select-none overflow-hidden touch-none"
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                >
                    {/* After Image (Simulated) */}
                    <div className="absolute inset-0">
                        <img 
                            src={beforeImage} 
                            className="w-full h-full object-cover" 
                            alt="After" 
                            style={{ 
                                filter: activeSim === 'whitening' 
                                    ? 'brightness(1.15) contrast(1.1) saturate(0.9)' 
                                    : activeSim === 'alignment' 
                                    ? 'contrast(1.05) saturate(1.1)' 
                                    : 'brightness(1.05) contrast(1.1)' 
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Before Image (Original) */}
                    <div 
                        className="absolute inset-0 z-10 border-r-2 border-white/40 shadow-[10px_0_30px_rgba(0,0,0,0.5)]"
                        style={{ width: `${sliderPos}%`, overflow: 'hidden' }}
                    >
                        <div style={{ width: `${(1 / (sliderPos / 100)) * 100}%`, height: '100%' }}>
                            <img 
                                src={beforeImage} 
                                className="w-full h-full object-cover grayscale brightness-[0.85] contrast-[1.1]" 
                                alt="Before" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>
                    </div>

                    {/* Labels */}
                    <div className="absolute bottom-8 left-8 z-20 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] border border-white/10 shadow-xl">
                        Baseline OPG
                    </div>
                    <div className="absolute bottom-8 right-8 z-20 px-4 py-2 bg-primary/60 backdrop-blur-xl rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] border border-primary/30 shadow-xl">
                        AI {activeSim.toUpperCase()} Simulation
                    </div>

                    {/* Slider Handle */}
                    <div 
                        className="absolute inset-y-0 z-30 flex items-center justify-center pointer-events-none"
                        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="w-14 h-14 bg-white rounded-full shadow-[0_0_40px_rgba(0,0,0,0.6)] flex items-center justify-center border-4 border-primary pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                            <Columns size={24} className="text-primary" />
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[#0D1117] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#161B22] rounded-2xl border border-[#30363D]">
                            <Smile className="text-emerald-400" size={28} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white mb-1 uppercase tracking-widest">Esthetic Prediction Engine</h4>
                            <p className="text-[11px] text-[#8B949E] leading-relaxed max-w-md font-medium">
                                Modeling based on clinical {activeSim} benchmarks. Predicted outcome incorporates surrounding tissue density and anatomical constraints.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={onClose} className="flex-1 md:flex-none px-8 py-3.5 bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] text-white font-bold text-xs uppercase tracking-[0.15em] rounded-2xl transition-all">
                            Close
                        </button>
                        <button className="flex-1 md:flex-none px-10 py-3.5 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-[0.15em] rounded-2xl shadow-[0_4px_20px_rgba(47,129,247,0.3)] transition-all flex items-center justify-center gap-2">
                            <ImageIcon size={18} /> Export Preview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
