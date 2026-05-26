import React from 'react';
import { NativeModules, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

const { FartSoundModule } = NativeModules;

const FartButton = () => {
  const handlePress = () => {
    if (FartSoundModule?.playFart) {
      FartSoundModule.playFart();
    }
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={handlePress} icon="emoticon-poop">
        💨 Fart
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});

export default FartButton;
