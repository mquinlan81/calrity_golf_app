import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { TPI_TESTS } from '../data/tpi';
import { screenMeta } from '../data/physicalScreenMeta';
import { assessPhysicalClip, skippedResult } from '../services/physicalAssess';
import { defaultResult } from '../services/tpi';
import { colors } from '../theme';
import type { TpiResult, TpiResults } from '../types';
import { GuidedRecorder } from './GuidedRecorder';
import { PhysicalScreenFigure } from './PhysicalScreenFigure';
import { Body, Button, Card, Kicker, Title } from './ui';

type Phase = 'intro' | 'brief' | 'record' | 'assess';

export function PhysicalScreenWalkthrough({
  results,
  onChange,
  onFinished,
}: {
  results: TpiResults;
  onChange: (next: TpiResults) => void;
  onFinished: (next: TpiResults) => void;
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [busy, setBusy] = useState(false);
  const test = TPI_TESTS[index];
  const meta = screenMeta(test.key);
  const current: TpiResult = results[test.key] ?? defaultResult(test.key);

  const commit = (partial: Partial<TpiResult> = {}) => {
    const next = {
      ...results,
      [test.key]: { ...current, ...partial, key: test.key },
    };
    onChange(next);
    return next;
  };

  const goNext = (nextResults: TpiResults) => {
    if (index < TPI_TESTS.length - 1) {
      setIndex((value) => value + 1);
      setPhase('brief');
      return;
    }
    onFinished(nextResults);
  };

  const skip = () => {
    const next = commit(skippedResult(test));
    goNext(next);
  };

  const onClip = async (videoUri: string) => {
    if (busy) return;
    setBusy(true);
    setPhase('assess');
    try {
      const assessed = await assessPhysicalClip(test, videoUri);
      goNext(commit(assessed));
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'intro') {
    return (
      <View style={{ gap: 16 }}>
        <Kicker>Physical Screen</Kicker>
        <Title>16 movements. Your range, not a pose.</Title>
        <Body>
          Each screen is a short picture and an explanation, then a 3-2-1. Clarity records the movement it sees and
          reads pass, limited, or restricted. You do not grade yourself. Move the way you move.
        </Body>
        <Card>
          <Body muted>
            Limited range is a capability map — never a swing fault. Pain is a stop sign. Skip any screen that is not
            cleared for your body.
          </Body>
        </Card>
        <Button label="Start with Pelvic Tilt" onPress={() => setPhase('brief')} />
      </View>
    );
  }

  if (phase === 'assess') {
    return (
      <View style={{ gap: 16, paddingVertical: 24 }}>
        <Kicker>
          Screen {test.number} / {TPI_TESTS.length}
        </Kicker>
        <Title>Reading your range</Title>
        <Body muted>Clarity is watching the clip for available motion — not for a model position.</Body>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (phase === 'record') {
    return (
      <View style={{ gap: 14 }}>
        <Kicker>
          Screen {test.number} / {TPI_TESTS.length} · {test.region}
        </Kicker>
        <Title>{test.title}</Title>
        <Body muted>3-2-1, then move. The recording stops on its own.</Body>
        <GuidedRecorder
          facingHint={test.camera}
          hint={test.setup[test.setup.length - 1] ?? ''}
          autoStart
          recordSeconds={meta.recordSeconds}
          onRecorded={(videoUri) => {
            void onClip(videoUri);
          }}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button variant="ghost" label="Back to picture" onPress={() => setPhase('brief')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button variant="ghost" label="Skip this screen" onPress={skip} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <Kicker>
        Screen {test.number} / {TPI_TESTS.length} · {test.region}
      </Kicker>
      <Title>{test.title}</Title>
      <PhysicalScreenFigure testKey={test.key} />
      <Card>
        <Kicker>How to do it</Kicker>
        <Body>{meta.briefing}</Body>
      </Card>
      <Card>
        <Kicker>Setup</Kicker>
        {test.setup.map((line) => (
          <Body key={line} muted>
            • {line}
          </Body>
        ))}
      </Card>
      <Button label="I'm in position" onPress={() => setPhase('record')} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {index > 0 ? (
          <View style={{ flex: 1 }}>
            <Button
              variant="ghost"
              label="Back"
              onPress={() => {
                setIndex((value) => value - 1);
                setPhase('brief');
              }}
            />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Button variant="ghost" label="Skip this screen" onPress={skip} />
        </View>
      </View>
    </View>
  );
}
