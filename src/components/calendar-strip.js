import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, FlatList, Dimensions } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';

const { width } = Dimensions.get('window');
const DAY_WIDTH = width / 7;

const WeeklyCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(moment());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const flatListRef = useRef(null);

  const generateWeekDays = (date) => {
    const start = moment(date).startOf('week');
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(moment(start).add(i, 'days'));
    }
    return days;
  };

  const handleWeekChange = (direction) => {
    const newDate = moment(selectedDate).add(direction, 'weeks');
    setSelectedDate(newDate);
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date) => {
    setSelectedDate(moment(date));
    hideDatePicker();
  };

  const renderDay = ({ item }) => {
    const isSelected = item.isSame(selectedDate, 'day');
    
    return (
      <TouchableOpacity
        style={[styles.dayContainer, isSelected && styles.selectedDayContainer]}
        onPress={() => setSelectedDate(moment(item))}
      >
        <Text style={[styles.dayName, isSelected && styles.selectedText]}>
          {item.format('ddd')}
        </Text>
        <Text style={[styles.dayNumber, isSelected && styles.selectedText]}>
          {item.format('D')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.parentContainer}>
      <View style={styles.topSpace} />
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={showDatePicker}
          style={styles.jumpButton}
        >
          <Text style={styles.jumpButtonText}>Jump to Date</Text>
        </TouchableOpacity>

        <View style={styles.customHeader}>
          <Text style={styles.headerText}>
            {selectedDate.format('MMMM YYYY')}
          </Text>
        </View>

        <View style={styles.calendarContainer}>
          <TouchableOpacity 
            style={styles.arrowButton} 
            onPress={() => handleWeekChange(-1)}
          >
            <Text style={styles.arrowText}>{'<'}</Text>
          </TouchableOpacity>

          <FlatList
            ref={flatListRef}
            data={generateWeekDays(selectedDate)}
            renderItem={renderDay}
            keyExtractor={(item) => item.format('YYYY-MM-DD')}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            pagingEnabled={true}
            onMomentumScrollEnd={(event) => {
              const contentOffset = event.nativeEvent.contentOffset.x;
              if (contentOffset > 0) {
                handleWeekChange(1);
              } else if (contentOffset < 0) {
                handleWeekChange(-1);
              }
              flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            }}
            contentContainerStyle={styles.weekContainer}
          />

          <TouchableOpacity 
            style={styles.arrowButton} 
            onPress={() => handleWeekChange(1)}
          >
            <Text style={styles.arrowText}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
          date={selectedDate.toDate()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  parentContainer: {
    flex: 1,
  },
  topSpace: {
    flex: 0.3,
  },
  container: {
    backgroundColor: 'white',
    paddingTop: 8,
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarContainer: {
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  jumpButton: {
    backgroundColor: '#3498db',
    padding: 6,
    borderRadius: 6,
    marginHorizontal: 16,
    marginBottom: 4,
    alignItems: 'center'
  },
  jumpButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  customHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  dayContainer: {
    width: DAY_WIDTH,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  selectedDayContainer: {
    backgroundColor: '#2ecc71',
    borderRadius: 6,
  },
  dayName: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  selectedText: {
    color: 'white',
    fontWeight: '500',
  },
  arrowButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 16,
    color: '#3498db',
  },
});

export default WeeklyCalendar;