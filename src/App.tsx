import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider} from 'react-native-paper';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ChooseUser} from './screens/ChooseUser';
import {Call} from './screens/Call';
import {SCREENS} from './constants';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <NavigationContainer>
      <SafeAreaProvider>
        <PaperProvider>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={backgroundStyle.backgroundColor}
          />
          <Stack.Navigator initialRouteName={SCREENS.CHOOSE_USER}>
            <Stack.Screen name={SCREENS.CHOOSE_USER} component={ChooseUser} />
            <Stack.Screen name={SCREENS.CALL} component={Call} />
          </Stack.Navigator>
        </PaperProvider>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}

export default App;
