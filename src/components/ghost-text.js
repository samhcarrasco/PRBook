import React, { useState } from 'react';
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
  
    const trimmedInput = text.trim();
    const lowerInput = trimmedInput.toLowerCase();

    const exactMatch = suggestions.find(
      (suggestion) => suggestion.name.toLowerCase() === lowerInput
    );
  
    if (exactMatch) {
      setGhostText('*');
      return;
    }
  
    const match = suggestions.find((suggestion) =>
      suggestion.name.toLowerCase().startsWith(lowerInput)
    );
  
    if (match) {
      const remaining = match.name.slice(trimmedInput.length);
      setGhostText(`${remaining}*`);
    } else {
      setGhostText('');
    }
  };

  const handleChangeText = (text) => {
    onChangeText(text);
    findMatch(text);
  };


  const displayText = ghostText ? `${value}${ghostText}` : '';

  return (
    <View style={styles.container}>

      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        {...props}
      />
      

      <View style={[styles.textOverlay, style, { pointerEvents: 'none' }]}>

        <Text style={styles.inputText}>{value}</Text>
        {ghostText && (
          <Text style={styles.ghostText}>{ghostText}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: 'transparent',
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  inputText: {
    fontSize: 16,
    color: '#000',
  },
  ghostText: {
    fontSize: 16,
    color: '#999',
  },
});

export default GhostTextInput;