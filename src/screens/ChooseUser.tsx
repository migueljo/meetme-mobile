import React from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, RadioButton} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';

import {useUserStore, User} from '../store';
import {SCREENS} from '../utils/constants';
import useSignalingConnection from '../hooks/useSignalingConnection';

export function ChooseUser() {
  const userStore = useUserStore();
  const navigation = useNavigation();
  const signalingConnection = useSignalingConnection();

  const handleNext = async () => {
    try {
      await signalingConnection.start({authToken: userStore.user});
      navigation.navigate(SCREENS.CALL);
    } catch (error) {
      console.error("ChooseUser: Couldn't start signaling connection", error);
    }
  };

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
