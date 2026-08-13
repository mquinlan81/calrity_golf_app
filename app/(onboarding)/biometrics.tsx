import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, Chip, Field, Kicker, ProgressDots, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';

export default function BiometricsScreen() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  return (
    <Screen>
      <ProgressDots step={1} total={6} />
      <Kicker>Body, not blueprint</Kicker>
      <Title>Biometrics</Title>
      <Body muted>Height and age help us scale stance and club length. Dominance tells us how you aim.</Body>
      <Field
        label="Height (cm)"
        keyboardType="number-pad"
        value={draft.heightCm}
        onChangeText={(heightCm) => setDraft({ heightCm })}
      />
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
