import { useRouter } from 'expo-router';
import { Body, Button, GoldRule, Kicker, Screen, Title } from '../../src/components/ui';
import { philosophy } from '../../src/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <Screen>
      <Kicker>{philosophy.teachers}</Kicker>
      <Title>Clarity</Title>
      <GoldRule />
      <Body>
        Golf instruction that starts with the clubhead in motion — not with lines drawn on a body. Ernest Jones and
        Manuel de la Torre taught a continuous swing around a stable axis, fitted to the player you actually are.
      </Body>
      <Body muted>
        We will map your body, capture an air swing and a real swing, then give you exactly one motion drill and one
        setup check. Restricted movement is a limit to respect, never a fault to punish.
      </Body>
      <Button label="Begin" onPress={() => router.push('/account')} />
    </Screen>
  );
}
