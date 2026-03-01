import { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, RefreshControl, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Modal, Portal, Button, Divider, TextInput as PaperInput } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Monitor } from 'lucide-react-native';
import { machinesApi } from '@/api/client';
import { EmptyState } from '@/components/EmptyState';
import { useColors } from '@/hooks/useColors';
import { Dropdown } from '@/components/Dropdown';
import type { MachineRequest, MachineStatus, MachineReason, ImportanceLevel } from '@/types/database';

const STATUSES: MachineStatus[] = ['pending', 'approved', 'fulfilled', 'rejected'];
const REASONS: MachineReason[] = ['old-hardware', 'faulty', 'new-user'];
const IMPORTANCE: ImportanceLevel[] = ['urgent', 'important', 'neutral'];

function MachineCard({ item, onStatusChange }: { item: MachineRequest; onStatusChange: (id: string, status: MachineStatus) => void }) {
    const C = useColors();

    const STATUS_COLOR: Record<MachineStatus, { bg: string; text: string }> = {
        pending: { bg: C.primaryLight, text: C.primary },
        approved: { bg: C.primaryLight, text: C.primary },
        fulfilled: { bg: '#dbeafe', text: '#1d4ed8' },
        rejected: { bg: '#fee2e2', text: '#dc2626' },
    };

    const c = STATUS_COLOR[item.status];
    return (
        <View style={[styles.card, { backgroundColor: C.surface, shadowColor: '#000' }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.cardNum, { color: C.primary }]}>#{item.number}</Text>
                <View style={[styles.badge, { backgroundColor: c.bg }]}>
                    <Text style={[styles.badgeText, { color: c.text }]}>{item.status}</Text>
                </View>
            </View>
            <Text style={[styles.cardName, { color: C.text }]}>{item.user_name}</Text>
            <Text style={[styles.cardMeta, { color: C.textSub }]}>{item.requester_name} · {item.work_email}</Text>
            <Text style={[styles.cardReason, { color: C.textMuted }]}>Reason: {item.reason}</Text>

            {item.status === 'pending' && (
                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.approveBtn, { backgroundColor: C.primaryLight }]} onPress={() => onStatusChange(item.id, 'approved')}>
                        <Text style={[styles.approveBtnText, { color: C.primary }]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => onStatusChange(item.id, 'rejected')}>
                        <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                </View>
            )}
            {item.status === 'approved' && (
                <TouchableOpacity style={styles.fulfillBtn} onPress={() => onStatusChange(item.id, 'fulfilled')}>
                    <Text style={styles.fulfillBtnText}>Mark Fulfilled</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export default function MachinesScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const C = useColors();
    const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
    const [statusFilter, setStatusFilter] = useState<MachineStatus | 'all'>('all');
    const [createVisible, setCreateVisible] = useState(false);
    const [form, setForm] = useState({ requester_name: '', user_name: '', work_email: '', reason: 'faulty' as MachineReason, importance: 'neutral' as ImportanceLevel, notes: '' });

    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;

    const { data: machines = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['machines', params],
        queryFn: () => machinesApi.list(params).then(r => r.data as MachineRequest[]),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: MachineStatus }) => machinesApi.update(id, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
    });

    const createMutation = useMutation({
        mutationFn: (data: typeof form) => machinesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            setCreateVisible(false);
            setForm({ requester_name: '', user_name: '', work_email: '', reason: 'faulty', importance: 'neutral', notes: '' });
        },
    });

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={C.text} />
                </TouchableOpacity>
                <View>
                    <Text style={[styles.title, { color: C.text }]}>Machines</Text>
                    <View style={[styles.toggleWrap, { backgroundColor: C.surfaceHigh }]}>
                        <TouchableOpacity
                            onPress={() => setViewMode('list')}
                            style={[styles.toggleBtn, viewMode === 'list' && { backgroundColor: C.primary }]}
                        >
                            <Text style={[styles.toggleText, { color: viewMode === 'list' ? '#fff' : C.textSub }]}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('dashboard')}
                            style={[styles.toggleBtn, viewMode === 'dashboard' && { backgroundColor: C.primary }]}
                        >
                            <Text style={[styles.toggleText, { color: viewMode === 'dashboard' ? '#fff' : C.textSub }]}>Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {viewMode === 'list' ? (
                <>
                    {/* Status filter chips */}
                    <View style={styles.filterRow}>
                        {(['all', ...STATUSES] as const).map(s => (
                            <TouchableOpacity
                                key={s}
                                style={[
                                    styles.chip,
                                    { backgroundColor: C.surfaceHigh, borderColor: C.border },
                                    statusFilter === s && { backgroundColor: C.primaryLight, borderColor: C.primary }
                                ]}
                                onPress={() => setStatusFilter(s)}
                            >
                                <Text style={[styles.chipText, { color: C.textSub }, statusFilter === s && { color: C.primary, fontWeight: '600' }]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <FlatList
                        data={machines}
                        keyExtractor={m => m.id}
                        contentContainerStyle={machines.length === 0 ? { flex: 1 } : { paddingBottom: 120 }}
                        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.primary} />}
                        ListEmptyComponent={
                            <EmptyState
                                title={isLoading ? 'Loading…' : 'No machine requests'}
                                subtitle="No requests match the current filter"
                                icon={<Monitor size={40} color={C.textMuted} />}
                            />
                        }
                        renderItem={({ item }) => (
                            <MachineCard item={item} onStatusChange={(id, status) => updateMutation.mutate({ id, status })} />
                        )}
                    />
                </>
            ) : (
                <ScrollView contentContainerStyle={styles.dashScroll} showsVerticalScrollIndicator={false}>
                    <View style={[styles.dashCard, { backgroundColor: C.surface }]}>
                        <Text style={[styles.dashLabel, { color: C.textMuted }]}>INVENTORY ANALYTICS</Text>
                        <View style={styles.dashGrid}>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: C.text }]}>{machines.length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Total</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: '#f59e0b' }]}>{machines.filter(m => m.status === 'pending').length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Pending</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: C.primary }]}>{machines.filter(m => m.status === 'approved').length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Approved</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: '#10b981' }]}>{machines.filter(m => m.status === 'fulfilled').length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Fulfilled</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}

            <FAB icon={() => <Plus size={22} color="#fff" />} style={[styles.fab, { backgroundColor: C.primary }]} onPress={() => setCreateVisible(true)} />

            <Portal>
                <Modal visible={createVisible} onDismiss={() => setCreateVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: C.surface }]}>
                    <Text style={[styles.modalTitle, { color: C.text }]}>New Machine Request</Text>
                    <Divider style={{ marginBottom: 16 }} />
                    <PaperInput label="Requester Name" value={form.requester_name} onChangeText={v => setForm(f => ({ ...f, requester_name: v }))} mode="outlined" style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />
                    <PaperInput label="User Name" value={form.user_name} onChangeText={v => setForm(f => ({ ...f, user_name: v }))} mode="outlined" style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />
                    <PaperInput label="Work Email" value={form.work_email} onChangeText={v => setForm(f => ({ ...f, work_email: v }))} mode="outlined" keyboardType="email-address" style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />

                    <Dropdown label="Reason" value={form.reason} options={REASONS} onSelect={v => setForm(f => ({ ...f, reason: v as MachineReason }))} />
                    <Dropdown label="Importance" value={form.importance} options={IMPORTANCE} onSelect={v => setForm(f => ({ ...f, importance: v as ImportanceLevel }))} />

                    <PaperInput label="Notes (optional)" value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} mode="outlined" multiline numberOfLines={2} style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />

                    <Button mode="contained" buttonColor={C.primary} loading={createMutation.isPending} onPress={() => createMutation.mutate(form)} style={{ marginTop: 8 }}>
                        Submit Request
                    </Button>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { padding: 4, marginRight: 10 },
    title: { fontSize: 20, fontWeight: '700' },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, marginBottom: 10 },
    chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 12, textTransform: 'capitalize' },
    card: { borderRadius: 14, padding: 14, marginHorizontal: 16, marginVertical: 5, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    cardNum: { fontSize: 12, fontWeight: '700' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    cardName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    cardMeta: { fontSize: 13, marginBottom: 2 },
    cardReason: { fontSize: 13, textTransform: 'capitalize', marginBottom: 10 },
    actionRow: { flexDirection: 'row', gap: 10 },
    approveBtn: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
    approveBtnText: { fontWeight: '600', fontSize: 13 },
    rejectBtn: { flex: 1, backgroundColor: '#fee2e2', borderRadius: 8, padding: 8, alignItems: 'center' },
    rejectBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
    fulfillBtn: { backgroundColor: '#dbeafe', borderRadius: 8, padding: 8, alignItems: 'center' },
    fulfillBtnText: { color: '#1d4ed8', fontWeight: '600', fontSize: 13 },
    fab: { position: 'absolute', bottom: 110, right: 20 },
    modal: { margin: 20, borderRadius: 20, padding: 24, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    formInput: { marginBottom: 10 },
    // Toggle Styles
    toggleWrap: { flexDirection: 'row', borderRadius: 8, padding: 2, marginTop: 4, width: 160 },
    toggleBtn: { flex: 1, paddingVertical: 4, alignItems: 'center', borderRadius: 6 },
    toggleText: { fontSize: 12, fontWeight: '600' },
    // Dash Styles
    dashScroll: { padding: 16, paddingBottom: 120 },
    dashCard: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    dashLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
    dashGrid: { flexDirection: 'row', flexWrap: 'wrap', margin: -8 },
    dashItem: { width: '50%', padding: 8 },
    dashVal: { fontSize: 24, fontWeight: '800' },
    dashSub: { fontSize: 12, marginTop: 2 },
});
