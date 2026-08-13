import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Chip, Field, Kicker, ProgressDots, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { MOBILITY_STEPS, type MobilityGrade } from '../../src/types';

const GRADES: { grade: MobilityGrade; label: string }[] = [
  { grade: 'full', label: 'Available' },
  { grade: 'limited', label: 'Limited' },
  { grade: 'restricted', label: 'Restricted' },
];

export default function MobilityScreen() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const [step, setStep] = useState(0);
  const current = MOBILITY_STEPS[step];
  const grade = draft.mobility[current.key];

  const setGrade = (value: MobilityGrade) => {
    setDraft({ mobility: { ...draft.mobility, [current.key]: value } });
  };

  return (
    <Screen>
      <ProgressDots step={4} total={6} />
      <Kicker>
        Mobility {step + 1} / {MOBILITY_STEPS.length}
      </Kicker>
      <Title>{current.title}</Title>
      <Body>{current.prompt}</Body>
      <Body muted>{current.cue}</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {GRADES.map((item) => (
          <Chip
            key={item.grade}
            label={item.label}
            selected={grade === item.grade}
            onPress={() => setGrade(item.grade)}
          />
        ))}
      </View>
      <Field
        label="Optional note"
        value={draft.mobilityNotes[current.key] ?? ''}
        onChangeText={(text) =>
          setDraft({ mobilityNotes: { ...draft.mobilityNotes, [current.key]: text } })
        }
        placeholder="Where it stops, which side, pain vs stiffness"
      />
      {step < MOBILITY_STEPS.length - 1 ? (
        <Button label="Next screen" onPress={() => setStep((value) => value + 1)} />
      ) : (
        <Button label="Finish mobility" onPress={() => router.push('/complete')} />
      )}
      {step > 0 ? (
        <Button variant="ghost" label="Back" onPress={() => setStep((value) => value - 1)} />
      ) : null}
    </Screen>
  );
}
