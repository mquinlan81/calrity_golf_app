import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Field, Kicker, Screen, Title } from '../src/components/ui';
import { useApp } from '../src/context/AppContext';
import { createId, readJson, storageKeys, writeJson } from '../src/lib/localStore';
import { JOURNAL_XP, buildRangePlan } from '../src/services/habits';
import { DRILLS } from '../src/data/instruction';

export default function JournalScreen() {
  const router = useRouter();
  const { diagnosis, awardXp, saveRemote } = useApp();
  const [text, setText] = useState('');
  const drill = diagnosis ? DRILLS[diagnosis.primaryDrillKey] : DRILLS.two_club;
  const prompt = buildRangePlan(drill.name, 'Full Shot').journalPrompt;

  const save = async () => {
    const entry = { id: createId('journal'), text, createdAt: new Date().toISOString() };
    const existing = await readJson<unknown[]>(storageKeys.rangePlans, []);
    await writeJson('clarity.journals', [entry, ...existing]);
    await awardXp(JOURNAL_XP);
    await saveRemote('range_plans', { journal_reflection: text });
    router.replace('/practice');
  };

  return (
    <Screen>
      <Kicker>30 seconds</Kicker>
      <Title>Practice journal</Title>
      <Body>{prompt}</Body>
      <Field
        label="One sentence"
        value={text}
        onChangeText={setText}
        multiline
        placeholder="The clubhead felt…"
      />
      <Button label="Save reflection" onPress={() => void save()} />
    </Screen>
  );
}
