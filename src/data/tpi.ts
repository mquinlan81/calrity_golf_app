import type { MobilityGrade, TpiTestKey } from '../types';

export type { TpiTestKey };

export interface TpiCorrective {
  name: string;
  kind: 'stretch' | 'exercise';
  duration: string;
  how: string[];
  stopIf: string;
}

export interface TpiTest {
  key: TpiTestKey;
  number: number;
  title: string;
  region: string;
  camera: 'front' | 'side' | 'behind';
  bilateral: boolean;
  setup: string[];
  perform: string[];
  passLooksLike: string;
  limitedLooksLike: string;
  restrictedLooksLike: string;
  capabilityNote: string;
  mapsTo: Array<'thoracic_spine_turn' | 'pelvic_separation' | 'hip_rotation' | 'shoulder_reach' | 'single_leg_balance'>;
  correctives: TpiCorrective[];
}

export const TPI_TESTS: TpiTest[] = [
  {
    key: 'pelvic_tilt',
    number: 1,
    title: 'Pelvic Tilt',
    region: 'Pelvis / lumbar',
    camera: 'side',
    bilateral: false,
    setup: [
      'Stand in golf posture: slight knee flex, spine long, arms hanging.',
      'Prop the phone on a chair, side-on, so we can see belt buckle and sternum.',
    ],
    perform: [
      'Without moving the chest, roll the belt buckle toward the chin (posterior tilt), then toward the floor (anterior tilt).',
      'Move slowly. Stop at the first pinch — never push into pain.',
    ],
    passLooksLike: 'Smooth tilt both ways with the chest quiet and knees still.',
    limitedLooksLike: 'One direction is short, or the chest and knees have to help.',
    restrictedLooksLike: 'Little or no independent pelvic motion, or pain.',
    capabilityNote: 'A quiet pelvis is a stable axis. We will not ask you to “clear the hip” past this range.',
    mapsTo: ['pelvic_separation'],
    correctives: [
      {
        name: 'Cat-camel',
        kind: 'exercise',
        duration: '8 slow breaths',
        how: [
          'On all fours, let the tailbone tuck and the back round. Then let the tailbone lift and the belly soften.',
          'The head follows the spine. Do not crank the neck.',
        ],
        stopIf: 'Sharp lumbar pain or dizziness.',
      },
      {
        name: 'Supine pelvic clocks',
        kind: 'exercise',
        duration: '1 minute',
        how: [
          'Lie on your back, knees bent, feet on the floor.',
          'Gently roll the pelvis toward 12 o’clock and 6 o’clock. Small, even motion.',
        ],
        stopIf: 'Pinch in the low back that does not ease when you make it smaller.',
      },
    ],
  },
  {
    key: 'pelvic_rotation',
    number: 2,
    title: 'Pelvic Rotation',
    region: 'Pelvis',
    camera: 'front',
    bilateral: true,
    setup: [
      'Stand in golf posture, arms crossed over the chest or a club across the shoulders.',
      'Phone facing you, chest-high, full pelvis in frame.',
    ],
    perform: [
      'Keep the chest pointing at the camera. Turn only the belt buckle left, then right.',
      'Watch whether the knees collapse or the chest sneaks around.',
    ],
    passLooksLike: 'Belt buckle turns both ways while the chest stays quiet.',
    limitedLooksLike: 'One side is shorter, or the chest has to rotate to finish.',
    restrictedLooksLike: 'Pelvis barely moves, or pain in a hip or the low back.',
    capabilityNote: 'Hip-to-hip in the two-club drill means *your* available pelvis, not a model’s.',
    mapsTo: ['pelvic_separation', 'hip_rotation'],
    correctives: [
      {
        name: 'Short-stop open books',
        kind: 'exercise',
        duration: '6 per side',
        how: [
          'Lie on your side, knees stacked and bent.',
          'Open the top knee like a book, then return. Keep the waist long.',
        ],
        stopIf: 'Hip pinch at the front of the socket.',
      },
      {
        name: 'Standing belt-buckle turns',
        kind: 'stretch',
        duration: '30 seconds each way',
        how: [
          'Hands on a chair. Soft knees. Turn the belt buckle toward the trail hip, then the lead hip.',
          'Stay inside the first tightness.',
        ],
        stopIf: 'Knee or SI-joint sharpness.',
      },
    ],
  },
  {
    key: 'torso_rotation',
    number: 3,
    title: 'Torso Rotation',
    region: 'Thoracic spine',
    camera: 'front',
    bilateral: true,
    setup: [
      'Stand in golf posture. Hold a club across the shoulders, or cross the arms.',
      'Phone facing you. Knees and belt buckle must stay visible.',
    ],
    perform: [
      'Pin the belt buckle toward the camera. Rotate the chest left, then right.',
      'Do not let the pelvis come along for the ride.',
    ],
    passLooksLike: 'Chest turns both ways with a quiet pelvis.',
    limitedLooksLike: 'One side is short, or the pelvis has to spin to finish.',
    restrictedLooksLike: 'Almost no independent chest turn, fusion, or pain.',
    capabilityNote: 'The clubhead can still orbit a shorter thorax. We will not prescribe “turn to parallel.”',
    mapsTo: ['thoracic_spine_turn'],
    correctives: [
      {
        name: 'Open-book thoracic rotation',
        kind: 'stretch',
        duration: '5 slow breaths each side',
        how: [
          'Side-lying, knees bent. Reach the top arm to the ceiling and let it fall open toward the floor behind you.',
          'Follow the hand with your eyes. Keep the knees stacked.',
        ],
        stopIf: 'Shoulder or rib pain, or numbness in the arm.',
      },
      {
        name: 'Seated broomstick turns',
        kind: 'exercise',
        duration: '8 each way',
        how: [
          'Sit tall on a chair. Club across the shoulders. Turn only the chest.',
          'Exhale as you turn. Stay inside a pain-free arc.',
        ],
        stopIf: 'You have a spinal fusion — keep this tiny or skip it.',
      },
    ],
  },
  {
    key: 'overhead_deep_squat',
    number: 4,
    title: 'Overhead Deep Squat',
    region: 'Hips, ankles, shoulders',
    camera: 'side',
    bilateral: false,
    setup: [
      'Feet about shoulder width, toes ahead. Arms reach overhead, biceps by the ears.',
      'Phone side-on so we can see heels, hips, and hands.',
    ],
    perform: [
      'Sit down as if to a chair, then deeper if the heels stay down and the arms stay up.',
      'Do not bounce. Come back up the same way.',
    ],
    passLooksLike: 'Heels stay down, thighs at least parallel, torso relatively tall, arms stay overhead.',
    limitedLooksLike: 'Heels lift, arms fall forward, or you cannot reach parallel.',
    restrictedLooksLike: 'Squat is shallow with several compensations, or pain.',
    capabilityNote: 'A limited squat changes stance width and how deep we ask the hips to sit. It is not a swing fault.',
    mapsTo: ['hip_rotation', 'shoulder_reach', 'single_leg_balance'],
    correctives: [
      {
        name: 'Assisted sit-to-stand',
        kind: 'exercise',
        duration: '8 slow reps',
        how: [
          'Stand in front of a chair. Sit and stand without using momentum.',
          'Keep heels heavy. Arms can reach forward for balance.',
        ],
        stopIf: 'Knee pain that increases with depth.',
      },
      {
        name: 'Ankle rocks',
        kind: 'stretch',
        duration: '30 seconds each side',
        how: [
          'Half-kneeling, hands on the front knee. Gently drive the knee over the toes without lifting the heel.',
        ],
        stopIf: 'Pinch at the front of the ankle.',
      },
    ],
  },
  {
    key: 'toe_touch',
    number: 5,
    title: 'Toe Touch',
    region: 'Hamstrings / spine',
    camera: 'side',
    bilateral: false,
    setup: [
      'Stand with feet together, knees soft then straighten them.',
      'Phone side-on, full body in frame.',
    ],
    perform: [
      'Hinge from the hips and reach toward the floor. Let the head hang.',
      'Stop at tightness, not pain. Note whether the knees bend or the back rounds early.',
    ],
    passLooksLike: 'Fingers reach the toes with a relatively even spine and quiet knees.',
    limitedLooksLike: 'You reach mid-shin, or the knees have to bend a lot.',
    restrictedLooksLike: 'You barely pass the knees, or there is sharp pain.',
    capabilityNote: 'Short hamstrings change address posture. We fit the spine we have; we do not flatten it.',
    mapsTo: ['hip_rotation', 'pelvic_separation'],
    correctives: [
      {
        name: 'Rag-doll hinge',
        kind: 'stretch',
        duration: '30–45 seconds',
        how: [
          'Soft knees. Fold forward and let the arms hang. Sway gently.',
          'Bend the knees more if the low back complains.',
        ],
        stopIf: 'Shooting pain down a leg, or dizziness when you stand up.',
      },
      {
        name: 'Supine hamstring strap',
        kind: 'stretch',
        duration: '45 seconds each leg',
        how: [
          'On your back, belt or towel around one foot. Straighten that knee toward the ceiling only as far as the other hip stays quiet.',
        ],
        stopIf: 'Sciatic zing. Bend the knee and shorten the range.',
      },
    ],
  },
  {
    key: 'ninety_ninety',
    number: 6,
    title: '90/90 Shoulder',
    region: 'Shoulder external rotation',
    camera: 'front',
    bilateral: true,
    setup: [
      'Stand or kneel. Upper arms at shoulder height, elbows bent 90° so the hands point up.',
      'Phone facing you, both elbows in frame.',
    ],
    perform: [
      'Keeping the elbows at 90°, rotate the hands back as if to show your palms to the wall behind you.',
      'Do not let the ribs flare or the elbows drop.',
    ],
    passLooksLike: 'Forearms approach vertical-back on both sides without the ribs lifting.',
    limitedLooksLike: 'One side is short, or the elbow has to drift to finish.',
    restrictedLooksLike: 'Little rotation, a pinchy front shoulder, or a replacement limit.',
    capabilityNote: 'The trail arm only needs the rotation you have. We will not chase “laid off” or “across the line.”',
    mapsTo: ['shoulder_reach'],
    correctives: [
      {
        name: 'Sleeper stretch (gentle)',
        kind: 'stretch',
        duration: '30 seconds each side',
        how: [
          'Lie on the test shoulder, elbow at 90°. Use the other hand to ease the forearm toward the floor.',
          'Very light pressure. This is a nudge, not a crank.',
        ],
        stopIf: 'Front-of-shoulder pinch or numbness.',
      },
      {
        name: 'Wall angels (short range)',
        kind: 'exercise',
        duration: '8 slow reps',
        how: [
          'Back to a wall, ribs quiet. Slide the arms in a small snow-angel. Stop before the back arches.',
        ],
        stopIf: 'Shoulder clicking with pain.',
      },
    ],
  },
  {
    key: 'single_leg_balance',
    number: 7,
    title: 'Single-Leg Balance',
    region: 'Balance / ankle / hip',
    camera: 'front',
    bilateral: true,
    setup: [
      'Stand near a wall or chair you can touch. Phone facing you, feet in frame.',
      'Shoes off if it is safe.',
    ],
    perform: [
      'Stand on one foot for up to ten seconds. Switch.',
      'If that is easy, repeat with eyes closed. Use the wall the moment you wobble.',
    ],
    passLooksLike: 'Ten seconds each side, eyes closed, without hopping.',
    limitedLooksLike: 'Eyes-open is fine; eyes-closed is not. Or one side is clearly worse.',
    restrictedLooksLike: 'Cannot hold ten seconds eyes-open without support.',
    capabilityNote: 'Balance limits change how we stand, never whether you are allowed to swing. Both feet may stay down.',
    mapsTo: ['single_leg_balance'],
    correctives: [
      {
        name: 'Supported single-leg stands',
        kind: 'exercise',
        duration: '20 seconds each side',
        how: [
          'Light finger on a chair. Stand on one foot. Take the finger away for a breath, then return it.',
          'Keep the standing knee soft.',
        ],
        stopIf: 'Ankle giving way, or vertigo.',
      },
      {
        name: 'Short-foot presses',
        kind: 'exercise',
        duration: '8 per side',
        how: [
          'Stand. Gently shorten the arch as if you could pick up a towel with the foot, without curling the toes hard.',
        ],
        stopIf: 'Cramping that does not ease when you stop.',
      },
    ],
  },
  {
    key: 'lat_length',
    number: 8,
    title: 'Lat Length',
    region: 'Lats / shoulders',
    camera: 'side',
    bilateral: true,
    setup: [
      'Stand with your back near a wall, or free-standing with arms reaching overhead.',
      'Phone side-on so we can see whether the ribs thrust.',
    ],
    perform: [
      'Reach both arms up. Then reach one arm, then the other, as if sliding up a wall.',
      'Notice if the low back arches to finish the reach.',
    ],
    passLooksLike: 'Arms reach overhead without the ribs flaring or the elbows bending a lot.',
    limitedLooksLike: 'Elbows bend, or the back arches to get the arms up.',
    restrictedLooksLike: 'Arms barely pass the ears, or there is shoulder/back pain.',
    capabilityNote: 'A shorter overhead reach means a shorter arm orbit. The clubhead can still move continuously.',
    mapsTo: ['shoulder_reach', 'thoracic_spine_turn'],
    correctives: [
      {
        name: 'Child’s pose with reach',
        kind: 'stretch',
        duration: '45 seconds',
        how: [
          'Sit back on your heels, arms reaching forward. Walk the hands slightly to the limited side.',
          'Breathe into the side of the ribs.',
        ],
        stopIf: 'Knee pain — place a pillow behind the knees.',
      },
      {
        name: 'Open-half-kneeling lat reach',
        kind: 'stretch',
        duration: '30 seconds each side',
        how: [
          'Half-kneeling. Reach the same-side arm up and slightly across. Lean away from the tight lat.',
        ],
        stopIf: 'Pinch in the shoulder joint.',
      },
    ],
  },
  {
    key: 'lower_quarter_rotation',
    number: 9,
    title: 'Lower-Quarter Rotation',
    region: 'Hips',
    camera: 'front',
    bilateral: true,
    setup: [
      'Sit tall on a chair, feet hanging or lightly on the floor.',
      'Phone facing you, knees and feet in frame.',
    ],
    perform: [
      'Keeping the chest still, swing one foot out (external rotation) and in (internal rotation). Repeat the other leg.',
      'Stop at the first hip pinch.',
    ],
    passLooksLike: 'Comfortable rotation in and out on both hips.',
    limitedLooksLike: 'One direction or one hip is clearly shorter.',
    restrictedLooksLike: 'Almost no rotation, a replaced hip’s safe arc, or pain.',
    capabilityNote: 'Replaced or stiff hips set the envelope. Hip-to-hip stays inside that arc.',
    mapsTo: ['hip_rotation'],
    correctives: [
      {
        name: 'Seated hip windshield wipers',
        kind: 'exercise',
        duration: '8 each way',
        how: [
          'Sit tall. Slowly sweep the foot in and out inside a pain-free range.',
          'Do not shove the last degrees.',
        ],
        stopIf: 'Groin pinch. That is a stop sign, not a stretch.',
      },
      {
        name: 'Figure-4 (easy)',
        kind: 'stretch',
        duration: '30 seconds each side',
        how: [
          'Sit. Ankle on the opposite knee. Sit tall. Lean forward a centimeter if that feels like a stretch, not a jam.',
        ],
        stopIf: 'Hip replacement on that side — skip unless your clinician has cleared this shape.',
      },
    ],
  },
  {
    key: 'seated_trunk_rotation',
    number: 10,
    title: 'Seated Trunk Rotation',
    region: 'Thorax',
    camera: 'front',
    bilateral: true,
    setup: [
      'Sit tall, feet on the floor, a club across the shoulders or arms crossed.',
      'Phone facing you.',
    ],
    perform: [
      'Without letting the pelvis slide on the chair, turn the chest left and right.',
      'Exhale as you turn.',
    ],
    passLooksLike: 'Even turn both ways with the sit-bones quiet.',
    limitedLooksLike: 'One side is shorter, or you have to lift a hip to finish.',
    restrictedLooksLike: 'Almost no turn, fusion, or pain.',
    capabilityNote: 'Seated turn is the thorax’s true budget. We fit the swing to this, not the other way around.',
    mapsTo: ['thoracic_spine_turn'],
    correctives: [
      {
        name: 'Chair-assisted turns',
        kind: 'exercise',
        duration: '6 each way',
        how: [
          'Sit tall. Hold the chair back and turn the chest toward that hand. Breathe out.',
          'Keep this smaller than sport rotation.',
        ],
        stopIf: 'Spinal fusion — keep it tiny or skip.',
      },
    ],
  },
  {
    key: 'cervical_rotation',
    number: 11,
    title: 'Cervical Rotation',
    region: 'Neck',
    camera: 'front',
    bilateral: true,
    setup: [
      'Sit or stand tall. Phone facing you, head and shoulders in frame.',
    ],
    perform: [
      'Turn the head to look over one shoulder, then the other. Keep the chest still.',
      'Do not crank with your hand.',
    ],
    passLooksLike: 'Nose approaches the shoulder line on both sides.',
    limitedLooksLike: 'One side is shorter, or the torso has to turn.',
    restrictedLooksLike: 'A small turn, dizziness, or pain.',
    capabilityNote: 'Eye dominance and neck range together decide how we aim. We will not demand a second line.',
    mapsTo: ['thoracic_spine_turn'],
    correctives: [
      {
        name: 'Nose-circle glances',
        kind: 'exercise',
        duration: '5 each way',
        how: [
          'Sit tall. Turn the nose toward one shoulder only as far as the room stays clear.',
          'Return to center. No hands.',
        ],
        stopIf: 'Dizziness, visual change, or arm tingling — stop and sit still.',
      },
    ],
  },
  {
    key: 'bridge_leg_extension',
    number: 12,
    title: 'Bridge with Leg Extension',
    region: 'Glutes / pelvis',
    camera: 'side',
    bilateral: true,
    setup: [
      'Lie on your back, knees bent, feet on the floor. Phone side-on.',
    ],
    perform: [
      'Lift the hips into a quiet bridge. Then straighten one knee without letting the pelvis drop or twist.',
      'Switch legs. Rest whenever the hamstrings cramp.',
    ],
    passLooksLike: 'Pelvis stays level while each leg extends.',
    limitedLooksLike: 'Hips drop or twist when a leg leaves, or cramping ends the test.',
    restrictedLooksLike: 'Cannot hold a bridge, or pain in the back or a hip.',
    capabilityNote: 'A weaker bridge means we keep both feet on the ground in motion drills. That is a fit, not a fail.',
    mapsTo: ['pelvic_separation', 'single_leg_balance'],
    correctives: [
      {
        name: 'Short-range glute bridge',
        kind: 'exercise',
        duration: '8 slow reps',
        how: [
          'Both feet down. Lift only until the ribs stay heavy. Pause, lower.',
          'Do not chase height.',
        ],
        stopIf: 'Low-back pinching — lower the lift.',
      },
      {
        name: 'Heel-press isometric',
        kind: 'exercise',
        duration: '5 breaths',
        how: [
          'On your back, knees bent. Press the heels, think of dragging them toward you, without actually moving.',
        ],
        stopIf: 'Cramp. Shake it out and do fewer breaths.',
      },
    ],
  },
  {
    key: 'forearm_rotation',
    number: 13,
    title: 'Forearm Rotation',
    region: 'Forearms',
    camera: 'front',
    bilateral: true,
    setup: [
      'Elbows at your sides, bent 90°, thumbs up. Phone facing you, hands in frame.',
    ],
    perform: [
      'Turn the palms fully up, then fully down, without the elbows leaving the ribs.',
    ],
    passLooksLike: 'Palms face the ceiling and the floor on both sides.',
    limitedLooksLike: 'One direction or one arm is short.',
    restrictedLooksLike: 'Little rotation, or elbow/wrist pain.',
    capabilityNote: 'Grip and face control live inside this range. We change hold pressure, not force a roll.',
    mapsTo: ['shoulder_reach'],
    correctives: [
      {
        name: 'Supported palm turns',
        kind: 'exercise',
        duration: '10 slow turns',
        how: [
          'Elbow on a table, thumb up. Rotate palm up and down inside comfort.',
        ],
        stopIf: 'Numbness in the fingers.',
      },
    ],
  },
  {
    key: 'wrist_hinge',
    number: 14,
    title: 'Wrist Hinge (Extension)',
    region: 'Wrists',
    camera: 'side',
    bilateral: true,
    setup: [
      'Elbows at your sides, as if holding a club. Phone side-on to the lead wrist.',
    ],
    perform: [
      'Hinge the hands up (extension) as you would at the top of a small swing, then return.',
      'Do both wrists.',
    ],
    passLooksLike: 'A comfortable hinge without the elbows having to lift.',
    limitedLooksLike: 'Hinge is short, or it comes from the elbow.',
    restrictedLooksLike: 'Pain, a fused wrist, or almost no hinge.',
    capabilityNote: 'The clubhead can still swing with a shorter hinge. We will not chase “full set.”',
    mapsTo: ['shoulder_reach'],
    correctives: [
      {
        name: 'Prayer stretch (easy)',
        kind: 'stretch',
        duration: '20 seconds',
        how: [
          'Palms together at the chest. Lower the hands a little, keeping the palms touching.',
        ],
        stopIf: 'Wrist joint pain, not just a forearm stretch.',
      },
    ],
  },
  {
    key: 'wrist_flexion',
    number: 15,
    title: 'Wrist Flexion',
    region: 'Wrists',
    camera: 'side',
    bilateral: true,
    setup: [
      'Same as the hinge test. Phone side-on.',
    ],
    perform: [
      'Let the hands nod forward (flexion) as they might through the ball, then return.',
    ],
    passLooksLike: 'Comfortable nod on both wrists.',
    limitedLooksLike: 'One wrist is shorter or the elbow takes over.',
    restrictedLooksLike: 'Pain or almost no flexion.',
    capabilityNote: 'Release is a result of clubhead momentum, not a forced wrist position.',
    mapsTo: ['shoulder_reach'],
    correctives: [
      {
        name: 'Gentle wrist nods',
        kind: 'exercise',
        duration: '10 slow nods',
        how: [
          'Forearm on a table, hand over the edge. Nod the hand down and up without load.',
        ],
        stopIf: 'Sharp wrist pain.',
      },
    ],
  },
  {
    key: 'reach_roll_lift',
    number: 16,
    title: 'Reach, Roll and Lift',
    region: 'Shoulder blade / thorax',
    camera: 'behind',
    bilateral: true,
    setup: [
      'Lie on your stomach, arms reaching forward, forehead on a towel.',
      'Phone behind and above if a partner can hold it; otherwise side-on is fine.',
    ],
    perform: [
      'Reach one arm a little longer, roll the thumb up, then lift the arm an inch off the floor.',
      'Lower. Switch arms. Keep the neck quiet.',
    ],
    passLooksLike: 'The arm lifts a little without shrugging the ear or rotating the whole chest.',
    limitedLooksLike: 'Shrug, bend, or almost no lift on one side.',
    restrictedLooksLike: 'Cannot lift, or shoulder/neck pain.',
    capabilityNote: 'A quieter shoulder blade still lets the clubhead orbit. We will not demand a posed “wide takeaway.”',
    mapsTo: ['shoulder_reach', 'thoracic_spine_turn'],
    correctives: [
      {
        name: 'Prone thumb-up slides',
        kind: 'exercise',
        duration: '6 per side',
        how: [
          'On your stomach. Slide one arm forward, thumb up, lift only as high as the neck stays long.',
        ],
        stopIf: 'Shoulder-blade cramp or neck strain.',
      },
    ],
  },
];

export function tpiTestByKey(key: TpiTestKey): TpiTest {
  const test = TPI_TESTS.find((item) => item.key === key);
  if (!test) throw new Error(`Unknown TPI test: ${key}`);
  return test;
}
