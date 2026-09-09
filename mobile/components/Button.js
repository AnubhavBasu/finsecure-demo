import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fonts, radius } from '../theme';

const VARIANTS = {
  primary: { bg: colors.ink, text: colors.white, border: colors.ink },
  brass: { bg: colors.brass, text: colors.white, border: colors.brass },
  ghost: { bg: 'transparent', text: colors.slate, border: colors.line },
  ghostLight: { bg: 'transparent', text: colors.white, border: 'rgba(255,255,255,0.35)' },
};

export default function Button({ title, onPress, variant = 'primary', loading = false, style }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.text} /> : <Text style={[styles.label, { color: v.text }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 15 },
});
