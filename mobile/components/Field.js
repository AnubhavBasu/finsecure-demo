import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';

export default function Field({ label, ...inputProps }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.slateMuted} style={styles.input} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.slateMuted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.slate,
    backgroundColor: colors.surface,
  },
});
