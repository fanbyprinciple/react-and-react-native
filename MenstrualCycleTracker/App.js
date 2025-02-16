import React from 'react';
import { CycleProvider } from './src/context/CycleContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <CycleProvider>
      <AppNavigator />
    </CycleProvider>
  );
};

export default App;