import { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, KeyboardAvoidingView,
    Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/client';
import { StatusBar } from 'expo-status-bar';
import { useColors } from '@/hooks/useColors';
import { useThemeStore } from '@/store/useThemeStore';

export default function LoginScreen() {
    const C = useColors();
    const isDark = useThemeStore(s => s.isDark);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { setAuth } = useAuthStore();
    const router = useRouter();

    const handleLogin = async () => {
        setError('');

        if (!email.toLowerCase().endsWith('@jtl.co.ke')) {
            setError('Access denied. Only @jtl.co.ke accounts are allowed.');
            return;
        }

        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await authApi.login(email.trim().toLowerCase(), password);
            await setAuth(data.token, {
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                role: data.user.role as any,
            });
            router.replace('/');
        } catch (e: any) {
            const msg = e?.response?.data?.error ?? 'Login failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.root, { backgroundColor: C.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >

                {/* Background blobs */}
                <View style={[styles.blob1, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)' }]} />
                <View style={[styles.blob2, { backgroundColor: isDark ? 'rgba(20, 184, 166, 0.12)' : 'rgba(20, 184, 166, 0.08)' }]} />

                <View style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255,255,255,0.92)' }]}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)' }]}>
                        <Lock size={28} color={C.primary} />
                    </View>

                    <Text style={[styles.title, { color: C.text }]}>Welcome Back</Text>
                    <Text style={[styles.subtitle, { color: C.textSub }]}>Ticketing System — JTL</Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.form}>
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            mode="outlined"
                            outlineColor={C.border}
                            activeOutlineColor={C.primary}
                            textColor={C.text}
                            style={[styles.input, { backgroundColor: C.inputBg }]}
                            placeholder="name@jtl.co.ke"
                            placeholderTextColor={C.textMuted}
                        />

                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            mode="outlined"
                            outlineColor={C.border}
                            activeOutlineColor={C.primary}
                            textColor={C.text}
                            style={[styles.input, { backgroundColor: C.inputBg }]}
                            right={
                                <TextInput.Icon
                                    icon={() =>
                                        showPassword
                                            ? <EyeOff size={20} color={C.textMuted} />
                                            : <Eye size={20} color={C.textMuted} />
                                    }
                                    onPress={() => setShowPassword(v => !v)}
                                />
                            }
                        />

                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                            buttonColor={C.primary}
                            textColor="#ffffff"
                            style={styles.button}
                            contentStyle={styles.buttonContent}
                            labelStyle={styles.buttonLabel}
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    blob1: {
        position: 'absolute', top: '20%', left: '-10%',
        width: 300, height: 300, borderRadius: 150,
    },
    blob2: {
        position: 'absolute', bottom: '20%', right: '-10%',
        width: 300, height: 300, borderRadius: 150,
    },
    card: {
        width: '100%', maxWidth: 400,
        borderRadius: 24, padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconContainer: {
        width: 64, height: 64, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
    },
    title: { fontSize: 26, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
    subtitle: { fontSize: 15, marginBottom: 28, textAlign: 'center' },
    errorBox: {
        width: '100%', backgroundColor: 'rgba(239,68,68,0.12)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
        borderRadius: 12, padding: 14, marginBottom: 20,
    },
    errorText: { color: '#ef4444', fontSize: 14, fontWeight: '500', textAlign: 'center' },
    form: { width: '100%', gap: 14 },
    input: { fontSize: 15 },
    button: { borderRadius: 14, marginTop: 8 },
    buttonContent: { height: 54 },
    buttonLabel: { fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});
