import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, Text} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';

import {useUserStore} from '../store';
import {SCREENS} from '../utils/constants';
import useSignalingConnection from '../hooks/useSignalingConnection';

export function Call() {
  const userStore = useUserStore();
  const callee = userStore.user === 'bob' ? 'alice' : 'bob';
  const navigation = useNavigation();
  const signalingConnection = useSignalingConnection();

  const handleCall = () => {
    console.log('Calling', callee);
    userStore.setCallee(callee);
    navigation.navigate(SCREENS.CALL_ROOM);
  };

  useEffect(() => {
    const handleBeforeRemove = () => {
      console.log('Call screen beforeRemove');
      signalingConnection.stop();
    };
    navigation.addListener('beforeRemove', handleBeforeRemove);
    return () => {
      navigation.removeListener('beforeRemove', handleBeforeRemove);
    };
  }, [navigation, signalingConnection]);

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
