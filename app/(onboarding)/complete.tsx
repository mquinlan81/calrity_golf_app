import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Body, Button, Card, Kicker, ProgressDots, Screen, Title } from '../../src/components/ui';
import { PoseReview } from '../../src/components/PoseReview';
import { useApp } from '../../src/context/AppContext';
import { TPI_TESTS } from '../../src/data/tpi';
import { mobilityLabel } from '../../src/data/instruction';
import { correctivesFor, mapTpiToMobility, observedRangeCopy, physicalGradeLabel, typicalRangeCopy } from '../../src/services/tpi';
import { MOBILITY_STEPS } from '../../src/types';

export default function CompleteScreen() {
  const router = useRouter();
  const { peekDraft, completeOnboarding } = useApp();
  const [busy, setBusy] = useState(false);
  const snapshot = peekDraft();
  const heightCm = Number(snapshot.heightCm) || null;
  const system = snapshot.measurementSystem;
  const mobility = mapTpiToMobility(snapshot.tpi);
  const plans = correctivesFor(snapshot.tpi);
  const recorded = TPI_TESTS.filter((test) => snapshot.tpi[test.key]?.videoUri).length;

  const finish = async () => {
    try {
      setBusy(true);
      await completeOnboarding();
      router.replace((plans.length ? '/correctives' : '/') as Href);
    } catch (error) {
      Alert.alert('Onboarding', error instanceof Error ? error.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ProgressDots step={6} total={7} />
      <Kicker>Physical Screen</Kicker>
      <Title>Typical range vs yours</Title>
      <Body muted>
        {recorded} of {TPI_TESTS.length} screens recorded. Typical range is the free version of each motion. Your range
        is what Clarity saw. Restricted is a limit to respect, never a penalty.
      </Body>
      {TPI_TESTS.map((test) => {
        const result = snapshot.tpi[test.key];
        return (
          <Card key={test.key}>
            <Kicker>
              {test.number}. {test.title} · {physicalGradeLabel(result?.recognized === false ? 'skipped' : result?.grade ?? 'skipped')}
            </Kicker>
            <Body muted>Typical range of motion should be: {typicalRangeCopy(test, result)}</Body>
            <Body>Your range of motion was: {observedRangeCopy(test, result)}</Body>
            {result?.videoUri ? (
              <PoseReview
                videoUri={result.videoUri}
                trace={result.poseTrace}
                testKey={test.key}
                heightCm={heightCm}
                system={system}
                autoPlay={false}
              />
            ) : null}
          </Card>
        );
      })}
      {MOBILITY_STEPS.map((step) => (
        <Card key={step.key}>
          <Kicker>{step.title}</Kicker>
          <Body>{mobilityLabel(mobility[step.key])}</Body>
        </Card>
      ))}
      {plans.length ? (
        <Card>
          <Kicker>Correctives waiting</Kicker>
          <Body>
            {plans.length} screen{plans.length === 1 ? '' : 's'} have a stretch or exercise attached. You can open them
            after you enter the app.
          </Body>
        </Card>
      ) : null}
      <Button label={busy ? 'Saving…' : 'Enter Clarity'} onPress={finish} disabled={busy} />
    </Screen>
  );
}
