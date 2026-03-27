import * as SQLite from 'expo-sqlite';

const openDB = async () => {
  try {
    const db = await SQLite.openDatabaseAsync('gym.db');
    return db;
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

const initDatabase = async () => {
  try {
    const db = await openDB();

    const createTables = async () => {
      await Promise.all([
        db.execAsync(`
          CREATE TABLE IF NOT EXISTS workout_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
          );
        `),

        db.execAsync(`
          CREATE TABLE IF NOT EXISTS daily_workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            workout_type_id INTEGER,
            FOREIGN KEY (workout_type_id) REFERENCES workout_types (id)
          );
        `),

        db.execAsync(`
          CREATE TABLE IF NOT EXISTS workout_sets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            daily_workout_id INTEGER,
            set_number INTEGER,
            reps INTEGER,
            weight TEXT,
            rest_time INTEGER DEFAULT 0,
            FOREIGN KEY (daily_workout_id) REFERENCES daily_workouts (id)
          );
        `),

        db.execAsync(`
          CREATE TABLE IF NOT EXISTS personal_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_type_id INTEGER NOT NULL,
            pr_type TEXT NOT NULL,
            value REAL NOT NULL,
            secondary_value REAL,
            date_achieved TEXT NOT NULL,
            daily_workout_id INTEGER,
            FOREIGN KEY (workout_type_id) REFERENCES workout_types (id),
            FOREIGN KEY (daily_workout_id) REFERENCES daily_workouts (id),
            UNIQUE(workout_type_id, pr_type, secondary_value)
          );
        `),

        db.execAsync(`
          CREATE TABLE IF NOT EXISTS pr_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workout_type_id INTEGER NOT NULL,
            pr_type TEXT NOT NULL,
            value REAL NOT NULL,
            secondary_value REAL,
            previous_value REAL,
            date_achieved TEXT NOT NULL,
            daily_workout_id INTEGER,
            FOREIGN KEY (workout_type_id) REFERENCES workout_types (id),
            FOREIGN KEY (daily_workout_id) REFERENCES daily_workouts (id)
          );
        `)
      ]);
    };

    await createTables();
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const workoutTypeOperations = {
  addWorkoutType: async (db, name) => {
    try {
      await db.runAsync(
        'INSERT INTO workout_types (name) VALUES (?)',
        [name]
      );
    } catch (error) {
      console.error('Error adding workout type:', error);
      if (error.message.includes('UNIQUE')) {
        throw new Error('This workout already exists');
      }
      throw error;
    }
  },

  getWorkoutTypes: async (db) => {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM workout_types ORDER BY LOWER(name) ASC'
      );
     
      return result;
    } catch (error) {
      console.error('Error getting workout types:', error);
      return [];
    }
  },

  searchWorkoutTypes: async (db, searchTerm) => {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM workout_types WHERE LOWER(name) LIKE LOWER(?) ORDER BY LOWER(name) ASC',
        [`${searchTerm}%`]
      );
      return result;
    } catch (error) {
      console.error('Error searching workout types:', error);
      return [];
    }
  },

  deleteWorkoutType: async (db, name) => {
    try {
      await db.runAsync(
        'DELETE FROM workout_types WHERE LOWER(name) = LOWER(?)',
        [name]
      );
    } catch (error) {
      console.error('Error deleting workout type:', error);
      throw error;
    }
  }
};

const comparePR = async (db, workoutTypeId, prType, newValue, secondaryValue, dailyWorkoutId, date, brokenPRs, lowerIsBetter = false) => {
  const existing = await db.getFirstAsync(
    `SELECT * FROM personal_records
     WHERE workout_type_id = ? AND pr_type = ? AND (secondary_value IS ? OR secondary_value = ?)`,
    [workoutTypeId, prType, secondaryValue, secondaryValue]
  );

  const isNewRecord = !existing ||
    (lowerIsBetter ? newValue < existing.value : newValue > existing.value);

  if (isNewRecord) {
    const previousValue = existing ? existing.value : null;

    if (existing) {
      await db.runAsync(
        `UPDATE personal_records SET value = ?, date_achieved = ?, daily_workout_id = ?
         WHERE id = ?`,
        [newValue, date, dailyWorkoutId, existing.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO personal_records (workout_type_id, pr_type, value, secondary_value, date_achieved, daily_workout_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [workoutTypeId, prType, newValue, secondaryValue, date, dailyWorkoutId]
      );
    }

    await db.runAsync(
      `INSERT INTO pr_history (workout_type_id, pr_type, value, secondary_value, previous_value, date_achieved, daily_workout_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [workoutTypeId, prType, newValue, secondaryValue, previousValue, date, dailyWorkoutId]
    );

    brokenPRs.push({ prType, newValue, previousValue, secondaryValue });
  }
};

const prOperations = {
  checkAndUpdatePRs: async (db, workoutTypeId, dailyWorkoutId, date, sets) => {
    const brokenPRs = [];
    const numericSets = sets.map(s => ({
      weight: parseFloat(s.weight) || 0,
      reps: parseInt(s.reps) || 0,
      rest_time: s.rest_time || 0,
    }));

    const maxWeight = Math.max(...numericSets.map(s => s.weight));
    if (maxWeight > 0) {
      await comparePR(db, workoutTypeId, 'max_weight', maxWeight, null, dailyWorkoutId, date, brokenPRs);
    }

    const weightGroups = {};
    for (const s of numericSets) {
      if (s.weight > 0) {
        if (!weightGroups[s.weight]) weightGroups[s.weight] = [];
        weightGroups[s.weight].push(s);
      }
    }
    for (const [weight, group] of Object.entries(weightGroups)) {
      const w = parseFloat(weight);
      const maxReps = Math.max(...group.map(s => s.reps));
      if (maxReps > 0) {
        await comparePR(db, workoutTypeId, 'max_reps_at_weight', maxReps, w, dailyWorkoutId, date, brokenPRs);
      }
      await comparePR(db, workoutTypeId, 'max_sets_at_weight', group.length, w, dailyWorkoutId, date, brokenPRs);
    }

    const restTimes = numericSets.map(s => s.rest_time).filter(t => t > 0);
    if (restTimes.length > 0) {
      const bestRest = Math.min(...restTimes);
      await comparePR(db, workoutTypeId, 'best_single_rest', bestRest, null, dailyWorkoutId, date, brokenPRs, true);
    }

    if (restTimes.length > 0) {
      const avgRest = restTimes.reduce((a, b) => a + b, 0) / restTimes.length;
      await comparePR(db, workoutTypeId, 'best_avg_rest', avgRest, null, dailyWorkoutId, date, brokenPRs, true);
    }

    const maxVolume = Math.max(...numericSets.map(s => s.weight * s.reps));
    if (maxVolume > 0) {
      await comparePR(db, workoutTypeId, 'max_volume_single_set', maxVolume, null, dailyWorkoutId, date, brokenPRs);
    }

    const totalTonnage = numericSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
    if (totalTonnage > 0) {
      await comparePR(db, workoutTypeId, 'max_total_tonnage', totalTonnage, null, dailyWorkoutId, date, brokenPRs);
    }

    return brokenPRs;
  },

  getPRsForExercise: async (db, workoutTypeId) => {
    return await db.getAllAsync(
      'SELECT * FROM personal_records WHERE workout_type_id = ? ORDER BY pr_type',
      [workoutTypeId]
    );
  },

  getAllCurrentPRs: async (db) => {
    return await db.getAllAsync(
      `SELECT pr.*, wt.name as exercise_name
       FROM personal_records pr
       JOIN workout_types wt ON pr.workout_type_id = wt.id
       ORDER BY wt.name, pr.pr_type`
    );
  },

  getPRTypesForWorkout: async (db, dailyWorkoutId) => {
    const results = await db.getAllAsync(
      'SELECT DISTINCT pr_type FROM pr_history WHERE daily_workout_id = ?',
      [dailyWorkoutId]
    );
    return results.map(r => r.pr_type);
  },

  restorePRsOnDelete: async (db, dailyWorkoutId) => {
    const affectedPRs = await db.getAllAsync(
      'SELECT * FROM personal_records WHERE daily_workout_id = ?',
      [dailyWorkoutId]
    );

    for (const pr of affectedPRs) {
      const previousBest = await db.getFirstAsync(
        `SELECT * FROM pr_history
         WHERE workout_type_id = ? AND pr_type = ? AND (secondary_value IS ? OR secondary_value = ?)
           AND daily_workout_id != ?
         ORDER BY value ${pr.pr_type.includes('rest') ? 'ASC' : 'DESC'}
         LIMIT 1`,
        [pr.workout_type_id, pr.pr_type, pr.secondary_value, pr.secondary_value, dailyWorkoutId]
      );

      if (previousBest) {
        await db.runAsync(
          'UPDATE personal_records SET value = ?, date_achieved = ?, daily_workout_id = ? WHERE id = ?',
          [previousBest.value, previousBest.date_achieved, previousBest.daily_workout_id, pr.id]
        );
      } else {
        await db.runAsync(
          'DELETE FROM personal_records WHERE id = ?',
          [pr.id]
        );
      }
    }

    await db.runAsync(
      'DELETE FROM pr_history WHERE daily_workout_id = ?',
      [dailyWorkoutId]
    );
  },
};

const historyOperations = {
  getExerciseHistory: async (db, workoutTypeId) => {
    return await db.getAllAsync(
      `SELECT dw.id as daily_workout_id, dw.date,
              ws.set_number, ws.reps, ws.weight, ws.rest_time
       FROM daily_workouts dw
       JOIN workout_sets ws ON ws.daily_workout_id = dw.id
       WHERE dw.workout_type_id = ?
       ORDER BY dw.date ASC, ws.set_number ASC`,
      [workoutTypeId]
    );
  },

  getPRsForDate: async (db, workoutTypeId, date) => {
    return await db.getAllAsync(
      `SELECT ph.pr_type, ph.value, ph.previous_value, ph.secondary_value
       FROM pr_history ph
       WHERE ph.workout_type_id = ? AND ph.date_achieved = ?
       ORDER BY ph.pr_type`,
      [workoutTypeId, date]
    );
  },

  getExercisesWithHistory: async (db) => {
    return await db.getAllAsync(
      `SELECT DISTINCT wt.id, wt.name
       FROM workout_types wt
       JOIN daily_workouts dw ON dw.workout_type_id = wt.id
       ORDER BY LOWER(wt.name) ASC`
    );
  },
};

const dataOperations = {
  getAllWorkoutData: async (db) => {
    return await db.getAllAsync(
      `SELECT dw.date, wt.name AS exercise_name, ws.set_number, ws.weight, ws.reps, ws.rest_time
       FROM workout_sets ws
       JOIN daily_workouts dw ON ws.daily_workout_id = dw.id
       JOIN workout_types wt ON dw.workout_type_id = wt.id
       ORDER BY dw.date ASC, wt.name ASC, ws.set_number ASC`
    );
  },

  getAllDailyWorkoutsOrdered: async (db) => {
    return await db.getAllAsync(
      `SELECT dw.id, dw.date, dw.workout_type_id
       FROM daily_workouts dw
       ORDER BY dw.date ASC`
    );
  },

  getSetsForWorkout: async (db, dailyWorkoutId) => {
    return await db.getAllAsync(
      `SELECT set_number, weight, reps, rest_time
       FROM workout_sets
       WHERE daily_workout_id = ?
       ORDER BY set_number ASC`,
      [dailyWorkoutId]
    );
  },

  clearAllPRData: async (db) => {
    await db.execAsync('DELETE FROM pr_history');
    await db.execAsync('DELETE FROM personal_records');
  },
};

export { openDB, initDatabase, workoutTypeOperations, prOperations, historyOperations, dataOperations };
