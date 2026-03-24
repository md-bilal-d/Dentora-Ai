import { AIScanPanel } from './AIScanPanel';
import { AppointmentManager } from './AppointmentManager';
import { PatientProgress } from './PatientProgress';
import { FindClinic } from './FindClinic';
import { ToothPainLocator } from './ToothPainLocator';
import { PrescriptionManager } from './PrescriptionManager';
import { InsuranceDashboard } from './InsuranceDashboard';
import { ErrorBoundary } from './ErrorBoundary';
import { CalendarClock, TrendingUp, MapPin, Bandage, Pill, CreditCard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
    { id: 'aiscan', label: 'AI Scanner', icon: <Sparkles size={16} />, component: AIScanPanel },
    { id: 'schedule', label: 'Schedule', icon: <CalendarClock size={16} />, component: AppointmentManager },
    { id: 'progress', label: 'Progress', icon: <TrendingUp size={16} />, component: PatientProgress },
    { id: 'find-clinic', label: 'Find Clinic', icon: <MapPin size={16} />, component: FindClinic },
    { id: 'pain', label: 'Pain Locator', icon: <Bandage size={16} />, component: ToothPainLocator },
    { id: 'medicine', label: 'Rx & Meds', icon: <Pill size={16} />, component: PrescriptionManager },
    { id: 'billing', label: 'Billing & Ins', icon: <CreditCard size={16} />, component: InsuranceDashboard },
] as const;

type TabId = typeof TABS[number]['id'];

import { useTabStore } from '../store/useTabStore';

export const DentalApp = () => {
    const { activeTab, setActiveTab } = useTabStore();

    return (
        <div className="w-full flex flex-col bg-bg relative min-h-0">
            {/* Navigation Tabs */}
            <div className="z-10 px-6 md:px-8 bg-surface border-b border-border shrink-0">
                <div className="max-w-7xl mx-auto flex gap-0 overflow-x-auto no-scrollbar">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all relative border-b-2
                                ${activeTab === tab.id 
                                    ? 'text-primary border-primary' 
                                    : 'text-text-secondary hover:text-text border-transparent hover:border-text-muted'
                                }
                            `}
                        >
                            <span className={activeTab === tab.id ? 'text-primary' : 'text-text-muted'}>
                                {tab.icon}
                            </span>
                            <span className="hidden sm:inline" style={{ fontFamily: 'var(--font-sans)' }}>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Content */}
            <div className="flex-1 p-4 md:p-6 z-10 w-full max-w-[1400px] mx-auto min-h-[600px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full"
                    >
                        {(() => {
                            // Explicit switch to avoid any array mapping/scrambling issues
                            switch(activeTab) {
                                case 'aiscan': return <ErrorBoundary key="aiscan"><AIScanPanel /></ErrorBoundary>;
                                case 'schedule': return <ErrorBoundary key="schedule"><AppointmentManager /></ErrorBoundary>;
                                case 'progress': return <ErrorBoundary key="progress"><PatientProgress /></ErrorBoundary>;
                                case 'find-clinic': return <ErrorBoundary key="find-clinic"><FindClinic /></ErrorBoundary>;
                                case 'pain': return <ErrorBoundary key="pain"><ToothPainLocator /></ErrorBoundary>;
                                case 'medicine': return <ErrorBoundary key="medicine"><PrescriptionManager /></ErrorBoundary>;
                                case 'billing': return <ErrorBoundary key="billing"><InsuranceDashboard /></ErrorBoundary>;
                                default: return <ErrorBoundary key="default"><AIScanPanel /></ErrorBoundary>;
                            }
                        })()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
