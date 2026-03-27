import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { dataOperations, prOperations } from '../db/db';

const EXPECTED_HEADER = 'date,exercise_name,set_number,weight,reps,rest_time';

const parseCSVLine = (line) => {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
};

const validateRow = (fields, lineNum) => {
  if (fields.length !== 6) {
    return `Line ${lineNum}: expected 6 columns, got ${fields.length}`;
  }
  const [date, name, setNum, weight, reps, restTime] = fields;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `Line ${lineNum}: invalid date format "${date}" (expected YYYY-MM-DD)`;
  }
  if (!name) {
    return `Line ${lineNum}: exercise name is empty`;
  }
  if (isNaN(parseInt(setNum)) || parseInt(setNum) < 1) {
    return `Line ${lineNum}: invalid set number "${setNum}"`;
  }
  if (weight === '' || isNaN(parseFloat(weight))) {
    return `Line ${lineNum}: invalid weight "${weight}"`;
  }
  if (isNaN(parseInt(reps)) || parseInt(reps) < 0) {
    return `Line ${lineNum}: invalid reps "${reps}"`;
  }
  if (restTime !== '' && isNaN(parseInt(restTime))) {
    return `Line ${lineNum}: invalid rest time "${restTime}"`;
  }
  return null;
};

const importWorkoutsCsv = async (db) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/*', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, imported: 0, skipped: 0, errors: ['Import cancelled.'] };
    }

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri);

    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      return { success: false, imported: 0, skipped: 0, errors: ['File is empty or has no data rows.'] };
    }

    const header = lines[0].toLowerCase().replace(/\s/g, '');
    if (header !== EXPECTED_HEADER) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [`Invalid header. Expected: ${EXPECTED_HEADER}\nGot: ${lines[0]}`],
      };
    }

    const parsedRows = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      const error = validateRow(fields, i + 1);
      if (error) {
        errors.push(error);
        if (errors.length >= 10) {
          errors.push('...too many errors, stopping validation.');
          break;
        }
        continue;
      }
      parsedRows.push({
        date: fields[0],
        exercise_name: fields[1],
        set_number: parseInt(fields[2]),
        weight: fields[3],
        reps: parseInt(fields[4]),
        rest_time: fields[5] ? parseInt(fields[5]) : 0,
      });
    }

    if (errors.length > 0) {
      return { success: false, imported: 0, skipped: 0, errors };
    }

    // Group by (date, exercise_name)
    const sessions = {};
    for (const row of parsedRows) {
      const key = `${row.date}|${row.exercise_name}`;
      if (!sessions[key]) {
        sessions[key] = { date: row.date, exercise_name: row.exercise_name, sets: [] };
      }
      sessions[key].sets.push(row);
    }

    let imported = 0;

    await db.withTransactionAsync(async () => {
      // Wipe all existing data
      await db.execAsync('DELETE FROM pr_history');
      await db.execAsync('DELETE FROM personal_records');
      await db.execAsync('DELETE FROM workout_sets');
      await db.execAsync('DELETE FROM daily_workouts');
      await db.execAsync('DELETE FROM workout_types');

      for (const session of Object.values(sessions)) {
        // Look up or create workout type
        let workoutType = await db.getFirstAsync(
          'SELECT id FROM workout_types WHERE LOWER(name) = LOWER(?)',
          [session.exercise_name]
        );
        if (!workoutType) {
          await db.runAsync('INSERT INTO workout_types (name) VALUES (?)', [session.exercise_name]);
          workoutType = await db.getFirstAsync(
            'SELECT id FROM workout_types WHERE LOWER(name) = LOWER(?)',
            [session.exercise_name]
          );
        }

        // Insert workout
        const insertResult = await db.runAsync(
          'INSERT INTO daily_workouts (date, workout_type_id) VALUES (?, ?)',
          [session.date, workoutType.id]
        );
        const dailyWorkoutId = insertResult.lastInsertRowId;

        for (const set of session.sets) {
          await db.runAsync(
            'INSERT INTO workout_sets (daily_workout_id, set_number, weight, reps, rest_time) VALUES (?, ?, ?, ?, ?)',
            [dailyWorkoutId, set.set_number, set.weight, set.reps, set.rest_time]
          );
        }

        imported++;
      }
    });

    return { success: true, imported, errors: [] };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, imported: 0, skipped: 0, errors: [error.message] };
  }
};

const recalculateAllPRs = async (db) => {
  await dataOperations.clearAllPRData(db);

  const workouts = await dataOperations.getAllDailyWorkoutsOrdered(db);

  for (const workout of workouts) {
    const sets = await dataOperations.getSetsForWorkout(db, workout.id);
    if (sets.length > 0) {
      await prOperations.checkAndUpdatePRs(
        db,
        workout.workout_type_id,
        workout.id,
        workout.date,
        sets
      );
    }
  }
};

export { importWorkoutsCsv, recalculateAllPRs };
