import React, { useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

const GhostTextInput = ({ 
  value, 
  onChangeText, 
  suggestions, 
  style, 
  placeholder,
  ...props 
}) => {
  const [ghostText, setGhostText] = useState('');

  const findMatch = (text) => {
    if (!text) {
      setGhostText('');
      return;
    }

    const match = suggestions.find(suggestion => 
      suggestion.name.toLowerCase().startsWith(text.toLowerCase())
    );

    if (match) {
      setGhostText(match.name);
    } else {
      setGhostText('');
    }
  };

  const handleChangeText = (text) => {
    onChangeText(text);
    findMatch(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        {...props}
      />
      <Text style={[
        styles.ghostText,
        {
          left: value.length * 8,
        }
      ]}>
        {ghostText.slice(value.length)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    padding: 8,
  },
  ghostText: {
    position: 'absolute',
    color: '#999',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

export default GhostTextInput;