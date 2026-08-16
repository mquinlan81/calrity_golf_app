import { ResizeMode, Video } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { SkeletonOverlay, SkeletonStudio } from './SkeletonStudio';

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
  const series = useMemo(
    () => (poses.length ? kinematicsSeries(poses, heightCm, trace?.aspect ?? 0.75) : null),
    [poses, heightCm, trace?.aspect],
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

  if (!trace || !poses.length) {
    return videoUri ? (
      <Video source={{ uri: videoUri }} style={styles.solo} resizeMode={ResizeMode.CONTAIN} useNativeControls isMuted />
    ) : null;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.split}>
        <View style={styles.pane}>
          {videoUri ? (
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
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink }]} />
          )}
          <SkeletonOverlay pose={pose} aspect={trace.aspect} />
        </View>
        <View style={styles.pane}>
          <SkeletonStudio pose={pose} />
        </View>
      </View>
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
        <View style={styles.ticks}>
          {poses.map((_, i) => (
            <View key={i} style={[styles.tick, i === index && styles.tickOn]} />
          ))}
        </View>
        <Text style={styles.time}>
          {(stamp / 1000).toFixed(1)}s / {(duration / 1000).toFixed(1)}s
        </Text>
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        {cards.map((card) => (
          <View key={card.key} style={[styles.card, card.primary && styles.cardPrimary]}>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{formatMetricValue(card.value, card.unit, metric)}</Text>
            {card.range != null ? (
              <Text style={styles.cardRange}>
                Range {formatMetricValue(card.range, card.unit, metric).replace(/^[+-]/, '')}
                {card.typical != null
                  ? ` · typ ${formatMetricValue(card.typical, card.unit, metric).replace(/^[+-]/, '')}`
                  : ''}
              </Text>
            ) : null}
          </View>
        ))}
      </ScrollView>
      <Text style={styles.note}>
        {trace.tracking === 'joints'
          ? 'Purple dots are joints. Gold lines are hip line, shoulder line, and spine to the ground. Numbers are this frame; range is the whole clip.'
          : 'Purple dots follow your silhouette. Gold lines are hip line, shoulder line, and spine. A plain wall behind you helps the joints lock on.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  split: {
    height: 248,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: colors.ink,
  },
  pane: { flex: 1, overflow: 'hidden' },
  solo: { width: '100%', height: 200, borderRadius: 12, backgroundColor: colors.ink },
  scrub: { gap: 6, paddingHorizontal: 4 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.fog, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: '#9B6BFF' },
  ticks: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 12 },
  tick: { width: 2, height: 7, backgroundColor: colors.mist, borderRadius: 1 },
  tickOn: { height: 12, backgroundColor: colors.gold },
  time: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  cards: { gap: 8, paddingVertical: 2 },
  card: {
    minWidth: 118,
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  cardPrimary: { borderWidth: 1, borderColor: colors.gold },
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
