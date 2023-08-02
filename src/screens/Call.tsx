import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, Text} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';

import {useUserStore} from '../store';
import {SCREENS} from '../utils/constants';
import {useWebRTCCall} from '../hooks/useWebRTCCall';
import {
  EventTypes,
  disconnectSignalingConnection,
  getSignalingConnection,
} from '../libs/SignalingConnection';

export function Call() {
  const userStore = useUserStore();
  const callee = userStore.user === 'bob' ? 'alice' : 'bob';
  const navigation = useNavigation();
  const webrtcCall = useWebRTCCall();

  const handleCall = async () => {
    console.log('Call screen: handle call to:', callee);
    userStore.setCallee(callee);
    webrtcCall.startCall({authToken: userStore.user});
    navigation.navigate(SCREENS.CALL_ROOM);
  };

  useEffect(() => {
    const handleSignalingConnection = async () => {
      try {
        const signalingConnection = await getSignalingConnection({
          authToken: userStore.user,
        });
        console.log('Call screen: adding offer listener');
        signalingConnection.on(EventTypes.offer, data => {
          console.log('Call screen: received offer from:', data);
          // TODO: Show accept/reject dialog and implement accept/reject logic in WebRTCCall module
        });
      } catch (error) {
        console.error('Call screen: Error getting signaling connection', error);
      }
    };
    handleSignalingConnection();
  }, [userStore.user]);

  useEffect(() => {
    const handleBeforeRemove = () => {
      console.log('Call screen: beforeRemove');
      disconnectSignalingConnection();
    };
    navigation.addListener('beforeRemove', handleBeforeRemove);

    return () => {
      navigation.removeListener('beforeRemove', handleBeforeRemove);
    };
  }, [navigation]);

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
