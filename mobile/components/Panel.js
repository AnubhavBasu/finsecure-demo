import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function Panel({ children, accent = false, style }) {
  return (
    <View
      style={[
        styles.base,
        accent && { borderLeftWidth: 3, borderLeftColor: colors.brass },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 20,
  },
});
