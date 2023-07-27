import React from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button, RadioButton} from 'react-native-paper';

type Users = 'bob' | 'alice';

export function ChooseUser() {
  const [user, setUser] = React.useState<Users>('bob');
  const handleNext = () => {
    console.log('Next!!');
  };
  console.log('User is:', user);

  return (
    <SafeAreaView>
      <View>
        <View>
          <RadioButton.Group
            onValueChange={newValue => setUser(newValue as Users)}
            value={user}>
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
