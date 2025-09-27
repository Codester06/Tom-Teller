import React, { useState, useEffect } from 'react';
import styles from './CountdownSignup.module.css';

const CountdownSignup = () => {
  const [timeLeft, setTimeLeft] = useState('30:10:03:00');
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  // Replace with your deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      
      // Set target date (3 months from now for demo)
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 3);
      targetDate.setHours(10, 3, 0, 0); // 10:03 AM
      
      const distance = targetDate - now;
      
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Format with leading zeros
        const formattedDays = days.toString().padStart(2, '0');
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        
        setTimeLeft(`${formattedDays}:${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
        
        // Add glitch effect occasionally
        if (seconds % 10 === 0 && Math.random() > 0.7) {
          setIsGlitching(true);
          setTimeout(() => setIsGlitching(false), 300);
        }
      } else {
        setTimeLeft("00:00:00:00");
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const submitEmailToGoogleSheets = async (emailAddress) => {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors', // Important for Google Apps Script
        body: JSON.stringify({
          email: emailAddress
        })
      });

      // Note: With no-cors mode, we can't read the response
      // So we assume success if no error is thrown
      return { success: true };
      
    } catch (error) {
      console.error('Error submitting email:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const handleSubmit = async () => {
    // Basic email validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitEmailToGoogleSheets(email);
      
      if (result.success) {
        setShowSuccess(true);
        setEmail('');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
        
        console.log('Email successfully submitted:', email);
      } else {
        setErrorMessage(result.message || 'Failed to submit email');
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <>
      <div className={styles.container}>
        {/* Logo at top */}
        <div className={styles.logoContainer}>
          <img 
            src="/assets/tom-teller-logo.png" 
            alt="Tom&Teller" 
            className={styles.logo}
          />
        </div>
        
        {/* Centered content (input and timer) */}
        <div className={styles.centerContent}>
          {/* Input field */}
          <div className={styles.signupContainer}>
            <div className={styles.inputWrapper}>
              <input 
                type="email" 
                className={styles.emailInput}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
                required
              />
              <button 
                type="button" 
                className={`${styles.signupBtn} ${isSubmitting ? styles.loading : ''}`}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>

          <div className={styles.dropText}>Be a part of our first drop.</div>
          
          {/* Timer */}
          <div className={styles.timerContainer}>
            <div className={`${styles.timer} ${isGlitching ? styles.glitch : ''}`}>
              {timeLeft}
            </div>
            <div className={styles.timerLabel}>COMING SOON</div>
          </div>
        </div>
      </div>
      
      {/* Success Message */}
      {showSuccess && (
        <div className={styles.successMessage}>
          <div>Successfully Subscribed!</div>
          <div className={styles.successSubtext}>
            We'll notify you when we launch!
          </div>
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className={styles.errorMessage}>
          <div>Oops! {errorMessage}</div>
          <div className={styles.errorSubtext}>
            Please try again.
          </div>
        </div>
      )}
    </>
  );
};

export default CountdownSignup;