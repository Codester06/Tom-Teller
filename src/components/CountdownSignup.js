import React, { useState, useEffect } from 'react';
import styles from './CountdownSignup.module.css';

const CountdownSignup = () => {
  const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Replace with your deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      
      // Set target date to April 1st, 2026 at 10:03 AM
      const targetDate = new Date('2026-04-01T10:03:00');
      
      const distance = targetDate - now;
      
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft({
          days: days.toString(),
          hours: hours.toString().padStart(2, '0'),
          minutes: minutes.toString().padStart(2, '0'),
          seconds: seconds.toString().padStart(2, '0')
        });
      } else {
        setTimeLeft({ days: '0', hours: '00', minutes: '00', seconds: '00' });
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
        
        {/* Main content */}
        <div className={styles.mainContent}>
          {/* Signup section */}
          <div className={styles.signupSection}>
            <h2 className={styles.signupTitle}>JOIN OUR FIRST EVER COLLECTION "PHASE 01"</h2>
            
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
                {isSubmitting ? 'JOINING...' : 'JOIN'}
              </button>
            </div>
            
            <p className={styles.disclaimerText}>
              By joining us, you agree to receive emails and text messages from us.
            </p>
          </div>

          {/* Countdown section */}
          <div className={styles.countdownSection}>
            <h3 className={styles.countdownTitle}>PHASE 01 DROP</h3>
            
            <div className={styles.timerContainer}>
              <div className={styles.timerNumbers}>
                <span className={styles.timeUnit}>{timeLeft.days}</span>
                <span className={styles.separator}>:</span>
                <span className={styles.timeUnit}>{timeLeft.hours}</span>
                <span className={styles.separator}>:</span>
                <span className={styles.timeUnit}>{timeLeft.minutes}</span>
                <span className={styles.separator}>:</span>
                <span className={styles.timeUnit}>{timeLeft.seconds}</span>
              </div>
              <div className={styles.timerLabels}>
                <span className={styles.timeLabel}>Day</span>
                <span className={styles.timeLabel}>Hrs</span>
                <span className={styles.timeLabel}>Min</span>
                <span className={styles.timeLabel}>Sec</span>
              </div>
            </div>
          </div>
          
          {/* Bottom disclaimer */}
          <div className={styles.bottomDisclaimer}>
            <p className={styles.bottomDisclaimerText}>
              By submitting this form, you agree that Tom & Teller may contact you with service-related e-mails (such as order confirmations and updates) as well as promotional e-mails (such as special offers or reminders). E-mails may be sent using automated technology. Your consent is optional and not required to complete a purchase.
            </p>
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