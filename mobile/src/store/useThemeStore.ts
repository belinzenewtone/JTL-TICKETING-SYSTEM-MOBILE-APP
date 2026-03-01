import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
    isDark: boolean;
    toggle: () => void;
    load: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    isDark: false,
    toggle: () => {
        const next = !get().isDark;
        set({ isDark: next });
        AsyncStorage.setItem('app_theme', next ? 'dark' : 'light').catch(() => {});
    },
    load: async () => {
        try {
            const saved = await AsyncStorage.getItem('app_theme');
            if (saved) set({ isDark: saved === 'dark' });
        } catch {}
    },
}));
