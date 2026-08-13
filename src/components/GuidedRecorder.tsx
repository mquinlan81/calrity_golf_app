import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Button } from './ui';

export function GuidedRecorder({
  hint,
  facingHint,
  onRecorded,
}: {
  hint: string;
  facingHint: 'front' | 'side' | 'behind';
  onRecorded: (uri: string) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const [recording, setRecording] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const live = Platform.OS !== 'web' && camPerm?.granted && micPerm?.granted;

  const ensurePermissions = async () => {
    const cam = camPerm?.granted ? camPerm : await requestCam();
    const mic = micPerm?.granted ? micPerm : await requestMic();
    return Boolean(cam.granted && mic.granted);
  };

  const pickFallback = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      const library = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 0.6, videoMaxDuration: 20 });
      if (!library.canceled) {
        setUri(library.assets[0].uri);
        onRecorded(library.assets[0].uri);
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 20,
      quality: 0.6,
    });
    if (!result.canceled) {
      setUri(result.assets[0].uri);
      onRecorded(result.assets[0].uri);
    }
  };

  const toggleRecord = async () => {
    if (uri) {
      setUri(null);
      return;
    }
    if (!live) {
      const ok = await ensurePermissions();
      if (!ok || Platform.OS === 'web') {
        await pickFallback();
        return;
      }
    }
    try {
      if (recording) {
        cameraRef.current?.stopRecording();
        return;
      }
      setRecording(true);
      const clip = await cameraRef.current?.recordAsync({ maxDuration: 20 });
      setRecording(false);
      if (clip?.uri) {
        setUri(clip.uri);
        onRecorded(clip.uri);
      }
    } catch {
      setRecording(false);
      await pickFallback();
    }
  };

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
      <Button
        label={uri ? 'Re-record' : recording ? 'Stop' : live ? 'Record this screen' : 'Record / choose clip'}
        onPress={() => void toggleRecord()}
        variant={recording ? 'secondary' : 'primary'}
      />
      {Platform.OS === 'web' ? (
        <Button
          label="Choose a video file"
          variant="ghost"
          onPress={() =>
            void ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] }).then((result) => {
              if (!result.canceled) {
                setUri(result.assets[0].uri);
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
              if (!ok) Alert.alert('Camera', 'Camera and microphone are used only to record this TPI screen.');
            })
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  stage: {
    height: 320,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  placeholder: { backgroundColor: '#1A2420' },
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
