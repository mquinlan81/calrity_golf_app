import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '../theme';

export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.scroll, style]}>{children}</View>
  );

  return (
    <LinearGradient colors={[colors.cream, '#EFE8DA']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>{body}</SafeAreaView>
    </LinearGradient>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && { color: colors.muted }]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        pressed && { opacity: 0.86 },
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text
        style={[
          styles.btnLabel,
          variant !== 'primary' && { color: colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...input
}: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mist}
        style={styles.input}
        {...input}
      />
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && { color: colors.paper }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.dot, index <= step && styles.dotOn, index === step && styles.dotNow]}
        />
      ))}
    </View>
  );
}

export function GoldRule() {
  return <View style={styles.rule} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 48, gap: spacing.md },
  kicker: {
    fontFamily: fonts.bodyMedium,
    color: colors.gold,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 38,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.fog,
  },
  btn: {
    borderRadius: radii.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: colors.clay },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.ink,
  },
  btnGhost: { backgroundColor: 'transparent' },
  btnLabel: {
    fontFamily: fonts.bodyMedium,
    color: colors.paper,
    fontSize: 16,
  },
  fieldLabel: {
    fontFamily: fonts.bodyMedium,
    color: colors.muted,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.fog,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.mist,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: colors.fairway,
    borderColor: colors.fairway,
  },
  chipText: {
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fog,
  },
  dotOn: { backgroundColor: colors.gold },
  dotNow: { width: 22 },
  rule: {
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.55,
    marginVertical: 4,
  },
});
