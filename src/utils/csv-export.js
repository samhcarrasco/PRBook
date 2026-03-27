import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { dataOperations } from '../db/db';

const escapeCSVField = (value) => {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const exportWorkoutsCsv = async (db) => {
  try {
    const rows = await dataOperations.getAllWorkoutData(db);

    if (rows.length === 0) {
      return { success: false, rowCount: 0, error: 'No workout data to export.' };
    }

    const header = 'date,exercise_name,set_number,weight,reps,rest_time';
    const csvLines = rows.map(row =>
      [
        row.date,
        escapeCSVField(row.exercise_name),
        row.set_number,
        row.weight,
        row.reps,
        row.rest_time ?? 0,
      ].join(',')
    );

    const csvContent = [header, ...csvLines].join('\n');
    const filePath = `${FileSystem.cacheDirectory}prbook_export.csv`;

    await FileSystem.writeAsStringAsync(filePath, csvContent);

    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Export Workout Data',
    });

    return { success: true, rowCount: rows.length };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, rowCount: 0, error: error.message };
  }
};

export { exportWorkoutsCsv };
