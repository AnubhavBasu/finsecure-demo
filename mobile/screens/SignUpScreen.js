import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { api } from '../api';
import { colors, fonts, spacing } from '../theme';
import Field from '../components/Field';
import Button from '../components/Button';
import Panel from '../components/Panel';
import Banner from '../components/Banner';

export default function SignUpScreen({ navigation }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', panNumber: '', aadhaarNumber: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm({ ...form, [field]: value });

  const submit = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const result = await api.signup(form);
      setMessage(result.message);
      setTimeout(() => navigation.navigate('Login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Open an account{'\n'}in minutes.</Text>
          <Text style={styles.heroSub}>
            New accounts start under review — a $500 daily transfer limit applies
            until KYC verification clears.
          </Text>
        </View>

        <Panel accent style={styles.card}>
          <Text style={styles.cardTitle}>Account details</Text>
          <Field label="Full name" value={form.fullName} onChangeText={(v) => update('fullName', v)} />
          <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(v) => update('email', v)} />
          <Field label="Password" secureTextEntry value={form.password} onChangeText={(v) => update('password', v)} />
          <Field label="PAN number" value={form.panNumber} onChangeText={(v) => update('panNumber', v)} />
          <Field label="Aadhaar number" value={form.aadhaarNumber} onChangeText={(v) => update('aadhaarNumber', v)} />
          <Button title="Create account" onPress={submit} loading={loading} />
          {message && <Banner tone="success" style={{ marginTop: 14, marginBottom: 0 }}>{message}</Banner>}
          {error && <Banner tone="error" style={{ marginTop: 14, marginBottom: 0 }}>{error}</Banner>}
        </Panel>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink },
  scroll: { flexGrow: 1 },
  hero: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  heroTitle: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.white, marginBottom: 12 },
  heroSub: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: 'rgba(255,255,255,0.7)' },
  card: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  cardTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, marginBottom: 16 },
});
