import { useThemeStore } from '@/store/useThemeStore';
import { light, dark } from '@/theme/colors';

export function useColors() {
    const isDark = useThemeStore(s => s.isDark);
    return isDark ? dark : light;
}
