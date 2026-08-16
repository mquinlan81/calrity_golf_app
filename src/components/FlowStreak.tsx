import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../theme';

export function FlowStreak({ streak, xp }: { streak: number; xp: number }) {
  const progress = Math.min(streak, 7) / 7;
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        <Svg width={110} height={110}>
          <Circle cx="55" cy="55" r={radius} stroke={colors.fog} strokeWidth="8" fill="none" />
          <Circle
            cx="55"
            cy="55"
            r={radius}
            stroke={colors.gold}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${circ * progress} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
          />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.num}>{streak}</Text>
          <Text style={styles.sub}>day flow</Text>
        </View>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.kicker}>Flow Streak</Text>
        <Text style={styles.copy}>
          Two minutes of hip-to-hip motion keeps the streak alive. XP {xp}.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ring: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  num: { fontFamily: fonts.display, fontSize: 32, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, letterSpacing: 0.6 },
  kicker: {
    fontFamily: fonts.bodyMedium,
    color: colors.gold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  copy: { fontFamily: fonts.body, color: colors.ink, lineHeight: 22, fontSize: 15 },
});
