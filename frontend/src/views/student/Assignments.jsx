import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Badge,
  Spinner,
  Table,
  Alert,
} from "react-bootstrap";
import useAxios from "../../utils/useAxios";
import { useSelector } from "react-redux";
import Sidebar from "./Partials/Sidebar";
import Header from "../instructor/Partials/Header";
import Toast from "../plugin/Toast";
import UserData from "../plugin/UserData";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import MobileNav from "./Partials/Mobile_Nav";



function Assignments() {
  // State for sidebar, assignments, and UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  // Submission state
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionType, setSubmissionType] = useState("text");
  const [submitting, setSubmitting] = useState(false);

  // Test mode state
  const [testMode, setTestMode] = useState(false);
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [timerId, setTimerId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const MAX_WARNINGS = 3;
  const videoRef = useRef(null);
  const screenShareRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Add these new state variables near the other state declarations
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});

  // Add these state variables near the other state declarations:
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [exitReason, setExitReason] = useState("");

  // 1. Add darkMode state
  const [darkMode, setDarkMode] = useState(false);

  // Add this new state variable for mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  
  // Add this effect to detect mobile screens
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle sidebar - same as Dashboard component
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Fetch assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const userId = UserData()?.user_id;
      if (!userId) {
        navigate("/");
        return;
      }

      const response = await useAxios().get(`/student/assignments/${userId}/`);
//      console.log("Assignments response:", response.data); // Debug log
      setAssignments(response.data);
      setLoading(false);
    } catch (error) {
//      console.error("Error fetching assignments:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load assignments",
      });
      setLoading(false);
    }
  };

  // Modify the handleAssignmentClick function
  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
    
    // If it's a secure test, show the assignment modal with details
    if (assignment.has_test_mode) {
      setShowAssignmentModal(true);
      
      // Reset test mode variables
      setTestMode(false);
      setFullscreenWarnings(0);
      setTabSwitchWarnings(0);
      
      // Set time limit if specified for test assignments
      if (assignment.time_limit_minutes) {
        setRemainingTime(assignment.time_limit_minutes * 60);
      }
    } 
    // For regular assignments, go directly to submission modal if not yet submitted
    else if (assignment.status !== "submitted" && assignment.status !== "graded") {
      setShowSubmissionModal(true);
    } 
    // For already submitted assignments, show the details modal
    else {
      setShowAssignmentModal(true);
    }
  };

  // Only add monitoring event listeners when in test mode
  useEffect(() => {
    if (testMode) {
      // Visibility change detection (tab switching)
      const handleVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          handleTabSwitchWarning();
        }
      };

      // Window blur detection (switching to another window)
      const handleWindowBlur = () => {
        handleTabSwitchWarning();
      };

      // Fullscreen change detection
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          handleFullscreenWarning();
        }
      };

      // Prevent copy/paste
      const preventCopy = (e) => {
        e.preventDefault();
        Toast().fire({
          icon: "error",
          title: "Copying is not allowed during a test",
        });
      };

      const preventPaste = (e) => {
        e.preventDefault();
        Toast().fire({
          icon: "error",
          title: "Pasting is not allowed during a test",
        });
      };

      // Keyboard shortcut prevention
      const handleKeyDown = (e) => {
        // Prevent common shortcuts
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === "c" ||
            e.key === "v" ||
            e.key === "a" ||
            e.key === "p" ||
            e.key === "u" ||
            e.key === "s" ||
            e.key === "f" ||
            e.key === "g" ||
            e.key === "tab")
        ) {
          e.preventDefault();
          Toast().fire({
            icon: "error",
            title: "Keyboard shortcuts are disabled during tests",
          });
        }

        // Prevent Alt+Tab
        if (e.altKey && e.key === "Tab") {
          e.preventDefault();
          Toast().fire({
            icon: "error",
            title: "Alt+Tab is not allowed during tests",
          });
        }
      };

      // Add event listeners
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleWindowBlur); // Added for better detection
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("copy", preventCopy);
      document.addEventListener("paste", preventPaste);
      document.addEventListener("keydown", handleKeyDown);

      // Clean up listeners when component unmounts or test mode ends
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("blur", handleWindowBlur);
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener("copy", preventCopy);
        document.removeEventListener("paste", preventPaste);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [testMode]);

  // Timer for test mode
  useEffect(() => {
    if (testMode && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleTestTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      setTimerId(timer);
      return () => clearInterval(timer);
    }
    return () => {};
  }, [testMode, remainingTime]);

  // Replace the cleanup useEffect (around line 180)
  useEffect(() => {
    return () => {
      // Clear timer if it exists
      if (timerId) {
        clearInterval(timerId);
      }

      // Safely cleanup resources without calling exitFullscreen directly
      if (testMode) {
        try {
          stopCameraAndScreenSharing();
        } catch (error) {
//          console.error("Error stopping media streams:", error);
        }

        // Don't call exitFullscreen here - it's causing the error
        // Remove or comment out this line:
        // exitFullscreen();
      }
    };
  }, [timerId]);

  // Add this effect (after your other useEffect hooks)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (testMode) {
        e.preventDefault();
        e.returnValue =
          "Leaving this page will terminate your test. Are you sure?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [testMode]);

  // Add this effect to show a success message when returning from a test
  useEffect(() => {
    if (location.state?.testCompleted) {
      Toast().fire({
        icon: "success",
        title: "Your test has been submitted successfully",
      });

      // Clear the state so the message doesn't show again on refresh
      navigate(location.pathname, { replace: true, state: {} });

      // Refresh assignments to show updated status
      fetchAssignments();
    }
  }, [location]);

  // 2. Add useEffect to fetch darkMode setting
  useEffect(() => {
    async function fetchDarkModeSetting() {
      try {
        const response = await useAxios().get("/user/appearance-settings/");
        if (response.data && response.data.dark_mode !== undefined) {
          setDarkMode(response.data.dark_mode);
//          console.log("Dark mode setting loaded:", response.data.dark_mode);
        }
      } catch (error) {
//        console.error("Error fetching dark mode setting:", error);
      }
    }

    fetchDarkModeSetting();
  }, []);

  // Add this function to setup mobile-friendly controls for any video player
  const setupMobileControls = (player) => {
    if (!player) return;
    
//    console.log("Setting up mobile-friendly controls");
    
    // Variable to track control visibility state
    let controlsVisible = true;
    
    // Variable to store the timeout ID
    let controlsTimeout = null;
    
    // Function to hide controls
    const hideControls = () => {
      if (player.isDisposed()) return;
      
      player.addClass('vjs-controls-hidden');
      controlsVisible = false;
      
//      console.log("Controls hidden");
    };
    
    // Function to show controls
    const showControls = () => {
      if (player.isDisposed()) return;
      
      player.removeClass('vjs-controls-hidden');
      controlsVisible = true;
      
      // Reset the auto-hide timer
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      
      // Auto-hide after 15 seconds
      controlsTimeout = setTimeout(() => {
        hideControls();
      }, 15000);
      
//      console.log("Controls shown, will auto-hide in 15 seconds");
    };
    
    // Function to toggle controls
    const toggleControls = () => {
      if (controlsVisible) {
        hideControls();
      } else {
        showControls();
      }
    };
    
    // Add click handler to the video element
    player.on('click', (event) => {
      // Don't toggle if clicked on a control or if player is paused
      if (
        !event.target.classList.contains('vjs-tech') &&
        !event.target.classList.contains('vjs-poster')
      ) {
        return;
      }
      
      toggleControls();
    });
    
    // Show controls initially and start the auto-hide timer
    showControls();
    
    // Show controls when the video is paused
    player.on('pause', () => {
      showControls();
    });
    
    // Reset timer when user interacts with controls
    player.on('useractive', () => {
      showControls();
    });
    
    // Add touch events for mobile devices
    const videoElement = player.el().querySelector('.vjs-tech');
    if (videoElement) {
      videoElement.addEventListener('touchstart', () => {
        toggleControls();
      });
    }
    
    // Add CSS for hiding controls
    const style = document.createElement('style');
    style.textContent = `
      .video-js.vjs-controls-hidden .vjs-control-bar {
        opacity: 0 !important;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      
      .video-js:not(.vjs-controls-hidden) .vjs-control-bar {
        opacity: 1 !important;
        pointer-events: auto;
        transition: opacity 0.3s ease;
      }
      
      @media (max-width: 700px) {
        .video-js .vjs-control-bar {
          height: 50px; /* Larger on mobile for easier touch */
        }
        
        .video-js .vjs-button > .vjs-icon-placeholder:before {
          font-size: 24px; /* Larger icons on mobile */
          line-height: 50px;
        }
        
        /* Larger progress bar for mobile */
        .video-js .vjs-progress-control {
          height: 5px !important;
        }
        
        .video-js:hover .vjs-progress-control {
          height: 8px !important;
        }
        
        /* Ensure touch targets are large enough */
        .video-js .vjs-control {
          width: 40px;
        }
      }
    `;
    document.head.appendChild(style);
  };

  // Replace the handleStartTest function
  const handleStartTest = async () => {
    // Prevent secure test on mobile devices
    if (isMobile && selectedAssignment?.has_test_mode) {
      Toast().fire({
        icon: "error",
        title: "Secure tests must be taken on a PC or laptop. Please use a desktop device to complete this assignment."
      });
      return;
    }
    try {
      // Log that the student is starting a test
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: selectedAssignment.id,
        action: "start_test_prep",
        details: `Student clicked Start Secure Test button. Device type: ${isMobile ? "Mobile" : "Desktop"}`
      });
      setShowAssignmentModal(false);
      setTimeout(() => {
        navigate(`/student/secure-test/${selectedAssignment.id}`);
      }, 100);
    } catch (error) {
//      console.error("Failed to prepare test mode:", error);
      Toast().fire({
        icon: "error",
        title: `Failed to start test mode: ${error.message || "An error occurred"}`,
      });
    }
  };

  const handleEndTest = async () => {
    try {
      // Log test end
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: selectedAssignment.id,
        action: "end_test",
        details: `Test completed. Fullscreen warnings: ${fullscreenWarnings}, Tab switch warnings: ${tabSwitchWarnings}`,
      });

      // Clean up test mode
      cleanupTestMode();

      Toast().fire({
        icon: "success",
        title: "Test completed successfully",
      });

      // Show submission modal
      setShowSubmissionModal(true);
    } catch (error) {
//      console.error("Error ending test:", error);
      Toast().fire({
        icon: "error",
        title: "Error ending test",
      });
    }
  };

  const handleTestTimeUp = async () => {
    try {
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: selectedAssignment.id,
        action: "time_up",
        details: "Test time expired",
      });

      Toast().fire({
        icon: "warning",
        title: "Time's up! Your test is being submitted automatically.",
      });

      // Clean up and show submission
      cleanupTestMode();
      setShowSubmissionModal(true);
    } catch (error) {
//      console.error("Error handling time up:", error);
    }
  };

  const cleanupTestMode = () => {
    setTestMode(false);
    if (timerId) clearInterval(timerId);
    stopCameraAndScreenSharing();
    exitFullscreen();
  };

  const handleFullscreenWarning = async () => {
    const newWarnings = fullscreenWarnings + 1;
    setFullscreenWarnings(newWarnings);

    try {
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: selectedAssignment.id,
        action: "fullscreen_exit",
        details: `Fullscreen exit detected (Warning ${newWarnings}/${MAX_WARNINGS})`,
      });

      if (newWarnings >= MAX_WARNINGS) {
        Toast().fire({
          icon: "error",
          title:
            "Maximum fullscreen exit warnings reached. Test is being submitted.",
        });
        handleEndTest();
      } else {
        Toast().fire({
          icon: "warning",
          title: `Warning: Please return to fullscreen mode! (${newWarnings}/${MAX_WARNINGS})`,
        });

        // Try to re-enter fullscreen after a brief delay
        setTimeout(() => {
          if (testMode && !document.fullscreenElement) {
            enterFullscreen().catch((error) => {
//              console.error("Failed to re-enter fullscreen:", error);
            });
          }
        }, 1000);
      }
    } catch (error) {
//      console.error("Error logging fullscreen warning:", error);
    }
  };

  const handleTabSwitchWarning = async () => {
    const newWarnings = tabSwitchWarnings + 1;
    setTabSwitchWarnings(newWarnings);

    try {
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: selectedAssignment.id,
        action: "tab_switch",
        details: `Tab switch detected (Warning ${newWarnings}/${MAX_WARNINGS})`,
      });

      if (newWarnings >= MAX_WARNINGS) {
        Toast().fire({
          icon: "error",
          title:
            "Maximum tab switch warnings reached. Test is being submitted.",
        });
        handleEndTest();
      } else {
        // The toast will show when they return to the tab
        Toast().fire({
          icon: "warning",
          title: `Warning: Tab switching detected! (${newWarnings}/${MAX_WARNINGS})`,
        });
      }
    } catch (error) {
//      console.error("Error logging tab switch warning:", error);
    }
  };

  // Modify the requestCameraAccess function to set up mobile controls
  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Apply mobile-friendly controls if the video is played through video.js
        if (videoRef.current.player) {
          setupMobileControls(videoRef.current.player);
        }
      }
      return stream;
    } catch (error) {
//      console.error("Failed to access camera:", error);
      throw new Error("Camera access is required for the test");
    }
  };

  // Modify the requestScreenSharing function to set up mobile controls
  const requestScreenSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      if (screenShareRef.current) {
        screenShareRef.current.srcObject = stream;
        
        // Apply mobile-friendly controls if the screen is displayed through video.js
        if (screenShareRef.current.player) {
          setupMobileControls(screenShareRef.current.player);
        }
      }
      return stream;
    } catch (error) {
//      console.error("Failed to share screen:", error);
      throw new Error("Screen sharing is required for the test");
    }
  };

  const stopCameraAndScreenSharing = () => {
    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // Stop screen sharing
    if (screenShareRef.current && screenShareRef.current.srcObject) {
      const tracks = screenShareRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      screenShareRef.current.srcObject = null;
    }
  };

  const enterFullscreen = async () => {
    return new Promise((resolve, reject) => {
      try {
        const element = document.documentElement;

        // Define fullscreen change handler
        const handleFullscreenChange = () => {
          if (document.fullscreenElement) {
            // Successfully entered fullscreen
//            console.log("Fullscreen entered successfully");
            setIsFullscreen(true);
            document.removeEventListener(
              "fullscreenchange",
              handleFullscreenChange
            );
            resolve();
          } else if (testMode) {
            // Only handle fullscreen exit if we're in test mode already
//            console.log("Exited fullscreen during test mode");
          }
        };

        // Add listener before requesting fullscreen
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        // Request fullscreen with browser compatibility
        if (element.requestFullscreen) {
          element.requestFullscreen().catch((err) => {
            document.removeEventListener(
              "fullscreenchange",
              handleFullscreenChange
            );
            reject(err);
          });
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen().catch((err) => {
            document.removeEventListener(
              "fullscreenchange",
              handleFullscreenChange
            );
            reject(err);
          });
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen().catch((err) => {
            document.removeEventListener(
              "fullscreenchange",
              handleFullscreenChange
            );
            reject(err);
          });
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen().catch((err) => {
            document.removeEventListener(
              "fullscreenchange",
              handleFullscreenChange
            );
            reject(err);
          });
        } else {
          document.removeEventListener(
            "fullscreenchange",
            handleFullscreenChange
          );
          reject(new Error("Fullscreen API not supported"));
        }
      } catch (error) {
//        console.error("Failed to enter fullscreen:", error);
        reject(error);
      }
    });
  };

  // Replace the exitFullscreen function (around line 441)
  const exitFullscreen = () => {
    try {
      // Only attempt to exit if we're in fullscreen mode and document is active
      if (
        document.fullscreenElement &&
        document.visibilityState === "visible"
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
      setIsFullscreen(false);
    } catch (error) {
//      console.error("Error exiting fullscreen:", error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleFileChange = (e) => {
    setSubmissionFiles(Array.from(e.target.files));
  };

  // Add this function to log selected answers (add near handleFileChange)
  const logAnswerSelection = (questionType, questionId, value) => {
//    console.log(`Answer selected - Type: ${questionType}, Question ID: ${questionId}, Value:`, value);
  };

  // Modify the handleSubmission function to include auto-grading
  const handleSubmission = async () => {
    try {
      setSubmitting(true);
//      console.log("Starting assignment submission...");

      const formData = new FormData();
      formData.append("assignment_id", selectedAssignment.id);
//      console.log(`Assignment ID: ${selectedAssignment.id}`);

      // Add the primary submission text
      if (submissionText) {
        formData.append("submission_text", submissionText);
//        console.log("Added submission text:", submissionText.substring(0, 100) + (submissionText.length > 100 ? "..." : ""));
      }

      // Log file uploads
//      console.log(`Uploading ${submissionFiles.length} files:`, submissionFiles.map(f => f.name));
      
      // Always add files if there are any
      submissionFiles.forEach((file) => {
        formData.append("submission_files", file);
      });

      // Add test mode data if applicable
      if (selectedAssignment.has_test_mode) {
        formData.append("fullscreen_warnings", fullscreenWarnings);
        formData.append("tab_switch_warnings", tabSwitchWarnings);
        formData.append("secure_mode_used", testMode);
//        console.log(`Test mode data - Fullscreen warnings: ${fullscreenWarnings}, Tab Switch warnings: ${tabSwitchWarnings}`);
      }

      // Add answers to questions for auto-grading
      if (!selectedAssignment.has_test_mode && selectedAssignment.questions) {
        // Create an answers object
        const answers = { ...multipleChoiceAnswers, ...textAnswers };
        formData.append("answers", JSON.stringify(answers));

        // Calculate auto-grade for multiple choice questions
        let correctAnswers = 0;
        let totalPoints = 0;
        let possiblePoints = 0;

        selectedAssignment.questions.forEach((question) => {
          if (question.type === "multiple_choice") {
            possiblePoints += question.points || 1;
            
            // Find which option was selected
            const selectedOptionIndex = multipleChoiceAnswers[question.id];
            
            if (selectedOptionIndex !== undefined && question.options && question.options.length > 0) {
              // Since frontend index starts at 0, we need to make sure backend also uses 0-based indexing
              // Check if any option is marked as correct
              const correctOption = question.options.findIndex(opt => opt.is_correct === true);
              
//              console.log(`Question ${question.id}: Selected ${selectedOptionIndex}, Correct is ${correctOption}`);
              
              if (selectedOptionIndex === correctOption && correctOption !== -1) {
                correctAnswers++;
                totalPoints += question.points || 1;
//                console.log(`Question ${question.id}: Correct answer!`);
              } else {
//                console.log(`Question ${question.id}: Wrong answer`);
              }
            }
          }
        });

//        console.log(`Auto-grading - Correct answers: ${correctAnswers}, Total points: ${totalPoints}, Possible points: ${possiblePoints}`);
        
        // Auto-grade for multiple choice will be included in submission
        formData.append("auto_grade", totalPoints);
        formData.append("auto_grade_possible", possiblePoints);
        formData.append(
          "auto_grade_details",
          JSON.stringify({
            correct_answers: correctAnswers,
            total_questions: selectedAssignment.questions.filter(
              (q) => q.type === "multiple_choice"
            ).length,
          })
        );
      }

//      console.log("Making API request to submit assignment...");
      const response = await useAxios().post("/student/assignment-submission/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

//      console.log("Assignment submission successful:", response.data);
      Toast().fire({
        icon: "success",
        title: "Assignment submitted successfully",
      });

      setShowSubmissionModal(false);
      setShowAssignmentModal(false);
      fetchAssignments(); // Refresh assignments list

      // Reset answers after successful submission
      setMultipleChoiceAnswers({});
      setTextAnswers({});
    } catch (error) {
//      console.error("Error submitting assignment:", error);
//      console.error("Error details:", error.response?.data || "No response data");
      Toast().fire({
        icon: "error",
        title: "Failed to submit assignment",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add this function:
  const handleExitAttempt = () => {
    if (testMode) {
      setShowExitConfirmModal(true);
      return;
    }
  };

  // Add this function:
  const confirmExitTest = async () => {
    if (!exitReason || exitReason.trim().length < 10) {
      Toast().fire({
        icon: "error",
        title: "Please provide a detailed reason for leaving the test",
      });
      return;
    }

    try {
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: selectedAssignment.id,
        action: "manual_exit",
        details: `Test aborted by student. Reason: ${exitReason}`,
      });

      // Clean up test mode
      cleanupTestMode();
      setShowExitConfirmModal(false);

      Toast().fire({
        icon: "warning",
        title: "Test has been aborted. Your instructor will be notified.",
      });

      // Show submission modal
      setShowSubmissionModal(true);
    } catch (error) {
//      console.error("Error logging test exit:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to exit test properly",
      });
    }
  };

  // First, add a new state variable to track if the assignment was already submitted
  const [previousSubmission, setPreviousSubmission] = useState(null);
  const [submissionLoaded, setSubmissionLoaded] = useState(false);

  // Add this function to fetch previous submission data
  const fetchPreviousSubmission = async (assignmentId) => {
    try {
      const response = await useAxios().get(`student/assignment-submission/${assignmentId}/`);
      if (response.data) {
//        console.log("Found previous submission:", response.data);
        setPreviousSubmission(response.data);
        
        // If there are previous answers, populate the form with them
        if (response.data.answers) {
          const savedAnswers = response.data.answers;
          
          // Set multiple choice answers from previous submission
          if (savedAnswers.multiple_choice) {
            setMultipleChoiceAnswers(savedAnswers.multiple_choice);
          }
          
          // Set text answers from previous submission
          if (savedAnswers.text) {
            setTextAnswers(savedAnswers.text);
          }
        }
      }
      setSubmissionLoaded(true);
    } catch (error) {
//      console.log("No previous submission found or error occurred:", error);
      setSubmissionLoaded(true);
    }
  };

  // Call this in useEffect when assignment is loaded
  useEffect(() => {
    if (selectedAssignment && selectedAssignment.id) {
      fetchPreviousSubmission(selectedAssignment.id);
    }
  }, [selectedAssignment]);

  // Toggle function for multiple choice answers
  const handleMultipleChoiceAnswer = (questionId, optionIndex) => {
    const updatedAnswers = { ...multipleChoiceAnswers, [questionId]: optionIndex };
    setMultipleChoiceAnswers(updatedAnswers);
    logAnswerSelection('multiple_choice', questionId, optionIndex);
  };

  // Handler for text area answers
  const handleTextAnswer = (questionId, value) => {
    const updatedAnswers = { ...textAnswers, [questionId]: value };
    setTextAnswers(updatedAnswers);
    logAnswerSelection('text', questionId, value.length > 50 ? value.substring(0, 50) + "..." : value);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar - Only show on non-mobile screens */}
      {!isMobile && <Sidebar sidebarCollapsed={sidebarCollapsed} />}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: !isMobile ? (sidebarCollapsed ? "80px" : "270px") : 0,
          transition: "margin-left 0.3s ease",
          color: darkMode ? "white" : "inherit", // Add this line
        }}
      >
        {/* Always show Header, even on mobile */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Main Assignments Content */}
        <div style={{ padding: isMobile ? "10px" : "20px" }}>
          <Row className="mb-4">
            <Col>
              <h3 style={{ color: darkMode ? "white" : "inherit" }}>
                Assignments
              </h3>
              <p
                className="text"
                style={{
                  color: `${darkMode ? "rgb(255, 255, 255)" : "rgb(255, 255, 255)"} !important`,
                }}
              >
                View and submit your course assignments
              </p>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {assignments.length > 0 ? (
                <Row>
                  {assignments.map((assignment) => (
                    <Col md={6} lg={4} key={assignment.id} className="mb-4">
                      <Card
                        className="shadow-sm h-100"
                        style={{
                          backgroundColor: darkMode
                            ? "#333"
                            : "rgba(224, 224, 224, 0.8)",
                          color: darkMode ? "#fff" : "#00000",
                        }}
                      >
                        <Card.Body className="d-flex flex-column">
                          {/* Title and course info */}
                          <div>
                            <Card.Title
                              style={{ color: darkMode ? "#fff" : "#00000" }}
                            >
                              {assignment.title}
                            </Card.Title>
                            
                            <Card.Text
                              className="mb-2"
                              style={{ color: darkMode ? "#fff" : "#00000" }}
                            >
                              Course: {assignment.course_name}
                            </Card.Text>
                            
                            {/* Only show due date if it exists, otherwise don't show anything */}
                            {assignment.due_date && (
                              <Card.Text
                                className="mb-3"
                                style={{ color: darkMode ? "#fff" : "#00000" }}
                              >
                                Due: {new Date(assignment.due_date).toLocaleDateString()}
                              </Card.Text>
                            )}
                          </div>

                          {/* Status badges */}
                          <div className="mb-3">
                            {assignment.has_test_mode && (
                              <Badge bg="warning" className="me-2">
                                Secure Test
                              </Badge>
                            )}

                            {assignment.status === "pending" ? (
                              <Badge bg="info">Not Submitted</Badge>
                            ) : assignment.status === "submitted" ? (
                              <Badge bg="success">Submitted</Badge>
                            ) : assignment.status === "graded" ? (
                              <Badge bg="success">
                                Graded: {assignment.grade}
                              </Badge>
                            ) : assignment.due_date && new Date(assignment.due_date) < new Date() ? (
                              <Badge bg="danger">Late</Badge>
                            ) : null}
                          </div>
                          
                          {/* Spacer to push button to bottom */}
                          <div className="flex-grow-1"></div>
                          
                          {/* Button always at bottom */}
                          <div>
                            <Button
                              variant={darkMode ? "primary" : "light"}
                              style={{
                                borderColor: darkMode
                                  ? "#4285f4"
                                  : "rgb(21, 0, 255)",
                                backgroundColor: darkMode
                                  ? "#4285f4"
                                  : "rgb(21, 0, 255)",
                                color: darkMode ? "" : "#fff",
                              }}
                              onClick={() => handleAssignmentClick(assignment)}
                            >
                              View Assignment
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <p>No assignments available.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Assignment Detail Modal */}
        <Modal
          show={showAssignmentModal}
          onHide={() => {
            if (testMode) {
              handleExitAttempt();
              return;
            }
            setShowAssignmentModal(false);
          }}
          backdrop={testMode ? "static" : true}
          keyboard={!testMode}
          size="lg"
          centered
          fullscreen={testMode}
          className={darkMode ? "dark-mode-modal" : ""} // Apply dark mode to secure test modal
        >
          <Modal.Header className="border-0" closeButton={false}>
            <Modal.Title>{selectedAssignment?.title}</Modal.Title>
            {/* Custom close button for both normal and secure test modals */}
            <button
              type="button"
              className="btn-close-custom"
              onClick={() => {
                if (testMode) {
                  handleExitAttempt();
                  return;
                }
                setShowAssignmentModal(false);
              }}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: darkMode ? "#fff" : "#000",
                opacity: "0.5",
                cursor: testMode ? "not-allowed" : "pointer",
                padding: "0.25rem 0.5rem",
                marginLeft: "auto"
              }}
              onMouseOver={e => e.currentTarget.style.opacity = "1"}
              onMouseOut={e => e.currentTarget.style.opacity = "0.5"}
              disabled={testMode}
            >
              &#x2715;
            </button>
            {testMode && (
              <div className="ms-auto me-3 d-flex align-items-center">
                <div className="fw-bold text-danger">
                  Time Remaining: {formatTime(remainingTime)}
                </div>
              </div>
            )}
          </Modal.Header>

          <Modal.Body>
            {testMode ? (
              <div>
                {/* Test Mode UI */}
                <div className="mb-4">
                  <div className="alert alert-warning">
                    <strong>Secure Test Mode Active</strong>
                    <p>
                      Do not exit fullscreen or switch tabs. Violations will be
                      recorded.
                    </p>
                    <p>
                      Warnings: Fullscreen ({fullscreenWarnings}/{MAX_WARNINGS})
                      | Tab Switches ({tabSwitchWarnings}/{MAX_WARNINGS})
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h5>Test Instructions</h5>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedAssignment?.description,
                    }}
                  />
                </div>

                <div className="mb-4">
                  <h5>Test Questions</h5>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedAssignment?.test_content,
                    }}
                  />
                </div>

                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Your Answer</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      placeholder="Type your answers here..."
                    />
                  </Form.Group>
                </Form>
              </div>
            ) : (
              <div>
                {/* Normal Assignment View */}
                <div className="mb-4">
                  <h5>Course</h5>
                  <p>{selectedAssignment?.course_name}</p>
                </div>

                <div className="mb-4">
                  <h5>Due Date</h5>
                  <p>
                    {selectedAssignment?.due_date &&
                      new Date(
                        selectedAssignment.due_date
                      ).toLocaleDateString()}
                  </p>
                </div>

                <div className="mb-4">
                  <h5>Description</h5>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedAssignment?.description,
                    }}
                  />
                </div>

                {selectedAssignment?.files &&
                  selectedAssignment.files.length > 0 && (
                    <div className="mb-4">
                      <h5>Resources</h5>
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>File Name</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAssignment.files.map((file, index) => (
                            <tr key={index}>
                              <td>{file.name}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() =>
                                    window.open(file.url, "_blank")
                                  }
                                >
                                  Download
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}

                {selectedAssignment?.has_test_mode && (
                  <div className="alert alert-warning">
                    <h5>Secure Test Mode</h5>
                    <p>This assignment requires secure test mode:</p>
                    <ul>
                      <li>Full-screen mode required</li>
                      {selectedAssignment.time_limit_minutes && (
                        <li>
                          Time limit: {selectedAssignment.time_limit_minutes}{" "}
                          minutes
                        </li>
                      )}
                    </ul>
                    <p>
                      You cannot exit secure mode once started until submission.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            {testMode ? (
              <Button variant="danger" onClick={handleEndTest}>
                End Test & Submit
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowAssignmentModal(false)}
                >
                  Close
                </Button>

                {selectedAssignment?.status !== "submitted" &&
                  selectedAssignment?.status !== "graded" &&
                  (selectedAssignment?.has_test_mode ? (
                    <Button variant="warning" onClick={handleStartTest}>
                      <i className="fas fa-lock me-2"></i>
                      Start Secure Test
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => setShowSubmissionModal(true)}
                    >
                      Submit Assignment
                    </Button>
                  ))}
              </>
            )}
          </Modal.Footer>
        </Modal>

        {/* Submission Modal */}
        <Modal
          show={showSubmissionModal}
          onHide={() => !submitting && setShowSubmissionModal(false)}
          backdrop="static"
          keyboard={!submitting}
          centered
          size="lg"
          className={darkMode ? "dark-mode-modal" : ""}
        >
          <Modal.Header className="border-0" closeButton={false}>
            <Modal.Title>Submit Assignment</Modal.Title>
            <button
              type="button"
              className="btn-close-custom"
              onClick={() => !submitting && setShowSubmissionModal(false)}
              disabled={submitting}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: darkMode ? "#fff" : "#000", // This already sets white for dark mode, black for light
                opacity: "0.5",
                cursor: submitting ? "not-allowed" : "pointer",
                padding: "0.25rem 0.5rem",
                marginLeft: "auto"
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
              onMouseOut={(e) => e.currentTarget.style.opacity = "0.5"}
            >
              &#x2715;
            </button>
          </Modal.Header>

          {/* Add assignment details at the top of the submission modal body */}
          <Modal.Body>
            {/* Display assignment details at the top */}
            {selectedAssignment && (
              <div className="mb-4">
                <h5>Assignment Details</h5>
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-subtitle mb-2 text-muted">
                      Course: {selectedAssignment.course_name}
                    </h6>
                    <p className="card-text">
                      {selectedAssignment.due_date 
                        ? `Due Date: ${new Date(selectedAssignment.due_date).toLocaleDateString()}` 
                        : "No Due Date"}
                    </p>
                    
                    {/* Show submission status and grade if submitted */}
                    {(selectedAssignment.status === "submitted" || selectedAssignment.status === "graded") && (
                      <div className="alert alert-success mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>
                              {selectedAssignment.status === "submitted" ? "Submitted" : "Graded"}
                            </strong>
                            {selectedAssignment.submitted_at && (
                              <div className="small">
                                on {new Date(selectedAssignment.submitted_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                          {selectedAssignment.grade && (
                            <div className="badge bg-success fs-6">
                              Score: {selectedAssignment.grade}/{selectedAssignment.points || 100}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <h6>Instructions:</h6>
                      <div dangerouslySetInnerHTML={{ __html: selectedAssignment.description }} />
                    </div>
                    
                    {/* Show attachments if any */}
                    {selectedAssignment.files && selectedAssignment.files.length > 0 && (
                      <div>
                        <h6>Resources:</h6>
                        <ul className="list-group">
                          {selectedAssignment.files.map((file, idx) => (
                            <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                              {file.name}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => window.open(file.url, "_blank")}
                              >
                                Download
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Rest of your modal body content... */}
            {selectedAssignment && !selectedAssignment.has_test_mode && (
              <div className="mb-4">
                <h5>Questions</h5>
                {selectedAssignment.questions &&
                selectedAssignment.questions.length > 0 ? (
                  selectedAssignment.questions.map((question, index) => (
                    <div key={question.id} className="mb-4">
                      <h5 className="mb-2">Question {index + 1}</h5>
                      <p className="mb-3">{question.text}</p>
                      
                      {question.type === "multiple_choice" && (
                        <div className="ms-3 mt-3">
                          {question.options.map((option, optionIndex) => (
                            <Form.Check
                              key={optionIndex}
                              type="radio"
                              id={`question-${question.id}-option-${optionIndex}`}
                              name={`question-${question.id}`}
                              label={option.text}
                              checked={multipleChoiceAnswers[question.id] === optionIndex}
                              onChange={() => handleMultipleChoiceAnswer(question.id, optionIndex)}
                              disabled={previousSubmission !== null}
                              className={previousSubmission !== null && 
                                        multipleChoiceAnswers[question.id] === optionIndex ? 
                                        "text-primary fw-bold" : ""}
                            />
                          ))}
                          
                          {previousSubmission !== null && (
                            <div className="mt-2 text-muted">
                              <small><i>This answer was previously submitted and cannot be changed.</i></small>
                            </div>
                          )}
                        </div>
                      )}

                      {question.type === "text" && (
                        <div className="ms-3 mt-3">
                          <Form.Control
                            as="textarea"
                            rows={4}
                            placeholder="Enter your answer..."
                            value={textAnswers[question.id] || ""}
                            onChange={(e) => handleTextAnswer(question.id, e.target.value)}
                            disabled={previousSubmission !== null}
                          />
                          
                          {previousSubmission !== null && (
                            <div className="mt-2 text-muted">
                              <small><i>This answer was previously submitted and cannot be changed.</i></small>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No questions available.</p>
                )}
              </div>
            )}

            {/* Always show file upload option at bottom */}
            {submissionType === "text" && (
              <>
                <div className="mt-4">
                  <h6>Additional Comments for Teacher (Optional)</h6>
                  <Form.Group className="text">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Add any questions or comments for your instructor here..."
                      value={submissionText}
                      onChange={(e) => setSubmissionText(e.target.value)}
                      disabled={submitting}
                      style={{
                        backgroundColor: "#ffffff", // Always white background
                        color: "#000000", // Always black text
                        borderColor: darkMode ? "#555" : "inherit"
                      }}
                    />
                  </Form.Group>
                </div>
                
                <div className="mt-4">
                  <h6>Additional Files (Optional)</h6>
                  <Form.Group className="mb-3">
                    <Form.Control 
                      type="file" 
                      multiple
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                  </Form.Group>
                </div>
              </>
            )}
          </Modal.Body>

          {/* Update Modal.Footer to align buttons vertically */}
          <Modal.Footer className="d-flex flex-column align-items-stretch">
            <Button
              variant="secondary"
              onClick={() => setShowSubmissionModal(false)}
              disabled={submitting}
              className="mb-2 w-100" // Added margin-bottom and full width
            >
              {(selectedAssignment?.status === "submitted" || selectedAssignment?.status === "graded") 
                ? "Close" 
                : "Cancel"}
            </Button>
            
            {/* Only show Submit button if not already submitted */}
            {!(selectedAssignment?.status === "submitted" || selectedAssignment?.status === "graded") && (
              <Button
                variant="primary"
                onClick={handleSubmission}
                disabled={
                  submitting ||
                  previousSubmission !== null ||
                  // Validate that required questions have answers
                  selectedAssignment?.questions?.some(
                    (q) =>
                      q.required &&
                      ((q.type === "multiple_choice" &&
                        multipleChoiceAnswers[q.id] === undefined) ||
                        (q.type === "text" &&
                          (!textAnswers[q.id] ||
                            textAnswers[q.id].trim() === "")))
                  )
                }
                className="w-100" // Full width
              >
                {submitting ? "Submitting..." : "Submit Assignment"}
              </Button>
            )}
            
            {previousSubmission !== null && (
              <Alert variant="info" className="mt-3 mb-0 w-100">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                You've already submitted this assignment on {" "}
                {new Date(previousSubmission.submitted_at).toLocaleString()}. 
                Your submission is final and cannot be changed.
              </Alert>
            )}
          </Modal.Footer>
        </Modal>

        {/* Exit Test Confirmation Modal */}
        <Modal
          show={showExitConfirmModal}
          backdrop="static"
          keyboard={false}
          centered
        >
          <Modal.Header>
            <Modal.Title>Exit Test Mode?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="alert alert-danger">
              <strong>Warning!</strong> Leaving the test before completion may
              be considered an academic violation. Your instructor will be
              notified.
            </div>
            <Form.Group className="mb-3">
              <Form.Label>
                Please explain in detail why you need to exit the test:
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                placeholder="Technical issues, emergency, etc. (minimum 10 characters)"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowExitConfirmModal(false);
                // Try to re-enter fullscreen if needed
                if (!document.fullscreenElement) {
                  enterFullscreen().catch(console.error);
                }
              }}
            >
              Return to Test
            </Button>
            <Button
              variant="danger"
              onClick={confirmExitTest}
              disabled={!exitReason || exitReason.trim().length < 10}
            >
              Exit Test
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Add Mobile Navigation at bottom of page */}
        {isMobile && <MobileNav />}

        <style>
          {`
            .dark-mode-modal .modal-content {
              background-color: #333 !important;
              color: #fff !important;
            }
            
            .dark-mode-modal .modal-header,
            .dark-mode-modal .modal-footer {
              border-color: #444 !important;
            }
            
            .dark-mode-modal .card {
              background-color: ${darkMode ? '#2a2a2a' : '#fff'};
              border-color: ${darkMode ? '#444' : 'rgba(0,0,0,.125)'};
              color: ${darkMode ? '#fff' : 'inherit'};
            }
            
            .dark-mode-modal .text-muted {
              color: ${darkMode ? '#aaa !important' : '#6c757d !important'};
            }
            
            .dark-mode-modal .list-group-item {
              background-color: ${darkMode ? '#2a2a2a' : '#fff'};
              border-color: ${darkMode ? '#444' : 'rgba(0,0,0,.125)'};
              color: ${darkMode ? '#fff' : 'inherit'};
            }
            
            .dark-mode .btn-close {
              filter: invert(1) grayscale(100%) brightness(200%);
            }
            
            .dark-mode .form-control,
            .dark-mode .form-select {
              background-color: #444;
              color: #fff;
              border-color: #555;
            }
            
            .dark-mode-modal .form-control:focus,
            .dark-mode-modal .form-select:focus {
              background-color: #444;
              color: #fff;
            }
            
            .dark-mode-modal .form-control.white-bg {
              background-color: #fff !important;
              color: #000 !important;
            }

            /* Add mobile-specific styles */
            @media (max-width: 700px) {
              .card {
                margin-bottom: 15px;
              }
              
              .modal-dialog {
                margin: 0.5rem;
              }
              
              .modal-title {
                font-size: 1.1rem;
              }
            }
            
            /* Controls hiding/showing */
            .video-js.vjs-controls-hidden .vjs-control-bar {
              opacity: 0 !important;
              pointer-events: none;
              transition: opacity 0.3s ease;
            }
            
            .video-js:not(.vjs-controls-hidden) .vjs-control-bar {
              opacity: 1 !important;
              pointer-events: auto;
              transition: opacity 0.3s ease;
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default Assignments;
