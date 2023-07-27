import React from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, Appbar} from 'react-native-paper';

export function Call() {
  return (
    <SafeAreaView>
      <View>
        <Appbar.Header>
          <Appbar.Content title="Call" />
          <Appbar.Action icon="dots-vertical" onPress={() => {}} />
        </Appbar.Header>
        <Button
          icon="camera"
          mode="contained"
          onPress={() => console.log('Pressedd')}>
          Press me
        </Button>
      </View>
    </SafeAreaView>
  );
}
