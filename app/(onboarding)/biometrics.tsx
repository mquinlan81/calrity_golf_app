import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, Chip, Field, Kicker, ProgressDots, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { cmToFeetInches, feetInchesToCm, heightFieldLabel } from '../../src/services/units';

export default function BiometricsScreen() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const imperial = draft.measurementSystem === 'imperial';
  const cm = Number(draft.heightCm) || 0;
  const { feet, inches } = cmToFeetInches(cm);

  return (
    <Screen>
      <ProgressDots step={2} total={7} />
      <Kicker>Body, not blueprint</Kicker>
      <Title>Biometrics</Title>
      <Body muted>
        Height and age help us scale stance and club length. Units follow your location choice
        ({draft.measurementSystem === 'imperial' ? 'imperial' : 'metric'}).
      </Body>
      {imperial ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Height (ft)"
              keyboardType="number-pad"
              value={draft.heightCm ? String(feet) : ''}
              onChangeText={(value) =>
                setDraft({ heightCm: String(feetInchesToCm(Number(value) || 0, inches)) })
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Height (in)"
              keyboardType="number-pad"
              value={draft.heightCm ? String(inches) : ''}
              onChangeText={(value) =>
                setDraft({ heightCm: String(feetInchesToCm(feet, Number(value) || 0)) })
              }
            />
          </View>
        </View>
      ) : (
        <Field
          label={heightFieldLabel('metric')}
          keyboardType="number-pad"
          value={draft.heightCm}
          onChangeText={(heightCm) => setDraft({ heightCm })}
        />
      )}
      <Field
        label="Age"
        keyboardType="number-pad"
        value={draft.age}
        onChangeText={(age) => setDraft({ age })}
      />
      <Body>Hand dominance</Body>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip
          label="Right"
          selected={draft.handDominance === 'right'}
          onPress={() => setDraft({ handDominance: 'right' })}
        />
        <Chip
          label="Left"
          selected={draft.handDominance === 'left'}
          onPress={() => setDraft({ handDominance: 'left' })}
        />
      </View>
      <Button label="Next · injuries" onPress={() => router.push('/injuries')} />
    </Screen>
  );
}
