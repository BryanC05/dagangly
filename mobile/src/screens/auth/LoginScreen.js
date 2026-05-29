import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { USE_FIREBASE_AUTH } from '../../config';

export default function LoginScreen({ navigation }) {
    const { colors, isDarkMode } = useThemeStore();
    const { t, language } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const login = useAuthStore((s) => s.login);
    const socialLogin = useAuthStore((s) => s.socialLogin);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert(t.error, t.fillAllFields);
            return;
        }
        setLoading(true);
        try {
            await login(email.trim(), password);
        } catch (err) {
            let errorMessage = t.invalidCredentials;
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }
            Alert.alert(t.loginFailed, errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        // If Firebase is disabled in config, show alert
        if (USE_FIREBASE_AUTH === false) {
            Alert.alert(
                "Firebase Disabled", 
                "Firebase authentication is disabled. Please set EXPO_PUBLIC_USE_FIREBASE_AUTH=true in your .env and restart Expo."
            );
            return;
        }

        setSocialLoading(true);
        try {
            // Refined check for Expo Go vs Development Build
            const Constants = require('expo-constants').default;
            const isExpoGo = Constants.appOwnership === 'expo' || !Constants.expoConfig?.extra?.eas?.projectId;

            if (isExpoGo) {
                Alert.alert(
                    "Action Required", 
                    "Social Login (Google) requires a Native Development Build.\n\nStandard Expo Go cannot run the native code required for Google Sign-in. Please use Email/Password or build the app natively using 'npx expo run:android'."
                );
                setSocialLoading(false);
                return;
            }

            // Lazy load modules within try-catch to prevent crash if not found
            let GoogleSignin;
            try {
                // Modular SDK Style (v22+)
                const { getAuth, GoogleAuthProvider, signInWithCredential } = require("@react-native-firebase/auth");
                GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
                
                // Configure Google Sign-in
                GoogleSignin.configure({
                    webClientId: '545811219533-n69ochfh1q72fdb31uhddoaa6i2ar864.apps.googleusercontent.com',
                    offlineAccess: true,
                });

                await GoogleSignin.hasPlayServices();
                const response = await GoogleSignin.signIn();
                
                if (response.type === 'cancelled') {
                    setSocialLoading(false);
                    return;
                }

                const idToken = response.data.idToken;
                if (!idToken) {
                    throw new Error("No ID Token found. Please ensure you have configured your Firebase project correctly.");
                }

                const auth = getAuth();
                const credential = GoogleAuthProvider.credential(idToken);
                const userCredential = await signInWithCredential(auth, credential);
                
                const firebaseToken = await userCredential.user.getIdToken();
                await socialLogin(firebaseToken);
            } catch (moduleErr) {
                if (moduleErr.message.includes("native code")) {
                    throw new Error("Native modules not found. Ensure you are using a Development Build and not Expo Go.");
                }
                throw moduleErr;
            }
        } catch (error) {
            console.error("[Social Auth Error]", error);
            Alert.alert("Login Error", error.message || "Failed to sign in with Google.");
        } finally {
            setSocialLoading(false);
        }
    };

    const styles = {
        container: { 
            flex: 1, 
            backgroundColor: isDarkMode ? '#0f172a' : '#f3f5f7',
        },
        scroll: { 
            flexGrow: 1, 
            justifyContent: 'center', 
            padding: 24,
        },
        card: {
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: isDarkMode ? colors.primary : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkMode ? 0.1 : 0.08,
            shadowRadius: 12,
            elevation: 4,
        },
        header: { alignItems: 'center', marginBottom: 24 },
        title: { 
            fontSize: 24, 
            fontWeight: '800', 
            color: colors.text, 
            marginBottom: 4,
            letterSpacing: 0.3,
        },
        subtitle: { 
            fontSize: 14, 
            color: colors.textSecondary,
        },
        form: { gap: 16 },
        inputGroup: { gap: 6 },
        label: { 
            fontSize: 11, 
            fontWeight: '600', 
            color: colors.textSecondary,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
        },
        inputWrap: {
            flexDirection: 'row', 
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            height: 48,
        },
        inputIcon: { marginRight: 10 },
        input: { 
            flex: 1, 
            fontSize: 15, 
            color: colors.text,
        },
        passwordBtn: {
            padding: 4,
        },
        button: {
            backgroundColor: colors.primary,
            borderRadius: 8,
            height: 48,
            justifyContent: 'center', 
            alignItems: 'center', 
            marginTop: 8,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        socialButton: {
            flexDirection: 'row',
            backgroundColor: isDarkMode ? '#1e293b' : '#fff',
            borderRadius: 8,
            height: 48,
            justifyContent: 'center', 
            alignItems: 'center', 
            marginTop: 12,
            borderWidth: 1,
            borderColor: colors.border,
        },
        socialIcon: {
            width: 20,
            height: 20,
            marginRight: 10,
        },
        dividerContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 20,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: colors.border,
        },
        dividerText: {
            marginHorizontal: 10,
            color: colors.textSecondary,
            fontSize: 12,
            textTransform: 'uppercase',
        },
        buttonDisabled: { opacity: 0.7 },
        buttonText: { 
            color: colors.white, 
            fontSize: 15, 
            fontWeight: '700',
            letterSpacing: 0.5,
        },
        socialButtonText: {
            color: colors.text,
            fontSize: 15,
            fontWeight: '600',
        },
        linkButton: { alignItems: 'center', marginTop: 20 },
        linkText: { fontSize: 14, color: colors.textSecondary },
        linkBold: { color: colors.primary, fontWeight: '700' },
        decorRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 20,
            gap: 4,
        },
        decorDot: {
            width: 4,
            height: 4,
            borderRadius: 2,
        },
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Masuk</Text>
                        <Text style={styles.subtitle}>Selamat datang kembali</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputWrap}>
                                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="nama@email.com"
                                    placeholderTextColor={colors.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrap}>
                                <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Type your Password"
                                    placeholderTextColor={colors.textSecondary}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity 
                                    style={styles.passwordBtn} 
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons 
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                                        size={20} 
                                        color={colors.textSecondary} 
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading || socialLoading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>Masuk</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Atau</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={[styles.socialButton, socialLoading && styles.buttonDisabled]}
                            onPress={handleGoogleLogin}
                            disabled={loading || socialLoading}
                        >
                            {socialLoading ? (
                                <ActivityIndicator color={colors.text} />
                            ) : (
                                <>
                                    <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
                                    <Text style={styles.socialButtonText}>Masuk dengan Google</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.linkText}>
                                Belum punya akun? <Text style={styles.linkBold}>Daftar</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.decorRow}>
                    <View style={[styles.decorDot, { backgroundColor: colors.primary + '40' }]} />
                    <View style={[styles.decorDot, { backgroundColor: colors.primary + '20' }]} />
                    <View style={[styles.decorDot, { backgroundColor: colors.primary + '10' }]} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
