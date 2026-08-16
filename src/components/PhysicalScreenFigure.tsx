import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Svg, { Circle, G, Line, Path, Polyline } from 'react-native-svg';
import { screenMeta, type ScreenPose } from '../data/physicalScreenMeta';
import type { TpiTestKey } from '../types';
import { colors, fonts } from '../theme';

export function PhysicalScreenFigure({
  testKey,
  title = 'Proper motion — looping',
  intervalMs = 750,
}: {
  testKey: TpiTestKey;
  title?: string;
  intervalMs?: number;
}) {
  const meta = screenMeta(testKey);
  const [action, setAction] = useState(false);

  useEffect(() => {
    setAction(false);
    const id = setInterval(() => setAction((value) => !value), intervalMs);
    return () => clearInterval(id);
  }, [testKey, intervalMs]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>{title}</Text>
      <PoseSvg pose={action ? meta.actionPose : meta.startPose} />
      <Text style={styles.caption}>{action ? meta.actionCaption : meta.startCaption}</Text>
    </View>
  );
}

function PoseSvg({ pose }: { pose: ScreenPose }) {
  return (
    <Svg viewBox="0 0 100 140" width="72%" height={180}>
      <Line x1="18" y1="132" x2="82" y2="132" stroke={colors.fog} strokeWidth="3" />
      <G stroke={colors.ink} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {renderPose(pose)}
      </G>
    </Svg>
  );
}

function Head({ x, y }: { x: number; y: number }) {
  return <Circle cx={x} cy={y} r="8.5" stroke={colors.ink} strokeWidth="3" fill={colors.cream} />;
}

function renderPose(pose: ScreenPose) {
  switch (pose) {
    case 'sideStand':
      return (
        <>
          <Head x={58} y={24} />
          <Line x1="56" y1="33" x2="50" y2="78" />
          <Line x1="50" y1="78" x2="44" y2="124" />
          <Line x1="50" y1="78" x2="62" y2="124" />
          <Line x1="54" y1="48" x2="38" y2="72" />
          <Line x1="54" y1="48" x2="72" y2="70" />
        </>
      );
    case 'sideTilt':
      return (
        <>
          <Head x={58} y={24} />
          <Line x1="56" y1="33" x2="50" y2="78" />
          <Path d="M42 78 Q50 68 62 82" stroke={colors.gold} strokeWidth="3.6" />
          <Line x1="48" y1="80" x2="44" y2="124" />
          <Line x1="52" y1="80" x2="62" y2="124" />
          <Line x1="54" y1="48" x2="38" y2="70" />
          <Line x1="54" y1="48" x2="70" y2="68" />
        </>
      );
    case 'sideSquat':
      return (
        <>
          <Head x={54} y={36} />
          <Line x1="54" y1="45" x2="48" y2="78" />
          <Line x1="48" y1="78" x2="36" y2="108" />
          <Line x1="36" y1="108" x2="32" y2="124" />
          <Line x1="48" y1="78" x2="60" y2="108" />
          <Line x1="60" y1="108" x2="66" y2="124" />
          <Line x1="52" y1="52" x2="52" y2="18" stroke={colors.gold} />
          <Line x1="52" y1="52" x2="64" y2="18" stroke={colors.gold} />
        </>
      );
    case 'sideHinge':
      return (
        <>
          <Head x={38} y={58} />
          <Line x1="42" y1="66" x2="62" y2="88" />
          <Line x1="62" y1="88" x2="52" y2="124" />
          <Line x1="62" y1="88" x2="74" y2="124" />
          <Line x1="48" y1="72" x2="28" y2="96" stroke={colors.gold} />
        </>
      );
    case 'sideOverhead':
      return (
        <>
          <Head x={56} y={28} />
          <Line x1="54" y1="37" x2="50" y2="80" />
          <Line x1="50" y1="80" x2="42" y2="124" />
          <Line x1="50" y1="80" x2="62" y2="124" />
          <Line x1="52" y1="50" x2="48" y2="16" stroke={colors.gold} />
          <Line x1="52" y1="50" x2="62" y2="14" stroke={colors.gold} />
        </>
      );
    case 'sideWristExt':
      return (
        <>
          <Head x={40} y={28} />
          <Line x1="42" y1="37" x2="48" y2="78" />
          <Line x1="48" y1="78" x2="40" y2="124" />
          <Line x1="48" y1="78" x2="60" y2="124" />
          <Line x1="46" y1="50" x2="78" y2="58" />
          <Polyline points="78,58 90,46 86,40" stroke={colors.gold} strokeWidth="3.4" />
        </>
      );
    case 'sideWristFlex':
      return (
        <>
          <Head x={40} y={28} />
          <Line x1="42" y1="37" x2="48" y2="78" />
          <Line x1="48" y1="78" x2="40" y2="124" />
          <Line x1="48" y1="78" x2="60" y2="124" />
          <Line x1="46" y1="50" x2="78" y2="58" />
          <Polyline points="78,58 88,72 84,76" stroke={colors.gold} strokeWidth="3.4" />
        </>
      );
    case 'sideBridge':
      return (
        <>
          <Head x={22} y={78} />
          <Line x1="30" y1="80" x2="78" y2="72" />
          <Line x1="78" y1="72" x2="86" y2="108" />
          <Line x1="86" y1="108" x2="94" y2="108" />
          <Line x1="56" y1="74" x2="70" y2="108" stroke={colors.gold} />
        </>
      );
    case 'frontStand':
      return frontBody({ armL: [32, 78], armR: [68, 78], legLift: null, pelvis: 0, chest: 0, neck: 0 });
    case 'frontPelvisTurn':
      return frontBody({ armL: [34, 76], armR: [66, 76], legLift: null, pelvis: 10, chest: 0, neck: 0, accent: 'pelvis' });
    case 'frontChestTurn':
      return frontBody({ armL: [28, 62], armR: [78, 58], legLift: null, pelvis: 0, chest: 12, neck: 0, accent: 'chest' });
    case 'frontGoalpost':
      return (
        <>
          <Head x={50} y={22} />
          <Line x1="50" y1="31" x2="50" y2="78" />
          <Line x1="50" y1="78" x2="40" y2="124" />
          <Line x1="50" y1="78" x2="60" y2="124" />
          <Line x1="50" y1="48" x2="28" y2="48" />
          <Line x1="50" y1="48" x2="72" y2="48" />
          <Line x1="28" y1="48" x2="28" y2="28" stroke={colors.gold} />
          <Line x1="72" y1="48" x2="78" y2="28" stroke={colors.gold} />
        </>
      );
    case 'frontSingleLeg':
      return frontBody({ armL: [30, 70], armR: [70, 70], legLift: 'right', pelvis: 0, chest: 0, neck: 0, accent: 'leg' });
    case 'frontSeated':
      return seated({ turn: 0 });
    case 'frontSeatedTurn':
      return seated({ turn: 14 });
    case 'frontNeck':
      return frontBody({ armL: [32, 78], armR: [68, 78], legLift: null, pelvis: 0, chest: 0, neck: 16, accent: 'neck' });
    case 'frontForearm':
      return (
        <>
          <Head x={50} y={22} />
          <Line x1="50" y1="31" x2="50" y2="80" />
          <Line x1="50" y1="80" x2="40" y2="124" />
          <Line x1="50" y1="80" x2="60" y2="124" />
          <Line x1="50" y1="50" x2="28" y2="50" />
          <Line x1="50" y1="50" x2="72" y2="50" />
          <Line x1="28" y1="50" x2="18" y2="38" stroke={colors.gold} />
          <Line x1="72" y1="50" x2="84" y2="62" stroke={colors.gold} />
        </>
      );
    case 'proneReach':
      return prone(false);
    case 'proneLift':
      return prone(true);
    default:
      return frontBody({ armL: [32, 78], armR: [68, 78], legLift: null, pelvis: 0, chest: 0, neck: 0 });
  }
}

function frontBody({
  armL,
  armR,
  legLift,
  pelvis,
  chest,
  neck,
  accent,
}: {
  armL: [number, number];
  armR: [number, number];
  legLift: 'left' | 'right' | null;
  pelvis: number;
  chest: number;
  neck: number;
  accent?: 'pelvis' | 'chest' | 'leg' | 'neck';
}) {
  const headX = 50 + neck;
  const chestX = 50 + chest;
  const pelvisX = 50 + pelvis;
  return (
    <>
      <Head x={headX} y={22} />
      <Line x1={headX} y1="31" x2={chestX} y2="50" stroke={accent === 'neck' || accent === 'chest' ? colors.gold : colors.ink} />
      <Line x1={chestX} y1="50" x2={pelvisX} y2="80" />
      <Line
        x1={pelvisX - 10}
        y1="80"
        x2={pelvisX + 10}
        y2="80"
        stroke={accent === 'pelvis' ? colors.gold : colors.ink}
        strokeWidth={accent === 'pelvis' ? 4 : 3.2}
      />
      <Line x1={chestX} y1="50" x2={armL[0]} y2={armL[1]} />
      <Line x1={chestX} y1="50" x2={armR[0]} y2={armR[1]} />
      {legLift === 'right' ? (
        <>
          <Line x1={pelvisX - 8} y1="80" x2="40" y2="124" />
          <Line x1={pelvisX + 8} y1="80" x2="68" y2="98" stroke={accent === 'leg' ? colors.gold : colors.ink} />
        </>
      ) : (
        <>
          <Line x1={pelvisX - 8} y1="80" x2="40" y2="124" />
          <Line x1={pelvisX + 8} y1="80" x2="60" y2="124" />
        </>
      )}
    </>
  );
}

function seated({ turn }: { turn: number }) {
  const chestX = 50 + turn;
  return (
    <>
      <Head x={chestX} y={24} />
      <Line x1={chestX} y1="33" x2={chestX} y2="70" stroke={turn ? colors.gold : colors.ink} />
      <Line x1="34" y1="92" x2="66" y2="92" />
      <Line x1="38" y1="92" x2="34" y2="124" />
      <Line x1="62" y1="92" x2="78" y2="118" stroke={turn ? colors.gold : colors.ink} />
      <Line x1={chestX} y1="48" x2={chestX - 22} y2="68" />
      <Line x1={chestX} y1="48" x2={chestX + 22} y2="64" />
    </>
  );
}

function prone(lift: boolean) {
  return (
    <>
      <Head x={22} y={86} />
      <Line x1="30" y1="90" x2="78" y2="90" />
      <Line x1="78" y1="90" x2="88" y2="108" />
      <Line x1="52" y1="90" x2={lift ? 58 : 70} y2={lift ? 70 : 90} stroke={colors.gold} />
      {lift ? <Line x1="58" y1="70" x2="70" y2="62" stroke={colors.gold} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.fog,
    padding: 10,
  },
  kicker: {
    fontFamily: fonts.bodyMedium,
    color: colors.gold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontSize: 11,
    marginBottom: 4,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
});
