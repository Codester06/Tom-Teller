import React, { useCallback } from 'react';
import CountdownSignup from './components/CountdownSignup';
import ResponsiveVideoBackground from './components/ResponsiveVideoBackground';
import './App.css';

function App() {
  // Handle video loading events
  const handleVideoLoadStart = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Background video loading started');
    }
  }, []);

  const handleVideoLoadComplete = useCallback((details) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Background video loaded:', details);
    }
  }, []);

  const handleVideoError = useCallback((error) => {
    console.warn('Background video failed to load:', error);
  }, []);

  return (
    <div className="app">
      {/* Enhanced Background Video */}
      <ResponsiveVideoBackground
        onLoadStart={handleVideoLoadStart}
        onLoadComplete={handleVideoLoadComplete}
        onError={handleVideoError}
        enableDebugLogging={false}
      />
      
      {/* Overlay Content */}
      <CountdownSignup />
    </div>
  );
}

export default App;