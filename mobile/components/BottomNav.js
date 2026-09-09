import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

const ITEMS = [
  { key: 'Dashboard', label: 'Home', real: true },
  { key: 'Transfer', label: 'Transfer', real: true },
  { key: 'Cards', label: 'Cards', real: false },
  { key: 'Statements', label: 'Statements', real: false },
];

export default function BottomNav({ active, navigation }) {
  return (
    <View style={styles.bar}>
      {ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => item.real && navigation.navigate(item.key)}
            style={styles.item}
          >
            <View style={[styles.dot, { backgroundColor: isActive ? colors.brass : 'transparent' }]} />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.white : item.real ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)' },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.ink,
    borderTopWidth: 1,
    borderTopColor: colors.lineDark,
    paddingTop: 8,
    paddingBottom: 20,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 11 },
});
