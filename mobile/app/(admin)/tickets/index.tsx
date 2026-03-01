import { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TextInput, TouchableOpacity, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Modal, Portal, Button, Divider, TextInput as PaperInput } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal, X, Plus } from 'lucide-react-native';
import { ticketsApi } from '@/api/client';
import { TicketCard } from '@/components/TicketCard';
import { EmptyState } from '@/components/EmptyState';
import { Dropdown } from '@/components/Dropdown';
import { useAppStore } from '@/store/useAppStore';
import { useColors } from '@/hooks/useColors';
import type { Ticket, TicketStatus, TicketPriority, TicketCategory, CreateTicketInput } from '@/types/database';

const STATUSES: TicketStatus[] = ['open', 'in-progress', 'resolved', 'closed'];
const PRIORITIES: TicketPriority[] = ['critical', 'high', 'medium', 'low'];
const CATEGORIES: TicketCategory[] = ['email', 'account-login', 'password-reset', 'hardware', 'software', 'network-vpn', 'other'];

export default function TicketsScreen() {
    const C = useColors();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { ticketStatus, ticketPriority, ticketSearch, setTicketStatus, setTicketPriority, setTicketSearch } = useAppStore();
    const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
    const [filterVisible, setFilterVisible] = useState(false);
    const [createVisible, setCreateVisible] = useState(false);

    const [form, setForm] = useState<Partial<CreateTicketInput>>({
        priority: 'medium', category: 'other', status: 'open',
    });

    const params: Record<string, string> = {};
    if (ticketStatus !== 'all') params.status = ticketStatus;
    if (ticketPriority !== 'all') params.priority = ticketPriority;
    if (ticketSearch) params.search = ticketSearch;

    const { data: tickets = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['tickets', params],
        queryFn: () => ticketsApi.list(params).then((r: { data: Ticket[] }) => r.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateTicketInput) => ticketsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            setCreateVisible(false);
            setForm({ priority: 'medium', category: 'other', status: 'open' });
        },
    });

    const handleCreate = () => {
        if (!form.employee_name || !form.subject || !form.category || !form.priority) return;
        const today = new Date().toISOString().split('T')[0];
        createMutation.mutate({ ...form, ticket_date: today } as CreateTicketInput);
    };

    const renderTicket = useCallback(({ item }: { item: Ticket }) => (
        <TicketCard ticket={item} onPress={() => router.push(`/(admin)/tickets/${item.id}`)} />
    ), [router]);

    const chipStyle = (active: boolean) => [
        styles.chip,
        { borderColor: C.border },
        active && { backgroundColor: C.primaryLight, borderColor: C.primary },
    ];
    const chipTextStyle = (active: boolean) => [
        styles.chipText,
        { color: C.textSub },
        active && { color: C.primary, fontWeight: '600' as const },
    ];

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: C.text }]}>Ticketing</Text>
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
                <View style={styles.headerRight}>
                    {viewMode === 'list' && (
                        <>
                            {(ticketStatus !== 'all' || ticketPriority !== 'all') && (
                                <View style={[styles.filterDot, { backgroundColor: C.primary }]} />
                            )}
                            <TouchableOpacity onPress={() => setFilterVisible(true)} style={styles.iconBtn}>
                                <SlidersHorizontal size={20} color={C.textSub} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {viewMode === 'list' ? (
                <>
                    {/* Search */}
                    <View style={[styles.searchRow, { backgroundColor: C.surface }]}>
                        <Search size={16} color={C.textMuted} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: C.text }]}
                            placeholder="Search tickets…"
                            placeholderTextColor={C.textMuted}
                            value={ticketSearch}
                            onChangeText={setTicketSearch}
                        />
                        {ticketSearch ? (
                            <TouchableOpacity onPress={() => setTicketSearch('')}>
                                <X size={16} color={C.textMuted} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <Text style={[styles.statsText, { color: C.textSub }]}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</Text>
                        <Text style={[styles.statsOpen, { color: C.primary }]}>{tickets.filter((t: Ticket) => t.status === 'open').length} open</Text>
                    </View>

                    <FlatList
                        data={tickets}
                        keyExtractor={(t: Ticket) => t.id}
                        renderItem={renderTicket}
                        contentContainerStyle={tickets.length === 0 ? { flex: 1 } : { paddingBottom: 120 }}
                        ListEmptyComponent={
                            <EmptyState
                                title={isLoading ? 'Loading tickets…' : 'No tickets found'}
                                subtitle={isLoading ? '' : 'Create a new ticket to get started'}
                            />
                        }
                        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.primary} />}
                    />
                </>
            ) : (
                <ScrollView contentContainerStyle={styles.dashScroll} showsVerticalScrollIndicator={false}>
                    <View style={[styles.dashCard, { backgroundColor: C.surface }]}>
                        <Text style={[styles.dashLabel, { color: C.textMuted }]}>TICKETING OVERVIEW</Text>
                        <View style={styles.dashGrid}>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: C.text }]}>{tickets.length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Total</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: '#ef4444' }]}>{tickets.filter(t => t.status === 'open').length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Open</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: '#f59e0b' }]}>{tickets.filter(t => t.status === 'in-progress').length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Active</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: C.primary }]}>{tickets.filter(t => t.status === 'resolved').length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Solved</Text>
                            </View>
                        </View>
                    </View>

                    {/* Add more ticketing specific widgets here if needed */}
                </ScrollView>
            )}

            <FAB icon={() => <Plus size={22} color="#ffffff" />} style={[styles.fab, { backgroundColor: C.primary }]} onPress={() => setCreateVisible(true)} />

            {/* Filter Modal */}
            <Portal>
                <Modal visible={filterVisible} onDismiss={() => setFilterVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: C.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: C.text }]}>Filter Tickets</Text>
                        <TouchableOpacity onPress={() => setFilterVisible(false)} hitSlop={12} style={[styles.closeBtn, { backgroundColor: C.surfaceHigh }]}>
                            <X size={16} color={C.textSub} />
                        </TouchableOpacity>
                    </View>
                    <Divider style={{ marginBottom: 16 }} />

                    <Text style={[styles.filterLabel, { color: C.textSub }]}>Status</Text>
                    <View style={styles.chipRow}>
                        {(['all', ...STATUSES] as const).map(s => (
                            <TouchableOpacity key={s} style={chipStyle(ticketStatus === s)} onPress={() => setTicketStatus(s as any)}>
                                <Text style={chipTextStyle(ticketStatus === s)}>{s === 'all' ? 'All' : s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.filterLabel, { color: C.textSub }]}>Priority</Text>
                    <View style={styles.chipRow}>
                        {(['all', ...PRIORITIES] as const).map(p => (
                            <TouchableOpacity key={p} style={chipStyle(ticketPriority === p)} onPress={() => setTicketPriority(p as any)}>
                                <Text style={chipTextStyle(ticketPriority === p)}>{p === 'all' ? 'All' : p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Button mode="contained" buttonColor={C.primary} onPress={() => setFilterVisible(false)} style={{ marginTop: 8 }}>
                        Apply
                    </Button>
                </Modal>

                {/* Create Ticket Modal */}
                <Modal visible={createVisible} onDismiss={() => setCreateVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: C.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: C.text }]}>New Ticket</Text>
                        <TouchableOpacity onPress={() => setCreateVisible(false)} hitSlop={12} style={[styles.closeBtn, { backgroundColor: C.surfaceHigh }]}>
                            <X size={16} color={C.textSub} />
                        </TouchableOpacity>
                    </View>
                    <Divider style={{ marginBottom: 16 }} />

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <PaperInput label="Employee Name *" value={form.employee_name ?? ''} onChangeText={(v: string) => setForm(f => ({ ...f, employee_name: v }))} mode="outlined" style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />
                        <PaperInput label="Department" value={form.department ?? ''} onChangeText={(v: string) => setForm(f => ({ ...f, department: v }))} mode="outlined" style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />
                        <PaperInput label="Subject *" value={form.subject ?? ''} onChangeText={(v: string) => setForm(f => ({ ...f, subject: v }))} mode="outlined" style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />
                        <PaperInput label="Description" value={form.description ?? ''} onChangeText={(v: string) => setForm(f => ({ ...f, description: v }))} mode="outlined" multiline numberOfLines={3} style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />

                        <Dropdown
                            label="Category *"
                            value={form.category ?? 'other'}
                            options={CATEGORIES}
                            onSelect={(v) => setForm(f => ({ ...f, category: v as TicketCategory }))}
                        />

                        <Dropdown
                            label="Priority *"
                            value={form.priority ?? 'medium'}
                            options={PRIORITIES}
                            onSelect={(v) => setForm(f => ({ ...f, priority: v as TicketPriority }))}
                        />

                        <Dropdown
                            label="Initial Status"
                            value={form.status ?? 'open'}
                            options={STATUSES}
                            onSelect={(v) => setForm(f => ({ ...f, status: v as TicketStatus }))}
                        />

                        <Button mode="contained" buttonColor={C.primary} loading={createMutation.isPending} onPress={handleCreate} style={{ marginTop: 16, marginBottom: 8 }}>
                            Create Ticket
                        </Button>
                    </ScrollView>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    headerTitle: { fontSize: 26, fontWeight: '800' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    filterDot: { width: 8, height: 8, borderRadius: 4 },
    iconBtn: { padding: 8 },
    searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
    statsText: { fontSize: 13 },
    statsOpen: { fontSize: 13, fontWeight: '600' },
    fab: { position: 'absolute', bottom: 110, right: 20 },
    modal: { margin: 20, borderRadius: 20, padding: 24, maxHeight: '88%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    filterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1 },
    chipText: { fontSize: 13, textTransform: 'capitalize' },
    formInput: { marginBottom: 10 },
    // Toggle Styles
    toggleWrap: { flexDirection: 'row', borderRadius: 8, padding: 2, marginTop: 8, width: 160 },
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
