import type { BodyTarget, TpiTestKey } from '../types';

export type ScreenPose =
  | 'sideStand'
  | 'sideTilt'
  | 'sideSquat'
  | 'sideHinge'
  | 'sideOverhead'
  | 'sideWristExt'
  | 'sideWristFlex'
  | 'sideBridge'
  | 'frontStand'
  | 'frontPelvisTurn'
  | 'frontChestTurn'
  | 'frontGoalpost'
  | 'frontSingleLeg'
  | 'frontSeated'
  | 'frontSeatedTurn'
  | 'frontNeck'
  | 'frontForearm'
  | 'proneReach'
  | 'proneLift';

export interface PhysicalScreenMeta {
  briefing: string;
  recordSeconds: number;
  startPose: ScreenPose;
  actionPose: ScreenPose;
  startCaption: string;
  actionCaption: string;
  bodyTarget: BodyTarget;
}

export const PHYSICAL_SCREEN_META: Record<TpiTestKey, PhysicalScreenMeta> = {
  pelvic_tilt: {
    briefing:
      'This maps how independently your pelvis can nod. Prop the phone side-on so the belt and chest are in frame. After the countdown, roll the belt buckle toward your chin, then toward the floor. Slow. Stop at the first pinch.',
    recordSeconds: 8,
    startPose: 'sideStand',
    actionPose: 'sideTilt',
    startCaption: 'Golf posture, side-on',
    actionCaption: 'Pelvis nods; chest stays',
    bodyTarget: 'full',
  },
  pelvic_rotation: {
    briefing:
      'This maps how far the belt buckle can turn while the chest stays quiet. Face the phone. After the countdown, turn only the pelvis left, then right. Knees can soften. Do not chase a shape.',
    recordSeconds: 10,
    startPose: 'frontStand',
    actionPose: 'frontPelvisTurn',
    startCaption: 'Facing the phone',
    actionCaption: 'Belt buckle turns',
    bodyTarget: 'torso',
  },
  torso_rotation: {
    briefing:
      'This maps chest turn with a quiet pelvis. Face the phone, club across the shoulders or arms crossed. After the countdown, pin the belt buckle toward the camera and rotate the chest left, then right.',
    recordSeconds: 10,
    startPose: 'frontStand',
    actionPose: 'frontChestTurn',
    startCaption: 'Belt toward the camera',
    actionCaption: 'Chest turns around it',
    bodyTarget: 'torso',
  },
  overhead_deep_squat: {
    briefing:
      'This maps how you sit while the arms stay up. Phone side-on, heels and hands visible. After the countdown, reach overhead and sit as if to a chair, then deeper only if it is easy. No bounce.',
    recordSeconds: 8,
    startPose: 'sideOverhead',
    actionPose: 'sideSquat',
    startCaption: 'Arms up, heels down',
    actionCaption: 'Sit, then stand',
    bodyTarget: 'full',
  },
  toe_touch: {
    briefing:
      'This maps a forward fold, nothing more. Phone side-on, full body in frame. After the countdown, hinge and reach toward the floor. Let the head hang. Stop at tightness, not pain.',
    recordSeconds: 7,
    startPose: 'sideStand',
    actionPose: 'sideHinge',
    startCaption: 'Feet together',
    actionCaption: 'Hinge and hang',
    bodyTarget: 'full',
  },
  ninety_ninety: {
    briefing:
      'This maps shoulder rotation, not a golf pose. Face the phone. After the countdown, raise the upper arms to shoulder height, elbows bent, then rotate the hands back. Ribs stay quiet.',
    recordSeconds: 10,
    startPose: 'frontStand',
    actionPose: 'frontGoalpost',
    startCaption: 'Arms at 90°',
    actionCaption: 'Hands rotate back',
    bodyTarget: 'torso',
  },
  single_leg_balance: {
    briefing:
      'This maps standing balance. Face the phone, near a wall you can touch. After the countdown, stand on one foot, then the other. Use the wall the moment you wobble. Eyes closed only if eyes-open is easy.',
    recordSeconds: 22,
    startPose: 'frontStand',
    actionPose: 'frontSingleLeg',
    startCaption: 'Both feet down',
    actionCaption: 'One foot, then switch',
    bodyTarget: 'torso',
  },
  lat_length: {
    briefing:
      'This maps how far the arms travel overhead. Phone side-on. After the countdown, reach both arms up, then one, then the other. Notice if the low back has to arch to finish — that is information, not a fail.',
    recordSeconds: 10,
    startPose: 'sideStand',
    actionPose: 'sideOverhead',
    startCaption: 'Arms hanging',
    actionCaption: 'Reach overhead',
    bodyTarget: 'full',
  },
  lower_quarter_rotation: {
    briefing:
      'This maps hip rotation from a chair. Face the phone, knees and feet in frame. After the countdown, keep the chest still and swing one foot out, then in. Repeat the other leg. Stop at the first hip pinch.',
    recordSeconds: 12,
    startPose: 'frontSeated',
    actionPose: 'frontSeatedTurn',
    startCaption: 'Sit tall',
    actionCaption: 'Foot swings in and out',
    bodyTarget: 'torso',
  },
  seated_trunk_rotation: {
    briefing:
      'This maps seated chest turn. Face the phone, feet on the floor. After the countdown, keep the sit-bones quiet and turn the chest left, then right. Exhale as you turn.',
    recordSeconds: 10,
    startPose: 'frontSeated',
    actionPose: 'frontSeatedTurn',
    startCaption: 'Sit-bones quiet',
    actionCaption: 'Chest turns',
    bodyTarget: 'torso',
  },
  cervical_rotation: {
    briefing:
      'This maps a comfortable head turn. Face the phone. After the countdown, look over one shoulder, then the other. Chest stays. No hands on the chin. If the room swims, stop.',
    recordSeconds: 8,
    startPose: 'frontStand',
    actionPose: 'frontNeck',
    startCaption: 'Eyes to the camera',
    actionCaption: 'Look over a shoulder',
    bodyTarget: 'upper',
  },
  bridge_leg_extension: {
    briefing:
      'This maps a quiet bridge. Phone side-on, lying on your back, knees bent. After the countdown, lift the hips, then straighten one knee and the other without chasing height. Rest if the hamstrings cramp.',
    recordSeconds: 14,
    startPose: 'sideBridge',
    actionPose: 'sideBridge',
    startCaption: 'On your back',
    actionCaption: 'Bridge, then one leg',
    bodyTarget: 'floor',
  },
  forearm_rotation: {
    briefing:
      'This maps palm-up and palm-down. Face the phone, elbows at your sides. After the countdown, turn the palms fully up, then fully down. Elbows stay on the ribs.',
    recordSeconds: 8,
    startPose: 'frontForearm',
    actionPose: 'frontForearm',
    startCaption: 'Thumbs up',
    actionCaption: 'Palms up, then down',
    bodyTarget: 'hands',
  },
  wrist_hinge: {
    briefing:
      'This maps a comfortable wrist hinge. Phone side-on to a hand, elbows at your sides. After the countdown, hinge both hands up as they might at the top of a small swing, then return. No load.',
    recordSeconds: 8,
    startPose: 'sideWristExt',
    actionPose: 'sideWristExt',
    startCaption: 'Hold as if a club',
    actionCaption: 'Hinge the hands up',
    bodyTarget: 'hands',
  },
  wrist_flexion: {
    briefing:
      'This maps a comfortable wrist nod. Same setup as the hinge. After the countdown, let both hands nod forward, then return. Stop at tightness.',
    recordSeconds: 8,
    startPose: 'sideWristFlex',
    actionPose: 'sideWristFlex',
    startCaption: 'Hold as if a club',
    actionCaption: 'Nod the hands forward',
    bodyTarget: 'hands',
  },
  reach_roll_lift: {
    briefing:
      'This maps a quiet shoulder blade. Lie on your stomach, forehead on a towel. Phone behind you if someone can hold it, otherwise side-on. After the countdown, reach one arm longer, roll the thumb up, lift an inch, then switch.',
    recordSeconds: 12,
    startPose: 'proneReach',
    actionPose: 'proneLift',
    startCaption: 'Arms reaching',
    actionCaption: 'Thumb up, tiny lift',
    bodyTarget: 'floor',
  },
};

export function screenMeta(key: TpiTestKey): PhysicalScreenMeta {
  return PHYSICAL_SCREEN_META[key];
}
