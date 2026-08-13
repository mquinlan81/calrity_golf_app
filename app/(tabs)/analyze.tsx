import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, Card, Kicker, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { CLIP_FLOW } from '../../src/types';

export default function AnalyzeScreen() {
  const router = useRouter();
  const { clips, diagnosis } = useApp();
  const captured = clips.filter((clip) => clip.localUri).length;

  return (
    <Screen>
      <Kicker>Dual baseline</Kicker>
      <Title>Air swing vs real swing</Title>
      <Body>
        Four clips. Same cameras. The only difference is the ball. If tempo collapses, that is anxiety — not a new
        mechanic to install.
      </Body>
      {CLIP_FLOW.map((item) => {
        const clip = clips.find((entry) => entry.type === item.type);
        return (
          <Card key={item.type}>
            <Kicker>{item.withBall ? 'Real' : 'Air'}</Kicker>
            <Body>{item.title}</Body>
            <Body muted>
              {clip?.localUri
                ? `Captured · tempo ${clip.tempoRatio ?? '—'} : 1`
                : item.subtitle}
            </Body>
          </Card>
        );
      })}
      <View style={{ gap: 10 }}>
        <Button
          label={captured === 4 ? 'Re-capture baseline' : `Capture clips (${captured}/4)`}
          onPress={() => router.push('/session/capture')}
        />
        <Button
          label="Run diagnosis"
          variant="secondary"
          onPress={() => router.push('/session/diagnose')}
          disabled={captured < 2}
        />
        {diagnosis ? (
          <Button label="Current drill" variant="ghost" onPress={() => router.push('/session/drill')} />
        ) : null}
      </View>
    </Screen>
  );
}
