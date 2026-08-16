import { useRouter } from 'expo-router';
import { TransferLadder } from '../../src/components/TransferLadder';
import { Body, Button, Card, Kicker, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { DRILLS, FOCUS_LABELS, SETUP_CHECKS } from '../../src/data/instruction';

export default function DrillScreen() {
  const router = useRouter();
  const { diagnosis } = useApp();
  if (!diagnosis) {
    return (
      <Screen>
        <Title>No diagnosis yet</Title>
        <Button label="Capture baseline" onPress={() => router.push('/session/capture')} />
      </Screen>
    );
  }
  const drill = DRILLS[diagnosis.primaryDrillKey];
  const setup = SETUP_CHECKS[diagnosis.setupCheckKey];

  return (
    <Screen>
      <Kicker>Single-focus rule</Kicker>
      <Title>{FOCUS_LABELS[diagnosis.primaryFocus]}</Title>
      {diagnosis.ballReaction ? (
        <Card>
          <Kicker>Ball reaction gap</Kicker>
          <Body>{diagnosis.ballReaction.summary}</Body>
        </Card>
      ) : null}
      <Card>
        <Kicker>One motion drill</Kicker>
        <Title>{drill.name}</Title>
        <Body>{drill.intent}</Body>
        {drill.how.map((line) => (
          <Body key={line} muted>
            • {line}
          </Body>
        ))}
      </Card>
      <Card>
        <Kicker>One setup check</Kicker>
        <Body>{setup.title}</Body>
        <Body muted>{setup.cue}</Body>
      </Card>
      <Card>
        <Kicker>4-step transfer ladder</Kicker>
        <TransferLadder step={diagnosis.transferStep} />
      </Card>
      {diagnosis.capabilityNotes.map((note) => (
        <Body key={note} muted>
          {note}
        </Body>
      ))}
      <Button label="Build 3-pile range plan" onPress={() => router.push('/range-plan')} />
    </Screen>
  );
}
