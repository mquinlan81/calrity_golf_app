import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BoundingBoxOverlay } from '../../src/components/BoundingBoxOverlay';
import { Body, Button, Card, Kicker, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { tempoRatio } from '../../src/services/diagnostics';
import { colors, fonts } from '../../src/theme';
import { CLIP_FLOW } from '../../src/types';

export default function CaptureScreen() {
  const router = useRouter();
  const { clips, saveClip } = useApp();
  const [index, setIndex] = useState(() => {
    const firstMissing = CLIP_FLOW.findIndex(
      (item) => !clips.find((clip) => clip.type === item.type && clip.localUri),
    );
    return firstMissing === -1 ? 0 : firstMissing;
  });
  const spec = CLIP_FLOW[index];
  const existing = clips.find((clip) => clip.type === spec.type);
  const taps = useRef<number[]>([]);
  const [ratio, setRatio] = useState<number | null>(existing?.tempoRatio ?? null);
  const [tapCount, setTapCount] = useState(0);

  const preview = existing?.localUri;
  const doneCount = useMemo(
    () => CLIP_FLOW.filter((item) => clips.some((clip) => clip.type === item.type && clip.localUri)).length,
    [clips],
  );

  const pick = async (camera: boolean) => {
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera', 'Clarity needs camera or library access for swing clips.');
      return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['videos'], videoMaxDuration: 20, quality: 0.6 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 0.6 });
    if (result.canceled) return;
    const asset = result.assets[0];
    await saveClip({
      type: spec.type,
      localUri: asset.uri,
      remoteUrl: null,
      backswingMs: ratio && ratio > 0 ? Math.round(ratio * 300) : null,
      downswingMs: ratio ? 300 : null,
      tempoRatio: ratio,
    });
  };

  const tapTempo = () => {
    const now = Date.now();
    if (taps.current.length === 0 || now - taps.current[taps.current.length - 1] > 4000) {
      taps.current = [now];
      setTapCount(1);
      return;
    }
    taps.current = [...taps.current, now].slice(-3);
    setTapCount(taps.current.length);
    if (taps.current.length === 3) {
      const backswing = taps.current[1] - taps.current[0];
      const downswing = taps.current[2] - taps.current[1];
      const next = tempoRatio(backswing, downswing);
      setRatio(next);
      taps.current = [];
      if (existing?.localUri) {
        void saveClip({ ...existing, backswingMs: backswing, downswingMs: downswing, tempoRatio: next });
      }
    }
  };

  return (
    <Screen>
      <Kicker>
        Clip {index + 1} of 4 · {doneCount} saved
      </Kicker>
      <Title>{spec.title}</Title>
      <Body muted>{spec.subtitle}</Body>
      <View style={styles.stage}>
        {preview ? (
          <Video
            source={{ uri: preview }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
        )}
        <BoundingBoxOverlay camera={spec.camera} />
      </View>
      <Card>
        <Kicker>Tempo taps</Kicker>
        <Body muted>Tap takeaway, top, then impact. Jones tempo lives near 3:1.</Body>
        <Pressable onPress={tapTempo} style={styles.pad}>
          <Text style={styles.padText}>{ratio ? `${ratio} : 1` : `Tap ${tapCount}/3`}</Text>
        </Pressable>
      </Card>
      <Button label="Record clip" onPress={() => void pick(true)} />
      <Button label="Choose from library" variant="secondary" onPress={() => void pick(false)} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {index > 0 ? (
          <View style={{ flex: 1 }}>
            <Button variant="ghost" label="Back" onPress={() => setIndex((value) => value - 1)} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          {index < 3 ? (
            <Button
              label="Next clip"
              onPress={() => {
                setIndex((value) => value + 1);
                setRatio(null);
                setTapCount(0);
              }}
            />
          ) : (
            <Button label="Diagnose" onPress={() => router.push('/session/diagnose')} />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 360,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  pad: {
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 22,
    alignItems: 'center',
  },
  padText: { color: colors.gold, fontFamily: fonts.display, fontSize: 28 },
});
