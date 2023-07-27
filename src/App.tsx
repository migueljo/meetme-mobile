import './utils/global.types';
import './utils/webrtc-setup';

import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PaperProvider} from 'react-native-paper';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ChooseUser} from './screens/ChooseUser';
import {Call} from './screens/Call';
import {SCREENS} from './utils/constants';
import {CallRoom} from './screens/CallRoom';

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
            <Stack.Screen
              name={SCREENS.CHOOSE_USER}
              component={ChooseUser}
              options={{title: 'Choose User'}}
            />
            <Stack.Screen
              name={SCREENS.CALL}
              component={Call}
              options={{title: 'Call'}}
            />
            <Stack.Screen
              name={SCREENS.CALL_ROOM}
              component={CallRoom}
              options={{title: 'Call Room'}}
            />
          </Stack.Navigator>
        </PaperProvider>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}

export default App;
