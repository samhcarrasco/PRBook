import { View } from 'react-native';
import WeeklyCalendar from './src/components/calendar-strip';

export default function App() {
  return (
    <View style={{ flex: 1, paddingTop: 50 }}>
      <WeeklyCalendar />
    </View>
  );
}