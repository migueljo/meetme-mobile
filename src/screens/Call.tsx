import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, Text, Portal, Dialog} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';

import {useUserStore} from '../store';
import {SCREENS} from '../utils/constants';
import {useWebRTCCall} from '../hooks/useWebRTCCall';
import {
  EventTypes,
  disconnectSignalingConnection,
  getSignalingConnection,
  SignalingConnectionType,
} from '../libs/SignalingConnection';
import {OfferMessageData} from '../libs/WebRTCCall';

export function Call() {
  const userStore = useUserStore();
  const callee = userStore.user === 'bob' ? 'alice' : 'bob';
  const navigation = useNavigation();
  const webrtcCall = useWebRTCCall();
  const [callPopUpVisible, setCallPopUpVisible] = React.useState(false);
  const [offer, setOffer] = React.useState<OfferMessageData | null>(null);

  const handleCall = async () => {
    console.log('Call screen: handle call to:', callee);
    userStore.setCallee(callee);
    webrtcCall.startCall({authToken: userStore.user});
    navigation.navigate(SCREENS.CALL_ROOM);
  };

  const handleDismissCallPopUp = () => {
    setCallPopUpVisible(false);
  };

  const handleAcceptCall = async () => {
    console.log('Call screen: handle accept call');
    await webrtcCall.acceptCall();
    setCallPopUpVisible(false);
    // TODO: navigate to call room
  };

  const handleRejectCall = async () => {
    console.log('Call screen: handle reject call');
    await webrtcCall.rejectCall({
      from: userStore.user,
      target: offer?.name as string,
    });
    setCallPopUpVisible(false);
  };

  useEffect(() => {
    let signalingConnection: SignalingConnectionType | null = null;
    const handleSignalingConnection = async () => {
      try {
        signalingConnection = await getSignalingConnection({
          authToken: userStore.user,
        });
        console.log('Call screen: adding offer listener');
        signalingConnection.on(EventTypes.offer, (data: OfferMessageData) => {
          console.log('Call screen: received offer from:', data);
          setOffer(data);
          setCallPopUpVisible(true);
        });
      } catch (error) {
        console.error('Call screen: Error getting signaling connection', error);
      }
    };
    handleSignalingConnection();

    return () => {
      console.log('Call screen: removing offer listener');
      signalingConnection?.off(EventTypes.offer);
    };
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

      <Portal>
        <Dialog visible={callPopUpVisible} onDismiss={handleDismissCallPopUp}>
          <Dialog.Title>Incoming call</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">This is simple dialog</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleAcceptCall}>Accept</Button>
            <Button onPress={handleRejectCall}>Reject</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
