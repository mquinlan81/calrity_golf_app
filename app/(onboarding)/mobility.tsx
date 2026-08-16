import { useRouter } from 'expo-router';
import { PhysicalScreenWalkthrough } from '../../src/components/PhysicalScreenWalkthrough';
import { ProgressDots, Screen } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';

export default function MobilityScreen() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  return (
    <Screen>
      <ProgressDots step={5} total={7} />
      <PhysicalScreenWalkthrough
        results={draft.tpi}
        onChange={(tpi) => setDraft({ tpi })}
        onFinished={() => router.push('/complete')}
      />
    </Screen>
  );
}
