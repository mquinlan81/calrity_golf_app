import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { TPI_TESTS } from '../data/tpi';
import { screenMeta } from '../data/physicalScreenMeta';
import { assessPhysicalClip, skippedResult, warmupMoveNet } from '../services/physicalAssess';
import { defaultResult, observedRangeCopy, physicalGradeLabel, typicalRangeCopy } from '../services/tpi';
import { colors } from '../theme';
import type { TpiResult, TpiResults } from '../types';
import { GuidedRecorder } from './GuidedRecorder';
import { PhysicalScreenFigure } from './PhysicalScreenFigure';
import { PoseReview } from './PoseReview';
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
  const { draft, profile } = useApp();
  const heightCm = profile?.height_cm ?? (Number(draft.heightCm) || null);
  const system = profile?.measurement_system ?? draft.measurementSystem;
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
  const noJoints = mismatch && current.poseTrace?.tracking !== 'joints';

  useEffect(() => {
    void warmupMoveNet();
  }, []);

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
          After each clip the skeleton is drawn on your video — dots on the joints we found, gold lines for hips,
          shoulders, and spine. Only the numbers that matter for that screen sit underneath. A plain wall and full body
          in frame help the joints lock on.
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
        <Title>Locking onto joints</Title>
        <Body muted>Finding hips, shoulders, and limbs in your video. First time can take a few extra seconds.</Body>
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
          <Title>{noJoints ? 'Could not lock onto your joints' : 'That did not appear correct'}</Title>
          <Body>
            {noJoints
              ? 'The skeleton has to sit on your body before we score range. Step back, use a plain wall, and more light, then try again.'
              : `Clarity did not see the ${test.title.toLowerCase()} motion it was expecting. This is not a range score yet. Watch the tutorial, then try again.`}
          </Body>
          <PhysicalScreenFigure testKey={test.key} title="Video tutorial" intervalMs={1100} />
          <Card>
            <Kicker>Do this</Kicker>
            {test.perform.map((line) => (
              <Body key={line}>• {line}</Body>
            ))}
          </Card>
          {current.videoUri ? (
            <PoseReview
              videoUri={current.videoUri}
              trace={current.poseTrace}
              testKey={test.key}
              heightCm={heightCm}
              system={system}
            />
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
        {current.videoUri ? (
          <PoseReview
            videoUri={current.videoUri}
            trace={current.poseTrace}
            testKey={test.key}
            heightCm={heightCm}
            system={system}
          />
        ) : null}
        <Card>
          <Kicker>Typical range of motion</Kicker>
          <Body>{typicalRangeCopy(test, current)}</Body>
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
        <Body muted>You should see yourself. We wait until you are in the box, then 3-2-1. Move through the motion. The video stops on its own.</Body>
        <GuidedRecorder
          key={`${test.key}-${captureKey}`}
          facingHint={test.camera}
          hint={test.setup[test.setup.length - 1] ?? ''}
          autoStart
          recordSeconds={meta.recordSeconds}
          bodyTarget={meta.bodyTarget}
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
