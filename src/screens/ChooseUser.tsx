import React from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, RadioButton} from 'react-native-paper';

import {useUserStore, User} from '../store';

export function ChooseUser() {
  const userStore = useUserStore();
  const handleNext = () => {
    console.log('Next!!');
  };
  console.log('User is:', userStore.user);

  return (
    <SafeAreaView>
      <View>
        <View>
          <RadioButton.Group
            onValueChange={newValue => userStore.setUser(newValue as User)}
            value={userStore.user}>
            <RadioButton.Item label="Bob" value="bob" />
            <RadioButton.Item label="Alice" value="alice" />
          </RadioButton.Group>
          <Button onPress={handleNext} mode="elevated">
            Next
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
