import { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Modal, Portal, Button, Divider, TextInput as PaperInput } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { portalApi } from '@/api/client';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { Dropdown } from '@/components/Dropdown';
import { EmptyState } from '@/components/EmptyState';
import { useAuthStore } from '@/store/useAuthStore';
import { useColors } from '@/hooks/useColors';
import type { Ticket, TicketCategory, TicketPriority } from '@/types/database';

const CATEGORIES: TicketCategory[] = ['email', 'account-login', 'password-reset', 'hardware', 'software', 'network-vpn', 'other'];
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

function TicketItem({ ticket }: { ticket: Ticket }) {
    const C = useColors();
    const [expanded, setExpanded] = useState(false);

    return (
        <TouchableOpacity
            style={[styles.ticketCard, { backgroundColor: C.surface }]}
            onPress={() => setExpanded(v => !v)}
            activeOpacity={0.8}
        >
            <View style={styles.ticketHeader}>
                <Text style={[styles.ticketNum, { color: C.primary }]}>#{ticket.number}</Text>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    {expanded ? <ChevronUp size={14} color={C.textMuted} /> : <ChevronDown size={14} color={C.textMuted} />}
                </View>
            </View>
            <Text style={[styles.ticketSubject, { color: C.text }]} numberOfLines={expanded ? undefined : 2}>{ticket.subject}</Text>
            <Text style={[styles.ticketDate, { color: C.textMuted }]}>
                {new Date(ticket.ticket_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                {ticket.department ? ` · ${ticket.department}` : ''}
            </Text>

            {expanded && (
                <>
                    {ticket.description ? (
                        <View style={[styles.descBox, { backgroundColor: C.surfaceHigh }]}>
                            <Text style={[styles.descLabel, { color: C.textMuted }]}>Description</Text>
                            <Text style={[styles.descText, { color: C.textSub }]}>{ticket.description}</Text>
                        </View>
                    ) : null}
                    {ticket.resolution_notes ? (
                        <View style={[styles.resolutionBox, { backgroundColor: C.primaryLight }]}>
                            <Text style={[styles.resolutionLabel, { color: C.primary }]}>Resolution</Text>
                            <Text style={[styles.resolutionText, { color: C.textSub }]}>{ticket.resolution_notes}</Text>
                        </View>
                    ) : null}
                </>
            )}
        </TouchableOpacity>
    );
}

export default function PortalScreen() {
    const C = useColors();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [createVisible, setCreateVisible] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [department, setDepartment] = useState('');
    const [category, setCategory] = useState<TicketCategory>('other');
    const [priority, setPriority] = useState<TicketPriority>('medium');

    const { data: tickets = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['portal-tickets'],
        queryFn: () => portalApi.myTickets().then(r => r.data as Ticket[]),
    });

    const submitMutation = useMutation({
        mutationFn: (data: { subject: string; description: string; department: string; category: TicketCategory; priority: TicketPriority }) =>
            portalApi.submit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portal-tickets'] });
            closeModal();
        },
    });

    const closeModal = () => {
        setCreateVisible(false);
        setSubject('');
        setDescription('');
        setDepartment('');
        setCategory('other');
        setPriority('medium');
    };

    const handleSubmit = () => {
        if (!subject.trim()) return;
        submitMutation.mutate({ subject: subject.trim(), description: description.trim(), department: department.trim(), category, priority });
    };

    const open = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;

    const chipStyle = (active: boolean) => [styles.chip, { borderColor: C.border }, active && { backgroundColor: C.primaryLight, borderColor: C.primary }];
    const chipTextStyle = (active: boolean) => [styles.chipText, { color: C.textSub }, active && { color: C.primary, fontWeight: '600' as const }];

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: C.text }]}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
                    <Text style={[styles.headerSub, { color: C.textSub }]}>{open} ticket{open !== 1 ? 's' : ''} in progress</Text>
                </View>
            </View>

            {/* Stats bar */}
            <View style={[styles.statsBar, { backgroundColor: C.surface }]}>
                {[
                    { label: 'Total', value: tickets.length, color: C.textSub },
                    { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: '#1d4ed8' },
                    { label: 'In Progress', value: tickets.filter(t => t.status === 'in-progress').length, color: '#b45309' },
                    { label: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length, color: C.primary },
                ].map(s => (
                    <View key={s.label} style={styles.statItem}>
                        <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                        <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
                    </View>
                ))}
            </View>

            <Text style={[styles.sectionTitle, { color: C.textSub }]}>Your Tickets</Text>

            <FlatList
                data={tickets}
                keyExtractor={t => t.id}
                renderItem={({ item }) => <TicketItem ticket={item} />}
                contentContainerStyle={tickets.length === 0 ? { flex: 1 } : { paddingBottom: 120 }}
                ListEmptyComponent={
                    <EmptyState
                        title={isLoading ? 'Loading…' : 'No tickets yet'}
                        subtitle="Submit a new ticket and our IT team will assist you"
                    />
                }
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.primary} />}
            />

            <FAB
                icon={() => <Plus size={22} color="#ffffff" />}
                label="Submit Ticket"
                style={[styles.fab, { backgroundColor: C.primary }]}
                onPress={() => setCreateVisible(true)}
            />

            <Portal>
                <Modal visible={createVisible} onDismiss={closeModal} contentContainerStyle={[styles.modal, { backgroundColor: C.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: C.text }]}>Submit a Ticket</Text>
                        <TouchableOpacity onPress={closeModal} hitSlop={12} style={[styles.closeBtn, { backgroundColor: C.surfaceHigh }]}>
                            <X size={16} color={C.textSub} />
                        </TouchableOpacity>
                    </View>
                    <Divider style={{ marginBottom: 16 }} />

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <PaperInput
                            label="Subject *"
                            value={subject}
                            onChangeText={setSubject}
                            mode="outlined"
                            style={[styles.formInput, { backgroundColor: C.inputBg }]}
                            outlineColor={C.inputBorder}
                            activeOutlineColor={C.primary}
                            textColor={C.text}
                            placeholderTextColor={C.textMuted}
                            placeholder="Briefly describe your issue"
                        />
                        <PaperInput
                            label="Description"
                            value={description}
                            onChangeText={setDescription}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={[styles.formInput, { backgroundColor: C.inputBg }]}
                            outlineColor={C.inputBorder}
                            activeOutlineColor={C.primary}
                            textColor={C.text}
                            placeholderTextColor={C.textMuted}
                        />
                        <PaperInput
                            label="Department"
                            value={department}
                            onChangeText={setDepartment}
                            mode="outlined"
                            style={[styles.formInput, { backgroundColor: C.inputBg }]}
                            outlineColor={C.inputBorder}
                            activeOutlineColor={C.primary}
                            textColor={C.text}
                            placeholderTextColor={C.textMuted}
                            placeholder="e.g. Finance, HR, IT"
                        />

                        <Dropdown
                            label="Category *"
                            value={category}
                            options={CATEGORIES}
                            onSelect={(v) => setCategory(v as TicketCategory)}
                        />

                        <Dropdown
                            label="Priority *"
                            value={priority}
                            options={PRIORITIES}
                            onSelect={(v) => setPriority(v as TicketPriority)}
                        />

                        <Button mode="contained" buttonColor={C.primary} loading={submitMutation.isPending} onPress={handleSubmit} style={{ marginTop: 16, marginBottom: 8 }}>
                            Submit Ticket
                        </Button>
                    </ScrollView>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
    greeting: { fontSize: 24, fontWeight: '800' },
    headerSub: { fontSize: 14, marginTop: 2 },
    statsBar: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 11, marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 16, marginBottom: 8 },
    ticketCard: { borderRadius: 14, padding: 14, marginHorizontal: 16, marginVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
    ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    ticketNum: { fontSize: 12, fontWeight: '700' },
    ticketSubject: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
    ticketDate: { fontSize: 12, marginBottom: 4 },
    descBox: { borderRadius: 8, padding: 10, marginTop: 8 },
    descLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    descText: { fontSize: 13, lineHeight: 19 },
    resolutionBox: { borderRadius: 8, padding: 10, marginTop: 8 },
    resolutionLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    resolutionText: { fontSize: 13, lineHeight: 19 },
    fab: { position: 'absolute', bottom: 110, right: 20 },
    modal: { margin: 20, borderRadius: 20, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    filterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1 },
    chipText: { fontSize: 12, textTransform: 'capitalize' },
    formInput: { marginBottom: 10 },
});
