import { useRouter } from 'expo-router';
import { TriangleTest } from '../../src/components/TriangleTest';
import { Body, Kicker, ProgressDots, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';

export default function EyeDominanceScreen() {
  const router = useRouter();
  const { setDraft } = useApp();
  return (
    <Screen>
      <ProgressDots step={3} total={6} />
      <Kicker>Ten-second triangle</Kicker>
      <Title>Eye dominance</Title>
      <Body muted>
        Aim belongs to the eye that actually sees the target. We will not draw a second line on your video.
      </Body>
      <TriangleTest
        onResult={(eyeDominance) => {
          setDraft({ eyeDominance });
          router.push('/mobility');
        }}
      />
    </Screen>
  );
}
