import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import moment from 'moment';

const WeeklyCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(moment());

  return (
    <View style={styles.container}>
      <CalendarStrip
            scrollable
            selectedDate={selectedDate}
            onDateSelected={(date) => setSelectedDate(date)}
            style={styles.calendarStrip}
            calendarHeaderStyle={styles.header}
            dateNumberStyle={styles.dateNumber}
            dateNameStyle={styles.dateName}
            highlightDateNumberStyle={styles.highlightDateNumber}
            highlightDateNameStyle={styles.highlightDateName}
            daySelectionAnimation={{
                type: 'background',
                duration: 200,
                highlightColor: '#2ecc71'
            }}
            iconContainer={{ flex: 0.1 }}
            calendarColor={'#ffffff'}
            highlightDateContainerStyle={{
                backgroundColor: '#2ecc71',
                borderRadius: 8
            }}
            iconLeft={require('../../assets/icons/left-arrow.png')} // Add your icons
            iconRight={require('../../assets/icons/right-arrow.png')}
            iconStyle={{ tintColor: '#3498db' }}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 120,
    paddingTop: 16,
    backgroundColor: 'white'
  },
  calendarStrip: {
    height: 100,
    paddingTop: 8,
    paddingBottom: 8
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  dateNumber: {
    color: '#7f8c8d',
    fontSize: 14
  },
  dateName: {
    color: '#7f8c8d',
    fontSize: 12,
    marginBottom: 4
  },
  highlightDateNumber: {
    color: 'white',
    fontSize: 14
  },
  highlightDateName: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4
  }
});

export default WeeklyCalendar;