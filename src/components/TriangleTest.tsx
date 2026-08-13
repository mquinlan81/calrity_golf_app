import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';
import type { Dominance } from '../types';
import { colors, fonts } from '../theme';
import { Button } from './ui';

export function TriangleTest({
  onResult,
}: {
  onResult: (eye: Exclude<Dominance, 'mixed'> | 'mixed') => void;
}) {
  const [seconds, setSeconds] = useState(10);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'hold' | 'choose'>('ready');

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      setPhase('choose');
      return;
    }
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [running, seconds]);

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Svg width={220} height={180} viewBox="0 0 220 180">
          <Polygon
            points="110,18 198,158 22,158"
            fill="none"
            stroke={colors.gold}
            strokeWidth="4"
          />
          <Line x1="110" y1="18" x2="110" y2="158" stroke={colors.fairway} strokeWidth="1" strokeDasharray="4 4" />
        </Svg>
        <Text style={styles.timer}>{phase === 'hold' ? `${seconds}s` : phase === 'choose' ? 'Which eye?' : '10s'}</Text>
      </View>
      <Text style={styles.help}>
        Make a triangle with your thumbs and index fingers. Center a distant object in the opening. Hold it for ten
        seconds. Then close one eye at a time.
      </Text>
      {phase === 'ready' ? (
        <Button
          label="Start 10-second hold"
          onPress={() => {
            setSeconds(10);
            setRunning(true);
            setPhase('hold');
          }}
        />
      ) : null}
      {phase === 'choose' ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.help}>
            If the object stays put when you close the left eye, the right eye is dominant. If it jumps, the left eye is
            dominant.
          </Text>
          <View style={styles.row}>
            <Pressable style={styles.choice} onPress={() => onResult('right')}>
              <Text style={styles.choiceText}>Right eye</Text>
            </Pressable>
            <Pressable style={styles.choice} onPress={() => onResult('left')}>
              <Text style={styles.choiceText}>Left eye</Text>
            </Pressable>
          </View>
          <Button label="It jumped both ways (mixed)" variant="ghost" onPress={() => onResult('mixed')} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  stage: { alignItems: 'center', justifyContent: 'center' },
  timer: {
    position: 'absolute',
    fontFamily: fonts.display,
    fontSize: 42,
    color: colors.ink,
  },
  help: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', gap: 10 },
  choice: {
    flex: 1,
    backgroundColor: colors.fairway,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  choiceText: { color: colors.cream, fontFamily: fonts.bodyMedium, fontSize: 16 },
});
