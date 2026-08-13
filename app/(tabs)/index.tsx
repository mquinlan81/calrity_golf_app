import { type Href, useRouter } from 'expo-router';
import { View } from 'react-native';
import { FlowStreak } from '../../src/components/FlowStreak';
import { Body, Button, Card, Chip, GoldRule, Kicker, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { DRILLS, FOCUS_LABELS } from '../../src/data/instruction';
import { philosophy } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, diagnosis, completeHabit, setMeasurementSystem } = useApp();
  const drill = diagnosis ? DRILLS[diagnosis.primaryDrillKey] : DRILLS.two_club;
  const habitDone = profile?.last_habit_date === new Date().toISOString().slice(0, 10);

  return (
    <Screen>
      <Kicker>{philosophy.teachers}</Kicker>
      <Title>Hello, {profile?.display_name || 'player'}.</Title>
      <GoldRule />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip
          label="Metric"
          selected={(profile?.measurement_system ?? 'metric') === 'metric'}
          onPress={() => void setMeasurementSystem('metric')}
        />
        <Chip
          label="Imperial"
          selected={profile?.measurement_system === 'imperial'}
          onPress={() => void setMeasurementSystem('imperial')}
        />
      </View>
      <FlowStreak streak={profile?.flow_streak ?? 0} xp={profile?.xp ?? 0} />
      <Card>
        <Kicker>Today’s 2-minute habit</Kicker>
        <Title>{drill.name}</Title>
        <Body>{drill.dailyHabit}</Body>
        <Button
          label={habitDone ? 'Flow streak is alive' : 'I moved for two minutes'}
          onPress={() => void completeHabit()}
          variant={habitDone ? 'secondary' : 'primary'}
        />
      </Card>
      {diagnosis ? (
        <Card>
          <Kicker>Single focus</Kicker>
          <Body>
            {FOCUS_LABELS[diagnosis.primaryFocus]} · {drill.name}
          </Body>
          <Body muted>
            One drill. One setup check. The rest of the swing is allowed to be ordinary.
          </Body>
          <Button label="Open the drill" variant="secondary" onPress={() => router.push('/session/drill')} />
        </Card>
      ) : (
        <Card>
          <Kicker>Baseline</Kicker>
          <Body>Capture air swing vs real swing so we can see if the ball steals your tempo.</Body>
          <Button label="Start dual baseline" onPress={() => router.push('/session/capture')} />
        </Card>
      )}
      <Card>
        <Kicker>TPI screen</Kicker>
        <Body>
          Limitations from the physical screen have stretches and exercises waiting. The swing is still fitted to the
          body you have today.
        </Body>
        <Button label="Open correctives" variant="secondary" onPress={() => router.push('/correctives' as Href)} />
      </Card>
      <Body muted>{philosophy.tagline}</Body>
      <Button label="Coach lesson lab" variant="ghost" onPress={() => router.push('/admin/lessons')} />
    </Screen>
  );
}
