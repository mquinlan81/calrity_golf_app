import { StyleSheet, Text, View } from 'react-native';
import { TRANSFER_LADDER, type TransferStep } from '../types';
import { colors, fonts } from '../theme';

export function TransferLadder({ step }: { step: TransferStep }) {
  return (
    <View style={styles.wrap}>
      {TRANSFER_LADDER.map((rung) => {
        const active = rung.step === step;
        const done = rung.step < step;
        return (
          <View key={rung.step} style={[styles.rung, active && styles.active]}>
            <View style={[styles.badge, done && styles.done, active && styles.now]}>
              <Text style={styles.badgeText}>{rung.step}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{rung.label}</Text>
              {active ? <Text style={styles.detail}>{rung.detail}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  rung: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 12,
  },
  active: { backgroundColor: '#F7F1E4' },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.mist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: { backgroundColor: colors.fairway, borderColor: colors.fairway },
  now: { backgroundColor: colors.clay, borderColor: colors.clay },
  badgeText: { color: colors.ink, fontFamily: fonts.bodyMedium },
  label: { fontFamily: fonts.bodyMedium, color: colors.ink, fontSize: 15 },
  detail: { fontFamily: fonts.body, color: colors.muted, marginTop: 2, lineHeight: 20 },
});
