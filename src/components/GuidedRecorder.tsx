import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Button } from './ui';

export type CaptureStatus = 'idle' | 'countdown' | 'watching' | 'recording' | 'done';

export function GuidedRecorder({
  hint,
  facingHint,
  autoStart = false,
  recordSeconds = 8,
  onRecorded,
}: {
  hint: string;
  facingHint: 'front' | 'side' | 'behind';
  autoStart?: boolean;
  recordSeconds?: number;
  onRecorded: (uri: string) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const [recording, setRecording] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const live = Platform.OS !== 'web' && camPerm?.granted && micPerm?.granted;

  const ensurePermissions = async () => {
    const cam = camPerm?.granted ? camPerm : await requestCam();
    const mic = micPerm?.granted ? micPerm : await requestMic();
    return Boolean(cam.granted && mic.granted);
  };

  const pickFallback = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      const library = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 0.6,
        videoMaxDuration: recordSeconds,
      });
      if (!library.canceled) {
        setUri(library.assets[0].uri);
        setStatus('done');
        onRecorded(library.assets[0].uri);
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: recordSeconds,
      quality: 0.6,
    });
    if (!result.canceled) {
      setUri(result.assets[0].uri);
      setStatus('done');
      onRecorded(result.assets[0].uri);
    }
  };

  const runCountdownAndRecord = async () => {
    if (startedRef.current || uri) return;
    startedRef.current = true;
    const ok = live || (await ensurePermissions());
    if (cancelledRef.current) return;
    if (!ok || Platform.OS === 'web') {
      await pickFallback();
      startedRef.current = false;
      return;
    }
    try {
      setStatus('countdown');
      for (const value of [3, 2, 1]) {
        if (cancelledRef.current) return;
        setCount(value);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        await delay(1000);
      }
      if (cancelledRef.current) return;
      setCount(null);
      setStatus('watching');
      await delay(450);
      if (cancelledRef.current) return;
      setStatus('recording');
      setRecording(true);
      const clip = await cameraRef.current?.recordAsync({ maxDuration: recordSeconds });
      setRecording(false);
      if (clip?.uri) {
        setUri(clip.uri);
        setStatus('done');
        onRecorded(clip.uri);
      } else {
        startedRef.current = false;
        setStatus('idle');
      }
    } catch {
      setRecording(false);
      startedRef.current = false;
      setStatus('idle');
      await pickFallback();
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      cameraRef.current?.stopRecording();
    };
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    void ensurePermissions();
  }, [autoStart]);

  useEffect(() => {
    if (!autoStart || uri || !live) return;
    const handle = setTimeout(() => {
      void runCountdownAndRecord();
    }, 500);
    return () => clearTimeout(handle);
    // Start once the live camera is actually on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, live, uri]);

  const overlay =
    status === 'countdown' && count
      ? String(count)
      : status === 'watching'
        ? 'Move'
        : status === 'recording'
          ? 'Hold the motion'
          : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        {uri ? (
          <Video
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        ) : live ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} mode="video" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
        )}
        {overlay ? (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={status === 'countdown' ? styles.count : styles.prompt}>{overlay}</Text>
          </View>
        ) : null}
        <View style={styles.caption}>
          <Text style={styles.captionText}>
            {facingHint === 'side'
              ? 'Side-on. Whole body in the box.'
              : facingHint === 'behind'
                ? 'Behind the player, or side-on if you are alone.'
                : 'Facing the phone. Belt and shoulders in frame.'}{' '}
            {hint}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Pressable onPress={() => setFacing((value) => (value === 'back' ? 'front' : 'back'))} style={styles.flip}>
          <Text style={styles.flipText}>{facing === 'back' ? 'Rear camera' : 'Front camera'}</Text>
        </Pressable>
      </View>
      {uri ? (
        <Button
          label="Re-record"
          variant="secondary"
          onPress={() => {
            setUri(null);
            startedRef.current = false;
            setStatus('idle');
            void runCountdownAndRecord();
          }}
        />
      ) : !autoStart ? (
        <Button
          label={recording ? 'Recording…' : live ? 'Start 3-2-1' : 'Record / choose clip'}
          onPress={() => void runCountdownAndRecord()}
          variant={recording ? 'secondary' : 'primary'}
          disabled={recording || status === 'countdown'}
        />
      ) : null}
      {Platform.OS === 'web' && !uri ? (
        <Button
          label="Choose a video file"
          variant="ghost"
          onPress={() =>
            void ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] }).then((result) => {
              if (!result.canceled) {
                setUri(result.assets[0].uri);
                setStatus('done');
                onRecorded(result.assets[0].uri);
              }
            })
          }
        />
      ) : null}
      {!camPerm?.granted && Platform.OS !== 'web' ? (
        <Button
          label="Allow camera"
          variant="ghost"
          onPress={() =>
            void ensurePermissions().then((ok) => {
              if (!ok) {
                Alert.alert('Camera', 'Camera and microphone are used only to record this physical screen.');
              }
            })
          }
        />
      ) : null}
    </View>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  stage: {
    height: 360,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  placeholder: { backgroundColor: '#1A2420' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,42,35,0.18)',
  },
  count: {
    fontFamily: fonts.display,
    fontSize: 88,
    color: colors.cream,
  },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 42,
    color: colors.cream,
  },
  caption: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(30,42,35,0.8)',
    padding: 10,
    borderRadius: 10,
  },
  captionText: {
    color: colors.cream,
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  flip: { paddingVertical: 4 },
  flipText: { fontFamily: fonts.bodyMedium, color: colors.gold, fontSize: 13 },
});
