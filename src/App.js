import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CountdownSignup from './components/CountdownSignup';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Redirect root path to /joinus */}
          <Route path="/" element={<Navigate to="/joinus" replace />} />
          
          {/* Main signup page */}
          <Route path="/joinus" element={<CountdownSignup />} />
          
          {/* Catch all other routes and redirect to /joinus */}
          <Route path="*" element={<Navigate to="/joinus" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;