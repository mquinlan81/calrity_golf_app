import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, Chip, Field, Kicker, ProgressDots, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';

export default function InjuriesScreen() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const injuries = draft.injuries;
  return (
    <Screen>
      <ProgressDots step={3} total={7} />
      <Kicker>Capability first</Kicker>
      <Title>What should we protect?</Title>
      <Body muted>
        Flag fusions, replacements, prosthetics, and active injuries. The diagnostic engine will never ask you to move
        past these limits.
      </Body>
      <Field
        label="Active injuries"
        value={injuries.activeInjuries}
        onChangeText={(activeInjuries) => setDraft({ injuries: { ...injuries, activeInjuries } })}
        placeholder="e.g. right knee flare, low-back spasm"
        multiline
      />
      <Body>Spinal fusion</Body>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip
          label="No"
          selected={!injuries.spinalFusion}
          onPress={() => setDraft({ injuries: { ...injuries, spinalFusion: false } })}
        />
        <Chip
          label="Yes — protect the center"
          selected={injuries.spinalFusion}
          onPress={() => setDraft({ injuries: { ...injuries, spinalFusion: true } })}
        />
      </View>
      <Field
        label="Joint replacements"
        value={injuries.jointReplacements}
        onChangeText={(jointReplacements) => setDraft({ injuries: { ...injuries, jointReplacements } })}
        placeholder="e.g. left hip, 2022"
      />
      <Field
        label="Prosthetics / adaptive needs"
        value={injuries.prostheticsAdaptive}
        onChangeText={(prostheticsAdaptive) => setDraft({ injuries: { ...injuries, prostheticsAdaptive } })}
        placeholder="Stance, grip, or equipment notes"
        multiline
      />
      <Button label="Next · eye dominance" onPress={() => router.push('/eye-dominance')} />
    </Screen>
  );
}
