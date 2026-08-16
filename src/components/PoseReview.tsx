import { ResizeMode, Video } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatMetricValue,
  kinematicsSeries,
  metricCards,
  peakRange,
  unpackPoses,
  type MetricCard,
  type PoseTrace,
} from '../services/poseKinematics';
import { emptyPose } from '../services/poseTypes';
import type { MeasurementSystem } from '../services/units';
import type { TpiTestKey } from '../types';
import { colors, fonts } from '../theme';
import { SkeletonOverlay } from './SkeletonStudio';

export function PoseReview({
  videoUri,
  trace,
  testKey,
  heightCm,
  system,
  autoPlay = true,
}: {
  videoUri: string | null;
  trace?: PoseTrace;
  testKey: TpiTestKey;
  heightCm: number | null;
  system: MeasurementSystem;
  autoPlay?: boolean;
}) {
  const videoRef = useRef<Video>(null);
  const barWidth = useRef(1);
  const poses = useMemo(() => (trace ? unpackPoses(trace) : []), [trace]);
  const locked = trace?.tracking === 'joints';
  const series = useMemo(
    () => (locked && poses.length ? kinematicsSeries(poses, heightCm, trace?.aspect ?? 0.75) : null),
    [locked, poses, heightCm, trace?.aspect],
  );
  const peaks = useMemo(() => (series ? peakRange(series.frames) : null), [series]);
  const [index, setIndex] = useState(0);
  const pose = poses[index] ?? emptyPose();
  const cards: MetricCard[] =
    series && peaks ? metricCards(testKey, series.frames[Math.min(index, series.frames.length - 1)], peaks) : [];
  const times = trace?.timesMs ?? [];
  const metric = system === 'metric';
  const stamp = times[index] ?? 0;
  const duration = trace?.durationMs ?? 0;

  useEffect(() => {
    setIndex(0);
  }, [trace]);

  const seekTo = (next: number) => {
    const clamped = Math.max(0, Math.min(poses.length - 1, next));
    setIndex(clamped);
    const time = times[clamped];
    if (time != null) {
      void videoRef.current?.setStatusAsync({ positionMillis: time, shouldPlay: false });
    }
  };

  if (!videoUri) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={autoPlay}
          isLooping={autoPlay}
          isMuted
          progressUpdateIntervalMillis={80}
          onPlaybackStatusUpdate={(status) => {
            if (!status.isLoaded || !times.length || !status.isPlaying) return;
            const ms = status.positionMillis ?? 0;
            let best = 0;
            let dist = Infinity;
            times.forEach((time, i) => {
              const gap = Math.abs(time - ms);
              if (gap < dist) {
                dist = gap;
                best = i;
              }
            });
            setIndex(best);
          }}
        />
        {locked ? <SkeletonOverlay pose={pose} aspect={trace?.aspect ?? 0.56} /> : null}
      </View>
      {poses.length > 1 ? (
        <Pressable
          style={styles.scrub}
          onLayout={(event) => {
            barWidth.current = event.nativeEvent.layout.width;
          }}
          onPress={(event) => {
            const x = event.nativeEvent.locationX;
            const next = Math.round((x / barWidth.current) * (Math.max(poses.length, 1) - 1));
            seekTo(next);
          }}
        >
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${poses.length < 2 ? 0 : (index / (poses.length - 1)) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.time}>
            {(stamp / 1000).toFixed(1)}s / {(duration / 1000).toFixed(1)}s · tap to scrub
          </Text>
        </Pressable>
      ) : null}
      {cards.length ? (
        <View style={styles.cards}>
          {cards.map((card) => (
            <View key={card.key} style={styles.card}>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardValue}>{formatMetricValue(card.value, card.unit, metric)}</Text>
              {card.range != null && card.typical != null ? (
                <Text style={styles.cardRange}>
                  Range {formatMetricValue(card.range, card.unit, metric).replace(/^[+-]/, '')} · typical{' '}
                  {formatMetricValue(card.typical, card.unit, metric).replace(/^[+-]/, '')}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      <Text style={styles.note}>
        {locked
          ? 'Dots sit on the joints we found in this frame. Gold is hip line, shoulder line, and spine.'
          : 'Could not lock joints onto your body in this clip. A plain wall and more light help.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  stage: {
    height: 420,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  scrub: { gap: 6, paddingHorizontal: 4 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.fog, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: '#9B6BFF' },
  time: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  cardLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.mist,
  },
  cardValue: { fontFamily: fonts.display, fontSize: 26, color: colors.cream },
  cardRange: { fontFamily: fonts.body, fontSize: 11, color: colors.mist },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, lineHeight: 16 },
});

