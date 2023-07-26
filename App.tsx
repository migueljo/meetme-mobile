import React from 'react';
import {StatusBar, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {PaperProvider, Button} from 'react-native-paper';

import {Colors} from 'react-native/Libraries/NewAppScreen';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <SafeAreaView>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundStyle.backgroundColor}
          />
          <View>
            <Text style={styles.text}>Testing</Text>
            <Button
              icon="camera"
              mode="contained"
              onPress={() => console.log('Pressed')}>
              Press me
            </Button>
          </View>
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  text: {
    color: 'white',
  },
});

export default App;
