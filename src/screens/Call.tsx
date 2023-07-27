import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, Text} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';

import {useUserStore} from '../store';
import {SCREENS} from '../utils/constants';

export function Call() {
  const userStore = useUserStore();
  const callee = userStore.user === 'bob' ? 'Alice' : 'Bob';
  const navigation = useNavigation();

  const handleCall = () => {
    console.log('Calling', callee);
    navigation.navigate(SCREENS.CALL_ROOM);
  };

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.callText}>
          Call {callee}?
        </Text>
        <Button icon="phone" mode="contained" onPress={handleCall}>
          Call
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  callText: {
    textAlign: 'center',
    marginBottom: 16,
  },
});
