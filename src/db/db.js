import * as SQLite from 'expo-sqlite';

const openDB = async () => {
  try {
    const db = await SQLite.openDatabaseAsync('gym.db');
    console.log('Database opened successfully');
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
        `).then(() => console.log('Workout types table created successfully'))
          .catch(error => console.error('Error creating workout_types table:', error)),

        db.execAsync(`
          CREATE TABLE IF NOT EXISTS daily_workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            workout_type_id INTEGER,
            FOREIGN KEY (workout_type_id) REFERENCES workout_types (id)
          );
        `).then(() => console.log('Daily workouts table created successfully'))
          .catch(error => console.error('Error creating daily_workouts table:', error)),

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
        `).then(() => console.log('Workout sets table created successfully'))
          .catch(error => console.error('Error creating workout_sets table:', error)),

          db.execAsync(`
            CREATE TABLE IF NOT EXISTS personal_records (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              date TEXT NOT NULL,
              workout_set_id INTEGER NOT NULL,
              workout_type_id INTEGER NOT NULL,
              FOREIGN KEY (workout_set_id) REFERENCES workout_sets (id),
              FOREIGN KEY (workout_type_id) REFERENCES workout_types (id)
            );
          `).then(() => console.log("Personal records table created successfully"))
            .catch(error => console.error('Error creating workout_sets table:', error))
      ]);
    };

    await createTables();
    console.log('Database initialized successfully');
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
     
      console.log('Total Workout Types Count:', result.length);
      console.log('Workout Types:', JSON.stringify(result, null, 2));
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
      console.log('Search Results:', result);
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

export { openDB, initDatabase, workoutTypeOperations };
