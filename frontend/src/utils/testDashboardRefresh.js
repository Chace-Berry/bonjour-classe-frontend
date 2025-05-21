// Test script for dashboard refresh functionality
import { 
  shouldRefreshPath, 
  markPathVisited, 
  hasVisitedPath, 
  resetAllVisitTracking,
  checkAndRefreshDashboard
} from './dashboardRefresh';

// Mock sessionStorage for testing
const mockSessionStorage = {
  storage: {},
  setItem: function(key, value) {
    this.storage[key] = value;
  },
  getItem: function(key) {
    return this.storage[key] || null;
  },
  removeItem: function(key) {
    delete this.storage[key];
  },
  clear: function() {
    this.storage = {};
  }
};

// Override window.sessionStorage with our mock for testing
window.sessionStorage = mockSessionStorage;

// Test paths
const testPaths = [
  '/student/dashboard/',
  '/teacher/dashboard',
  '/some/random/path'
];

// Test shouldRefreshPath function
console.log('Testing shouldRefreshPath:');
testPaths.forEach(path => {
  console.log(`${path}: ${shouldRefreshPath(path)}`);
});

// Test markPathVisited and hasVisitedPath functions
console.log('\nTesting visit tracking:');
testPaths.forEach(path => {
  console.log(`Before marking ${path}: ${hasVisitedPath(path)}`);
  markPathVisited(path);
  console.log(`After marking ${path}: ${hasVisitedPath(path)}`);
});

// Test resetAllVisitTracking function
console.log('\nTesting reset:');
console.log('Before reset:');
testPaths.forEach(path => {
  console.log(`${path}: ${hasVisitedPath(path)}`);
});
resetAllVisitTracking();
console.log('After reset:');
testPaths.forEach(path => {
  console.log(`${path}: ${hasVisitedPath(path)}`);
});

// Test checkAndRefreshDashboard function
// Note: This function calls window.location.reload(), so we mock it
const originalLocation = window.location;
let reloadCalled = false;
delete window.location;
window.location = { 
  reload: function() { 
    reloadCalled = true; 
    console.log('window.location.reload() was called'); 
  }
};

console.log('\nTesting checkAndRefreshDashboard:');
resetAllVisitTracking(); // Start fresh

// First visit to a dashboard page should trigger reload
console.log('First visit to dashboard:');
const dashboardPath = '/student/dashboard/';
const shouldReload = checkAndRefreshDashboard(dashboardPath);
console.log(`Should reload: ${shouldReload}, reload called: ${reloadCalled}`);

// Reset for second test
reloadCalled = false;
resetAllVisitTracking();

// Mark it as visited first
markPathVisited(dashboardPath);
console.log('Second visit to dashboard:');
const shouldNotReload = checkAndRefreshDashboard(dashboardPath);
console.log(`Should reload: ${shouldNotReload}, reload called: ${reloadCalled}`);

// Restore original window.location
window.location = originalLocation;

console.log('\nAll tests completed.');
