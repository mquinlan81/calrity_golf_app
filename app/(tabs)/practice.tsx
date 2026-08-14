import { type Href, useRouter } from 'expo-router';
import { Body, Button, Card, Kicker, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { DRILLS } from '../../src/data/instruction';
import { buildRangePlan } from '../../src/services/habits';
import { TRANSFER_LADDER } from '../../src/types';

export default function PracticeScreen() {
  const router = useRouter();
  const { diagnosis, profile, completeHabit } = useApp();
  const drill = diagnosis ? DRILLS[diagnosis.primaryDrillKey] : DRILLS.two_club;
  const step = TRANSFER_LADDER[(diagnosis?.transferStep ?? 1) - 1];
  const plan = buildRangePlan(drill.name, step.label);
  const habitDone = profile?.last_habit_date === new Date().toISOString().slice(0, 10);

  return (
    <Screen>
      <Kicker>Habits & range</Kicker>
      <Title>Keep the motion alive</Title>
      <Card>
        <Kicker>2-minute daily habit</Kicker>
        <Body>{drill.name}</Body>
        <Body muted>{drill.how[0]}</Body>
        <Button
          label={habitDone ? 'Done today' : 'Log two minutes'}
          onPress={() => void completeHabit()}
        />
      </Card>
      <Card>
        <Kicker>3-pile range plan</Kicker>
        <Body>{plan.pile1Focus}</Body>
        <Body>{plan.pile2Focus}</Body>
        <Body>{plan.pile3Focus}</Body>
        <Button label="Open full plan" variant="secondary" onPress={() => router.push('/range-plan')} />
      </Card>
      <Button label="Physical screen results" variant="ghost" onPress={() => router.push('/correctives' as Href)} />
      <Button label="Practice journal" variant="ghost" onPress={() => router.push('/journal')} />
    </Screen>
  );
}
