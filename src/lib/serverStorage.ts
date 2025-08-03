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

// Simple in-memory storage for development (data will be lost on server restart)
const memoryStorage: ScreenTimeEntry[] = [];

export const serverStorage = {
  // Save screen time entry to server memory
  saveEntry: (entry: Omit<ScreenTimeEntry, 'id' | 'created_at'>): ScreenTimeEntry => {
    const newEntry: ScreenTimeEntry = {
      ...entry,
      id: `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    
    memoryStorage.push(newEntry);
    console.log('Saved to server memory:', newEntry);
    
    return newEntry;
  },

  // Get all entries from server memory
  getAllEntries: (): ScreenTimeEntry[] => {
    return [...memoryStorage];
  },

  // Get entries by user ID
  getEntriesByUser: (userId: string): ScreenTimeEntry[] => {
    return memoryStorage.filter(entry => entry.user_id === userId);
  },

  // Get entries by date
  getEntriesByDate: (date: string): ScreenTimeEntry[] => {
    return memoryStorage.filter(entry => entry.date === date);
  },

  // Clear all entries
  clearAllEntries: (): void => {
    memoryStorage.length = 0;
    console.log('Cleared server memory storage');
  }
}; 