export type MeasurementSystem = 'metric' | 'imperial';

/** US, Liberia, and Myanmar are the customary-unit countries. Everyone else defaults to metric. */
const IMPERIAL_COUNTRIES = new Set(['US', 'LR', 'MM']);

export function systemFromCountry(isoCountryCode: string | null | undefined): MeasurementSystem {
  if (!isoCountryCode) return 'metric';
  return IMPERIAL_COUNTRIES.has(isoCountryCode.trim().toUpperCase()) ? 'imperial' : 'metric';
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  if (!Number.isFinite(cm) || cm <= 0) return { feet: 0, inches: 0 };
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  if (inches === 12) return { feet: feet + 1, inches: 0 };
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = Math.max(0, feet) * 12 + Math.max(0, inches);
  return Math.round(totalInches * 2.54);
}

export function formatHeight(cm: number | null | undefined, system: MeasurementSystem): string {
  if (!cm) return '—';
  if (system === 'metric') return `${Math.round(cm)} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}"`;
}

/** Canonical putting distance is stored in feet. */
export function formatPuttDistance(feet: number | null | undefined, system: MeasurementSystem): string {
  if (feet === null || feet === undefined) return '—';
  if (system === 'imperial') return `${round1(feet)} ft`;
  return `${round1(feet * 0.3048)} m`;
}

export function parsePuttInput(raw: string, system: MeasurementSystem): number | null {
  const value = Number(raw);
  if (!raw.trim() || !Number.isFinite(value) || value < 0) return null;
  if (system === 'imperial') return round1(value);
  return round1(value / 0.3048);
}

export function displayPuttInput(feet: number | null, system: MeasurementSystem): string {
  if (feet === null) return '';
  if (system === 'imperial') return String(round1(feet));
  return String(round1(feet * 0.3048));
}

export function heightFieldLabel(system: MeasurementSystem): string {
  return system === 'metric' ? 'Height (cm)' : 'Height';
}

export function puttFieldLabel(system: MeasurementSystem): string {
  return system === 'metric' ? '1st putt (m)' : '1st putt (ft)';
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
