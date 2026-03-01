import { useState } from 'react';
import { View, Text, StyleSheet, Alert, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput as PaperInput, Modal, Portal, Divider } from 'react-native-paper';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useColors } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Mail, Shield, LogOut, Pencil, X, Moon, Sun } from 'lucide-react-native';
import { profileApi } from '@/api/client';

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrator',
    IT_STAFF: 'IT Staff',
    USER: 'Staff User',
};

export default function AdminProfileScreen() {
    const C = useColors();
    const { user, clearAuth, setAuth, token } = useAuthStore();
    const { isDark, toggle: toggleTheme } = useThemeStore();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [editVisible, setEditVisible] = useState(false);
    const [editName, setEditName] = useState('');

    const openEdit = () => { setEditName(user?.name ?? ''); setEditVisible(true); };

    const saveMutation = useMutation({
        mutationFn: () => profileApi.update({ name: editName.trim() }),
        onSuccess: (res: { data: { name: string } }) => {
            if (user && token) setAuth(token, { ...user, name: res.data.name });
            setEditVisible(false);
        },
        onError: () => Alert.alert('Error', 'Failed to update profile.'),
    });

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out', style: 'destructive',
                onPress: async () => { await clearAuth(); queryClient.clear(); router.replace('/(auth)/login'); },
            },
        ]);
    };

    if (!user) return null;
    const initials = user.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '??';

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <Text style={[styles.pageTitle, { color: C.text }]}>Profile</Text>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={[styles.avatar, { backgroundColor: C.primaryLight, borderColor: C.primary }]}>
                    <Text style={[styles.avatarText, { color: C.primary }]}>{initials}</Text>
                </View>
                <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: C.text }]}>{user.name}</Text>
                    <TouchableOpacity onPress={openEdit} style={[styles.editBtn, { backgroundColor: C.surfaceHigh }]}>
                        <Pencil size={14} color={C.textSub} />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.role, { color: C.textSub }]}>{ROLE_LABELS[user.role] ?? user.role}</Text>
                <View style={[styles.infoCard, { backgroundColor: C.surface }]}>
                    <View style={styles.infoRow}>
                        <Mail size={18} color={C.textMuted} />
                        <View style={styles.infoText}>
                            <Text style={[styles.infoLabel, { color: C.textMuted }]}>Email</Text>
                            <Text style={[styles.infoValue, { color: C.text }]}>{user.email}</Text>
                        </View>
                    </View>
                    <View style={[styles.infoDiv, { backgroundColor: C.borderLight }]} />
                    <View style={styles.infoRow}>
                        <Shield size={18} color={C.textMuted} />
                        <View style={styles.infoText}>
                            <Text style={[styles.infoLabel, { color: C.textMuted }]}>Account Type</Text>
                            <Text style={[styles.infoValue, { color: C.text }]}>{ROLE_LABELS[user.role] ?? user.role}</Text>
                        </View>
                    </View>
                    <View style={[styles.infoDiv, { backgroundColor: C.borderLight }]} />
                    <View style={styles.infoRow}>
                        {isDark ? <Moon size={18} color={C.textMuted} /> : <Sun size={18} color={C.textMuted} />}
                        <View style={styles.infoText}>
                            <Text style={[styles.infoLabel, { color: C.textMuted }]}>Appearance</Text>
                            <Text style={[styles.infoValue, { color: C.text }]}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
                        </View>
                        <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: C.border, true: C.primaryLight }} thumbColor={isDark ? C.primary : C.textMuted} />
                    </View>
                </View>
                <Button
                    mode="outlined"
                    onPress={handleLogout}
                    textColor={isDark ? '#f87171' : '#dc2626'}
                    style={[styles.logoutBtn, { borderColor: isDark ? 'rgba(248, 113, 113, 0.3)' : '#fca5a5' }]}
                    contentStyle={styles.logoutContent}
                    icon={() => <LogOut size={18} color={isDark ? '#f87171' : '#dc2626'} />}
                >
                    Sign Out
                </Button>
            </ScrollView>
            <Portal>
                <Modal visible={editVisible} onDismiss={() => setEditVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: C.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: C.text }]}>Edit Profile</Text>
                        <TouchableOpacity onPress={() => setEditVisible(false)} hitSlop={12} style={[styles.closeBtn, { backgroundColor: C.surfaceHigh }]}>
                            <X size={16} color={C.textSub} />
                        </TouchableOpacity>
                    </View>
                    <Divider style={{ marginBottom: 16 }} />
                    <PaperInput label="Display Name" value={editName} onChangeText={setEditName} mode="outlined" style={{ backgroundColor: C.inputBg, marginBottom: 16 }} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />
                    <Button mode="contained" buttonColor={C.primary} loading={saveMutation.isPending} disabled={!editName.trim() || editName.trim() === user.name} onPress={() => saveMutation.mutate()}>Save Changes</Button>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    pageTitle: { fontSize: 26, fontWeight: '800', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
    scroll: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },
    avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3 },
    avatarText: { fontSize: 28, fontWeight: '800' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    name: { fontSize: 22, fontWeight: '700' },
    editBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    role: { fontSize: 14, marginBottom: 28 },
    infoCard: { width: '100%', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2, marginBottom: 24 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 12, marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '500' },
    infoDiv: { height: 1, marginHorizontal: -16 },
    logoutBtn: { width: '100%', borderRadius: 12 },
    logoutContent: { height: 48 },
    modal: { margin: 20, borderRadius: 20, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
