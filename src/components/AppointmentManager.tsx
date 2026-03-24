import { useState, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Clock, Bandage, User, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Appointment {
    id: string;
    date: string;
    time: string;
    treatmentType: string;
    doctor: string;
    notes: string;
    status: 'Confirmed';
}

const TIME_SLOTS = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM'
];

const TREATMENTS = [
    'Cleaning', 'Root Canal', 'Crown Fitting', 
    'Consultation', 'Filling', 'Extraction', 'Whitening'
];

export const AppointmentManager = () => {
    const [view, setView] = useState<'month' | 'week'>('month');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalDate, setModalDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [treatmentType, setTreatmentType] = useState(TREATMENTS[0]);
    const [doctorName, setDoctorName] = useState('');
    const [notes, setNotes] = useState('');
    const { openScheduleBooking, setOpenScheduleBooking } = useTabStore();

    const [nextApptCountdown, setNextApptCountdown] = useState<string>('No upcoming appointments');

    // Handle remote trigger from header
    useEffect(() => {
        if (openScheduleBooking) {
            const today = new Date();
            today.setHours(0,0,0,0);
            setSelectedDate(today);
            setModalDate(today);
            setShowModal(true);
            setOpenScheduleBooking(false); // Reset trigger
        }
    }, [openScheduleBooking, setOpenScheduleBooking]);

    // Update next appointment display
    useEffect(() => {
        const now = new Date();
        
        // Find the closest future appointment across all dates
        const upcoming = appointments
            .map(a => {
                const dt = new Date(a.date);
                // Parse "09:30 AM" format
                const [time, modifier] = a.time.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (hours === 12) hours = 0;
                if (modifier === 'PM') hours += 12;
                
                dt.setHours(hours, minutes, 0, 0);
                return { dt, formattedTime: a.time };
            })
            .filter(item => item.dt > now)
            .sort((a, b) => a.dt.getTime() - b.dt.getTime())[0];

        if (upcoming) {
            const dateStr = upcoming.dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            setNextApptCountdown(`${dateStr} at ${upcoming.formattedTime}`);
        } else {
            setNextApptCountdown('No upcoming appointments');
        }
    }, [appointments]);

    const handleDateClick = (date: Date) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        if (date >= today) {
            setSelectedDate(date);
            setModalDate(date);
            setShowModal(true);
            // Reset form
            setSelectedTime('');
            setTreatmentType(TREATMENTS[0]);
            setDoctorName('');
            setNotes('');
        }
    };

    const handleConfirmBooking = () => {
        if (!selectedTime || !doctorName.trim() || !modalDate) return;
        
        const newAppt: Appointment = {
            id: Date.now().toString(),
            date: modalDate.toISOString().split('T')[0],
            time: selectedTime,
            treatmentType,
            doctor: doctorName,
            notes,
            status: 'Confirmed'
        };
        
        setAppointments(prev => [...prev, newAppt]);
        setShowModal(false);
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysAppointments = appointments.filter(a => a.date === todayStr);

    // Calculate position for week timeline
    const getWeekApptStyle = (timeStr: string) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (hours === 12) hours = 0;
        if (modifier === 'PM') hours += 12;
        
        // Timeline starts at 8 AM (8 = 0px)
        // Each hour is 80px high
        const startHour = 8;
        const topPx = ((hours - startHour) + (minutes / 60)) * 80;
        
        return {
            top: `${topPx}px`,
            left: '8px',
            right: '8px',
            height: '38px', // Approx 30 mins
        };
    };

    const getDaysInCurrentWeek = () => {
        const curr = new Date(selectedDate);
        const day = curr.getDay(); // 0 is Sunday
        const first = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday
        
        const days = [];
        for (let i = 0; i < 6; i++) { // Mon - Sat
            const d = new Date(curr.setDate(first + i));
            days.push(d);
        }
        return days;
    };

    const weekDays = getDaysInCurrentWeek();

    return (
        <div className="w-full h-full flex flex-col lg:flex-row gap-6 lg:overflow-hidden overflow-y-auto pb-20 lg:pb-0" style={{ fontFamily: 'var(--font-sans)', color: 'var(--text)' }}>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-0 min-w-0 rounded-2xl border border-border lg:overflow-hidden" style={{ backgroundColor: '#161B22' }}>
                {/* Toolbar */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full justify-between">
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: '#f8fafc' }}>Schedule</h2>
                        <div className="flex p-1 rounded-lg w-full sm:w-auto" style={{ backgroundColor: '#0D1117' }}>
                            <button onClick={() => setView('month')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'month' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'}`}>Month</button>
                            <button onClick={() => setView('week')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'week' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'}`}>Week Timeline</button>
                        </div>
                    </div>
                </div>

                {/* View Content */}
                <div className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-6 custom-scrollbar">
                    {view === 'month' ? (
                        <div className="max-w-4xl mx-auto custom-calendar-wrapper min-w-[300px]">
                            <Calendar 
                                onChange={(val) => setSelectedDate(val as Date)} 
                                value={selectedDate}
                                onClickDay={handleDateClick}
                                minDate={new Date()} // Disables past dates completely
                                prev2Label={null} // Remove double arrows
                                next2Label={null} // Remove double arrows
                                tileClassName={({ date }) => {
                                    const today = new Date();
                                    today.setHours(0,0,0,0);
                                    if (date.getTime() === today.getTime()) {
                                        return 'border-2 border-primary bg-primary/10 rounded-xl'; // Blue border exactly as before
                                    }
                                    return 'rounded-xl hover:bg-surface-elevated';
                                }}
                                tileContent={({ date, view }) => {
                                    if (view !== 'month') return null;
                                    const dateStr = date.toISOString().split('T')[0];
                                    const dayAppts = appointments.filter(a => a.date === dateStr);
                                    if (dayAppts.length === 0) return null;
                                    return (
                                        <div className="flex justify-center mt-1">
                                            <div className="w-2 h-2 rounded-full bg-success"></div>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    ) : (
                        <div className="w-full relative min-w-[600px] md:min-w-[800px]">
                            <div className="flex border-b border-border pb-2 mb-4">
                                <div className="w-16 md:w-20 shrink-0"></div>
                                {weekDays.map((dateObj, i) => {
                                    const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
                                    return (
                                        <div key={i} className="flex-1 text-center font-semibold text-text-secondary text-sm">
                                            {dayName}
                                            <div className="text-xl text-text mt-1" style={{ fontFamily: 'var(--font-serif)' }}>
                                                {dateObj.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="relative">
                                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
                                    <div key={hour} className="flex h-20 border-b border-border/50 group">
                                        <div className="w-16 md:w-20 shrink-0 flex items-start justify-end pr-2 md:pr-4 text-[10px] md:text-xs font-medium text-text-muted">
                                            {hour > 12 ? `${hour-12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                        </div>
                                        {[0,1,2,3,4,5].map(col => {
                                            const colDate = weekDays[col].toISOString().split('T')[0];
                                            const colAppts = appointments.filter(a => a.date === colDate);

                                            return (
                                                <div key={col} className="flex-1 border-l border-border/30 relative hover:bg-surface-elevated/30 transition-colors">
                                                    {colAppts.map(appt => {
                                                        const style = getWeekApptStyle(appt.time);
                                                        // Only render if it falls roughly in this hour (handling absolute positioning)
                                                        if (hour === 8) { // We only need to render them once per column!
                                                            return (
                                                                <div key={appt.id} className="absolute ml-1 rounded-md shadow-sm p-1.5 overflow-hidden border border-success/30 bg-[#121D16] z-10" style={style}>
                                                                    <div className="flex items-center justify-between">
                                                                        <h4 className="text-[9px] md:text-[10px] font-bold text-success truncate">{appt.treatmentType}</h4>
                                                                    </div>
                                                                    <p className="text-[8px] md:text-[9px] text-text-secondary truncate mt-0.5">{appt.doctor}</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
                
                <div className="rounded-2xl p-6 text-white shadow-[0_0_20px_rgba(47,129,247,0.2)]" style={{ background: 'linear-gradient(135deg, #2F81F7, #1F6FEB)' }}>
                    <h3 className="text-sm font-medium text-blue-100 flex items-center gap-2">
                        <CalendarIcon size={16} /> Next Appointment
                    </h3>
                    <div className="text-2xl font-bold mt-3 font-mono tracking-tight">
                        {nextApptCountdown}
                    </div>
                    {nextApptCountdown !== 'No upcoming appointments' && (
                        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-sm">
                            <span>Status: <strong className="text-white">Confirmed</strong></span>
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        </div>
                    )}
                </div>

                <div className="flex-1 rounded-2xl border border-border p-5 overflow-hidden flex flex-col" style={{ backgroundColor: '#161B22' }}>
                    <h3 className="text-lg font-bold text-text mb-4" style={{ fontFamily: 'var(--font-serif)', color: '#f8fafc' }}>Today's Feed</h3>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {todaysAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-text-muted text-sm border-2 border-dashed border-border rounded-xl">
                                <CalendarIcon size={24} className="mb-2 opacity-50" />
                                No appointments booked yet
                            </div>
                        ) : (
                            todaysAppointments.map(appt => (
                                <div key={appt.id} className="p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-[0_0_10px_rgba(47,129,247,0.08)] transition-all cursor-pointer bg-[#0D1117]">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] px-2.5 py-1 rounded-md font-bold border flex items-center gap-1 bg-success/15 text-success border-success/30">
                                                <CheckCircle2 size={12} /> Confirmed
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm text-text font-medium border-b border-border/50 pb-2">
                                            <Clock size={14} className="text-primary" /> {appt.date} at {appt.time}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                                            <Bandage size={14} className="text-text-muted" /> {appt.treatmentType}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-text-secondary">
                                            <User size={14} className="text-text-muted" /> {appt.doctor}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Booking */}
            <AnimatePresence>
                {showModal && modalDate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
                            style={{ backgroundColor: '#161B22', color: '#f8fafc' }}
                        >
                            <div className="p-8 text-center border-b border-border bg-[#0D1117]">
                                <h2 className="text-3xl font-black text-primary tracking-tight">
                                    {modalDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                </h2>
                            </div>

                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Select Time</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TIME_SLOTS.map(time => (
                                            <button 
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                                    ${selectedTime === time 
                                                        ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(47,129,247,0.4)]' 
                                                        : 'bg-[#0D1117] text-text-secondary border-border hover:border-primary/50 hover:text-text'}`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Treatment Type</label>
                                    <select 
                                        value={treatmentType}
                                        onChange={(e) => setTreatmentType(e.target.value)}
                                        className="w-full bg-[#0D1117] border border-border text-text rounded-xl p-3 outline-none focus:border-primary transition-colors"
                                    >
                                        {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Doctor Name</label>
                                    <input 
                                        type="text" 
                                        value={doctorName}
                                        onChange={(e) => setDoctorName(e.target.value)}
                                        placeholder="e.g. Dr. Smith"
                                        className="w-full bg-[#0D1117] border border-border text-text rounded-xl p-3 outline-none focus:border-primary transition-colors placeholder:text-text-muted/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Notes</label>
                                    <textarea 
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Any special requirements..."
                                        className="w-full bg-[#0D1117] border border-border text-text rounded-xl p-3 outline-none focus:border-primary transition-colors resize-none placeholder:text-text-muted/50"
                                    />
                                </div>

                            </div>

                            <div className="p-6 border-t border-border flex gap-4 bg-[#0D1117]">
                                <button 
                                    onClick={() => setShowModal(false)} 
                                    className="flex-1 py-3 bg-[#161B22] text-text-secondary rounded-xl font-bold hover:bg-surface-elevated transition-colors border border-border"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmBooking}
                                    disabled={!selectedTime || !doctorName.trim()}
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-[0_0_15px_rgba(47,129,247,0.3)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Injected CSS to fix calendar theming and hide built-in disabled styles temporarily */}
            <style dangerouslySetInnerHTML={{__html: `
                /* React-Calendar custom styling to match dark theme perfectly */
                .custom-calendar-wrapper .react-calendar {
                    width: 100%;
                    background: transparent;
                    border: none;
                    font-family: var(--font-sans);
                    color: var(--text);
                }
                .custom-calendar-wrapper .react-calendar__navigation {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2rem;
                }
                .custom-calendar-wrapper .react-calendar__navigation button {
                    color: var(--text);
                    background: none;
                    min-width: 44px;
                    font-size: 1.25rem;
                    font-weight: bold;
                    border-radius: 8px;
                }
                .custom-calendar-wrapper .react-calendar__navigation button:hover,
                .custom-calendar-wrapper .react-calendar__navigation button:focus {
                    background-color: var(--surface-elevated);
                }
                .custom-calendar-wrapper .react-calendar__navigation button[disabled] {
                    opacity: 0.5;
                }
                .custom-calendar-wrapper .react-calendar__month-view__weekdays {
                    text-transform: uppercase;
                    font-weight: bold;
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    text-decoration: none;
                }
                .custom-calendar-wrapper .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none;
                }
                .custom-calendar-wrapper .react-calendar__tile {
                    padding: 1rem 0.5rem;
                    background: none;
                    color: var(--text);
                    border-radius: 12px;
                    font-weight: 500;
                    position: relative;
                }
                .custom-calendar-wrapper .react-calendar__tile:enabled:hover,
                .custom-calendar-wrapper .react-calendar__tile:enabled:focus {
                    background-color: var(--surface-elevated);
                }
                /* Past dates styling */
                .custom-calendar-wrapper .react-calendar__tile:disabled {
                    color: var(--text-muted);
                    background-color: rgba(0, 0, 0, 0.1);
                    opacity: 0.5;
                }
                /* Active state (selected month) */
                .custom-calendar-wrapper .react-calendar__tile--active {
                    background-color: var(--primary) !important;
                    color: white !important;
                    border-radius: 12px;
                }
                .custom-calendar-wrapper .react-calendar__month-view__days__day--neighboringMonth {
                    color: var(--border);
                }
                .custom-calendar-wrapper .react-calendar__tile--now {
                    border: 2px solid var(--primary);
                    color: var(--primary);
                }
            `}} />
        </div>
    );
};
