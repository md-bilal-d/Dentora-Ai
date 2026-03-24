import { create } from 'zustand';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  medicalHistory: string;
  allergies: string;
  medications: string;
  lastVisit: string;
  diseaseScore: number;
  risk_level?: number;
  notes: string;
  createdAt: string;
  scanResults: any[];
  treatments: any[];
  appointments: any[];
}

interface PatientState {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  fetchPatients: () => Promise<void>;
  addPatient: (p: Omit<Patient, 'id' | 'createdAt' | 'scanResults' | 'treatments' | 'appointments'>) => Promise<void>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Patient | undefined;
}

const API_BASE = '/api';

const DEMO_PATIENTS: Patient[] = [
  {
    id: 'PT-DEMO-001',
    name: 'Emily Rivera',
    age: 28,
    gender: 'Female',
    phone: '+1 555-0202',
    email: 'emily@example.com',
    medicalHistory: '',
    allergies: '',
    medications: '',
    lastVisit: '2026-03-08',
    diseaseScore: 18,
    risk_level: 18,
    notes: 'Demo patient. Mild sensitivity in upper left quadrant.',
    createdAt: new Date().toISOString(),
    scanResults: [],
    treatments: [],
    appointments: [],
  },
];

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  isLoading: false,
  error: null,

  fetchPatients: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/patients`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      const rawPatients = data.patients || data;
      const mappedPatients = rawPatients.map((p: any) => ({
        ...p,
        lastVisit: p.last_visit || p.lastVisit || 'No record',
        diseaseScore: p.risk_level !== undefined ? p.risk_level : (p.diseaseScore || 0),
        createdAt: p.created_at || p.createdAt || new Date().toISOString()
      }));
      set({ patients: mappedPatients, isLoading: false });
    } catch (err: any) {
      console.error(err);
      set({ patients: DEMO_PATIENTS, error: 'Backend offline, using demo data.', isLoading: false });
    }
  },

  addPatient: async (patientData) => {
    const newPatient = {
      ...patientData,
      id: `PT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      scanResults: [],
      treatments: [],
      appointments: []
    };

    try {
      const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient)
      });
      if (!res.ok) throw new Error('Failed to create patient');
      
      const saved = await res.json();
      // The API only returns { id, status }, so we merge it with our local complete object
      const finalPatient = { ...newPatient, id: saved.id || newPatient.id };
      set(state => ({ patients: [...state.patients, finalPatient] }));
    } catch (err) {
      console.error(err);
      set(state => ({ patients: [...state.patients, newPatient as Patient] }));
    }
  },

  updatePatient: async (id, data) => {
    try {
      const res = await fetch(`${API_BASE}/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update patient');
      
      const updated = get().patients.map(p => p.id === id ? { ...p, ...data } : p);
      set({ patients: updated });
    } catch (err) {
      console.error(err);
      const updated = get().patients.map(p => p.id === id ? { ...p, ...data } : p);
      set({ patients: updated });
    }
  },

  deletePatient: async (id) => {
    try {
      await fetch(`${API_BASE}/patients/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
    const updated = get().patients.filter(p => p.id !== id);
    set({ patients: updated });
  },

  getPatient: (id) => get().patients.find(p => p.id === id),
}));
