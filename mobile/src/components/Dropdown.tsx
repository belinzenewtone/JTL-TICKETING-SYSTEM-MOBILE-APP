import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Menu, Divider } from 'react-native-paper';
import { ChevronDown } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';

interface DropdownProps {
    label: string;
    value: string;
    onSelect: (value: string) => void;
    options: string[];
}

export function Dropdown({ label, value, onSelect, options }: DropdownProps) {
    const C = useColors();
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: C.textSub }]}>{label}</Text>
            <Menu
                visible={visible}
                onDismiss={() => setVisible(false)}
                anchor={
                    <TouchableOpacity
                        onPress={() => setVisible(true)}
                        activeOpacity={0.7}
                        style={[styles.anchor, { backgroundColor: C.inputBg, borderColor: C.border }]}
                    >
                        <Text style={[styles.value, { color: value ? C.text : C.textMuted }]}>
                            {value || `Select ${label}...`}
                        </Text>
                        <ChevronDown size={18} color={C.textMuted} />
                    </TouchableOpacity>
                }
                contentStyle={{ backgroundColor: C.surface, borderRadius: 12, paddingVertical: 4 }}
            >
                {options.map((opt, i) => (
                    <React.Fragment key={opt}>
                        <Menu.Item
                            onPress={() => {
                                onSelect(opt);
                                setVisible(false);
                            }}
                            title={opt}
                            titleStyle={{
                                color: value === opt ? C.primary : C.text,
                                fontWeight: value === opt ? '700' : '400',
                                fontSize: 15,
                                textTransform: 'capitalize'
                            }}
                            style={{
                                minWidth: 180,
                                height: 48,
                                justifyContent: 'center'
                            }}
                        />
                        {i < options.length - 1 && <Divider style={{ marginHorizontal: 12, opacity: 0.5 }} />}
                    </React.Fragment>
                ))}
            </Menu>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    anchor: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1
    },
    value: { fontSize: 15, textTransform: 'capitalize' },
});
