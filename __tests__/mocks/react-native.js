const React = require('react');

const createComponent = (name) => {
  const Comp = ({ children, ...props }) => React.createElement(name, props, children);
  Comp.displayName = name;
  return Comp;
};

module.exports = {
  View: createComponent('View'),
  Text: createComponent('Text'),
  TouchableOpacity: createComponent('TouchableOpacity'),
  ActivityIndicator: createComponent('ActivityIndicator'),
  ScrollView: createComponent('ScrollView'),
  TextInput: createComponent('TextInput'),
  FlatList: createComponent('FlatList'),
  KeyboardAvoidingView: createComponent('KeyboardAvoidingView'),
  StyleSheet: { create: (styles) => styles },
  Platform: { OS: 'ios' },
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
};
