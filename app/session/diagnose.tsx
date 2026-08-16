import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Body, Button, Card, Chip, Kicker, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { FOCUS_LABELS } from '../../src/data/instruction';

export default function DiagnoseScreen() {
  const router = useRouter();
  const { clips, runDiagnosis, diagnosis, mobility } = useApp();
  const [setupConcern, setSetup] = useState(false);
  const [gripConcern, setGrip] = useState(false);
  const [axisConcern, setAxis] = useState(false);
  const [pathConcern, setPath] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    try {
      setBusy(true);
      await runDiagnosis({ setupConcern, gripConcern, axisConcern, pathConcern });
      router.push('/session/drill');
    } catch (error) {
      Alert.alert('Diagnosis', error instanceof Error ? error.message : 'Could not diagnose.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Kicker>Evaluate in order</Kicker>
      <Title>Setup → Tempo → Axis → Path</Title>
      <Body muted>
        Tempo is measured from your taps. Mark only what you actually saw. The engine still returns exactly one primary
        drill and one setup check.
      </Body>
      <Card>
        <Kicker>Clips</Kicker>
        <Body>{clips.filter((clip) => clip.localUri).length} / 4 captured</Body>
        <Body muted>
          Air tempo{' '}
          {clips.find((clip) => clip.type.endsWith('air') && clip.tempoRatio)?.tempoRatio ?? '—'} · Real tempo{' '}
          {clips.find((clip) => clip.type.endsWith('real') && clip.tempoRatio)?.tempoRatio ?? '—'}
        </Body>
      </Card>
      <Body>Optional observations</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="Grip / setup looks tense" selected={gripConcern || setupConcern} onPress={() => { setGrip((v) => !v); setSetup((v) => !v); }} />
        <Chip label="Center is sliding" selected={axisConcern} onPress={() => setAxis((v) => !v)} />
        <Chip label="Path is weaving" selected={pathConcern} onPress={() => setPath((v) => !v)} />
      </View>
      {mobility ? (
        <Card>
          <Kicker>Capability lock</Kicker>
          <Body>
            Restricted movement matching your mobility screen will not be scored as a fault.
          </Body>
        </Card>
      ) : null}
      {diagnosis ? (
        <Card>
          <Kicker>Last diagnosis</Kicker>
          <Body>{FOCUS_LABELS[diagnosis.primaryFocus]}</Body>
        </Card>
      ) : null}
      <Button label={busy ? 'Reading the motion…' : 'Deliver single focus'} onPress={() => void run()} disabled={busy} />
    </Screen>
  );
}
