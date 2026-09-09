import { useState, useCallback } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { colors, fonts, spacing } from '../theme';
import Field from '../components/Field';
import Button from '../components/Button';
import Panel from '../components/Panel';
import Banner from '../components/Banner';

export default function LoginScreen({ navigation }) {
  const [step, setStep] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitPassword = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.login({ email, password });
      setChallengeId(result.challengeId);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const submitOtp = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.verifyLoginOtp({ challengeId, otp });
      await AsyncStorage.setItem('token', result.token);
      await AsyncStorage.setItem('accountId', String(result.accountId));
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [challengeId, otp, navigation]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Banking that gets{'\n'}out of your way.</Text>
          <Text style={styles.heroSub}>
            Move money and manage your account from one place — with step-up
            verification on anything that matters.
          </Text>
        </View>

        <Panel accent style={styles.card}>
          <Text style={styles.cardTitle}>Log in</Text>

          {step === 'password' && (
            <>
              <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
              <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
              <Button title="Continue" onPress={submitPassword} loading={loading} />
            </>
          )}

          {step === 'otp' && (
            <>
              <Banner tone="hint">Enter the OTP sent to your registered mobile number. (Demo OTP: 123456)</Banner>
              <Field label="One-time passcode" keyboardType="number-pad" value={otp} onChangeText={setOtp} />
              <Button title="Verify" onPress={submitOtp} loading={loading} />
            </>
          )}

          {error && <Banner tone="error" style={{ marginTop: 14, marginBottom: 0 }}>{error}</Banner>}

          <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
            New here? Open an account
          </Text>
          <Text style={styles.hint}>Demo login: demo@finsecure.com / Passw0rd!</Text>
        </Panel>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink },
  scroll: { flexGrow: 1 },
  hero: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  heroTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.white, marginBottom: 12 },
  heroSub: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: 'rgba(255,255,255,0.7)' },
  card: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  cardTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginBottom: 16 },
  link: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: colors.brassDark, marginTop: 16, textAlign: 'center' },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.slateMuted, marginTop: 10, textAlign: 'center' },
});
