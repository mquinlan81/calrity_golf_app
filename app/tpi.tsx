import { type Href, useRouter } from 'expo-router';
import { TpiWalkthrough } from '../src/components/TpiWalkthrough';
import { Screen } from '../src/components/ui';
import { useApp } from '../src/context/AppContext';

export default function RetakeTpiScreen() {
  const router = useRouter();
  const { draft, setDraft, saveTpiScreen } = useApp();
  return (
    <Screen>
      <TpiWalkthrough
        results={draft.tpi}
        onChange={(tpi) => setDraft({ tpi })}
        onFinished={(tpi) => {
          void saveTpiScreen(tpi).then(() => router.replace('/correctives' as Href));
        }}
      />
    </Screen>
  );
}
