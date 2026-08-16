import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { colors, fonts } from '../theme';

export function BoundingBoxOverlay({ camera }: { camera: 'dtl' | 'fo' }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 160" preserveAspectRatio="none">
        {camera === 'dtl' ? (
          <>
            <Rect x="28" y="18" width="44" height="124" rx="4" fill="none" stroke={colors.gold} strokeWidth="1.2" />
            <Line x1="50" y1="18" x2="50" y2="142" stroke={colors.gold} strokeDasharray="3 3" strokeWidth="0.8" />
            <Line x1="22" y1="118" x2="78" y2="118" stroke={colors.gold} strokeWidth="0.8" />
          </>
        ) : (
          <>
            <Rect x="18" y="22" width="64" height="116" rx="4" fill="none" stroke={colors.gold} strokeWidth="1.2" />
            <Circle cx="50" cy="40" r="10" fill="none" stroke={colors.gold} strokeWidth="1" />
            <Line x1="18" y1="128" x2="82" y2="128" stroke={colors.gold} strokeWidth="0.8" />
          </>
        )}
      </Svg>
      <View style={styles.caption}>
        <Text style={styles.captionText}>
          {camera === 'dtl'
            ? 'Frame the player inside the box. Shaft points at the camera at address.'
            : 'Feet on the line. Head in the circle. Whole swing stays in frame.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30,42,35,0.78)',
    padding: 10,
    borderRadius: 10,
  },
  captionText: {
    color: colors.cream,
    fontFamily: fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
});
