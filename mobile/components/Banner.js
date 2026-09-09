import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

const TONES = {
  success: { bg: colors.successBg, text: colors.success },
  error: { bg: colors.dangerBg, text: colors.danger },
  hint: { bg: '#F0EBE2', text: colors.brassDark },
};

export default function Banner({ tone = 'hint', children, style }) {
  const t = TONES[tone] || TONES.hint;
  return (
    <View style={[styles.base, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 3, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14 },
  text: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19 },
});
