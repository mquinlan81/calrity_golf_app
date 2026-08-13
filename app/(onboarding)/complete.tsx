import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Body, Button, Card, Kicker, ProgressDots, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { mobilityLabel } from '../../src/data/instruction';
import { MOBILITY_STEPS } from '../../src/types';

export default function CompleteScreen() {
  const router = useRouter();
  const { draft, completeOnboarding } = useApp();
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    try {
      setBusy(true);
      await completeOnboarding();
      router.replace('/');
    } catch (error) {
      Alert.alert('Onboarding', error instanceof Error ? error.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ProgressDots step={5} total={6} />
      <Kicker>Stored in mobility_screens</Kicker>
      <Title>Your envelope</Title>
      <Body muted>
        These grades travel with every diagnosis. Restricted does not mean “wrong.” It means the drill will be fitted.
      </Body>
      {MOBILITY_STEPS.map((step) => (
        <Card key={step.key}>
          <Kicker>{step.title}</Kicker>
          <Body>{mobilityLabel(draft.mobility[step.key])}</Body>
        </Card>
      ))}
      <Button label={busy ? 'Saving…' : 'Enter Clarity'} onPress={finish} disabled={busy} />
    </Screen>
  );
}
