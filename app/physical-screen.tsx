import { type Href, useRouter } from 'expo-router';
import { PhysicalScreenWalkthrough } from '../src/components/PhysicalScreenWalkthrough';
import { Screen } from '../src/components/ui';
import { useApp } from '../src/context/AppContext';

export default function PhysicalScreenRetake() {
  const router = useRouter();
  const { draft, setDraft, saveTpiScreen } = useApp();
  return (
    <Screen>
      <PhysicalScreenWalkthrough
        results={draft.tpi}
        onChange={(tpi) => setDraft({ tpi })}
        onFinished={(tpi) => {
          void saveTpiScreen(tpi).then(() => router.replace('/correctives' as Href));
        }}
      />
    </Screen>
  );
}
