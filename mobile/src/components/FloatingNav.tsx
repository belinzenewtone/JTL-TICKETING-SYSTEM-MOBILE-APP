import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
    Ticket, FileBarChart, User,
    MessageSquare, BookOpen, LayoutDashboard, Monitor,
    Briefcase
} from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/store/useAppStore';

const { width } = Dimensions.get('window');

type NavDomain = 'ticketing' | 'reports';

export function FloatingNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuthStore();
    const C = useColors();
    const insets = useSafeAreaInsets();

    // Add domain state to app store or local state for switching
    const [activeDomain, setActiveDomain] = React.useState<NavDomain>('ticketing');

    if (!user) return null;

    const isAdmin = user.role === 'ADMIN' || user.role === 'IT_STAFF';

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    const NavButton = ({
        icon: Icon,
        label,
        onPress,
        active = false,
        small = false
    }: {
        icon: any,
        label: string,
        onPress: () => void,
        active?: boolean,
        small?: boolean
    }) => (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.navBtn,
                active && { backgroundColor: C.primaryLight }
            ]}
        >
            <Icon size={small ? 18 : 22} color={active ? C.primary : C.textSub} />
            <Text style={[
                styles.navLabel,
                { color: active ? C.primary : C.textSub },
                small && { fontSize: 10 }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const DomainToggle = ({
        domain,
        label,
        icon: Icon
    }: {
        domain: NavDomain,
        label: string,
        icon: any
    }) => (
        <TouchableOpacity
            onPress={() => setActiveDomain(domain)}
            style={[
                styles.domainBtn,
                activeDomain === domain && { backgroundColor: C.surfaceHigh }
            ]}
        >
            <Icon size={16} color={activeDomain === domain ? C.primary : C.textMuted} />
            <Text style={[
                styles.domainLabel,
                { color: activeDomain === domain ? C.primary : C.textMuted }
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={[
            styles.wrapper,
            { bottom: insets.bottom > 0 ? insets.bottom + 10 : 20 }
        ]}>
            <View style={[
                styles.container,
                {
                    backgroundColor: C.navBg,
                    borderColor: C.navBorder,
                    shadowColor: '#000',
                }
            ]}>

                {/* Domain Toggles (Left) - Only for Admin */}
                {isAdmin && (
                    <View style={[styles.section, styles.domainSection, { borderRightColor: C.borderLight }]}>
                        <DomainToggle domain="ticketing" label="T" icon={Ticket} />
                        <DomainToggle domain="reports" label="R" icon={FileBarChart} />
                    </View>
                )}

                {/* Contextual Actions (Middle) */}
                <View style={styles.actionsSection}>
                    {isAdmin ? (
                        activeDomain === 'ticketing' ? (
                            <>
                                <NavButton
                                    icon={MessageSquare}
                                    label="Tickets"
                                    onPress={() => router.push('/(admin)/tickets')}
                                    active={isActive('/(admin)/tickets')}
                                    small
                                />
                                <NavButton
                                    icon={BookOpen}
                                    label="KB"
                                    onPress={() => router.push('/(admin)/more/knowledge-base')}
                                    active={isActive('/(admin)/more/knowledge-base')}
                                    small
                                />
                            </>
                        ) : (
                            <>
                                <NavButton
                                    icon={Ticket}
                                    label="Email"
                                    onPress={() => router.push('/(admin)/more/dashboard')} // Links to dashboard for email stats
                                    active={false} // Dashboard is shared
                                    small
                                />
                                <NavButton
                                    icon={Briefcase}
                                    label="Tasks"
                                    onPress={() => router.push('/(admin)/tasks')}
                                    active={isActive('/(admin)/tasks')}
                                    small
                                />
                                <NavButton
                                    icon={Monitor}
                                    label="Machines"
                                    onPress={() => router.push('/(admin)/more/machines')}
                                    active={isActive('/(admin)/more/machines')}
                                    small
                                />
                            </>
                        )
                    ) : (
                        <NavButton
                            icon={Ticket}
                            label="My Tickets"
                            onPress={() => router.push('/(portal)')}
                            active={pathname === '/(portal)'}
                        />
                    )}
                </View>

                {/* Profile (Right) */}
                <View style={[styles.section, styles.profileSection, { borderLeftColor: C.borderLight }]}>
                    <NavButton
                        icon={User}
                        label="Profile"
                        onPress={() => router.push(isAdmin ? '/(admin)/profile' : '/(portal)/profile')}
                        active={isActive('/profile')}
                        small={isAdmin}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    container: {
        flexDirection: 'row',
        height: 64,
        width: width * 0.94,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    section: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    domainSection: {
        width: 55,
        flexDirection: 'column',
        gap: 4,
        paddingVertical: 6,
        borderRightWidth: 1,
    },
    domainBtn: {
        flex: 1,
        width: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    domainLabel: {
        fontSize: 9,
        fontWeight: '700',
        marginTop: 1,
    },
    actionsSection: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    profileSection: {
        width: 60,
        borderLeftWidth: 1,
    },
    navBtn: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRadius: 12,
        minWidth: 50,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
        textAlign: 'center',
    }
});
