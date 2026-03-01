import { View, Text, StyleSheet } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
}

export function EmptyState({ title, subtitle, icon }: Props) {
    const C = useColors();
    return (
        <View style={styles.container}>
            <View style={[styles.iconWrap, { backgroundColor: C.surfaceHigh }]}>
                {icon ?? <Inbox size={40} color={C.textMuted} />}
            </View>
            <Text style={[styles.title, { color: C.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: C.textSub }]}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    iconWrap: {
        width: 72, height: 72, borderRadius: 36,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    title: { fontSize: 17, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
    subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
