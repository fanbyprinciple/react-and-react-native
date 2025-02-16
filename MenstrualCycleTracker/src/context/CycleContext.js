import React, { createContext, useState, useEffect } from 'react';
import { getCycleStartDate } from '../services/storage';

export const CycleContext = createContext();

export const CycleProvider = ({ children }) => {
  const [cycleStartDate, setCycleStartDate] = useState(null);

  useEffect(() => {
    const loadCycleData = async () => {
      const date = await getCycleStartDate();
      setCycleStartDate(date);
    };
    loadCycleData();
  }, []);

  return (
    <CycleContext.Provider value={{ cycleStartDate, setCycleStartDate }}>
      {children}
    </CycleContext.Provider>
  );
};