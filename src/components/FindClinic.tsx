import { MapPin, Building2, Star, AlertTriangle } from 'lucide-react';

export const FindClinic = () => {
    return (
        <div className="w-full h-full flex flex-col gap-6 p-4 md:p-8 overflow-y-auto custom-scrollbar bg-bg" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
            
            {/* Header */}
            <div className="text-center md:text-left mb-2">
                <h1 className="text-3xl md:text-4xl text-text mb-2 font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Find a Dental Clinic</h1>
                <p className="text-text-secondary text-base">Locate verified dental clinics near your area instantly using Google Maps.</p>
            </div>

            {/* Main Card */}
            <div className="rounded-[16px] border border-border p-8 md:p-12 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full shrink-0" style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
                
                {/* Animated Tooth SVG */}
                <div className="mb-6 animate-floating">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2F81F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21c-2-1-3-3-3-5v-1c0-1.8-1.5-3.3-3.3-3.3-2 0-3.7-1.5-3.7-3.5 0-2.8 2.2-5 5-5s5 2.2 5 5c0 1.1-.9 2-2 2 .6 0 1.1.4 1.1 1v1c0 2 1 4 3 5z"/>
                        <path d="M12 21c2-1 3-3 3-5v-1c0-1.8 1.5-3.3 3.3-3.3 2 0 3.7-1.5 3.7-3.5 0-2.8-2.2-5-5-5s-5 2.2-5 5c0 1.1.9 2 2 2-.6 0-1.1.4-1.1 1v1c0 2-1 4-3 5z"/>
                    </svg>
                    <style>
                        {`
                        @keyframes float {
                            0% { transform: translateY(0px); }
                            50% { transform: translateY(-10px); }
                            100% { transform: translateY(0px); }
                        }
                        .animate-floating {
                            animation: float 3s ease-in-out infinite;
                        }
                        `}
                    </style>
                </div>

                <h2 className="text-[24px] font-bold text-text mb-8">Find Nearest Dental Clinic</h2>

                {/* Features */}
                <div className="flex flex-col gap-4 w-full max-w-md mb-10 text-left mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 text-success">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-text-secondary text-base">Shows verified dental clinics near your exact location.</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 text-success">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-text-secondary text-base">Gives you real directions from your home to the clinic.</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0 text-success">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="text-text-secondary text-base">Completely free and opens instantly in Google Maps.</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="w-full max-w-md flex flex-col gap-4">
                    <button 
                        onClick={() => window.open('https://www.google.com/maps/search/dental+clinic+near+me', '_blank')}
                        className="w-full h-[56px] bg-[#2F81F7] hover:bg-[#3b8bf7] text-white text-[16px] font-bold rounded-[12px] flex items-center justify-center gap-3 transition-colors shrink-0"
                    >
                        <MapPin size={20} /> Open Google Maps and find a clinic near me
                    </button>
                    
                    <button 
                        onClick={() => window.open('https://www.google.com/maps/search/dental+clinic', '_blank')}
                        className="w-full h-[56px] bg-transparent hover:bg-white/5 border border-[#30363D] text-white text-[16px] font-bold rounded-[12px] flex items-center justify-center gap-2 transition-colors shrink-0"
                    >
                        Search for a specific clinic by name
                    </button>
                </div>

                <p className="text-sm text-text-muted mt-6 max-w-md text-center">
                    We use Google Maps to find clinics. Make sure location access is enabled in your browser for best results.
                </p>
            </div>

            {/* Quick Actions Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full mt-2 border border-border p-4 md:p-6 rounded-[16px] shrink-0" style={{ backgroundColor: '#161B22', borderColor: '#30363D' }}>
                <button 
                    onClick={() => window.open('https://www.google.com/maps/search/emergency+dentist+near+me', '_blank')}
                    className="flex flex-col items-center justify-center gap-3 p-[20px] rounded-[12px] text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#F85149' }}
                >
                    <AlertTriangle size={24} />
                    <span className="font-bold text-[15px]">Emergency Dentist</span>
                </button>
                
                <button 
                    onClick={() => window.open('https://www.google.com/maps/search/dental+hospital+near+me', '_blank')}
                    className="flex flex-col items-center justify-center gap-3 p-[20px] rounded-[12px] text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#2F81F7' }}
                >
                    <Building2 size={24} />
                    <span className="font-bold text-[15px]">Dental Hospital</span>
                </button>
                
                <button 
                    onClick={() => window.open('https://www.google.com/maps/search/orthodontist+near+me', '_blank')}
                    className="flex flex-col items-center justify-center gap-3 p-[20px] rounded-[12px] text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#BC8CFF' }}
                >
                    <Star size={24} />
                    <span className="font-bold text-[15px]">Orthodontist</span>
                </button>
            </div>

            {/* Tips Section */}
            <div className="max-w-4xl mx-auto w-full mt-4 flex flex-col gap-4 shrink-0 pb-12">
                <h3 className="text-xl font-bold text-text mb-2">Tips for choosing a dental clinic</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tip 1 */}
                    <div className="p-4 rounded-[12px] border border-[#30363D] flex items-start gap-4" style={{ backgroundColor: '#0D1117' }}>
                        <div className="text-2xl mt-0.5">⭐</div>
                        <div>
                            <h4 className="font-bold text-text text-[15px] mb-1">Check Google Reviews</h4>
                            <p className="text-sm text-text-secondary">Look for clinics with 4 stars or above.</p>
                        </div>
                    </div>
                    {/* Tip 2 */}
                    <div className="p-4 rounded-[12px] border border-[#30363D] flex items-start gap-4" style={{ backgroundColor: '#0D1117' }}>
                        <div className="text-2xl mt-0.5">🕐</div>
                        <div>
                            <h4 className="font-bold text-text text-[15px] mb-1">Check Opening Hours</h4>
                            <p className="text-sm text-text-secondary">Make sure the clinic is open on your preferred day.</p>
                        </div>
                    </div>
                    {/* Tip 3 */}
                    <div className="p-4 rounded-[12px] border border-[#30363D] flex items-start gap-4" style={{ backgroundColor: '#0D1117' }}>
                        <div className="text-2xl mt-0.5">📍</div>
                        <div>
                            <h4 className="font-bold text-text text-[15px] mb-1">Choose the Closest One</h4>
                            <p className="text-sm text-text-secondary">Pick a clinic within 3 to 5 km of your home.</p>
                        </div>
                    </div>
                    {/* Tip 4 */}
                    <div className="p-4 rounded-[12px] border border-[#30363D] flex items-start gap-4" style={{ backgroundColor: '#0D1117' }}>
                        <div className="text-2xl mt-0.5">📞</div>
                        <div>
                            <h4 className="font-bold text-text text-[15px] mb-1">Call Before You Visit</h4>
                            <p className="text-sm text-text-secondary">Always call ahead to confirm availability.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
