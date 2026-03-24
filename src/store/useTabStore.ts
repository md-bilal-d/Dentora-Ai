import { create } from 'zustand';

type TabId = 'aiscan' | 'schedule' | 'progress' | 'find-clinic' | 'pain' | 'medicine' | 'billing';

interface TabState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  openScheduleBooking: boolean;
  setOpenScheduleBooking: (open: boolean) => void;
}

export const useTabStore = create<TabState>((set) => ({
  activeTab: 'aiscan',
  setActiveTab: (tab) => set({ activeTab: tab }),
  openScheduleBooking: false,
  setOpenScheduleBooking: (open) => set({ openScheduleBooking: open }),
}));
