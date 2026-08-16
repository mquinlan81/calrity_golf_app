import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { BONES, fittedSkeleton } from '../services/poseKinematics';
import { keypoint, type Pose } from '../services/poseTypes';

const JOINT = '#9B6BFF';
const BONE = '#F4EFE6';
const GUIDE = '#E4C36A';

export function SkeletonStudio({ pose }: { pose: Pose }) {
  const points = fittedSkeleton(pose);
  const fittedHip = {
    x: (points.left_hip.x + points.right_hip.x) / 2,
    y: (points.left_hip.y + points.right_hip.y) / 2,
  };
  const fittedChest = {
    x: (points.left_shoulder.x + points.right_shoulder.x) / 2,
    y: (points.left_shoulder.y + points.right_shoulder.y) / 2,
  };
  const spineDx = fittedChest.x - fittedHip.x;
  const spineDy = fittedChest.y - fittedHip.y;
  const groundY = 148;
  const t = spineDy !== 0 ? (groundY - fittedHip.y) / spineDy : 0;
  const groundX = fittedHip.x + spineDx * t;

  return (
    <View style={styles.stage}>
      <Svg width="100%" height="100%" viewBox="0 0 100 160">
        <Line x1="12" y1="150" x2="88" y2="150" stroke="#C9C3B8" strokeWidth="0.6" />
        {BONES.map(([a, b]) => {
          const from = points[a];
          const to = points[b];
          if (from.score < 0.12 || to.score < 0.12) return null;
          return (
            <Line
              key={`${a}-${b}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={BONE}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          );
        })}
        <Line
          x1={points.left_hip.x}
          y1={points.left_hip.y}
          x2={points.right_hip.x}
          y2={points.right_hip.y}
          stroke={GUIDE}
          strokeWidth="1.6"
        />
        <Line
          x1={points.left_shoulder.x}
          y1={points.left_shoulder.y}
          x2={points.right_shoulder.x}
          y2={points.right_shoulder.y}
          stroke={GUIDE}
          strokeWidth="1.6"
        />
        <Line x1={fittedChest.x} y1={fittedChest.y} x2={groundX} y2={groundY} stroke={GUIDE} strokeWidth="1.4" />
        <Circle cx={groundX} cy={groundY} r="2.2" fill={BONE} />
        {pose.keypoints.map((item) => {
          const point = points[item.name];
          if (point.score < 0.12 || item.name.includes('eye') || item.name.includes('ear')) return null;
          const r = item.name.includes('hip') || item.name.includes('shoulder') ? 3.2 : 2.5;
          return <Circle key={item.name} cx={point.x} cy={point.y} r={r} fill={JOINT} />;
        })}
        {keypoint(pose, 'nose').score >= 0.12 ? (
          <Circle cx={points.nose.x} cy={points.nose.y} r="5.4" fill={BONE} stroke={JOINT} strokeWidth="1.4" />
        ) : null}
      </Svg>
    </View>
  );
}

export function SkeletonOverlay({ pose, aspect }: { pose: Pose; aspect: number }) {
  const width = Math.max(aspect, 0.4);
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      viewBox={`0 0 ${width} 1`}
      preserveAspectRatio="xMidYMid meet"
    >
      {BONES.map(([a, b]) => {
        const from = keypoint(pose, a);
        const to = keypoint(pose, b);
        if (from.score < 0.16 || to.score < 0.16) return null;
        return (
          <Line
            key={`${a}-${b}`}
            x1={from.x * width}
            y1={from.y}
            x2={to.x * width}
            y2={to.y}
            stroke="rgba(244,239,230,0.9)"
            strokeWidth="0.012"
            strokeLinecap="round"
          />
        );
      })}
      {pose.keypoints.map((item) => {
        if (item.score < 0.16 || item.name.includes('eye') || item.name.includes('ear')) return null;
        return (
          <Circle
            key={item.name}
            cx={item.x * width}
            cy={item.y}
            r={item.name.includes('hip') || item.name.includes('shoulder') ? 0.018 : 0.014}
            fill={JOINT}
          />
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: '#D4D0C8' },
});
