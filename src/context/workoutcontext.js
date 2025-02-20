import React, { createContext, useState, useContext } from 'react';
const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [workoutListVersion, setWorkoutListVersion] = useState(0);

  const refreshWorkoutList = () => {
    setWorkoutListVersion(prev => prev + 1);
  };

  return (
    <WorkoutContext.Provider value={{ workoutListVersion, refreshWorkoutList }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);