import { Video, ResizeMode } from 'expo-av';
import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Card, Kicker, Screen, Title } from '../src/components/ui';
import { useApp } from '../src/context/AppContext';
import { mobilityLabel } from '../src/data/instruction';
import { correctivesFor, physicalGradeLabel, screenReport } from '../src/services/tpi';

export default function CorrectivesScreen() {
  const router = useRouter();
  const { mobility, draft } = useApp();
  const results = mobility?.tpi ?? draft.tpi;
  const report = screenReport(results);
  const plans = correctivesFor(results);

  return (
    <Screen>
      <Kicker>Physical Screen</Kicker>
      <Title>Your results</Title>
      <Body muted>
        Clarity read each clip for available motion. Pass, limited, and restricted describe range — never a swing
        fault. Stretches and exercises sit under anything limited or restricted.
      </Body>
      {report.map((row) => (
        <Card key={row.test.key}>
          <Kicker>
            {row.test.number}. {row.test.title} · {physicalGradeLabel(row.grade)}
          </Kicker>
          {row.leftGrade && row.rightGrade ? (
            <Body muted>
              Left {physicalGradeLabel(row.leftGrade)} · Right {physicalGradeLabel(row.rightGrade)}
            </Body>
          ) : null}
          {row.rationale ? <Body>{row.rationale}</Body> : null}
          {row.videoUri ? (
            <Video
              source={{ uri: row.videoUri }}
              style={styles.clip}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              isMuted
            />
          ) : null}
        </Card>
      ))}
      <Title>Exercises to restore range</Title>
      {!plans.length ? (
        <Card>
          <Body>No limitations on file. Re-run the physical screen if something feels tighter than last time.</Body>
        </Card>
      ) : (
        plans.map((plan) => (
          <Card key={`ex-${plan.test.key}`}>
            <Kicker>
              {plan.test.title} · {mobilityLabel(plan.grade)}
            </Kicker>
            <Body muted>{plan.test.capabilityNote}</Body>
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

const styles = StyleSheet.create({
  clip: { width: '100%', height: 180, borderRadius: 12, marginTop: 8 },
});
