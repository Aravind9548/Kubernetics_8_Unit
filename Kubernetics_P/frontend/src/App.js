import React, { useState } from 'react';
import './App.css'; // We will create this file next

function App() {
  const [resultText, setResultText] = useState('');
  const [resultClass, setResultClass] = useState('');

  //
  // THIS IS THE FIX for your "Network Error: Unexpected token '<'"
  // It now correctly points to your API server on port 5000.
  //
  const API_URL = 'http://localhost:5000/api/convert';

  const handleFormSubmit = async (event) => {
    // 1. Prevent the form from doing a default page reload
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // 2. Create a data object from the form's fields
    const data = {
      form_id: formData.get('form_id'),
      input_value: parseFloat(formData.get('input_value')),
      unit_from: formData.get('unit_from'),
      unit_to: formData.get('unit_to')
    };

    setResultText('Sending...');
    setResultClass('');

    try {
      // 3. Send the data to the Node.js API backend
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      // 4. Update the result box with the server's message
      if (response.ok) {
        setResultText(responseData.message);
        setResultClass('success');
      } else {
        setResultText(`Error: ${responseData.error}`);
        setResultClass('error');
      }
    } catch (error) {
      // This will show "Failed to fetch" if your api-server container is crashed
      setResultText(`Network Error: ${error.message}`);
      setResultClass('error');
    }
  };

  // This is JSX (JavaScript XML) - it looks like HTML
  return (
    <div className="App">
      <h1>Unit Converter (React + Node.js)</h1>

      {/* Result box - it's hidden until you submit */}
      {resultText && (
        <div id="result-box" className={resultClass}>
          <p id="result-text">{resultText}</p>
        </div>
      )}

      {/* --- LENGTH CONVERTER --- */}
      <div className="converter-section">
        <h3>Length Conversion</h3>
        <form id="length_form" onSubmit={handleFormSubmit}>
          <input type="hidden" name="form_id" value="length_form" />
          <div className="form-group">
            <label>Value:</label>
            <input type="number" name="input_value" step="any" required />
          </div>
          <div className="form-group">
            <label>From:</label>
            <select name="unit_from" defaultValue="meter">
              <option value="millimeter">millimeter</option>
              <option value="centimeter">centimeter</option>
              <option value="meter">meter</option>
              <option value="kilometer">kilometer</option>
              <option value="inch">inch</option>
              <option value="foot">foot</option>
              <option value="yard">yard</option>
              <option value="mile">mile</option>
            </select>
            <label>To:</label>
            <select name="unit_to" defaultValue="kilometer">
              <option value="millimeter">millimeter</option>
              <option value="centimeter">centimeter</option>
              <option value="meter">meter</option>
              <option value="kilometer">kilometer</option>
              <option value="inch">inch</option>
              <option value="foot">foot</option>
              <option value="yard">yard</option>
              <option value="mile">mile</option>
            </select>
          </div>
          <button type="submit">Convert Length</button>
        </form>
      </div>

      {/* --- WEIGHT CONVERTER (The missing part) --- */}
      <div className="converter-section">
        <h3>Weight Conversion</h3>
        <form id="weight_form" onSubmit={handleFormSubmit}>
          <input type="hidden" name="form_id" value="weight_form" />
          <div className="form-group">
            <label>Value:</label>
            <input type="number" name="input_value" step="any" required />
          </div>
          <div className="form-group">
            <label>From:</label>
            <select name="unit_from" defaultValue="gram">
              <option value="milligram">milligram</option>
              <option value="gram">gram</option>
              <option value="kilogram">kilogram</option>
              <option value="ounce">ounce</option>
              <option value="pound">pound</option>
            </select>
            <label>To:</label>
            <select name="unit_to" defaultValue="kilogram">
              <option value="milligram">milligram</option>
              <option value="gram">gram</option>
              <option value="kilogram">kilogram</option>
              <option value="ounce">ounce</option>
              <option value="pound">pound</option>
            </select>
          </div>
          <button type="submit">Convert Weight</button>
        </form>
      </div>

      {/* --- TEMPERATURE CONVERTER (The missing part) --- */}
      <div className="converter-section">
        <h3>Temperature Conversion</h3>
        <form id="temp_form" onSubmit={handleFormSubmit}>
          <input type="hidden" name="form_id" value="temp_form" />
          <div className="form-group">
            <label>Value:</label>
            <input type="number" name="input_value" step="any" required />
          </div>
          <div className="form-group">
            <label>From:</label>
            <select name="unit_from" defaultValue="Celsius">
              <option value="Celsius">Celsius</option>
              <option value="Fahrenheit">Fahrenheit</option>
              <option value="Kelvin">Kelvin</option>
            </select>
            <label>To:</label>
            <select name="unit_to" defaultValue="Fahrenheit">
              <option value="Celsius">Celsius</option>
              <option value="Fahrenheit">Fahrenheit</option>
              <option value="Kelvin">Kelvin</option>
            </select>
          </div>
          <button type="submit">Convert Temp</button>
        </form>
      </div>
    </div>
  );
}

export default App;