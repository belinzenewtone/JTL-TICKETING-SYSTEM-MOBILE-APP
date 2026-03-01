import { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Modal, Portal, Button, Divider, TextInput as PaperInput } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react-native';
import { tasksApi } from '@/api/client';
import { TaskCard } from '@/components/TaskCard';
import { EmptyState } from '@/components/EmptyState';
import { Dropdown } from '@/components/Dropdown';
import { useAppStore } from '@/store/useAppStore';
import { useColors } from '@/hooks/useColors';
import type { Task, ImportanceLevel } from '@/types/database';

const IMPORTANCES: ImportanceLevel[] = ['urgent', 'important', 'neutral'];

export default function TasksScreen() {
    const C = useColors();
    const queryClient = useQueryClient();
    const { taskFilter, taskImportance, setTaskFilter, setTaskImportance } = useAppStore();
    const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
    const [createVisible, setCreateVisible] = useState(false);
    const [newText, setNewText] = useState('');
    const [newImportance, setNewImportance] = useState<ImportanceLevel>('neutral');
    const [newDate, setNewDate] = useState('');

    const params: Record<string, string> = {};
    if (taskFilter === 'completed') params.completed = 'true';
    if (taskFilter === 'pending') params.completed = 'false';
    if (taskImportance !== 'all') params.importance = taskImportance;

    const { data: tasks = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['tasks', params],
        queryFn: () => tasksApi.list(params).then(r => r.data as Task[]),
    });

    const createMutation = useMutation({
        mutationFn: (data: { text: string; importance: ImportanceLevel; date: string }) =>
            tasksApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            closeModal();
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
            tasksApi.update(id, { completed }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => tasksApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });

    const closeModal = () => {
        setCreateVisible(false);
        setNewText('');
        setNewImportance('neutral');
        setNewDate('');
    };

    const handleCreate = () => {
        if (!newText.trim()) return;
        createMutation.mutate({
            text: newText.trim(),
            importance: newImportance,
            date: newDate || new Date().toISOString().split('T')[0],
        });
    };

    const pending = tasks.filter(t => !t.completed).length;

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: C.text }]}>Tasks</Text>
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
                <Text style={[styles.headerSub, { color: C.primary }]}>{pending} pending</Text>
            </View>

            {viewMode === 'list' ? (
                <>
                    {/* Filter chips */}
                    <View style={styles.filterRow}>
                        {(['all', 'pending', 'completed'] as const).map(f => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.chip, { borderColor: C.border }, taskFilter === f && { backgroundColor: C.primaryLight, borderColor: C.primary }]}
                                onPress={() => setTaskFilter(f)}
                            >
                                <Text style={[styles.chipText, { color: C.textSub }, taskFilter === f && { color: C.primary, fontWeight: '600' }]}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={[styles.dividerV, { backgroundColor: C.border }]} />
                        {IMPORTANCES.map(i => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.chip, { borderColor: C.border }, taskImportance === i && { backgroundColor: C.primaryLight, borderColor: C.primary }]}
                                onPress={() => setTaskImportance(taskImportance === i ? 'all' : i)}
                            >
                                <Text style={[styles.chipText, { color: C.textSub }, taskImportance === i && { color: C.primary, fontWeight: '600' }]}>{i}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <FlatList
                        data={tasks}
                        keyExtractor={t => t.id}
                        renderItem={({ item }) => (
                            <TaskCard
                                task={item}
                                onToggle={() => toggleMutation.mutate({ id: item.id, completed: !item.completed })}
                                onDelete={() => deleteMutation.mutate(item.id)}
                            />
                        )}
                        contentContainerStyle={tasks.length === 0 ? { flex: 1 } : { paddingBottom: 120 }}
                        ListEmptyComponent={
                            <EmptyState
                                title={isLoading ? 'Loading tasks…' : 'No tasks found'}
                                subtitle={isLoading ? '' : 'Tap + to add your first task'}
                            />
                        }
                        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.primary} />}
                    />
                </>
            ) : (
                <ScrollView contentContainerStyle={styles.dashScroll} showsVerticalScrollIndicator={false}>
                    <View style={[styles.dashCard, { backgroundColor: C.surface }]}>
                        <Text style={[styles.dashLabel, { color: C.textMuted }]}>TASK ANALYTICS</Text>
                        <View style={styles.dashGrid}>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: C.text }]}>{tasks.length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Total</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: '#ef4444' }]}>{tasks.filter(t => !t.completed).length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Pending</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: C.primary }]}>{tasks.filter(t => t.completed).length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Done</Text>
                            </View>
                            <View style={styles.dashItem}>
                                <Text style={[styles.dashVal, { color: '#8b5cf6' }]}>{tasks.filter(t => t.importance === 'urgent').length}</Text>
                                <Text style={[styles.dashSub, { color: C.textMuted }]}>Urgent</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}

            <FAB icon={() => <Plus size={22} color="#ffffff" />} style={[styles.fab, { backgroundColor: C.primary }]} onPress={() => setCreateVisible(true)} />

            <Portal>
                <Modal visible={createVisible} onDismiss={closeModal} contentContainerStyle={[styles.modal, { backgroundColor: C.surface }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: C.text }]}>New Task</Text>
                        <TouchableOpacity onPress={closeModal} hitSlop={12} style={[styles.closeBtn, { backgroundColor: C.surfaceHigh }]}>
                            <X size={16} color={C.textSub} />
                        </TouchableOpacity>
                    </View>
                    <Divider style={{ marginBottom: 16 }} />

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <PaperInput
                            label="Task description"
                            value={newText}
                            onChangeText={setNewText}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={[styles.formInput, { backgroundColor: C.inputBg }]}
                            outlineColor={C.inputBorder}
                            activeOutlineColor={C.primary}
                            textColor={C.text}
                        />
                        <PaperInput
                            label="Due date (YYYY-MM-DD)"
                            value={newDate}
                            onChangeText={setNewDate}
                            mode="outlined"
                            style={[styles.formInput, { backgroundColor: C.inputBg }]}
                            outlineColor={C.inputBorder}
                            activeOutlineColor={C.primary}
                            placeholder={new Date().toISOString().split('T')[0]}
                            textColor={C.text}
                        />

                        <Dropdown
                            label="Importance"
                            value={newImportance}
                            options={IMPORTANCES}
                            onSelect={(v) => setNewImportance(v as ImportanceLevel)}
                        />

                        <Button mode="contained" buttonColor={C.primary} loading={createMutation.isPending} onPress={handleCreate} style={{ marginTop: 20 }}>
                            Add Task
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
    headerSub: { fontSize: 14, fontWeight: '600' },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, marginBottom: 12 },
    dividerV: { width: 1, height: 24, marginHorizontal: 4, alignSelf: 'center' },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1 },
    chipText: { fontSize: 12, textTransform: 'capitalize' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fab: { position: 'absolute', bottom: 110, right: 20 },
    modal: { margin: 20, borderRadius: 20, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    filterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
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
