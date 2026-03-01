import { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, TextInput, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Modal, Portal, Button, Divider, TextInput as PaperInput } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, X, Plus, Trash2, BookOpen } from 'lucide-react-native';
import { kbApi } from '@/api/client';
import { EmptyState } from '@/components/EmptyState';
import { useColors } from '@/hooks/useColors';
import type { KbArticle } from '@/types/database';

export default function KnowledgeBaseScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const C = useColors();
    const [search, setSearch] = useState('');
    const [createVisible, setCreateVisible] = useState(false);
    const [viewArticle, setViewArticle] = useState<KbArticle | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const params: Record<string, string> = {};
    if (search) params.search = search;

    const { data: articles = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['kb', params],
        queryFn: () => kbApi.list(params).then(r => r.data as KbArticle[]),
    });

    const createMutation = useMutation({
        mutationFn: (data: { title: string; content: string }) => kbApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kb'] });
            setCreateVisible(false);
            setNewTitle('');
            setNewContent('');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => kbApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kb'] }),
    });

    const handleDelete = (article: KbArticle) => {
        Alert.alert('Delete Article', `Delete "${article.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(article.id) },
        ]);
    };

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={C.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: C.text }]}>Knowledge Base</Text>
            </View>

            <View style={[styles.searchRow, { backgroundColor: C.surface }]}>
                <Search size={16} color={C.textMuted} style={{ marginRight: 8 }} />
                <TextInput style={[styles.searchInput, { color: C.text }]} placeholder="Search articles…" placeholderTextColor={C.textMuted} value={search} onChangeText={setSearch} />
                {search ? <TouchableOpacity onPress={() => setSearch('')}><X size={16} color={C.textMuted} /></TouchableOpacity> : null}
            </View>

            <FlatList
                data={articles}
                keyExtractor={a => a.id}
                contentContainerStyle={articles.length === 0 ? { flex: 1 } : { paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.primary} />}
                ListEmptyComponent={
                    <EmptyState
                        title={isLoading ? 'Loading…' : 'No articles yet'}
                        subtitle="Create your first knowledge base article"
                        icon={<BookOpen size={40} color={C.textMuted} />}
                    />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.articleCard, { backgroundColor: C.surface, shadowColor: '#000' }]} onPress={() => setViewArticle(item)} activeOpacity={0.75}>
                        <View style={styles.articleHeader}>
                            <Text style={[styles.articleTitle, { color: C.text }]} numberOfLines={2}>{item.title}</Text>
                            <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
                                <Trash2 size={16} color={C.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.articlePreview, { color: C.textSub }]} numberOfLines={3}>{item.content}</Text>
                        {item.category && (
                            <View style={[styles.catBadge, { backgroundColor: C.primaryLight }]}>
                                <Text style={[styles.catText, { color: C.primary }]}>{item.category}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            />

            <FAB icon={() => <Plus size={22} color="#fff" />} style={[styles.fab, { backgroundColor: C.primary }]} onPress={() => setCreateVisible(true)} />

            <Portal>
                {/* Create modal */}
                <Modal visible={createVisible} onDismiss={() => setCreateVisible(false)} contentContainerStyle={[styles.modal, { backgroundColor: C.surface }]}>
                    <Text style={[styles.modalTitle, { color: C.text }]}>New Article</Text>
                    <Divider style={{ marginBottom: 16 }} />
                    <PaperInput label="Title" value={newTitle} onChangeText={setNewTitle} mode="outlined" style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />
                    <PaperInput label="Content" value={newContent} onChangeText={setNewContent} mode="outlined" multiline numberOfLines={6} style={[styles.formInput, { backgroundColor: C.inputBg }]} outlineColor={C.inputBorder} activeOutlineColor={C.primary} textColor={C.text} />
                    <Button mode="contained" buttonColor={C.primary} loading={createMutation.isPending} onPress={() => createMutation.mutate({ title: newTitle, content: newContent })} style={{ marginTop: 8 }}>
                        Create Article
                    </Button>
                </Modal>

                {/* View article modal */}
                <Modal visible={!!viewArticle} onDismiss={() => setViewArticle(null)} contentContainerStyle={[styles.modal, { backgroundColor: C.surface, maxHeight: '80%' }]}>
                    {viewArticle && (
                        <>
                            <Text style={[styles.modalTitle, { color: C.text }]}>{viewArticle.title}</Text>
                            {viewArticle.category && <View style={[styles.catBadge, { backgroundColor: C.primaryLight, marginBottom: 12 }]}><Text style={[styles.catText, { color: C.primary }]}>{viewArticle.category}</Text></View>}
                            <Divider style={{ marginBottom: 12 }} />
                            <Text style={[styles.articleBody, { color: C.text }]}>{viewArticle.content}</Text>
                            <Button mode="outlined" textColor={C.primary} onPress={() => setViewArticle(null)} style={{ marginTop: 16, borderColor: C.primary }}>Close</Button>
                        </>
                    )}
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
    searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    searchInput: { flex: 1, fontSize: 15 },
    articleCard: { borderRadius: 14, padding: 16, marginHorizontal: 16, marginVertical: 5, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
    articleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    articleTitle: { flex: 1, fontSize: 15, fontWeight: '700', marginRight: 8 },
    articlePreview: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
    catBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
    catText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    fab: { position: 'absolute', bottom: 110, right: 20 },
    modal: { margin: 20, borderRadius: 20, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    formInput: { marginBottom: 10 },
    articleBody: { fontSize: 14, lineHeight: 22 },
});
