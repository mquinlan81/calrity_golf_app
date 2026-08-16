import { Video, ResizeMode } from 'expo-av';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { TPI_TESTS } from '../data/tpi';
import { screenMeta } from '../data/physicalScreenMeta';
import { assessPhysicalClip, skippedResult } from '../services/physicalAssess';
import { defaultResult, observedRangeCopy, physicalGradeLabel, typicalRangeCopy } from '../services/tpi';
import { colors } from '../theme';
import type { TpiResult, TpiResults } from '../types';
import { GuidedRecorder } from './GuidedRecorder';
import { PhysicalScreenFigure } from './PhysicalScreenFigure';
import { Body, Button, Card, Kicker, Title } from './ui';

type Phase = 'intro' | 'brief' | 'record' | 'assess' | 'result';

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
  const [captureKey, setCaptureKey] = useState(0);
  const [latest, setLatest] = useState<TpiResult | null>(null);
  const test = TPI_TESTS[index];
  const meta = screenMeta(test.key);
  const current: TpiResult = latest?.key === test.key ? latest : results[test.key] ?? defaultResult(test.key);
  const nextTest = index < TPI_TESTS.length - 1 ? TPI_TESTS[index + 1] : null;
  const recognized = current.recognized !== false && current.grade !== 'skipped';
  const mismatch = current.recognized === false && Boolean(current.videoUri);

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
      setCaptureKey((value) => value + 1);
      setLatest(null);
      setPhase('brief');
      return;
    }
    onFinished(nextResults);
  };

  const skip = () => {
    goNext(commit(skippedResult(test)));
  };

  const retry = () => {
    setCaptureKey((value) => value + 1);
    setPhase('record');
  };

  const onClip = async (videoUri: string) => {
    if (busy) return;
    setBusy(true);
    setPhase('assess');
    try {
      const assessed = await assessPhysicalClip(test, videoUri);
      setLatest(assessed);
      commit(assessed);
      setPhase('result');
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
          Use the front camera so you can see the countdown and yourself. After each motion you get a result. If the
          clip does not look like the exercise, Clarity will say so and show a tutorial before you try again.
        </Body>
        <Card>
          <Body muted>
            At the end you will see typical range vs your range, plus stretches for anything limited. Pain is a stop
            sign. Skip any screen that is not cleared for your body.
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
        <Title>Reading your video</Title>
        <Body muted>Checking whether this clip is the {test.title.toLowerCase()} motion, then measuring range.</Body>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (phase === 'result') {
    if (mismatch) {
      return (
        <View style={{ gap: 14 }}>
          <Kicker>
            Screen {test.number} / {TPI_TESTS.length}
          </Kicker>
          <Title>That did not appear correct</Title>
          <Body>
            Clarity did not see the {test.title.toLowerCase()} motion it was expecting. This is not a range score yet.
            Watch the tutorial, then try again.
          </Body>
          <PhysicalScreenFigure testKey={test.key} title="Video tutorial" intervalMs={1100} />
          <Card>
            <Kicker>Do this</Kicker>
            {test.perform.map((line) => (
              <Body key={line}>• {line}</Body>
            ))}
          </Card>
          {current.videoUri ? (
            <Video source={{ uri: current.videoUri }} style={styles.clip} resizeMode={ResizeMode.COVER} useNativeControls isMuted />
          ) : null}
          <Button label="Try again" onPress={retry} />
          <Button variant="ghost" label="Skip this screen" onPress={skip} />
        </View>
      );
    }

    return (
      <View style={{ gap: 14 }}>
        <Kicker>
          Screen {test.number} / {TPI_TESTS.length} · {physicalGradeLabel(current.grade)}
        </Kicker>
        <Title>{test.title}</Title>
        <Card>
          <Kicker>Typical range of motion</Kicker>
          <Body>{typicalRangeCopy(test)}</Body>
        </Card>
        <Card>
          <Kicker>Your range of motion</Kicker>
          <Body>{observedRangeCopy(test, current)}</Body>
          {current.leftGrade && current.rightGrade ? (
            <Body muted>
              Left {physicalGradeLabel(current.leftGrade)} · Right {physicalGradeLabel(current.rightGrade)}
            </Body>
          ) : null}
        </Card>
        {recognized && current.grade !== 'full' ? (
          <Card>
            <Kicker>To help you reach typical range</Kicker>
            {test.correctives.map((item) => (
              <View key={item.name} style={{ gap: 4, marginTop: 8 }}>
                <Body>
                  {item.name} · {item.duration}
                </Body>
                {item.how.map((line) => (
                  <Body key={line} muted>
                    • {line}
                  </Body>
                ))}
              </View>
            ))}
          </Card>
        ) : null}
        {current.videoUri ? (
          <Video source={{ uri: current.videoUri }} style={styles.clip} resizeMode={ResizeMode.COVER} useNativeControls isMuted />
        ) : null}
        <Button
          label={nextTest ? `Next · ${nextTest.title}` : 'See full rundown'}
          onPress={() => goNext({ ...results, [test.key]: current })}
        />
        <Button variant="ghost" label="Try this one again" onPress={retry} />
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
        <Body muted>You should see yourself and a 3-2-1. Then move through the motion. The video stops on its own.</Body>
        <GuidedRecorder
          key={`${test.key}-${captureKey}`}
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
            <Button variant="ghost" label="Back to motion" onPress={() => setPhase('brief')} />
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
        <Kicker>The motion</Kicker>
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

const styles = StyleSheet.create({
  clip: { width: '100%', height: 180, borderRadius: 12 },
});
