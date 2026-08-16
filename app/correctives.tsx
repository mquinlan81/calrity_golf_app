import { type Href, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, Card, Kicker, Screen, Title } from '../src/components/ui';
import { PoseReview } from '../src/components/PoseReview';
import { useApp } from '../src/context/AppContext';
import { correctivesFor, physicalGradeLabel, screenReport } from '../src/services/tpi';

export default function CorrectivesScreen() {
  const router = useRouter();
  const { mobility, draft, profile } = useApp();
  const results = mobility?.tpi ?? draft.tpi;
  const report = screenReport(results);
  const plans = correctivesFor(results);
  const heightCm = profile?.height_cm ?? (Number(draft.heightCm) || null);
  const system = profile?.measurement_system ?? draft.measurementSystem;

  return (
    <Screen>
      <Kicker>Physical Screen</Kicker>
      <Title>Typical range vs yours</Title>
      <Body muted>
        Typical range is what a free version of each motion looks like. Your range is what Clarity saw. Restricted does
        not mean a swing fault. Exercises below are only for the screens that were limited or restricted.
      </Body>
      {report.map((row) => (
        <Card key={row.test.key}>
          <Kicker>
            {row.test.number}. {row.test.title} · {physicalGradeLabel(row.grade)}
          </Kicker>
          <Body muted>Typical range of motion should be: {row.typicalRange}</Body>
          <Body>Your range of motion was: {row.observedRange}</Body>
          {row.leftGrade && row.rightGrade ? (
            <Body muted>
              Left {physicalGradeLabel(row.leftGrade)} · Right {physicalGradeLabel(row.rightGrade)}
            </Body>
          ) : null}
          {row.videoUri ? (
            <PoseReview
              videoUri={row.videoUri}
              trace={row.poseTrace}
              testKey={row.test.key}
              heightCm={heightCm}
              system={system}
              autoPlay={false}
            />
          ) : null}
        </Card>
      ))}
      <Title>Exercises to help you reach typical range</Title>
      {!plans.length ? (
        <Card>
          <Body>Nothing limited on file. Re-run the physical screen if something feels tighter than last time.</Body>
        </Card>
      ) : (
        plans.map((plan) => (
          <Card key={`ex-${plan.test.key}`}>
            <Kicker>
              {plan.test.title} · {physicalGradeLabel(plan.grade)}
            </Kicker>
            <Body muted>Typical range: {plan.test.passLooksLike}</Body>
            <Body muted>Your range: {plan.test.limitedLooksLike || plan.test.restrictedLooksLike}</Body>
            {plan.items.map((item) => (
              <View key={item.name} style={{ gap: 4, marginTop: 8 }}>
                <Kicker>
                  {item.kind === 'stretch' ? 'Stretch' : 'Exercise'} · {item.duration}
                </Kicker>
                <Body>{item.name}</Body>
                {item.how.map((line) => (
                  <Body key={line} muted>
                    • {line}
                  </Body>
                ))}
                <Body muted>Stop if: {item.stopIf}</Body>
              </View>
            ))}
          </Card>
        ))
      )}
      <Button label="Re-run physical screen" variant="secondary" onPress={() => router.push('/physical-screen' as Href)} />
      <Button label="Back home" variant="ghost" onPress={() => router.replace('/')} />
    </Screen>
  );
}
