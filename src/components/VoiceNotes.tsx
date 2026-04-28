import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Save, Trash2, History, Wand2 } from 'lucide-react';

interface VoiceNotesProps {
    onSave: (note: string) => void;
}

export default function VoiceNotes({ onSave }: VoiceNotesProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSave = () => {
        if (transcript.trim()) {
            onSave(transcript);
            setHistory(prev => [transcript, ...prev.slice(0, 4)]);
            setTranscript('');
        }
    };

    const handleAIEnhance = () => {
        if (!transcript.trim()) return;
        // Mock AI enhancement: Formatting medical shorthand into professional notes
        const enhanced = "CLINICAL OBSERVATION: " + transcript + 
                         ". Recommended follow-up in 6 months for routine prophylaxis. Patient advised on interproximal cleaning.";
        setTranscript(enhanced);
    };

    return (
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isListening ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {isListening ? <Mic className="animate-pulse" size={20} /> : <Mic size={20} />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Voice Clinical Notes</h3>
                        <p className="text-[10px] text-[#8B949E] uppercase tracking-wider font-semibold">Hands-free Charting System</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleAIEnhance}
                        disabled={!transcript.trim()}
                        className="p-2 hover:bg-[#30363D] rounded-lg text-[#8B949E] hover:text-blue-400 transition-all disabled:opacity-30"
                        title="AI Formatting"
                    >
                        <Wand2 size={18} />
                    </button>
                    <button 
                        onClick={() => setTranscript('')}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-[#8B949E] hover:text-red-500 transition-all"
                        title="Clear"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="relative flex-1 mb-6">
                <textarea 
                    className="w-full h-full min-h-[120px] bg-[#0D1117] border border-[#30363D] rounded-xl p-4 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none font-medium leading-relaxed"
                    placeholder="Speak now to dictate clinical observations..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                />
                {isListening && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30 backdrop-blur-sm">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Live Dictation</span>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={toggleListening}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${
                        isListening 
                        ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                        : 'bg-[#2F81F7] text-white hover:bg-[#216cd4] shadow-[0_4px_12px_rgba(47,129,247,0.2)]'
                    }`}
                >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    {isListening ? 'Stop Recording' : 'Start Voice Note'}
                </button>
                <button 
                    onClick={handleSave}
                    disabled={!transcript.trim()}
                    className="px-6 bg-[#21262D] border border-[#30363D] rounded-xl text-white font-bold text-sm hover:bg-[#30363D] transition-all disabled:opacity-50 flex items-center justify-center"
                >
                    <Save size={18} />
                </button>
            </div>

            {history.length > 0 && (
                <div className="mt-8 pt-6 border-t border-[#30363D]">
                    <div className="flex items-center gap-2 mb-4 text-[#8B949E]">
                        <History size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Session History</span>
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-[150px] pr-2 no-scrollbar">
                        {history.map((note, i) => (
                            <div key={i} className="p-3 bg-[#0D1117] rounded-lg border border-[#30363D] text-[12px] text-[#8B949E] leading-relaxed italic border-l-2 border-l-blue-500">
                                "{note}"
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
