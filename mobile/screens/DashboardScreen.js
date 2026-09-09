import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { colors, fonts, spacing } from '../theme';
import Panel from '../components/Panel';
import Banner from '../components/Banner';
import BottomNav from '../components/BottomNav';

export default function DashboardScreen({ navigation }) {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const accountId = await AsyncStorage.getItem('accountId');
      if (!accountId) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      const result = await api.getAccount(accountId);
      setAccount(result);
    } catch (err) {
      setError(err.message);
    }
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {error && <Banner tone="error" style={{ margin: spacing.lg }}>{error}</Banner>}
        {!error && !account && <Text style={styles.loading}>Loading…</Text>}
        {account && (
          <>
            <Text style={styles.greeting}>Welcome back, {account.full_name.split(' ')[0]}.</Text>

            <Panel accent style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available balance</Text>
              <Text style={styles.balanceAmount}>${Number(account.balance).toLocaleString()}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusPill, { backgroundColor: account.kyc_status === 'Verified' ? colors.successBg : '#F0EBE2' }]}>
                  <Text style={{ color: account.kyc_status === 'Verified' ? colors.success : colors.brassDark, fontFamily: fonts.bodyMedium, fontSize: 12.5 }}>
                    {account.kyc_status}
                  </Text>
                </View>
                <Text style={styles.limitText}>Daily limit: ${Number(account.daily_transfer_limit).toLocaleString()}</Text>
              </View>
            </Panel>

            <View style={styles.tileRow}>
              <Pressable style={styles.tile} onPress={() => navigation.navigate('Transfer')}>
                <Text style={styles.tileTitle}>Send money</Text>
                <Text style={styles.tileSub}>Step-up above $1,000</Text>
              </Pressable>
              <View style={[styles.tile, styles.tileDisabled]}>
                <Text style={styles.tileTitle}>Statements</Text>
                <Text style={styles.tileSub}>Not in this demo</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      <BottomNav active="Dashboard" navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  scroll: { flexGrow: 1, padding: spacing.lg },
  loading: { fontFamily: fonts.body, color: colors.slateMuted },
  greeting: { fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginBottom: 16 },
  balanceCard: { marginBottom: 16 },
  balanceLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.slateMuted, marginBottom: 4 },
  balanceAmount: { fontFamily: fonts.mono, fontSize: 34, color: colors.ink, marginBottom: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3 },
  limitText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.slateMuted },
  tileRow: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 4, padding: 16 },
  tileDisabled: { opacity: 0.55 },
  tileTitle: { fontFamily: fonts.display, fontSize: 15.5, color: colors.ink, marginBottom: 4 },
  tileSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.slateMuted },
});
