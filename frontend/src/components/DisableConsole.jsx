import { useEffect } from 'react';

/**
 * Component that disables all console logging when mounted
 * @param {Object} props
 * @param {boolean} props.disabled - Whether console logging should be disabled
 * @param {boolean} props.preserveError - Whether to preserve console.error (useful for React errors)
 */
const DisableConsole = ({ disabled = true, preserveError = true }) => {
  useEffect(() => {
    if (!disabled) return;
    
    // Store original console methods before overriding
    const originalConsole = {
      // log: console.log,
      // info: console.info,
      // warn: console.warn,
      // error: console.error,
      // debug: console.debug
    };

    // Override console methods with empty functions
    // console.log = () => {};
    // console.info = () => {};
    // console.warn = () => {};
    // console.debug = () => {};
    
    // Optionally preserve error logging
    if (!preserveError) {
      // console.error = () => {};
    }

    // Restore original behavior on unmount
    return () => {
      // console.log = originalConsole.log;
      // console.info = originalConsole.info;
      // console.warn = originalConsole.warn;
      // console.error = originalConsole.error;
      // console.debug = originalConsole.debug;
    };
  }, [disabled, preserveError]);

  return null;// <-- Add this line
};

export default DisableConsole;