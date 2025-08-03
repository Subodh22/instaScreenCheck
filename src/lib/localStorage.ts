export interface ScreenTimeEntry {
  id: string;
  date: string;
  total_time: string;
  apps: Array<{ name: string; time: string }>;
  categories: Array<{ name: string; time: string }>;
  updated_at: string;
  user_id: string;
  created_at: string;
}

const STORAGE_KEY = 'screen_time_entries';

export const localStorageUtils = {
  // Save screen time entry to local storage
  saveEntry: (entry: Omit<ScreenTimeEntry, 'id' | 'created_at'>): ScreenTimeEntry => {
    if (typeof window === 'undefined') {
      // Server-side fallback - return a mock entry
      return {
        ...entry,
        id: 'server-generated-id',
        created_at: new Date().toISOString()
      };
    }
    
    const entries = localStorageUtils.getAllEntries();
    
    const newEntry: ScreenTimeEntry = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    
    entries.push(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    
    return newEntry;
  },

  // Get all entries from local storage
  getAllEntries: (): ScreenTimeEntry[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  // Get entries by user ID
  getEntriesByUser: (userId: string): ScreenTimeEntry[] => {
    return localStorageUtils.getAllEntries().filter(entry => entry.user_id === userId);
  },

  // Get entries by date
  getEntriesByDate: (date: string): ScreenTimeEntry[] => {
    return localStorageUtils.getAllEntries().filter(entry => entry.date === date);
  },

  // Clear all entries
  clearAllEntries: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  }
}; 