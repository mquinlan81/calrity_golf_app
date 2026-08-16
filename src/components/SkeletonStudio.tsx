import { StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { BONES } from '../services/poseKinematics';
import { hipMid, keypoint, shoulderMid, type Pose } from '../services/poseTypes';

const JOINT = '#C9A6FF';
const BONE = '#F7F2E8';
const GUIDE = '#E4C36A';
const MIN = 0.28;

export function SkeletonOverlay({ pose, aspect }: { pose: Pose; aspect: number }) {
  if (pose.score < 0.2) return null;
  const width = Math.max(aspect, 0.35);
  const hip = hipMid(pose);
  const chest = shoulderMid(pose);
  const spineX = chest.x + (hip.x - chest.x) * 1.65;
  const spineY = chest.y + (hip.y - chest.y) * 1.65;
  const sx = (x: number) => x * width;
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
        if (from.score < MIN || to.score < MIN) return null;
        return (
          <Line
            key={`${a}-${b}`}
            x1={sx(from.x)}
            y1={from.y}
            x2={sx(to.x)}
            y2={to.y}
            stroke={BONE}
            strokeWidth="0.01"
            strokeLinecap="round"
          />
        );
      })}
      {hip.score >= MIN && chest.score >= MIN ? (
        <Line x1={sx(chest.x)} y1={chest.y} x2={sx(spineX)} y2={Math.min(0.98, spineY)} stroke={GUIDE} strokeWidth="0.008" />
      ) : null}
      {hip.score >= MIN ? (
        <Line
          x1={sx(keypoint(pose, 'left_hip').x)}
          y1={keypoint(pose, 'left_hip').y}
          x2={sx(keypoint(pose, 'right_hip').x)}
          y2={keypoint(pose, 'right_hip').y}
          stroke={GUIDE}
          strokeWidth="0.008"
        />
      ) : null}
      {chest.score >= MIN ? (
        <Line
          x1={sx(keypoint(pose, 'left_shoulder').x)}
          y1={keypoint(pose, 'left_shoulder').y}
          x2={sx(keypoint(pose, 'right_shoulder').x)}
          y2={keypoint(pose, 'right_shoulder').y}
          stroke={GUIDE}
          strokeWidth="0.008"
        />
      ) : null}
      {pose.keypoints.map((item) => {
        if (item.score < MIN || item.name.includes('eye') || item.name.includes('ear')) return null;
        return (
          <Circle
            key={item.name}
            cx={sx(item.x)}
            cy={item.y}
            r={item.name.includes('hip') || item.name.includes('shoulder') ? 0.016 : 0.012}
            fill={JOINT}
            stroke="#1E2A23"
            strokeWidth="0.003"
          />
        );
      })}
    </Svg>
  );
}
