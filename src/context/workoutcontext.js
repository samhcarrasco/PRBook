import React, { createContext, useState, useContext } from 'react';
const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [workoutListVersion, setWorkoutListVersion] = useState(0);
  const [workoutHistoryVersion, setWorkoutHistoryVersion] = useState(0);

  const refreshWorkoutList = () => {
    setWorkoutListVersion(prev => prev + 1);
  };

  const refreshWorkoutHistory = () => {
    setWorkoutHistoryVersion(prev => prev + 1);
  };

  const refreshAllWorkoutData = () => {
    refreshWorkoutList();
    refreshWorkoutHistory();
  };

  return (
    <WorkoutContext.Provider
      value={{
        workoutListVersion,
        workoutHistoryVersion,
        refreshWorkoutList,
        refreshWorkoutHistory,
        refreshAllWorkoutData,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);