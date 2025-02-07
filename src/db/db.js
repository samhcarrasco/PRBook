import * as SQLite from 'expo-sqlite';

const openDB = async () => {
  return await SQLite.openDatabaseAsync('gym.db');
};

const initDatabase = async () => {
  try {
    const db = await openDB();
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        workout_type_id INTEGER,
        FOREIGN KEY (workout_type_id) REFERENCES workout_types (id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS workout_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        daily_workout_id INTEGER,
        set_number INTEGER,
        reps INTEGER,
        FOREIGN KEY (daily_workout_id) REFERENCES daily_workouts (id)
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const workoutTypeOperations = {
  addWorkoutType: async (db, name) => {
    try {
      await db.execAsync(`
        INSERT INTO workout_types (name) 
        VALUES ('${name}');
      `);
    } catch (error) {
      if (error.message.includes('UNIQUE')) {
        throw new Error('This workout already exists');
      }
      throw error;
    }
  },

  getWorkoutTypes: async (db) => {
    try {
      const result = await db.execAsync(`
        SELECT * FROM workout_types 
        ORDER BY name ASC;
      `);
      return result && result[0] && result[0].rows ? result[0].rows : [];
    } catch (error) {
      console.error('Error getting workout types:', error);
      return [];
    }
  },


  searchWorkoutTypes: async (db, searchTerm) => {
    try {
      const result = await db.execAsync(`
        SELECT * FROM workout_types 
        WHERE name LIKE '${searchTerm}%'
        ORDER BY name ASC;
      `);
      return result && result[0] && result[0].rows ? result[0].rows : [];
    } catch (error) {
      console.error('Error searching workout types:', error);
      return [];
    }
  }
};

export { openDB, initDatabase, workoutTypeOperations };