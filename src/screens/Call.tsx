import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, Text} from 'react-native-paper';
import {useUserStore} from '../store';

export function Call() {
  const userStore = useUserStore();
  const callee = userStore.user === 'bob' ? 'Alice' : 'Bob';
  const handleCall = () => {
    console.log('Calling', callee);
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
