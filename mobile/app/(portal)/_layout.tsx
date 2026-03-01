import { Tabs } from 'expo-router';
import { Ticket, User } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';

export default function PortalLayout() {
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
                name="index"
                options={{
                    title: 'My Tickets',
                    tabBarLabel: 'Tickets',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ticket size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => <User size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
