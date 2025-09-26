import React from 'react';
import CountdownSignup from './components/CountdownSignup';
import './App.css';

function App() {
  return (
    <div className="app">
      {/* Background Video */}
      <video 
        className="background-video" 
        autoPlay 
        loop 
        muted
        playsInline
      >
        <source src="/assets//background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Overlay Content */}
      <CountdownSignup />
    </div>
  );
}

export default App;