import { Video, ResizeMode } from 'expo-av';
import { type Href, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Body, Button, Card, Kicker, Screen, Title } from '../src/components/ui';
import { useApp } from '../src/context/AppContext';
import { mobilityLabel } from '../src/data/instruction';
import { correctivesFor } from '../src/services/tpi';

export default function CorrectivesScreen() {
  const router = useRouter();
  const { mobility, draft } = useApp();
  const results = mobility?.tpi ?? draft.tpi;
  const plans = correctivesFor(results);

  return (
    <Screen>
      <Kicker>Restore available motion</Kicker>
      <Title>Stretches & exercises</Title>
      <Body muted>
        These belong to the TPI screens that were limited or restricted. They are not swing positions. Do them away from
        the ball so the clubhead can later move inside a more comfortable envelope.
      </Body>
      {!plans.length ? (
        <Card>
          <Body>No limitations on file. Re-run the TPI screen if something feels tighter than last time.</Body>
        </Card>
      ) : (
        plans.map((plan) => (
          <Card key={plan.test.key}>
            <Kicker>
              {plan.test.title} · {mobilityLabel(plan.grade)}
            </Kicker>
            <Body muted>{plan.test.capabilityNote}</Body>
            {plan.videoUri ? (
              <Video
                source={{ uri: plan.videoUri }}
                style={styles.clip}
                resizeMode={ResizeMode.COVER}
                useNativeControls
                isMuted
              />
            ) : null}
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
      <Button label="Re-run TPI screen" variant="secondary" onPress={() => router.push('/tpi' as Href)} />
      <Button label="Back home" variant="ghost" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  clip: { width: '100%', height: 180, borderRadius: 12, marginTop: 8 },
});
