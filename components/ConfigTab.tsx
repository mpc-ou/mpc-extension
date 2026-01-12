import React, { useState, useEffect } from 'react';
import { useConfig } from '@/hooks/useConfig';

const ConfigTab = () => {
  // Get current settings from our custom hook
  const { fixedPoint, ignoreList, saveSettings } = useConfig();

  // Local state for the form inputs
  const [localPoint, setLocalPoint] = useState(3);
  const [localIgnoreString, setLocalIgnoreString] = useState("");

  // When data loads from the hook, update the form inputs
  useEffect(() => {
    setLocalPoint(fixedPoint);
    // Convert the array ["A", "B"] into a string "A, B" for the text box
    setLocalIgnoreString(ignoreList.join(', '));
  }, [fixedPoint, ignoreList]);

  const handleSave = () => {
    // Convert the text string back into an array
    const newIgnoreArray = localIgnoreString
      .split(',')
      .map((item) => item.trim()) // Remove spaces
      .filter((item) => item !== ""); // Remove empty items

    saveSettings(localPoint, newIgnoreArray);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold mb-4">Configuration</h2>

      {/* Decimal Point Input */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-gray-700">
          Decimal Precision (GPA):
        </label>
        <input
          type="number"
          value={localPoint}
          onChange={(e) => setLocalPoint(Number(e.target.value))}
          className="border border-gray-300 p-2 rounded focus:outline-blue-500"
          min="1"
          max="5"
        />
        <p className="text-xs text-gray-500">How many decimal places to show (e.g., 3 for 3.142)</p>
      </div>

      {/* Ignore List Input */}
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-gray-700">
          Ignored Subjects (comma separated):
        </label>
        <textarea
          rows={5}
          value={localIgnoreString}
          onChange={(e) => setLocalIgnoreString(e.target.value)}
          className="border border-gray-300 p-2 rounded focus:outline-blue-500"
          placeholder="e.g. MEETING, PHYSICAL_EDU"
        />
        <p className="text-xs text-gray-500">Subjects codes to exclude from GPA calculation.</p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full font-bold"
      >
        Save Changes
      </button>
    </div>
  );
};

export default ConfigTab;