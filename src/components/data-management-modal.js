import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Modal, Portal, Text, Button, ActivityIndicator, Surface, IconButton } from 'react-native-paper';
import { useAppTheme } from '../context/themecontext';
import { useWorkout } from '../context/workoutcontext';
import { openDB } from '../db/db';
import { exportWorkoutsCsv } from '../utils/csv-export';
import { importWorkoutsCsv, recalculateAllPRs } from '../utils/csv-import';

const DataManagementModal = ({ visible, onDismiss }) => {
  const { theme } = useAppTheme();
  const c = theme.custom.colors;
  const { refreshAllWorkoutData } = useWorkout();
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setStatusText('Exporting...');
    try {
      const db = await openDB();
      const result = await exportWorkoutsCsv(db);
      if (result.success) {
        Alert.alert('Export Complete', `Exported ${result.rowCount} sets.`);
      } else if (result.error) {
        Alert.alert('Export Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const handleImport = () => {
    Alert.alert(
      'Import Workouts',
      'This will replace all existing data with the contents of the CSV file. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', onPress: performImport },
      ]
    );
  };

  const performImport = async () => {
    setLoading(true);
    setStatusText('Importing...');
    try {
      const db = await openDB();
      const result = await importWorkoutsCsv(db);

      if (!result.success) {
        const errorMsg = result.errors.join('\n');
        Alert.alert('Import Failed', errorMsg);
        setLoading(false);
        setStatusText('');
        return;
      }

      setStatusText('Recalculating personal records...');
      await recalculateAllPRs(db);
      refreshAllWorkoutData();

      Alert.alert('Import Complete', `Imported ${result.imported} workout(s).`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={loading ? undefined : onDismiss} contentContainerStyle={styles.modalWrapper}>
        <Surface style={[styles.container, { backgroundColor: c.surface }]} elevation={3}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.textPrimary }]}>Data Management</Text>
            <IconButton
              icon="close"
              size={20}
              onPress={onDismiss}
              disabled={loading}
              iconColor={c.textSecondary}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Export</Text>
            <Text style={[styles.description, { color: c.textSecondary }]}>
              Download all workout logs as a CSV file.
            </Text>
            <Button
              mode="contained-tonal"
              icon="database-export"
              onPress={handleExport}
              disabled={loading}
              style={styles.button}
            >
              Export CSV
            </Button>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Import</Text>
            <Text style={[styles.description, { color: c.textSecondary }]}>
              Import workout logs from a CSV file. Personal records will be recalculated.
            </Text>
            <Button
              mode="contained-tonal"
              icon="database-import"
              onPress={handleImport}
              disabled={loading}
              style={styles.button}
            >
              Import CSV
            </Button>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={[styles.loadingText, { color: c.textSecondary }]}>{statusText}</Text>
            </View>
          )}
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    marginHorizontal: 24,
  },
  container: {
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 10,
  },
  button: {
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
});

export default DataManagementModal;
