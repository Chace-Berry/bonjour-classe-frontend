import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container, Row, Col, Button, Form, Spinner, Alert, Modal
} from "react-bootstrap";
import axios from 'axios';
import useAxios from "../../utils/useAxios"; 
import Toast from "../plugin/Toast";

function SecureTest() {
  // State variables
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [inFullscreen, setInFullscreen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [timerId, setTimerId] = useState(null);
  const [exitReason, setExitReason] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);
  const [isPageHidden, setIsPageHidden] = useState(false); // Track page visibility
  const [isTabFocused, setIsTabFocused] = useState(true);  // Track tab focus state
  const [secureTestAnswers, setSecureTestAnswers] = useState({});
  
  const MAX_WARNINGS = 3;
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  // Load assignment data when component mounts
  useEffect(() => {
    loadAssignment();
    
    // Set up beforeunload handler
    const handleBeforeUnload = (e) => {
      if (inFullscreen) {
        e.preventDefault();
        e.returnValue = "Leaving this page will terminate your test. Are you sure?";
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerId) clearInterval(timerId);
      
      // Only attempt to exit fullscreen if we're currently in fullscreen mode
      if (document.fullscreenElement) {
        try {
          document.exitFullscreen();
        } catch (e) {
          //          console.error("Error exiting fullscreen:", e);
        }
      }
    };
  }, [inFullscreen, timerId]);

  // Load assignment details
  const loadAssignment = async () => {
    try {
      setLoading(true);
      const api = useAxios(); // Get the axios instance
      //      console.log("Loading assignment ID:", assignmentId); // Debug
      
      const response = await api.get(`/student/assignment/${assignmentId}/`);
      //      console.log("Assignment response:", response.data); // Debug
      
      const assignmentData = response.data;
      
      // Add this validation
      if (!assignmentData) {
        throw new Error('No assignment data returned');
      }
      
      setAssignment(assignmentData);
      
      // Set up timer if time limit exists
      if (assignmentData.time_limit_minutes) {
        setRemainingTime(assignmentData.time_limit_minutes * 60);
      }
      
      setLoading(false);
    } catch (error) {
      //      console.error("Error loading assignment:", error);
      // Show more detail in the error
      Toast().fire({
        icon: "error",
        title: `Failed to load test: ${error.message || "Unknown error"}`
      });
      navigate("/student/assignments");
    }
  };
  
  // Set up timer effect
  useEffect(() => {
    if (inFullscreen && assignment && remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      setTimerId(timer);
      return () => clearInterval(timer);
    }
  }, [inFullscreen, assignment, remainingTime]);
  
  // Set up fullscreen and tab switch detection with enhanced focus monitoring
  useEffect(() => {
    if (!inFullscreen) return;
    
    // Fullscreen change detection
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleFullscreenWarning();
      }
    };
    
    // Tab/page visibility detection
    const handleVisibilityChange = () => {
      const isHidden = document.visibilityState === "hidden";
      setIsPageHidden(isHidden);
      
      if (isHidden) {
        handleTabSwitchWarning();
      }
    };
    
    // Window blur detection - using blur/focus events
    const handleWindowBlur = () => {
      setIsTabFocused(false);
      handleTabSwitchWarning();
    };
    
    const handleWindowFocus = () => {
      setIsTabFocused(true);
    };
    
    // Capture right-click to prevent context menu
    const preventContextMenu = (e) => {
      e.preventDefault();
      Toast().fire({
        icon: "error",
        title: "Right-click is disabled during the test",
      });
    };
    
    // Prevent key combinations like Alt+Tab, Ctrl+T, etc.
    const handleKeyDown = (e) => {
      // Prevent Alt+Tab, Alt+F4
      if (e.altKey && (e.key === 'Tab' || e.key === 'F4')) {
        e.preventDefault();
        Toast().fire({
          icon: "warning",
          title: "Switching windows is not allowed during the test",
        });
      }
      
      // Prevent Ctrl+N (new window), Ctrl+T (new tab)
      if (e.ctrlKey && (e.key === 'n' || e.key === 't')) {
        e.preventDefault();
        Toast().fire({
          icon: "warning",
          title: "Opening new tabs/windows is not allowed during the test",
        });
      }
      
      // Prevent F11 (fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
      }
      
      // Prevent print screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        Toast().fire({
          icon: "warning",
          title: "Screenshots are not allowed during the test",
        });
      }
    };
    
    // Prevent copy/paste/cut operations
    const preventClipboardOperations = (e) => {
      e.preventDefault();
      Toast().fire({
        icon: "warning",
        title: "Copy, cut, and paste are not allowed during the test",
      });
    };
    
    // Point lock API for cursor confinement (optional, may not work in all browsers)
    const requestPointerLock = () => {
      try {
        const element = document.documentElement;
        if (element.requestPointerLock) {
          element.requestPointerLock();
        }
      } catch (error) {
        //        console.error("Pointer lock failed:", error);
      }
    };
    
    // Add all event listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", preventClipboardOperations);
    document.addEventListener("paste", preventClipboardOperations);
    document.addEventListener("cut", preventClipboardOperations);
    
    // Setup periodic focus check every 2 seconds
    const focusCheckInterval = setInterval(() => {
      if (!document.hasFocus() && !isPageHidden) {
        // If the page doesn't have focus but isn't hidden (another window/app is active)
        handleTabSwitchWarning();
      }
    }, 2000);
    
    // Clean up
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", preventClipboardOperations);
      document.removeEventListener("paste", preventClipboardOperations);
      document.removeEventListener("cut", preventClipboardOperations);
      clearInterval(focusCheckInterval);
      
      // Release pointer lock if active
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    };
  }, [inFullscreen, isPageHidden]);
  
  // Handle fullscreen warning
  const handleFullscreenWarning = async () => {
    const newWarnings = fullscreenWarnings + 1;
    setFullscreenWarnings(newWarnings);
    
    try {
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: assignmentId,
        action: "fullscreen_exit",
        details: `Fullscreen exit detected (Warning ${newWarnings}/${MAX_WARNINGS})`
      });
      
      if (newWarnings >= MAX_WARNINGS) {
        setExitReason("Too many fullscreen exits");
        setShowExitModal(true);
      }
    } catch (error) {
      //      console.error("Error logging fullscreen exit:", error);
    }
  };
  
  // Handle tab switch warning
  const handleTabSwitchWarning = async () => {
    const newWarnings = tabSwitchWarnings + 1;
    setTabSwitchWarnings(newWarnings);
    
    try {
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: assignmentId,
        action: "tab_switch",
        details: `Tab switch detected (Warning ${newWarnings}/${MAX_WARNINGS})`
      });
      
      if (newWarnings >= MAX_WARNINGS) {
        setExitReason("Too many tab switches");
        setShowExitModal(true);
      }
    } catch (error) {
      //      console.error("Error logging tab switch:", error);
    }
  };
  
  // Request fullscreen - must be triggered by user action
  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      
      // Start the test
      setInFullscreen(true);
      
      // Log test start
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: assignmentId,
        action: "start_test",
        details: "Test started in secure mode"
      });
      
      Toast().fire({
        icon: "info",
        title: "Test mode activated. Please do not exit fullscreen or switch tabs.",
      });
    } catch (error) {
      //      console.error("Failed to enter fullscreen:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to enter fullscreen mode. Please try again.",
      });
    }
  };

  // Fix: Use a dedicated openFullscreen function for the button
  const openFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
    setInFullscreen(true);
  };

  // Also add this function to safely exit fullscreen
  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement) {
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
      setInFullscreen(false);
    } catch (error) {
      //      console.error("Error exiting fullscreen:", error);
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Log test completion
      await useAxios().post(`/student/assignment-test-log/`, {
        assignment_id: assignmentId,
        action: "end_test",
        details: `Test completed. Fullscreen warnings: ${fullscreenWarnings}, Tab switch warnings: ${tabSwitchWarnings}`
      });
      
      // Submit the test
      const formData = new FormData();
      formData.append("assignment_id", assignmentId);
      formData.append("submission_text", submissionText);
      formData.append("fullscreen_warnings", fullscreenWarnings);
      formData.append("tab_switch_warnings", tabSwitchWarnings);
      formData.append("secure_mode_used", true);
      formData.append("answers", JSON.stringify(secureTestAnswers));
      
      await useAxios().post("/student/assignment-submission/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      Toast().fire({
        icon: "success",
        title: "Test submitted successfully"
      });
      
      // Safely exit fullscreen before navigation
      try {
        if (document.fullscreenElement) {
          exitFullscreen();
          // Small delay to ensure fullscreen is exited properly
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (err) {
        //        console.error("Error exiting fullscreen:", err);
      }
      
      // Navigate back with success message
      navigate("/student/assignments", { state: { testCompleted: true } });
    } catch (error) {
      //      console.error("Error submitting test:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to submit test"
      });
      setSubmitting(false);
    }
  };
  
  return (
    <div className="secure-test-page">
      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading secure test environment...</p>
        </div>
      ) : !inFullscreen ? (
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Alert variant="info">
                <Alert.Heading>Start Secure Test</Alert.Heading>
                <p>
                  This test must be taken in full-screen mode. No tab switching, 
                  copying/pasting, or printing is allowed during the test.
                </p>
                <hr />
                <p className="mb-0">
                  When you're ready to begin, click the button below.
                </p>
              </Alert>
              
              <div className="text-center">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={openFullscreen}
                >
                  Start Secure Test
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      ) : (
        <Container fluid className="p-4">
          <Alert variant="warning" className="mb-4">
            <strong>SECURE TEST MODE ACTIVE</strong>
            <p>Do not exit fullscreen. Violations will be recorded.</p>
            <p>Warnings: Fullscreen: {fullscreenWarnings}/{MAX_WARNINGS} | Tab Switches: {tabSwitchWarnings}/{MAX_WARNINGS}</p>
          </Alert>
          
          {/* Test Content */}
          <div className="mb-4">
            <h1>{assignment?.title}</h1>
            <div className="my-4">
              <h3>Instructions</h3>
              <div dangerouslySetInnerHTML={{ __html: assignment?.description }} />
            </div>
            
            {/* Add this section to show test content */}
            {assignment?.test_content && (
              <div className="my-4">
                <h3>Test Content</h3>
                <div dangerouslySetInnerHTML={{ __html: assignment?.test_content }} />
              </div>
            )}
            
            {/* Add this section to show questions */}
            {assignment?.questions && assignment.questions.length > 0 ? (
              <div className="my-4">
                <h3>Questions</h3>
                {assignment.questions.map((question, index) => (
                  <div key={question.id || index} className="card mb-3 p-3">
                    <h5>{index + 1}. {question.title}</h5>
                    {question.description && <p>{question.description}</p>}
                    
                    {question.type === 'multiple_choice' && question.options && (
                      <div className="mt-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="form-check">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              id={`option-${question.id || index}-${optIndex}`}
                              className="form-check-input"
                              checked={secureTestAnswers[question.id] === optIndex}
                              onChange={() => setSecureTestAnswers(prev => ({ ...prev, [question.id]: optIndex }))}
                            />
                            <label 
                              className="form-check-label" 
                              htmlFor={`option-${question.id || index}-${optIndex}`}
                            >
                              {option.text}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'text' && (
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Your answer..."
                        className="mt-2"
                        value={secureTestAnswers[question.id] || ""}
                        onChange={e => setSecureTestAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                      />
                    )}
                    
                    {question.type === 'file_upload' && (
                      <Form.Control
                        type="file"
                        className="mt-2"
                      />
                    )}
                    
                    <div className="mt-1 text-end text-muted">
                      <small>{question.points} point{question.points !== 1 ? 's' : ''}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-info">
                No questions found for this assignment.
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="text-end">
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </Button>
          </div>
        </Container>
      )}
      <style>{`
      body.dark-mode .form-control, body.dark-mode .form-select
      {
        background-color: #ffffff;
        color: #000000;
      }
      
      `}
      </style>
    </div>
  );
}

export default SecureTest;