import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image } from 'react-native';
import { Body, Button, Card, Field, Kicker, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { uploadUri } from '../../src/lib/upload';
import { writeJson } from '../../src/lib/localStore';

export default function ScorecardTab() {
  const router = useRouter();
  const { session } = useApp();
  const [uri, setUri] = useState<string | null>(null);
  const [course, setCourse] = useState('');

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos', 'Allow photo access to upload a 4×6 scorecard.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      const photo = result.assets[0].uri;
      setUri(photo);
      await writeJson('clarity.scorecardPhoto', { uri: photo, course });
      if (session?.user.id) {
        try {
          await uploadUri(
            'scorecards',
            `${session.user.id}/${Date.now()}.jpg`,
            photo,
            'image/jpeg',
          );
        } catch {
          // Local review still works if the bucket is not created yet.
        }
      }
    }
  };

  return (
    <Screen>
      <Kicker>On-course</Kicker>
      <Title>Paper scorecard</Title>
      <Body>
        Photograph the 4×6 card. We parse Fairways (L/H/R), GIR, Up & Down, Putts, first-putt distance, penalties, and
        bunkers — then compute lag-putting efficiency and a target shift that avoids the hazard.
      </Body>
      <Field label="Course (optional)" value={course} onChangeText={setCourse} placeholder="Club name" />
      <Button label="Upload scorecard photo" onPress={() => void pick()} />
      {uri ? (
        <Card>
          <Image source={{ uri }} style={{ width: '100%', height: 180, borderRadius: 12 }} />
          <Body muted>Photo attached. Confirm the numbers on the next screen.</Body>
        </Card>
      ) : null}
      <Button
        label="Review & parse"
        variant="secondary"
        onPress={() =>
          router.push({ pathname: '/card-review', params: { photo: uri ?? '', course } })
        }
      />
    </Screen>
  );
}
