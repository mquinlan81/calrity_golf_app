import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Body, Button, Card, Chip, Kicker, ProgressDots, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { systemFromCountry, type MeasurementSystem } from '../../src/services/units';

export default function UnitsScreen() {
  const router = useRouter();
  const { draft, setDraft } = useApp();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    draft.locationConsent && draft.locationCountry
      ? `Detected ${draft.locationCountry}`
      : '',
  );

  const detect = async () => {
    try {
      setBusy(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setStatus('Location was declined. Choose Metric or Imperial below — we will not ask again unless you tap Detect.');
        setDraft({ locationConsent: false });
        return;
      }
      setDraft({ locationConsent: true });
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });
      const places = await Location.reverseGeocodeAsync(position.coords);
      const country = places[0]?.isoCountryCode ?? null;
      const system = systemFromCountry(country);
      setDraft({ locationCountry: country, measurementSystem: system, locationConsent: true });
      setStatus(
        country
          ? `${country} · ${system === 'imperial' ? 'Imperial (ft, in)' : 'Metric (cm, m)'}`
          : `Could not read country. ${system === 'metric' ? 'Metric' : 'Imperial'} is selected.`,
      );
    } catch (error) {
      Alert.alert('Location', error instanceof Error ? error.message : 'Could not read location.');
      setStatus('Detect failed. Pick a system manually.');
    } finally {
      setBusy(false);
    }
  };

  const choose = (system: MeasurementSystem) => {
    setDraft({ measurementSystem: system });
  };

  return (
    <Screen>
      <ProgressDots step={0} total={7} />
      <Kicker>How we measure</Kicker>
      <Title>Units from your location</Title>
      <Body>
        Clarity uses your location once to choose Metric or Imperial — height, putting distance, and later yardage. We
        do not track you on the course, we do not store a live GPS trail, and we do not sell location data.
      </Body>
      <Card>
        <Body muted>
          If you allow location, we read an approximate country code (for example US → feet and inches; most other
          countries → centimetres and metres). You can override the choice any time.
        </Body>
      </Card>
      <Button
        label={busy ? 'Detecting…' : 'Allow location and set units'}
        onPress={() => void detect()}
        disabled={busy}
      />
      {status ? <Body muted>{status}</Body> : null}
      <Body>Or choose now</Body>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip
          label="Metric (cm, m)"
          selected={draft.measurementSystem === 'metric'}
          onPress={() => choose('metric')}
        />
        <Chip
          label="Imperial (ft, in)"
          selected={draft.measurementSystem === 'imperial'}
          onPress={() => choose('imperial')}
        />
      </View>
      <Button label="Continue" onPress={() => router.push('/account')} />
    </Screen>
  );
}
