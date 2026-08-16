import { useRouter } from 'expo-router';
import { TransferLadder } from '../src/components/TransferLadder';
import { Body, Button, Card, Kicker, Screen, Title } from '../src/components/ui';
import { useApp } from '../src/context/AppContext';
import { DRILLS } from '../src/data/instruction';
import { createId, readJson, storageKeys, writeJson } from '../src/lib/localStore';
import { RANGE_XP, buildRangePlan } from '../src/services/habits';
import { TRANSFER_LADDER } from '../src/types';

export default function RangePlanScreen() {
  const router = useRouter();
  const { diagnosis, awardXp, saveRemote } = useApp();
  const drill = diagnosis ? DRILLS[diagnosis.primaryDrillKey] : DRILLS.two_club;
  const step = TRANSFER_LADDER[(diagnosis?.transferStep ?? 1) - 1];
  const plan = buildRangePlan(drill.name, step.label);

  const complete = async () => {
    const row = {
      id: createId('range'),
      pile1: plan.pile1Focus,
      pile2: plan.pile2Focus,
      pile3: plan.pile3Focus,
      createdAt: new Date().toISOString(),
    };
    const existing = await readJson<unknown[]>(storageKeys.rangePlans, []);
    await writeJson(storageKeys.rangePlans, [row, ...existing]);
    await awardXp(RANGE_XP);
    await saveRemote('range_plans', {
      diagnosis_id: diagnosis?.id ?? null,
      pile1_balls: plan.pile1Balls,
      pile1_focus: plan.pile1Focus,
      pile2_balls: plan.pile2Balls,
      pile2_focus: plan.pile2Focus,
      pile3_balls: plan.pile3Balls,
      pile3_focus: plan.pile3Focus,
      completed_at: new Date().toISOString(),
    });
    router.push('/journal');
  };

  return (
    <Screen>
      <Kicker>Range session</Kicker>
      <Title>Three piles</Title>
      <Body muted>Split the bucket before you hit. Outcome is only allowed in pile three.</Body>
      <Card>
        <Kicker>{plan.pile1Balls} balls</Kicker>
        <Body>{plan.pile1Focus}</Body>
      </Card>
      <Card>
        <Kicker>{plan.pile2Balls} balls</Kicker>
        <Body>{plan.pile2Focus}</Body>
      </Card>
      <Card>
        <Kicker>{plan.pile3Balls} balls</Kicker>
        <Body>{plan.pile3Focus}</Body>
      </Card>
      <Card>
        <Kicker>Transfer</Kicker>
        <TransferLadder step={diagnosis?.transferStep ?? 1} />
      </Card>
      <Button label="Session complete · journal" onPress={() => void complete()} />
    </Screen>
  );
}
