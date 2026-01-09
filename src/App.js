import React from 'react';
import CountdownSignup from './components/CountdownSignup';
import './App.css';

function App() {
  return (
    <div className="app">
      {/* Background will be handled via CSS */}
      <CountdownSignup />
    </div>
  );
}

export default App;