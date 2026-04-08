import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useAppTheme } from '../context/themecontext';

const GhostTextInput = ({
  value,
  onChangeText,
  onFocus,
  suggestions,
  style,
  placeholder,
  ...props
}) => {
  const [ghostText, setGhostText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useAppTheme();
  const c = theme.custom.colors;

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

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: c.inputBg,
            color: c.textPrimary,
            borderColor: c.border,
          },
          style,
        ]}
        value={value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textTertiary}
        onFocus={(e) => {
          setIsFocused(true);
          if (onFocus) onFocus(e);
        }}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {(value || ghostText || !isFocused) && (
        <View style={[
          styles.textOverlay,
          { backgroundColor: c.inputBg },
          style,
          { pointerEvents: 'none' },
        ]}>
          {!value && !ghostText && placeholder ? (
            <Text style={[styles.ghostText, { color: c.textTertiary }]}>{placeholder}</Text>
          ) : (
            <>
              <Text style={[styles.inputText, { color: c.textPrimary }]}>{value}</Text>
              {ghostText && (
                <Text style={[styles.ghostText, { color: c.textTertiary }]}>{ghostText}</Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  inputText: {
    fontSize: 16,
  },
  ghostText: {
    fontSize: 16,
  },
});

export default GhostTextInput;
