import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { base64ToBytes } from '../services/physicalAssessCore';
import { bodyInFrameFromJpegBytes } from '../services/poseVision';
import type { BodyTarget } from '../types';
import { colors, fonts } from '../theme';
import { Button } from './ui';

export type CaptureStatus = 'idle' | 'finding' | 'countdown' | 'recording' | 'done';

export function GuidedRecorder({
  hint,
  facingHint,
  autoStart = false,
  recordSeconds = 8,
  bodyTarget = 'torso',
  onRecorded,
}: {
  hint: string;
  facingHint: 'front' | 'side' | 'behind';
  autoStart?: boolean;
  recordSeconds?: number;
  bodyTarget?: BodyTarget;
  onRecorded: (uri: string) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const startedRef = useRef(false);
  const cancelledRef = useRef(false);
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [remaining, setRemaining] = useState(recordSeconds);
  const [uri, setUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('front');
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [findHint, setFindHint] = useState('Finding you… hips and shoulders in the box.');
  const live = Platform.OS !== 'web' && Boolean(camPerm?.granted && micPerm?.granted);

  const ensurePermissions = async () => {
    const cam = camPerm?.granted ? camPerm : await requestCam();
    const mic = micPerm?.granted ? micPerm : await requestMic();
    return Boolean(cam.granted && mic.granted);
  };

  const pickVideoLibrary = async () => {
    const library = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: recordSeconds + 4,
      quality: 0.6,
    });
    if (!library.canceled && library.assets[0]?.uri) {
      setUri(library.assets[0].uri);
      setStatus('done');
      onRecorded(library.assets[0].uri);
    }
  };

  const waitForBody = async () => {
    if (Platform.OS === 'web' || !cameraRef.current?.takePictureAsync) return;
    setStatus('finding');
    setFindHint('Finding you… hips and shoulders in the box.');
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && !cancelledRef.current) {
      try {
        const snap = await cameraRef.current.takePictureAsync({
          quality: 0.35,
          base64: true,
          skipProcessing: true,
          shutterSound: false,
        });
        if (!snap?.base64) break;
        const check = bodyInFrameFromJpegBytes(base64ToBytes(snap.base64), bodyTarget);
        if (check.ok) {
          setFindHint('Got you. Hold still.');
          await delay(280);
          return;
        }
        setFindHint(check.hint);
      } catch {
        return;
      }
      await delay(400);
    }
  };

  const runCountdownAndRecord = async () => {
    if (startedRef.current || uri) return;
    startedRef.current = true;
    const ok = await ensurePermissions();
    if (cancelledRef.current) return;
    if (!ok) {
      startedRef.current = false;
      Alert.alert('Camera', 'Clarity needs the camera and microphone to record a short video of this motion.');
      return;
    }
    if (Platform.OS === 'web' || !cameraRef.current) {
      startedRef.current = false;
      await pickVideoLibrary();
      return;
    }
    try {
      await waitForBody();
      if (cancelledRef.current) return;
      setStatus('countdown');
      for (const value of [3, 2, 1]) {
        if (cancelledRef.current) return;
        setCount(value);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        await delay(1000);
      }
      if (cancelledRef.current) return;
      setCount(null);
      setStatus('recording');
      setRecording(true);
      setRemaining(recordSeconds);
      const backup = setTimeout(() => {
        cameraRef.current?.stopRecording();
      }, (recordSeconds + 0.6) * 1000);
      const clip = await cameraRef.current.recordAsync({
        maxDuration: recordSeconds,
      });
      clearTimeout(backup);
      setRecording(false);
      if (clip?.uri) {
        setUri(clip.uri);
        setStatus('done');
        onRecorded(clip.uri);
      } else {
        startedRef.current = false;
        setStatus('idle');
        Alert.alert('Video', 'The motion clip did not save. Try again — this needs a short video, not a still.');
      }
    } catch {
      setRecording(false);
      startedRef.current = false;
      setStatus('idle');
      Alert.alert('Video', 'Could not record the clip. Keep the phone still on a chair and try again.');
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
    if (!autoStart || uri || !live || !ready) return;
    const handle = setTimeout(() => {
      void runCountdownAndRecord();
    }, 350);
    return () => clearTimeout(handle);
    // Start once the live video camera is actually ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, live, ready, uri]);

  useEffect(() => {
    if (!recording) return;
    setRemaining(recordSeconds);
    const tick = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [recording, recordSeconds]);

  const overlay =
    status === 'finding'
      ? findHint
      : status === 'countdown' && count
        ? String(count)
        : status === 'recording'
          ? `REC  0:${String(remaining).padStart(2, '0')}`
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
            useNativeControls
          />
        ) : live ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            mode="video"
            mute={false}
            mirror={facing === 'front'}
            videoQuality="720p"
            onCameraReady={() => setReady(true)}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
        )}
        {overlay ? (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={status === 'countdown' ? styles.count : status === 'finding' ? styles.find : styles.prompt}>
              {overlay}
            </Text>
          </View>
        ) : null}
        <View style={styles.caption}>
          <Text style={styles.captionText}>
            {facingHint === 'side'
              ? 'Front camera. Turn side-on so you can still see the countdown.'
              : facingHint === 'behind'
                ? 'Front camera. Set the phone where you can see yourself — behind or side-on is fine.'
                : 'Front camera. You should see yourself and the countdown.'}{' '}
            {hint} Whole body in the box. This is a short video of the motion.
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Pressable onPress={() => setFacing((value) => (value === 'back' ? 'front' : 'back'))} style={styles.flip}>
          <Text style={styles.flipText}>{facing === 'front' ? 'Front camera' : 'Rear camera'}</Text>
        </Pressable>
      </View>
      {uri ? (
        <Button
          label="Re-record video"
          variant="secondary"
          onPress={() => {
            setUri(null);
            setReady(false);
            startedRef.current = false;
            setStatus('idle');
          }}
        />
      ) : !autoStart ? (
        <Button
          label={recording ? 'Recording video…' : 'Start 3-2-1 video'}
          onPress={() => void runCountdownAndRecord()}
          variant={recording ? 'secondary' : 'primary'}
          disabled={recording || status === 'countdown' || status === 'finding'}
        />
      ) : null}
      {!uri ? (
        <Button label="Choose a video file" variant="ghost" onPress={() => void pickVideoLibrary()} />
      ) : null}
      {!camPerm?.granted && Platform.OS !== 'web' ? (
        <Button
          label="Allow camera"
          variant="ghost"
          onPress={() =>
            void ensurePermissions().then((ok) => {
              if (!ok) {
                Alert.alert('Camera', 'Camera and microphone are used only to record this physical screen video.');
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
    fontSize: 36,
    color: colors.cream,
  },
  find: {
    fontFamily: fonts.bodyMedium,
    fontSize: 22,
    color: colors.cream,
    textAlign: 'center',
    paddingHorizontal: 24,
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
