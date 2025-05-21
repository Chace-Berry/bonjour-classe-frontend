// utils/dashboardRefresh.js - Manages dashboard refresh functionality

/**
 * Check if a particular path needs to be refreshed on first visit
 * @param {string} path - The current path to check
 * @returns {boolean} - Whether the path should be refreshed
 */
export const shouldRefreshPath = (path) => {
  // List of dashboard paths that should be refreshed on first visit
  const dashboardPaths = [
    // Student paths
    '/student/dashboard/',
    '/student/courses/', 
    '/student/assignments/',
    '/student/quiz/',
    
    // Instructor paths
    '/teacher/dashboard',
    '/teacher/courses',
    '/teacher/assignments/',
    '/teacher/quiz/'
  ];
  
  return dashboardPaths.includes(path);
};

/**
 * Mark a path as visited in the current session
 * @param {string} path - The path to mark as visited
 */
export const markPathVisited = (path) => {
  const visitKey = `visited_${path.replace(/\//g, '_')}`;
  sessionStorage.setItem(visitKey, 'true');
};

/**
 * Check if a path has been visited in the current session
 * @param {string} path - The path to check
 * @returns {boolean} - Whether the path has been visited
 */
export const hasVisitedPath = (path) => {
  const visitKey = `visited_${path.replace(/\//g, '_')}`;
  return sessionStorage.getItem(visitKey) === 'true';
};

/**
 * Reset all visit tracking (useful for testing)
 */
export const resetAllVisitTracking = () => {
  // Find all keys related to visit tracking
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key.startsWith('visited_')) {
      sessionStorage.removeItem(key);
    }
  }
};

/**
 * Wrapper function to force a refresh for a particular dashboard
 * @param {string} path - The path to check and potentially refresh
 * @returns {boolean} - Whether a refresh was initiated
 */
export const checkAndRefreshDashboard = (path) => {
  if (shouldRefreshPath(path) && !hasVisitedPath(path)) {
    markPathVisited(path);
    window.location.reload();
    return true;
  }
  return false;
};
