import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { colors, fonts, spacing } from '../theme';
import Field from '../components/Field';
import Button from '../components/Button';
import Panel from '../components/Panel';
import Banner from '../components/Banner';
import BottomNav from '../components/BottomNav';

export default function TransferScreen({ navigation }) {
  const [toPayee, setToPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [challengeId, setChallengeId] = useState(null);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitTransfer = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    console.log('FS_EVENT: transfer_initiated', { toPayee, amount: Number(amount) });
    try {
      const accountId = await AsyncStorage.getItem('accountId');
      const result = await api.transfer({ accountId, toPayee, amount: Number(amount) });
      if (result.requiresOtp) {
        setChallengeId(result.challengeId);
        setMessage(result.message);
      } else {
        console.log('FS_EVENT: transfer_completed', { toPayee: result.toPayee, amount: result.amount });
        setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      }
    } catch (err) {
      console.error('FS_EVENT: transfer_failed', { toPayee, amount, reason: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await api.verifyTransferOtp({ challengeId, otp });
      console.log('FS_EVENT: transfer_completed', { toPayee: result.toPayee, amount: result.amount });
      setMessage(`Transfer of $${result.amount} to ${result.toPayee} completed.`);
      setChallengeId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Send money</Text>
          <Text style={styles.sub}>Transfers above $1,000 require a step-up OTP challenge.</Text>

          <Panel accent style={styles.card}>
            {!challengeId && (
              <>
                <Field label="Pay to (email)" autoCapitalize="none" value={toPayee} onChangeText={setToPayee} />
                <Field label="Amount ($)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
                <Button title="Send" onPress={submitTransfer} loading={loading} disabled={!toPayee || !amount || Number(amount) <= 0} />
              </>
            )}
            {challengeId && (
              <>
                <Banner tone="hint">Step-up verification required. (Demo OTP: 123456)</Banner>
                <Field label="One-time passcode" keyboardType="number-pad" value={otp} onChangeText={setOtp} />
                <Button title="Confirm transfer" onPress={submitOtp} loading={loading} />
              </>
            )}
            {message && <Banner tone="success" style={{ marginTop: 14, marginBottom: 0 }}>{message}</Banner>}
            {error && <Banner tone="error" style={{ marginTop: 14, marginBottom: 0 }}>{error}</Banner>}
          </Panel>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNav active="Transfer" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  scroll: { flexGrow: 1, padding: spacing.lg },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 4 },
  sub: { fontFamily: fonts.body, fontSize: 13.5, color: colors.slateMuted, marginBottom: 16 },
  card: {},
});
