import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Ticket, CheckSquare, Monitor, Mail, TrendingUp, CheckCircle, Clock } from 'lucide-react-native';
import { dashboardApi } from '@/api/client';
import { useColors } from '@/hooks/useColors';

function MetricRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const C = useColors();
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <View style={styles.metricRow}>
            <View style={styles.metricLabel}>
                <Text style={[styles.metricName, { color: C.textSub }]}>{label}</Text>
                <Text style={[styles.metricCount, { color: C.text }]}>{value}</Text>
            </View>
            <View style={[styles.barTrack, { backgroundColor: C.surfaceHigh }]}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
}

function StatCard({ label, value, icon: Icon, color, bgColor }: any) {
    const C = useColors();
    return (
        <View style={[styles.bigStat, { backgroundColor: C.surface, shadowColor: '#000' }]}>
            <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
                <Icon size={18} color={color} />
            </View>
            <Text style={[styles.bigNum, { color: C.text }]}>{value}</Text>
            <Text style={[styles.bigLabel, { color: C.textMuted }]}>{label}</Text>
        </View>
    );
}

export default function DashboardScreen() {
    const router = useRouter();
    const C = useColors();
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => dashboardApi.stats().then(r => r.data as any),
        staleTime: 60_000,
    });

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ArrowLeft size={22} color={C.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: C.text }]}>Dashboard</Text>
            </View>

            {isLoading || !stats ? (
                <View style={styles.loading}><Text style={[styles.loadingText, { color: C.textMuted }]}>Loading stats…</Text></View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* Email Entries (New Section from Web App) */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Mail size={18} color={C.primary} />
                            <Text style={[styles.sectionTitle, { color: C.text }]}>Email Dashboard</Text>
                        </View>
                        <View style={styles.bigStatRow}>
                            <StatCard label="Total" value={stats.entries?.total || 0} icon={Mail} color="#10b981" bgColor="rgba(16, 185, 129, 0.1)" />
                            <StatCard label="Sorted" value={stats.entries?.sorted || 0} icon={CheckCircle} color="#06b6d4" bgColor="rgba(6, 182, 212, 0.1)" />
                            <StatCard label="Pending" value={stats.entries?.pending || 0} icon={Clock} color="#f59e0b" bgColor="rgba(245, 158, 11, 0.1)" />
                        </View>
                    </View>

                    {/* Tickets */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ticket size={18} color="#8b5cf6" />
                            <Text style={[styles.sectionTitle, { color: C.text }]}>Ticketing System</Text>
                        </View>
                        <View style={styles.bigStatRow}>
                            <StatCard label="Total" value={stats.tickets.total} icon={Ticket} color="#8b5cf6" bgColor="rgba(139, 92, 246, 0.1)" />
                            <StatCard label="Open" value={stats.tickets.open} icon={TrendingUp} color="#3b82f6" bgColor="rgba(59, 130, 246, 0.1)" />
                            <StatCard label="Resolved" value={stats.tickets.resolved} icon={CheckCircle} color="#10b981" bgColor="rgba(16, 185, 129, 0.1)" />
                        </View>
                        <View style={[styles.card, { backgroundColor: C.surface, shadowColor: '#000' }]}>
                            <MetricRow label="Open" value={stats.tickets.open} total={stats.tickets.total} color="#3b82f6" />
                            <MetricRow label="In Progress" value={stats.tickets.in_progress} total={stats.tickets.total} color="#f59e0b" />
                            <MetricRow label="Resolved" value={stats.tickets.resolved} total={stats.tickets.total} color="#10b981" />
                            <MetricRow label="Closed" value={stats.tickets.closed} total={stats.tickets.total} color="#6b7280" />
                        </View>
                    </View>

                    {/* Tasks & Machines */}
                    <View style={styles.row}>
                        <View style={[styles.halfSection, { backgroundColor: C.surface, shadowColor: '#000' }]}>
                            <View style={styles.sectionHeader}>
                                <CheckSquare size={16} color="#f59e0b" />
                                <Text style={[styles.subTitle, { color: C.text }]}>Tasks</Text>
                            </View>
                            <Text style={[styles.halfNum, { color: C.text }]}>{stats.tasks.total}</Text>
                            <Text style={[styles.halfLabel, { color: C.textMuted }]}>{stats.tasks.pending} pending</Text>
                        </View>
                        <View style={[styles.halfSection, { backgroundColor: C.surface, shadowColor: '#000' }]}>
                            <View style={styles.sectionHeader}>
                                <Monitor size={16} color="#06b6d4" />
                                <Text style={[styles.subTitle, { color: C.text }]}>Machines</Text>
                            </View>
                            <Text style={[styles.halfNum, { color: C.text }]}>{stats.machines.total}</Text>
                            <Text style={[styles.halfLabel, { color: C.textMuted }]}>{stats.machines.pending} requests</Text>
                        </View>
                    </View>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { padding: 4, marginRight: 10 },
    title: { fontSize: 22, fontWeight: '800' },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 15 },
    scroll: { padding: 16, paddingTop: 4, paddingBottom: 120 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    sectionTitle: { fontSize: 17, fontWeight: '700' },
    subTitle: { fontSize: 15, fontWeight: '600' },
    bigStatRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    bigStat: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    bigNum: { fontSize: 24, fontWeight: '800' },
    bigLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
    card: { borderRadius: 18, padding: 18, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
    metricRow: { marginBottom: 14 },
    metricLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    metricName: { fontSize: 13, fontWeight: '500' },
    metricCount: { fontSize: 13, fontWeight: '700' },
    barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 4 },
    row: { flexDirection: 'row', gap: 12 },
    halfSection: { flex: 1, borderRadius: 18, padding: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    halfNum: { fontSize: 24, fontWeight: '800', marginVertical: 4 },
    halfLabel: { fontSize: 12, fontWeight: '500' },
});
