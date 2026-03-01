import { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Divider, TextInput as PaperInput, Modal, Portal } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Lock, Globe, Trash2, UserCheck, Activity } from 'lucide-react-native';
import { ticketsApi, commentsApi, staffApi, activityApi } from '@/api/client';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useColors } from '@/hooks/useColors';
import type { Ticket, TicketComment, TicketStatus } from '@/types/database';

interface StaffUser { id: string; name: string | null; email: string | null; }
interface ActivityEntry { id: string; action: string; field: string | null; old_value: string | null; new_value: string | null; user_name: string; created_at: string; }

const STATUSES: TicketStatus[] = ['open', 'in-progress', 'resolved', 'closed'];

function formatDate(s: string) {
    try { return new Date(s).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return s; }
}

function formatShortDate(s: string) {
    try { return new Date(s).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return s; }
}

export default function TicketDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const C = useColors();
    const { isDark } = useThemeStore();
    const { user } = useAuthStore();
    const [comment, setComment] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [staffPickerVisible, setStaffPickerVisible] = useState(false);
    const [showActivity, setShowActivity] = useState(false);

    const { data: ticket, isLoading } = useQuery({
        queryKey: ['ticket', id],
        queryFn: () => ticketsApi.get(id).then((r: { data: Ticket }) => r.data),
    });

    const { data: comments = [] } = useQuery({
        queryKey: ['comments', id],
        queryFn: () => commentsApi.list(id).then((r: { data: TicketComment[] }) => r.data),
    });

    const { data: staff = [] } = useQuery({
        queryKey: ['staff'],
        queryFn: () => staffApi.list().then((r: { data: StaffUser[] }) => r.data),
        enabled: user?.role !== 'USER',
    });

    const { data: activity = [] } = useQuery({
        queryKey: ['activity', id],
        queryFn: () => activityApi.list(id).then((r: { data: ActivityEntry[] }) => r.data),
        enabled: showActivity && user?.role !== 'USER',
    });

    const updateMutation = useMutation({
        mutationFn: (updates: Partial<Ticket>) => ticketsApi.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ticket', id] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['activity', id] });
        },
    });

    const commentMutation = useMutation({
        mutationFn: (data: { ticket_id: string; content: string; is_internal: boolean }) => commentsApi.create(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['comments', id] }); setComment(''); },
    });

    const deleteMutation = useMutation({
        mutationFn: () => ticketsApi.delete(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tickets'] }); router.back(); },
    });

    const handleDelete = () => {
        Alert.alert('Delete Ticket', 'This cannot be undone. Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
        ]);
    };

    const handleAssign = (staffMember: StaffUser | null) => {
        updateMutation.mutate({ assigned_to: staffMember?.id ?? null });
        setStaffPickerVisible(false);
    };

    if (isLoading || !ticket) {
        return (
            <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
                <View style={styles.loadingHeader}>
                    <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={22} color={C.text} /></TouchableOpacity>
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: C.textMuted }}>Loading…</Text>
                </View>
            </SafeAreaView>
        );
    }

    const assignedStaff = staff.find((s: StaffUser) => s.id === ticket.assigned_to);

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={22} color={C.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: C.text }]}>#{ticket.number}</Text>
                    {user?.role !== 'USER' && (
                        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                            <Trash2 size={18} color="#dc2626" />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Ticket info card */}
                    <View style={[styles.card, { backgroundColor: C.surface, shadowColor: '#000' }]}>
                        <View style={styles.badgeRow}>
                            <StatusBadge status={ticket.status} />
                            <PriorityBadge priority={ticket.priority} />
                        </View>
                        <Text style={[styles.subject, { color: C.text }]}>{ticket.subject}</Text>
                        <Text style={[styles.meta, { color: C.textMuted }]}>{ticket.employee_name} · {ticket.department}</Text>
                        {ticket.description ? <Text style={[styles.description, { color: C.textSub }]}>{ticket.description}</Text> : null}

                        <Divider style={{ marginVertical: 12 }} />

                        {/* Status selector */}
                        {user?.role !== 'USER' && (
                            <>
                                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Update Status</Text>
                                <View style={styles.chipRow}>
                                    {STATUSES.map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[
                                                styles.chip,
                                                { backgroundColor: C.surfaceHigh, borderColor: C.border },
                                                ticket.status === s && { backgroundColor: C.primaryLight, borderColor: C.primary }
                                            ]}
                                            onPress={() => updateMutation.mutate({ status: s })}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                { color: C.textSub },
                                                ticket.status === s && { color: C.primary, fontWeight: '600' }
                                            ]}>
                                                {s}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Staff assignment */}
                                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Assigned To</Text>
                                <TouchableOpacity style={[styles.assignRow, { backgroundColor: C.surfaceHigh }]} onPress={() => setStaffPickerVisible(true)}>
                                    <UserCheck size={16} color={C.primary} />
                                    <Text style={[styles.assignText, { color: C.text }]}>
                                        {assignedStaff ? (assignedStaff.name ?? assignedStaff.email ?? 'Unknown') : 'Unassigned — tap to assign'}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {ticket.resolution_notes ? (
                            <>
                                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Resolution Notes</Text>
                                <Text style={[styles.resolutionText, { color: C.textSub }]}>{ticket.resolution_notes}</Text>
                            </>
                        ) : null}
                    </View>

                    {/* Comments */}
                    <Text style={[styles.commentsTitle, { color: C.text }]}>
                        Comments ({comments.filter((c: TicketComment) => !c.is_internal || user?.role !== 'USER').length})
                    </Text>

                    {comments.map((c: TicketComment) => (
                        <View key={c.id} style={[
                            styles.commentCard,
                            { backgroundColor: C.surface, shadowColor: '#000' },
                            c.is_internal && { backgroundColor: isDark ? 'rgba(180, 83, 9, 0.1)' : '#fffbeb', borderLeftColor: '#f59e0b' }
                        ]}>
                            <View style={styles.commentHeader}>
                                <View style={styles.commentAuthorRow}>
                                    {c.is_internal && <Lock size={11} color="#b45309" />}
                                    <Text style={[styles.commentAuthor, { color: C.text }]}>{c.author_name}</Text>
                                </View>
                                <Text style={[styles.commentDate, { color: C.textMuted }]}>{formatDate(c.created_at)}</Text>
                            </View>
                            <Text style={[styles.commentContent, { color: C.textSub }]}>{c.content}</Text>
                        </View>
                    ))}

                    {/* Add comment */}
                    <View style={styles.commentForm}>
                        {user?.role !== 'USER' && (
                            <TouchableOpacity
                                style={styles.internalToggle}
                                onPress={() => setIsInternal(v => !v)}
                            >
                                {isInternal ? <Lock size={14} color="#b45309" /> : <Globe size={14} color={C.textMuted} />}
                                <Text style={[styles.internalToggleText, { color: C.textMuted }, isInternal && { color: '#b45309' }]}>
                                    {isInternal ? 'Internal note' : 'Public reply'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.commentInputRow}>
                            <PaperInput
                                value={comment}
                                onChangeText={setComment}
                                placeholder="Write a comment…"
                                placeholderTextColor={C.textMuted}
                                mode="outlined"
                                multiline
                                style={[styles.commentInput, { backgroundColor: C.inputBg }]}
                                outlineColor={C.inputBorder}
                                activeOutlineColor={C.primary}
                                textColor={C.text}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, { backgroundColor: C.primary }, !comment.trim() && { backgroundColor: C.border }]}
                                onPress={() => comment.trim() && commentMutation.mutate({ ticket_id: id, content: comment.trim(), is_internal: isInternal })}
                                disabled={!comment.trim() || commentMutation.isPending}
                            >
                                <Send size={18} color="#ffffff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Activity log (admin/staff only) */}
                    {user?.role !== 'USER' && (
                        <View style={styles.activitySection}>
                            <TouchableOpacity style={styles.activityToggle} onPress={() => setShowActivity(v => !v)}>
                                <Activity size={14} color={C.textMuted} />
                                <Text style={[styles.activityToggleText, { color: C.textMuted }]}>
                                    {showActivity ? 'Hide Activity' : 'Show Activity Log'}
                                </Text>
                            </TouchableOpacity>

                            {showActivity && activity.map((entry: ActivityEntry) => (
                                <View key={entry.id} style={styles.activityItem}>
                                    <View style={[styles.activityDot, { backgroundColor: C.border }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.activityText, { color: C.textSub }]}>
                                            <Text style={{ fontWeight: '600', color: C.text }}>{entry.user_name}</Text>
                                            {' '}{entry.action}
                                            {entry.field ? ` (${entry.field})` : ''}
                                        </Text>
                                        {entry.old_value && entry.new_value && (
                                            <Text style={[styles.activityChange, { color: C.textMuted }]}>{entry.old_value} → {entry.new_value}</Text>
                                        )}
                                        <Text style={[styles.activityDate, { color: C.textMuted }]}>{formatShortDate(entry.created_at)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Staff picker modal */}
            <Portal>
                <Modal visible={staffPickerVisible} onDismiss={() => setStaffPickerVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: C.surface }]}>
                    <Text style={[styles.modalTitle, { color: C.text }]}>Assign Ticket</Text>
                    <Divider style={{ marginBottom: 12 }} />

                    <TouchableOpacity style={styles.staffRow} onPress={() => handleAssign(null)}>
                        <View style={[styles.staffAvatar, { backgroundColor: C.surfaceHigh }]}>
                            <Text style={[styles.staffAvatarText, { color: C.textMuted }]}>—</Text>
                        </View>
                        <Text style={[styles.staffName, { color: C.textMuted }]}>Unassigned</Text>
                    </TouchableOpacity>

                    {staff.map((s: StaffUser) => (
                        <TouchableOpacity key={s.id} style={styles.staffRow} onPress={() => handleAssign(s)}>
                            <View style={[styles.staffAvatar, { backgroundColor: C.primaryLight }, ticket.assigned_to === s.id && { backgroundColor: C.primaryLight }]}>
                                <Text style={[styles.staffAvatarText, { color: C.primary }, ticket.assigned_to === s.id && { color: C.primary }]}>
                                    {(s.name ?? s.email ?? '?')[0].toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.staffName, { color: C.text }]}>{s.name ?? s.email}</Text>
                                {s.name && s.email && <Text style={[styles.staffEmail, { color: C.textMuted }]}>{s.email}</Text>}
                            </View>
                            {ticket.assigned_to === s.id && <UserCheck size={16} color={C.primary} />}
                        </TouchableOpacity>
                    ))}

                    <Button mode="outlined" textColor={C.primary} onPress={() => setStaffPickerVisible(false)} style={{ marginTop: 12, borderColor: C.primary }}>Cancel</Button>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    loadingHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '700' },
    deleteBtn: { padding: 8 },
    scroll: { padding: 16, paddingBottom: 40 },
    card: { borderRadius: 16, padding: 16, marginBottom: 16, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    subject: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
    meta: { fontSize: 13, marginBottom: 10 },
    description: { fontSize: 14, lineHeight: 21 },
    sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 13, textTransform: 'capitalize' },
    assignRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10, marginBottom: 12 },
    assignText: { fontSize: 14 },
    resolutionText: { fontSize: 14, lineHeight: 21 },
    commentsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
    commentCard: { borderRadius: 12, padding: 12, marginBottom: 8, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    commentAuthor: { fontSize: 13, fontWeight: '600' },
    commentDate: { fontSize: 11 },
    commentContent: { fontSize: 14, lineHeight: 20 },
    commentForm: { marginTop: 12 },
    internalToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    internalToggleText: { fontSize: 13 },
    commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    commentInput: { flex: 1 },
    sendBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    activitySection: { marginTop: 20 },
    activityToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    activityToggleText: { fontSize: 13 },
    activityItem: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
    activityText: { fontSize: 13, lineHeight: 18 },
    activityChange: { fontSize: 12, marginTop: 2 },
    activityDate: { fontSize: 11, marginTop: 2 },
    modal: { margin: 20, borderRadius: 20, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
    staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    staffAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    staffAvatarText: { fontSize: 14, fontWeight: '700' },
    staffName: { fontSize: 14, fontWeight: '600' },
    staffEmail: { fontSize: 12 },
});
