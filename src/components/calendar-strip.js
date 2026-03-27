import { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Surface, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import { useAppTheme } from '../context/themecontext';
import DataManagementModal from './data-management-modal';

const WeeklyCalendar = ({ onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [dataModalVisible, setDataModalVisible] = useState(false);
  const { theme, isDark, toggleTheme } = useAppTheme();
  const c = theme.custom.colors;

  const generateWeekDays = (date) => {
    const start = moment(date).startOf('week');
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(moment(start).add(i, 'days'));
    }
    return days;
  };

  const handleDateSelection = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date.toDate());
    }
  };

  const handleWeekChange = (direction) => {
    const newDate = moment(selectedDate).add(direction, 'weeks');
    handleDateSelection(newDate);
  };

  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);

  const handleConfirm = (date) => {
    handleDateSelection(moment(date));
    hideDatePicker();
  };

  const isToday = (date) => date.isSame(moment(), 'day');

  const renderDay = (item) => {
    const isSelected = item.isSame(selectedDate, 'day');
    const today = isToday(item);

    return (
      <TouchableOpacity
        key={item.format('YYYY-MM-DD')}
        style={styles.dayWrapper}
        onPress={() => handleDateSelection(moment(item))}
        activeOpacity={0.7}
      >
        <View style={[
          styles.dayContainer,
          isSelected && { backgroundColor: c.primary, borderRadius: 12 },
        ]}>
          <Text style={[
            styles.dayName,
            { color: isSelected ? '#FFFFFF' : c.textTertiary },
          ]}>
            {item.format('dd')}
          </Text>
          <Text style={[
            styles.dayNumber,
            { color: isSelected ? '#FFFFFF' : c.textPrimary },
            isSelected && { fontWeight: '700' },
          ]}>
            {item.format('D')}
          </Text>
          {today && !isSelected && (
            <View style={[styles.todayDot, { backgroundColor: c.primary }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Surface style={[styles.container, { backgroundColor: c.surface }]} elevation={2}>
      <View style={styles.topRow}>
        <Button
          mode="contained-tonal"
          onPress={showDatePicker}
          compact
          labelStyle={styles.jumpLabel}
          style={styles.jumpButton}
          icon="calendar-search"
        >
          Jump to Date
        </Button>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton
            icon="cog-outline"
            size={20}
            onPress={() => setDataModalVisible(true)}
            iconColor={c.textSecondary}
          />
          <IconButton
            icon={isDark ? 'weather-sunny' : 'weather-night'}
            size={20}
            onPress={toggleTheme}
            iconColor={c.textSecondary}
          />
        </View>
      </View>

      <Text style={[styles.headerText, { color: c.textPrimary }]}>
        {selectedDate.format('MMMM YYYY')}
      </Text>

      <View style={styles.calendarContainer}>
        <TouchableOpacity onPress={() => handleWeekChange(-1)} style={styles.arrowButton}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={c.primary} />
        </TouchableOpacity>

        <View style={styles.weekContainer}>
          {generateWeekDays(selectedDate).map(day => renderDay(day))}
        </View>

        <TouchableOpacity onPress={() => handleWeekChange(1)} style={styles.arrowButton}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={c.primary} />
        </TouchableOpacity>
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={selectedDate.toDate()}
      />

      <DataManagementModal
        visible={dataModalVisible}
        onDismiss={() => setDataModalVisible(false)}
      />
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  jumpButton: {
    borderRadius: 8,
  },
  jumpLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  calendarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  weekContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  dayWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    paddingVertical: 8,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '500',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  arrowButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WeeklyCalendar;
