import { useRouter } from 'expo-router';
import { TpiWalkthrough } from '../../src/components/TpiWalkthrough';
import { ProgressDots, Screen } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';

export default function MobilityScreen() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  return (
    <Screen>
      <ProgressDots step={5} total={7} />
      <TpiWalkthrough
        results={draft.tpi}
        onChange={(tpi) => setDraft({ tpi })}
        onFinished={() => router.push('/complete')}
      />
    </Screen>
  );
}
