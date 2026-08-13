import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Body, Button, Field, Kicker, Screen, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';

export default function AccountScreen() {
  const router = useRouter();
  const { draft, setDraft, signIn, signUp } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'skip' | 'in' | 'up'>('skip');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      if (mode === 'up') await signUp(email.trim(), password, draft.displayName);
      if (mode === 'in') await signIn(email.trim(), password);
      router.push('/biometrics');
    } catch (error) {
      Alert.alert('Account', error instanceof Error ? error.message : 'Could not authenticate.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Kicker>Step 1 of 6</Kicker>
      <Title>Who is swinging?</Title>
      <Body muted>
        An account syncs mobility screens and swing sessions to Supabase. You can also continue on this device and
        attach an account later.
      </Body>
      <Field
        label="Name"
        value={draft.displayName}
        onChangeText={(displayName) => setDraft({ displayName })}
        placeholder="What should we call you?"
      />
      {mode !== 'skip' ? (
        <>
          <Field
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <Button
            label={busy ? 'Working…' : mode === 'up' ? 'Create account' : 'Sign in'}
            onPress={submit}
            disabled={busy}
          />
        </>
      ) : (
        <Button label="Continue on this device" onPress={() => router.push('/biometrics')} />
      )}
      <Button
        variant="secondary"
        label={mode === 'up' ? 'I already have an account' : 'Create an account'}
        onPress={() => setMode(mode === 'up' ? 'in' : 'up')}
      />
      {mode !== 'skip' ? (
        <Button variant="ghost" label="Skip for now" onPress={() => setMode('skip')} />
      ) : null}
    </Screen>
  );
}
