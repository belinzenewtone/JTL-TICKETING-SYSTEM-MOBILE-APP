import { Tabs } from 'expo-router';
import { Ticket, CheckSquare, Grid, User } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';

export default function AdminLayout() {
    const C = useColors();
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: C.tabActive,
                tabBarInactiveTintColor: C.tabInactive,
                tabBarStyle: { display: 'none' },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="tickets"
                options={{
                    title: 'Tickets',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ticket size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'Tasks',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <CheckSquare size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Grid size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <User size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
