import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Body, Button, Card, Field, Kicker, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { createId, readJson, writeJson } from '../../src/lib/localStore';
import { uploadUri } from '../../src/lib/upload';
import { extractLessonLanguage } from '../../src/services/lessons';

export default function CoachLessonsScreen() {
  const { session } = useApp();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const extracted = extractLessonLanguage(notes);

  const pick = async (kind: 'video' | 'audio') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'video' ? ['videos'] : ['videos'],
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    if (kind === 'video') setVideoUri(uri);
    else setAudioUri(uri);
  };

  const save = async () => {
    const id = createId('lesson');
    let videoUrl = videoUri;
    let audioUrl = audioUri;
    try {
      if (session?.user.id && videoUri) {
        videoUrl = await uploadUri('coach-lessons', `${session.user.id}/${id}.mp4`, videoUri, 'video/mp4');
      }
    } catch {
      // Keep the local URI if storage is not ready.
    }
    const row = {
      id,
      title,
      video_url: videoUrl,
      audio_url: audioUrl,
      raw_notes: notes,
      extracted_vocabulary: extracted.vocabulary,
      analogies: extracted.analogies,
      decision_logic: extracted.decisionLogic,
      created_at: new Date().toISOString(),
    };
    const existing = await readJson<unknown[]>('clarity.lessons', []);
    await writeJson('clarity.lessons', [row, ...existing]);
    Alert.alert('Lesson stored', 'Vocabulary, analogies, and decision logic are ready for fine-tuning.');
  };

  return (
    <Screen>
      <Kicker>Admin</Kicker>
      <Title>Coach lesson ingestion</Title>
      <Body muted>
        Upload raw video or audio. We extract motion vocabulary, quoted analogies, and if/then decision logic — and
        filter positional language Jones would not teach.
      </Body>
      <Field label="Lesson title" value={title} onChangeText={setTitle} placeholder="Jones clinic, hour 2" />
      <Button label={videoUri ? 'Video attached' : 'Attach video'} onPress={() => void pick('video')} />
      <Button
        label={audioUri ? 'Audio attached' : 'Attach audio (video file ok)'}
        variant="secondary"
        onPress={() => void pick('audio')}
      />
      <Field
        label="Transcript / notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        placeholder='Swing the clubhead. "The clubhead is the teacher." If the whoosh disappears, then the ball is in charge.'
      />
      <Card>
        <Kicker>Vocabulary</Kicker>
        <Body>{extracted.vocabulary.join(', ') || '—'}</Body>
        <Kicker>Analogies</Kicker>
        <Body>{extracted.analogies.join(' · ') || '—'}</Body>
        <Kicker>Decision logic</Kicker>
        {extracted.decisionLogic.length ? (
          extracted.decisionLogic.map((line) => (
            <Body key={line} muted>
              {line}
            </Body>
          ))
        ) : (
          <Body muted>—</Body>
        )}
      </Card>
      <Button label="Store for fine-tuning" onPress={() => void save()} />
    </Screen>
  );
}
