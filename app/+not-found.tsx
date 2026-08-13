import { Link, Stack } from 'expo-router';
import { Body, Screen, Title } from '../src/components/ui';

export default function NotFound() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Missing' }} />
      <Title>That page is off the card.</Title>
      <Body>
        <Link href="/">Return home</Link>
      </Body>
    </Screen>
  );
}
