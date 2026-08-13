import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Body, Button, Card, Chip, Field, Kicker, Screen, Title } from '../src/components/ui';
import { useApp } from '../src/context/AppContext';
import { createId, readJson, storageKeys, writeJson } from '../src/lib/localStore';
import { emptyCard, parseScorecardText, scorecardMetrics } from '../src/services/ocr';
import type { FairwayMiss, ScorecardHole } from '../src/types';

export default function CardReviewScreen() {
  const router = useRouter();
  const { saveRemote } = useApp();
  const params = useLocalSearchParams<{ photo?: string; course?: string }>();
  const [raw, setRaw] = useState('');
  const [holes, setHoles] = useState<ScorecardHole[]>(emptyCard(9));
  const metrics = useMemo(() => scorecardMetrics(holes), [holes]);

  const applyParse = () => {
    setHoles(parseScorecardText(raw, holes.length));
  };

  const patch = (index: number, partial: Partial<ScorecardHole>) => {
    setHoles((current) => current.map((hole, i) => (i === index ? { ...hole, ...partial } : hole)));
  };

  const save = async () => {
    const row = {
      id: createId('card'),
      photo_url: params.photo ?? null,
      course_name: params.course ?? null,
      holes,
      ...metrics,
      created_at: new Date().toISOString(),
    };
    const existing = await readJson<unknown[]>(storageKeys.scorecards, []);
    await writeJson(storageKeys.scorecards, [row, ...existing]);
    await saveRemote('scorecards', {
      photo_url: params.photo ?? null,
      course_name: params.course ?? null,
      holes,
      total_putts: metrics.totalPutts,
      fairways_hit: metrics.fairwaysHit,
      gir_count: metrics.girCount,
      lag_putting_efficiency: metrics.lagPuttingEfficiency,
      target_dispersion_shift: metrics.targetDispersionShift,
    });
    router.replace('/card');
  };

  return (
    <Screen>
      <Kicker>Parse & confirm</Kicker>
      <Title>{params.course || 'Scorecard'}</Title>
      <Body muted>
        Paste OCR text (one hole per line: hole par score fairway gir up/down putts first-putt-ft penalties bunkers) or
        tap the grid.
      </Body>
      <Field
        label="OCR / typed dump"
        value={raw}
        onChangeText={setRaw}
        multiline
        placeholder={'1 4 5 L N N 3 28 0 1'}
      />
      <Button label="Parse dump" variant="secondary" onPress={applyParse} />
      <Button
        variant="ghost"
        label={holes.length === 9 ? 'Switch to 18 holes' : 'Switch to 9 holes'}
        onPress={() => setHoles(emptyCard(holes.length === 9 ? 18 : 9))}
      />
      {holes.map((hole, index) => (
        <Card key={hole.hole}>
          <Kicker>
            Hole {hole.hole} · Par {hole.par}
          </Kicker>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Score"
                keyboardType="number-pad"
                value={hole.score?.toString() ?? ''}
                onChangeText={(value) => patch(index, { score: Number(value) || null })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Putts"
                keyboardType="number-pad"
                value={hole.putts?.toString() ?? ''}
                onChangeText={(value) => patch(index, { putts: Number(value) || null })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="1st putt ft"
                keyboardType="number-pad"
                value={hole.firstPuttFt?.toString() ?? ''}
                onChangeText={(value) => patch(index, { firstPuttFt: Number(value) || null })}
              />
            </View>
          </View>
          <Body>Fairway</Body>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['L', 'H', 'R'] as FairwayMiss[]).map((side) => (
              <Chip
                key={String(side)}
                label={side ?? ''}
                selected={hole.fairway === side}
                onPress={() => patch(index, { fairway: hole.fairway === side ? null : side })}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip
              label={hole.gir ? 'GIR yes' : 'GIR no'}
              selected={Boolean(hole.gir)}
              onPress={() => patch(index, { gir: !hole.gir })}
            />
            <Chip
              label={hole.upAndDown ? 'Up & down' : 'No U/D'}
              selected={Boolean(hole.upAndDown)}
              onPress={() => patch(index, { upAndDown: !hole.upAndDown })}
            />
          </View>
        </Card>
      ))}
      <Card>
        <Kicker>Lag putting efficiency</Kicker>
        <Title>{metrics.lagPuttingEfficiency ?? '—'}{metrics.lagPuttingEfficiency !== null ? '%' : ''}</Title>
        <Body>
          Fairways {metrics.fairwaysHit}/{metrics.fairwayAttempts} · GIR {metrics.girCount}/{metrics.girAttempts} ·
          Putts {metrics.totalPutts}
        </Body>
        <Body muted>{metrics.targetDispersionShift}</Body>
      </Card>
      <Button label="Save scorecard" onPress={() => void save()} />
    </Screen>
  );
}
