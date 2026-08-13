import { useState } from 'react';
import { View } from 'react-native';
import { TPI_TESTS } from '../data/tpi';
import type { MobilityGrade, TpiResult, TpiResults } from '../types';
import { GuidedRecorder } from './GuidedRecorder';
import { Body, Button, Card, Chip, Field, Kicker, Title } from './ui';

const GRADES: { grade: MobilityGrade; label: string }[] = [
  { grade: 'full', label: 'Pass' },
  { grade: 'limited', label: 'Limited' },
  { grade: 'restricted', label: 'Restricted' },
];

export function TpiWalkthrough({
  results,
  onChange,
  onFinished,
}: {
  results: TpiResults;
  onChange: (next: TpiResults) => void;
  onFinished: (next: TpiResults) => void;
}) {
  const [index, setIndex] = useState(0);
  const [intro, setIntro] = useState(index === 0 && !results[TPI_TESTS[0].key]);
  const test = TPI_TESTS[index];
  const current: TpiResult = results[test.key] ?? {
    key: test.key,
    grade: 'skipped',
    videoUri: null,
    remoteUrl: null,
    notes: '',
  };

  const commit = (partial: Partial<TpiResult> = {}) => {
    const next = {
      ...results,
      [test.key]: { ...current, ...partial, key: test.key },
    };
    onChange(next);
    return next;
  };

  const patch = (partial: Partial<TpiResult>) => {
    commit(partial);
  };

  if (intro) {
    return (
      <View style={{ gap: 16 }}>
        <Kicker>Titleist Performance Institute</Kicker>
        <Title>16-test physical screen</Title>
        <Body>
          Each screen has a setup, a movement, and a pass picture. Prop the phone, follow the instructions, then record
          yourself completing it. Limited range is a capability map — never a swing fault.
        </Body>
        <Card>
          <Body muted>
            We watch the recording with you so later we can prescribe stretches and exercises for the tests that were
            limited or restricted. Pain is a stop sign. Skip any test that is not cleared for your body.
          </Body>
        </Card>
        <Button label="Start test 1 · Pelvic Tilt" onPress={() => setIntro(false)} />
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <Kicker>
        TPI {test.number} / {TPI_TESTS.length} · {test.region}
      </Kicker>
      <Title>{test.title}</Title>
      <Card>
        <Kicker>Setup</Kicker>
        {test.setup.map((line) => (
          <Body key={line} muted>
            • {line}
          </Body>
        ))}
        <Kicker>Perform</Kicker>
        {test.perform.map((line) => (
          <Body key={line}>{line}</Body>
        ))}
      </Card>
      <Card>
        <Kicker>What we are looking for</Kicker>
        <Body>Pass — {test.passLooksLike}</Body>
        <Body muted>Limited — {test.limitedLooksLike}</Body>
        <Body muted>Restricted — {test.restrictedLooksLike}</Body>
        <Body muted>{test.capabilityNote}</Body>
      </Card>
      <GuidedRecorder
        facingHint={test.camera}
        hint={test.setup[test.setup.length - 1] ?? ''}
        onRecorded={(videoUri) => patch({ videoUri })}
      />
      {test.bilateral ? (
        <View style={{ gap: 8 }}>
          <Body>Left</Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GRADES.map((item) => (
              <Chip
                key={`L-${item.grade}`}
                label={item.label}
                selected={current.leftGrade === item.grade}
                onPress={() =>
                  patch({
                    leftGrade: item.grade,
                    grade: worse(item.grade, current.rightGrade) ?? item.grade,
                  })
                }
              />
            ))}
          </View>
          <Body>Right</Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {GRADES.map((item) => (
              <Chip
                key={`R-${item.grade}`}
                label={item.label}
                selected={current.rightGrade === item.grade}
                onPress={() =>
                  patch({
                    rightGrade: item.grade,
                    grade: worse(current.leftGrade, item.grade) ?? item.grade,
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GRADES.map((item) => (
            <Chip
              key={item.grade}
              label={item.label}
              selected={current.grade === item.grade}
              onPress={() => patch({ grade: item.grade })}
            />
          ))}
        </View>
      )}
      <Field
        label="Note (optional)"
        value={current.notes}
        onChangeText={(notes) => patch({ notes })}
        placeholder="Which side, pain vs stiffness, replacement limit"
      />
      {index < TPI_TESTS.length - 1 ? (
        <Button
          label={`Next · ${TPI_TESTS[index + 1].title}`}
          onPress={() => {
            if (current.grade === 'skipped' && !current.leftGrade && !current.rightGrade && !current.videoUri) {
              patch({ grade: 'skipped' });
            }
            setIndex((value) => value + 1);
          }}
        />
      ) : (
        <Button label="Finish screen" onPress={() => onFinished(commit())} />
      )}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {index > 0 ? (
          <View style={{ flex: 1 }}>
            <Button variant="ghost" label="Back" onPress={() => setIndex((value) => value - 1)} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <Button
            variant="ghost"
            label="Skip this test"
            onPress={() => {
              const next = commit({ grade: 'skipped' });
              if (index < TPI_TESTS.length - 1) setIndex((value) => value + 1);
              else onFinished(next);
            }}
          />
        </View>
      </View>
    </View>
  );
}

function worse(a?: MobilityGrade, b?: MobilityGrade): MobilityGrade | undefined {
  if (!a) return b;
  if (!b) return a;
  if (a === 'restricted' || b === 'restricted') return 'restricted';
  if (a === 'limited' || b === 'limited') return 'limited';
  return 'full';
}
