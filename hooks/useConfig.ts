import { useState, useEffect } from 'react';
// Import the original defaults to use as fallbacks
import { _DEFAULT_FIXED_POINT, _DEFAULT_IGNORE_SUBJECT_DATA } from '@/constants/default';

export const useConfig = () => {
  // 1. Initialize state
  const [fixedPoint, setFixedPoint] = useState<number>(_DEFAULT_FIXED_POINT);
  const [ignoreList, setIgnoreList] = useState<string[]>(_DEFAULT_IGNORE_SUBJECT_DATA);

  // 2. Load from LocalStorage when the app starts
  useEffect(() => {
    const storedPoint = localStorage.getItem('mpc_fixed_point');
    const storedList = localStorage.getItem('mpc_ignore_list');

    if (storedPoint) {
      setFixedPoint(Number(storedPoint));
    }
    
    if (storedList) {
      // Data is saved as a JSON string, so we parse it back to an Array
      setIgnoreList(JSON.parse(storedList));
    }
  }, []);

  // 3. Function to save new settings
  const saveSettings = (newPoint: number, newIgnoreList: string[]) => {
    localStorage.setItem('mpc_fixed_point', newPoint.toString());
    localStorage.setItem('mpc_ignore_list', JSON.stringify(newIgnoreList));
    
    // Update state so the UI updates immediately
    setFixedPoint(newPoint);
    setIgnoreList(newIgnoreList);
    
    alert('Settings Saved Successfully!');
  };

  return { fixedPoint, ignoreList, saveSettings };
};