import { router } from 'expo-router';
import { Body, Display, GameButton, Screen } from '@/components/ui';

export default function NotFound() {
  return (
    <Screen footer={<GameButton label="BACK TO THE LINEUP" onPress={() => router.replace('/home')} />}>
      <Display size={64}>WRONG STAGE</Display>
      <Body>That page doesn't exist. Let's get you back to the show.</Body>
    </Screen>
  );
}
