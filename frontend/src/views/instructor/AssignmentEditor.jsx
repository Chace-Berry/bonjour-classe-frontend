import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useParams, useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import UserData from "../../views/plugin/UserData";
import { Form, Button, Overlay } from "react-bootstrap";
import { FaCalendarAlt, FaClock, FaPlus, FaChevronDown } from "react-icons/fa";
import InstructorSidebar from "./Partials/InstructorSidebar";
import Header from "./Partials/Header";
import Toast from "../../views/plugin/Toast";
import { TbGripVertical } from "react-icons/tb";

// Generate simple IDs without uuid to avoid dependency issues
const generateId = (prefix = '') => {
  return `${prefix}${Math.random().toString(36).substring(2, 10)}`;
};

const AssignmentEditor = () => {
  // Add sidebar state like in Dashboard
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Define all state variables first
  const [openTypeDropdown, setOpenTypeDropdown] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [formTitle, setFormTitle] = useState("Untitled Assignment");
  const [formDescription, setFormDescription] = useState("");
  const [dueDateEnabled, setDueDateEnabled] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [dueTime, setDueTime] = useState("23:59"); // Default time
  const [publishedStatus, setPublishedStatus] = useState("draft");
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [secureTest, setSecureTest] = useState(false); 
  const [showQuestionTypeMenu, setShowQuestionTypeMenu] = useState(false);
  const [isTimeLimited, setIsTimeLimited] = useState(false);
  const [timeLimit, setTimeLimit] = useState(30); // Default 30 minutes
  const [testContent, setTestContent] = useState("");
  // Add isSaving state here with all the other state variables
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState([
    {
      id: generateId('q'),
      type: "multiple_choice",
      title: "Question 1",
      description: "",
      required: true,
      points: 1,
      options: [
        { id: generateId('opt'), text: "Option 1", isCorrect: false },
        { id: generateId('opt'), text: "Option 2", isCorrect: false }
      ],
      correctFeedback: "Correct!",
      incorrectFeedback: "Try again!"
    }
  ]);
  
  // Other hooks and refs
  const api = useAxios();
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!assignmentId;
  const apiCallMade = useRef(false);
  
  // Use userData directly from UserData() like in Dashboard
  const userData = UserData();
  const teacherId = userData?.teacher_id;
  
// Log teacher data once on component mount
useEffect(() => {
  if (!teacherId) {
    // console.log("Not a teacher, redirecting to 404 page");
    Toast().fire({
      icon: "error",
      title: "Teacher access required",
    });
    navigate("/404");
  }
}, [teacherId, navigate]);
  
  // Define refs for dropdown positioning
  const typeButtonRefs = useRef({});
  
  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Helper constants 
  const primaryBlue = "#0d6efd"; // Bootstrap primary blue
  const darkBlue = "#0a58ca"; // Darker blue for hover states
  
  // Helper functions
  const getQuestionTypeName = (type) => {
    switch(type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'text': return 'Text Answer';
      case 'file_upload': return 'File Upload';
      default: return type;
    }
  };
  
  // Toggle dropdown function
  const toggleTypeDropdown = (questionId) => {
    if (openTypeDropdown === questionId) {
      setOpenTypeDropdown(null);
    } else {
      setOpenTypeDropdown(questionId);
    }
  };

  // Updated updateQuestionType function
  const updateQuestionType = (questionId, newType) => {
    // console.log(`Updating question ${questionId} to type: ${newType}`);
    
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      // Create new question object with the updated type
      const updated = { ...q, type: newType };
      
      // Add necessary properties based on the question type
      if (newType === 'multiple_choice') {
        // Ensure options exist and have the right structure
        if (!updated.options || updated.options.length < 2) {
          updated.options = [
            { id: generateId('opt'), text: "Option 1", isCorrect: true },
            { id: generateId('opt'), text: "Option 2", isCorrect: false }
          ];
        }
        // Ensure feedback properties exist
        updated.correctFeedback = updated.correctFeedback || "Correct!";
        updated.incorrectFeedback = updated.incorrectFeedback || "Try again!";
      } 
      else if (newType === 'text') {
        // Ensure sample answer exists
        updated.sampleAnswer = updated.sampleAnswer || "";
      } 
      else if (newType === 'file_upload') {
        // File upload might not need extra properties
      }
      
      return updated;
    }));
    
    // This ensures the dropdown closes after selection
    setOpenTypeDropdown(null);
  };

  // Update question field
  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };
  // Add this function right after getQuestionTypeName or before updateQuestionType function
const handleDateChange = (e) => {
  if (e.target.value) {
    setDueDate(new Date(e.target.value));
  } else {
    setDueDate(null);
  }
};

// Add these date helper functions if they're still missing
const handleSetToday = () => {
  setDueDate(new Date());
};

const handleSetNow = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  setDueTime(`${hours}:${minutes}`);
};
  
  // Handle drag and drop reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setQuestions(items);
  };
  
  // FIX: Define fetchAssignment BEFORE it's used in loadData
  const fetchAssignment = async () => {
    if (!assignmentId) return;
    
    try {
      // Use the correct endpoint with /get/
      const response = await api.get(`/teacher/assignment/${assignmentId}/get/`);
      const assignment = response.data;
      // console.log("Assignment loaded:", assignment);
      
      // Populate form with assignment data
      setFormTitle(assignment.title || "");
      setFormDescription(assignment.description || "");
      
      // Handle different ways the course ID might be returned from the API
      let courseId = null;
      
      // Check for course_id directly in the assignment
      if (assignment.course_id !== undefined && assignment.course_id !== null) {
        courseId = assignment.course_id;
      } 
      // Check if there's a course object with an id
      else if (assignment.course && assignment.course.id) {
        courseId = assignment.course.id;
      }
      // Check if the course is just the ID
      else if (assignment.course) {
        courseId = assignment.course;
      }
      
      // Set the selected course if we found an ID
      if (courseId !== null) {
        // console.log("Auto-selecting course:", courseId);
        setSelectedCourse(courseId.toString());
      }
      
      // Rest of your existing code...
      if (assignment.due_date) {
        setDueDateEnabled(true);
        const dueDateTime = new Date(assignment.due_date);
        setDueDate(dueDateTime);
        
        // Extract time in HH:MM format
        const hours = dueDateTime.getHours().toString().padStart(2, '0');
        const minutes = dueDateTime.getMinutes().toString().padStart(2, '0');
        setDueTime(`${hours}:${minutes}`);
      }
      
      setPublishedStatus(assignment.status || "draft");
      setSecureTest(assignment.has_test_mode || false);
      
      // Load questions if available
      if (assignment.questions && assignment.questions.length > 0) {
        const formattedQuestions = assignment.questions.map(q => ({
          id: generateId('q'),
          type: q.type || "multiple_choice",
          title: q.title || "Question",
          description: q.description || "",
          required: q.required !== undefined ? q.required : true,
          points: q.points || 1,
          options: (q.options || []).map(opt => ({
            id: generateId('opt'),
            text: opt.text || "Option",
            isCorrect: opt.is_correct || false
          })),
          correctFeedback: q.correct_feedback || "Correct!",
          incorrectFeedback: q.incorrect_feedback || "Try again!",
          sampleAnswer: q.sample_answer || ""
        }));
        
        setQuestions(formattedQuestions);
        
        // Calculate total points
        const total = formattedQuestions.reduce((sum, q) => sum + q.points, 0);
        setTotalPoints(total);
      }
    } catch (error) {
      // console.error("Error loading assignment:", error);
      Toast().fire({
        icon: 'error',
        title: 'Failed to load assignment details'
      });
    }
  };

  // Fetch courses when component mounts
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Make sure we have the teacherId
        if (!teacherId) {
          // console.error("Teacher ID not found");
          Toast().fire({
            icon: 'error',
            title: 'Teacher profile not found. Please ensure you\'re logged in with a teacher account.'
          });
          return;
        }
        
        // FIXED: Use the correct API endpoint for course list
        const response = await api.get(`teacher/course-lists/${teacherId}/`);
        setCourses(response.data);
        // console.log("Courses loaded:", response.data);
      } catch (error) {
        // console.error("Error loading courses:", error);
        Toast().fire({
          icon: 'error',
          title: 'Failed to load courses'
        });
      }
    };
    
    // Rest of your existing useEffect code

    // Check for dark mode
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark-mode') || 
                     (localStorage.getItem('appearanceSettings') && 
                      JSON.parse(localStorage.getItem('appearanceSettings')).darkMode);
      setDarkMode(isDark);
    };

    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchCourses();
        if (isEditMode) {
          await fetchAssignment();
        }
        checkDarkMode();
      } finally {
        setIsLoading(false);
        apiCallMade.current = true;
      }
    };
    
    // Add click outside handler for dropdown
    const handleClickOutside = (event) => {
      if (openTypeDropdown) {
        // Check if click is inside any type button or dropdown
        let isInsideDropdown = false;
        Object.keys(typeButtonRefs.current).forEach(id => {
          if (typeButtonRefs.current[id] && typeButtonRefs.current[id].contains(event.target)) {
            isInsideDropdown = true;
          }
        });
        
        if (!isInsideDropdown) {
          setOpenTypeDropdown(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    if (!apiCallMade.current) {
      loadData();
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [assignmentId, api, teacherId]);

  // Render component with loading state
  if (isLoading) {
    return <div className="p-5 text-center">Loading assignment data...</div>;
  }

  // Update the saveAssignment function
  const saveAssignment = async () => {
    if (!selectedCourse) {
      Toast().fire({
        icon: 'error',
        title: 'Please select a course'
      });
      return;
    }
    
    if (!formTitle.trim()) {
      Toast().fire({
        icon: 'error',
        title: 'Please enter an assignment title'
      });
      return;
    }
    
    // Calculate combined due date and time
    let dueDateTimeISO = null;
    if (dueDateEnabled && dueDate) {
      const [hours, minutes] = dueTime.split(':').map(Number);
      const dueDateTime = new Date(dueDate);
      dueDateTime.setHours(hours, minutes, 0, 0);
      dueDateTimeISO = dueDateTime.toISOString();
    }
    
    // Transform questions to format expected by API
    const formattedQuestions = questions.map((q, index) => {
      // Make sure we're properly sending the description field
      const base = {
        title: q.title || `Question ${index + 1}`,
        type: q.type,
        required: q.required,
        points: q.points,
        order: index
      };
      
      if (q.type === 'multiple_choice') {
        base.options = q.options.map(opt => ({
          text: opt.text,
          is_correct: opt.isCorrect
        }));
        base.correct_feedback = q.correctFeedback;
        base.incorrect_feedback = q.incorrectFeedback;
      } else if (q.type === 'text') {
        base.sample_answer = q.sampleAnswer || "";
      }
      
      return base;
    });
    
    const assignmentData = {
      title: formTitle,
      description: formDescription,
      course_id: selectedCourse,
      due_date: dueDateEnabled && dueDate ? dueDateTimeISO : null,
      status: publishedStatus,
      has_test_mode: secureTest,
      time_limit_minutes: secureTest && isTimeLimited ? timeLimit : null,
      test_content: secureTest ? testContent : null,
      questions: formattedQuestions
    };
    
    // Add assignment_id if we're in edit mode
    if (isEditMode) {
      assignmentData.assignment_id = assignmentId;
    }

    setIsSaving(true); // Show loading state
    
    try {
      let response;
      if (isEditMode) {
        // console.log("Updating assignment:", assignmentId, assignmentData);
        response = await api.post(`/teacher/assignment/${assignmentId}/`, assignmentData);
        // console.log("Update response:", response);
        
        Toast().fire({
          icon: 'success',
          title: 'Assignment updated successfully'
        });
      } else {
        // console.log("Creating new assignment:", assignmentData);
        response = await api.post("/teacher/assignment/", assignmentData);
        
        Toast().fire({
          icon: 'success',
          title: 'Assignment created successfully'
        });
        navigate("/teacher/assignments");
      }
    } catch (error) {
      // console.error("Error saving assignment:", error);
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           "Failed to save assignment";
      
      Toast().fire({
        icon: 'error',
        title: errorMessage
      });
    } finally {
      setIsSaving(false); // Hide loading state
    }
  };

  // Add a new question function
const addQuestion = (type) => {
  const newId = generateId('q');
  const pointsValue = 1; // Default point value for new questions
  
  let newQuestion = {
    id: newId,
    type: type,
    title: `Question ${questions.length + 1}`,
    description: "",
    required: true,
    points: pointsValue
  };
  
  // Add type-specific properties
  if (type === 'multiple_choice') {
    newQuestion.options = [
      { id: generateId('opt'), text: "Option 1", isCorrect: true },
      { id: generateId('opt'), text: "Option 2", isCorrect: false }
    ];
    newQuestion.correctFeedback = "Correct!";
    newQuestion.incorrectFeedback = "Try again!";
  } else if (type === 'text') {
    newQuestion.sampleAnswer = "";
  }
  
  // Add the new question to the array
  setQuestions([...questions, newQuestion]);
  
  // Set the new question as active
  setActiveQuestion(newId);
};

// Add this function if it's missing - place it near other question manipulation functions
const deleteOption = (questionId, optionId) => {
  const question = questions.find(q => q.id === questionId);
  if (!question || question.type !== 'multiple_choice') return;
  
  if (question.options.length <= 2) {
    Toast().fire({
      icon: 'error',
      title: 'Multiple choice questions must have at least two options'
    });
    return;
  }
  
  const updatedOptions = question.options.filter(opt => opt.id !== optionId);
  updateQuestion(questionId, 'options', updatedOptions);
};

// Also make sure you have this helper function for adding options
const addOption = (questionId) => {
  const question = questions.find(q => q.id === questionId);
  if (!question || question.type !== 'multiple_choice') return;
  
  const newOption = {
    id: generateId('opt'),
    text: `Option ${question.options.length + 1}`,
    isCorrect: false
  };
  
  updateQuestion(questionId, 'options', [...question.options, newOption]);
};

// Update the deleteQuestion function to automatically update total points
const deleteQuestion = (questionId) => {
  // Remove the question from the array
  setQuestions(questions.filter(q => q.id !== questionId));
  
  // If the deleted question was active, clear active selection
  if (activeQuestion === questionId) {
    setActiveQuestion(null);
  }
};
  
  // Return the actual component UI with updated layout structure matching Dashboard
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <InstructorSidebar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginTop: "40px",
          marginLeft: sidebarCollapsed ? "80px" : "270px", 
          transition: "margin-left 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Fixed Header */}
        <div 
          style={{ 
            position: "fixed",
            top: 0,
            right: 0,
            left: sidebarCollapsed ? "80px" : "270px",
            zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0)",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0)",
            transition: "left 0.3s ease",
          }}
        >
          <Header
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />
        </div>

        {/* Assignment Editor Content */}
        <div style={{ padding: "20px", marginTop: "60px" }}>
          <div className={`assignment-editor ${darkMode ? 'dark-mode' : 'light-mode'}`}>
            <style jsx="true">{`
              .assignment-editor {
                font-family: 'Roboto', Arial, sans-serif;
                padding: 0; /* Adjusted padding since we have outer padding */
              }
              
              .dark-mode {
                background-color: #121212;
                color: white;
                min-height: 100vh;
              }
              
              .light-mode {
                background-color:rgb(255, 254, 254);
                color: black;
                min-height: 100vh;
              }
              
              .header-card {
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-bottom: 16px;
                padding: 24px;
              }
              
              .dark-mode .header-card {
                background-color: #333;
                border-left-color: #444;
              }
              
              .light-mode .header-card {
                background-color: white;
              }
              
              .question-card {
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-bottom: 16px;
                border-left: 1px solid #dadce0;
                transition: all 0.2s;
              }

              .DropdownIndicator {
               color: rgba(0,0,0,0);
              }
              
              .dark-mode .question-card {
                background-color: #333;
                border-left-color: #444;
              }
              
              .light-mode .question-card {
                background-color: white;
              }
              
              .question-card.active {
                border-left: 6px solid ${primaryBlue};
              }
              
              .question-card:hover {
                box-shadow: 0 3px 12px rgba(0,0,0,0.15);
              }
              
              .question-header {
                display: flex;
                align-items: center;
                padding: 16px 24px;
                border-bottom: 1px solid #e0e0e0;
              }
              
              .dark-mode .question-header {
                border-bottom-color: #444;
              }
              
              .question-drag-handle {
                cursor: grab;
                margin-right: 12px;
              }
              
              .dark-mode .question-drag-handle {
                color: #ddd;
              }
              
              .light-mode .question-drag-handle {
                color: #5f6368;
              }
              
              .question-body {
                padding: 16px 24px;
              }
              
              .question-footer {
                display: flex;
                justify-content: space-between;
                padding: 8px 24px;
                border-top: 1px solid #e0e0e0;
              }
              
              .dark-mode .question-footer {
                background-color: #2a2a2a;
                border-top-color: #444;
              }
              
              .light-mode .question-footer {
                background-color: #f8f9fa;
              }
              
              .btn-custom {
                background-color:rgba(54, 6, 151, 0);
                color : Blue;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                border : 1px solid rgb(0, 22, 145);
                padding: 8px 24px;
                border-radius: 4px;
                font-weight: 500;
              }
              
              .btn-custom.outline {
                background-color: transparent;
                color:rgb(60, 0, 165);
                border: 1px solidrgb(66, 0, 181);
              }
              
              .dark-mode .btn-custom.outline {
                background-color: #444;
                color: white;
                border: 1px solid #777;
              }
              
              .btn-custom:hover {
                background-color:rgb(0, 13, 193);
                color: #fff;

              }
              
              .btn-custom.outline:hover {
                background-color: #f0f0f0;
              }
              
              .dark-mode .btn-custom.outline:hover {
                background-color: #555;
              }
              
              .option-row {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
              }
              
              .option-circle {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid #5f6368;
                margin-right: 12px;
              }
              
              .dark-mode .option-circle {
                border-color: #aaa;
              }
              
              /* Input styling */
              .form-control, .form-select {
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 12px;
              }
              
              /* Fix the toggle slider indicator */
              .toggle-slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
              }
              
              /* Remove dropdown indicators from all select elements */
              .form-select {
                appearance: none !important;
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                background-image: none !important;
                padding-right: 8px !important;
              }
              
              .dark-mode .form-control,
              .dark-mode .form-select {
                background-color: white !important;
                color: black !important;
                border: 1px solid #444;
              }
              
              .light-mode .form-control,
              .light-mode .form-select {
                background-color: #f8f9fa !important;
                color: black !important;
                border: 1px solid #ddd;
              }
              
              /* Toggle switch styling */
              .toggle-switch {
                position: relative;
                display: inline-block;
                width: 48px;
                height: 24px;
                margin-right: 10px;
              }
              
              .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
              }
              
              .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 24px;
              }
              
              .toggle-slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
              }
              
              input:checked + .toggle-slider {
                background-color:rgb(0, 13, 160);
              }
              
              input:checked + .toggle-slider:before {
                transform: translateX(24px);
              }
              
              .toggle-label {
                vertical-align: middle;
                margin-left: 5px;
              }
              
              /* Date/time styling */
              .date-time-container {
                display: flex;
                gap: 10px;
                align-items: center;
                margin-bottom: 10px;
              }

              /* Floating Action Button */
              .add-question-wrapper {
                margin: 30px 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
              }
              
              .add-question-button {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background-color: ${primaryBlue};
                color: white;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 3px 10px rgba(13, 110, 253, 0.3);
                cursor: pointer;
                border: none;
                transition: all 0.2s ease;
                overflow: hidden;
              }

              .add-question-button:hover {
                transform: scale(1.05);
                background-color: ${darkBlue};
                box-shadow: 0 5px 15px rgba(13, 110, 253, 0.4);
              }
              
              .add-question-button:active {
                transform: scale(0.95);
              }
              
              .add-question-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
                opacity: 0;
                transition: opacity 0.3s;
              }
              
              .add-question-button:hover::before {
                opacity: 1;
              }
              
              /* Question Type Menu Styling */
              .question-type-menu {
                position: absolute;
                right: 30px;
                bottom: 100px;
                background-color: white;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                width: 200px;
                z-index: 999;
                overflow: hidden;
                transition: transform 0.3s, opacity 0.3s;
                transform-origin: bottom right;
              }

              .dark-mode .question-type-menu {
                background-color: #333;
              }

              .question-type-menu.hidden {
                transform: scale(0.8);
                opacity: 0;
                pointer-events: none;
              }

              .question-type-option {
                padding: 12px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                transition: background-color 0.2s;
              }

              .light-mode .question-type-option:hover {
                background-color: #f0f0f0;
              }

              .dark-mode .question-type-option {
                color: #fff;
              }

              .dark-mode .question-type-option:hover {
                background-color: #444;
              }

              .question-type-option i {
                margin-right: 12px;
                width: 20px;
                text-align: center;
              }

              .question-type-button {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.4rem 0.8rem;
                background-color: ${darkMode ? '#3a3a3a' : '#ffffff'};
                color: ${darkMode ? '#ffffff' : '#333333'};
                border: 1px solid ${darkMode ? '#555555' : '#e0e0e0'};
                border-radius: 4px;
                font-size: 0.85rem;
                font-weight: 500;
                min-width: 140px;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-right: 12px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.08);
              }

              .question-type-button:hover {
                border-color: ${darkMode ? '#777777' : '#ccc'};
                background-color: ${darkMode ? '#444444' : '#f9f9f9'};
              }

              .question-type-dropdown {
                position: absolute;
                top: calc(100% + 5px);
                left: 0;
                z-index: 1050;
                min-width: 180px;
                background-color: ${darkMode ? '#2d2d2d' : '#ffffff'};
                border-radius: 6px;
                box-shadow: 0 6px 16px rgba(0,0,0,${darkMode ? '0.3' : '0.15'});
                overflow: hidden;
                opacity: 0;
                transform: translateY(-10px);
                animation: dropdownFadeIn 0.2s ease forwards;
                border: 1px solid ${darkMode ? '#444444' : 'rgba(0,0,0,0.08)'};
              }

              @keyframes dropdownFadeIn {
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              .question-type-item {
                display: flex;
                width: 100%;
                padding: 10px 16px;
                border: none;
                background: none;
                text-align: left;
                font-size: 0.9rem;
                color: ${darkMode ? '#e0e0e0' : '#333333'};
                cursor: pointer;
                transition: all 0.15s ease;
                border-left: 2px solid transparent;
              }

              .question-type-item:hover {
                background-color: ${darkMode ? '#3a3a3a' : '#f5f9ff'};
                border-left-color: ${primaryBlue};
                color: ${darkMode ? '#ffffff' : primaryBlue};
              }

              .question-type-item:not(:last-child) {
                border-bottom: 1px solid ${darkMode ? '#3a3a3a' : '#f0f0f0'};
              }

              .question-type-item-icon {
                margin-right: 8px;
                width: 16px;
                opacity: 0.7;
              }
            `}</style>
            
            {/* Header Card with Title and Description */}
            <div className="header-card mb-4">
              <input 
                type="text"
                className="form-control form-control-lg mb-3"
                style={{ fontSize: '24px', border: 'none', borderBottom: '1px solid #ccc' }}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Assignment Title"
              />
              
              <textarea 
                className="form-control"
                style={{ border: 'none', borderBottom: '1px solid #ccc' }}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Description (optional)"
                rows="2"
              ></textarea>
              
              <div className="d-flex justify-content-between align-items-center mt-4">
                <div className="d-flex align-items-center">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={secureTest}
                      onChange={() => setSecureTest(!secureTest)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label">Secure Test Mode</span>
                </div>
                
                <select 
                  className="form-select ms-2"
                  style={{ width: 'auto' }}
                  value={publishedStatus}
                  onChange={(e) => setPublishedStatus(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              {secureTest && (
                <div className={`alert mt-3 ${darkMode ? 'alert-info bg-dark text-light' : 'alert-info'}`}>
                  <strong>Secure Test Mode:</strong> Students will be unable to navigate away from the test or open other applications while taking it.
                  
                  <div className="mt-3">
                    <div className="d-flex align-items-center mb-2">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={isTimeLimited}
                          onChange={() => setIsTimeLimited(!isTimeLimited)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className="toggle-label">Time Limited Test</span>
                    </div>
                    
                    {isTimeLimited && (
                      <div className="d-flex align-items-center mt-2">
                        <input 
                          type="number" 
                          className="form-control form-control-sm"
                          style={{ width: '80px' }}
                          value={timeLimit}
                          onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                          min="1"
                        />
                        <span className="ms-2">minutes</span>
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="form-label">Test Instructions/Content</label>
                      <textarea 
                        className="form-control"
                        value={testContent}
                        onChange={(e) => setTestContent(e.target.value)}
                        placeholder="Enter test instructions or additional content..."
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Course Selection */}
            <div className="question-card mb-4">
              <div className="question-body">
                <h5 className="mb-3">Assignment Details</h5>
                
                <div className="mb-3">
                  <label className="form-label">Course</label>
                  <select 
                    className="form-select"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    required
                    disabled={isEditMode} // Disable when in edit mode
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  {isEditMode && (
                    <div className="form-text text-info">
                      Course cannot be changed after assignment creation
                    </div>
                  )}
                </div>
                
                {/* Due Date Toggle */}
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={dueDateEnabled}
                        onChange={() => setDueDateEnabled(!dueDateEnabled)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className="toggle-label">Set Due Date</span>
                  </div>
                  
                  {dueDateEnabled && (
                    <div>
                      <div className="date-time-container">
                        <input 
                          type="date" 
                          className="form-control" 
                          value={dueDate ? dueDate.toISOString().split('T')[0] : ''} 
                          onChange={handleDateChange}
                        />
                        <Button 
                          variant={darkMode ? "outline-light" : "outline-secondary"}
                          size="sm"
                          onClick={handleSetToday}
                          className="btn-today"
                        >
                          Today <FaCalendarAlt className="ms-1" />
                        </Button>
                      </div>
                      
                      <div className="date-time-container">
                        <input 
                          type="time" 
                          className="form-control" 
                          value={dueTime} 
                          onChange={(e) => setDueTime(e.target.value)}
                        />
                        <Button 
                          variant={darkMode ? "outline-light" : "outline-secondary"}
                          size="sm"
                          onClick={handleSetNow}
                          className="btn-now"
                        >
                          Now <FaClock className="ms-1" />
                        </Button>
                      </div>
                      
                      <div className="text small">
                        Note: you are 2 hours ahead of server time.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Points Summary */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>Total Points: {totalPoints}</h5>
            </div>
            
            {/* Questions */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="questions" type="QUESTIONS">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="questions-container"
                    style={{ minHeight: '50px' }}
                  >
                    {questions.map((question, index) => (
                      <Draggable 
                        key={question.id} 
                        draggableId={question.id} 
                        index={index}
                      >
                        {(providedDrag) => (
                          <div
                            ref={providedDrag.innerRef}
                            {...providedDrag.draggableProps}
                            className={`question-card mb-3 ${activeQuestion === question.id ? 'active' : ''}`}
                            onClick={() => setActiveQuestion(question.id)}
                          >
                            <div className="question-header">
                            <div
                              {...providedDrag.dragHandleProps}  // FIXED - using Draggable's providedDrag
                              className="question-drag-handle"
                              >
                              <TbGripVertical size={18} />
                              </div>
                              <span className="me-2">Question {index + 1}</span>
                              <div className="ms-auto d-flex align-items-center">
                                <div className="position-relative">
                                  <select
                                    className="form-select"
                                    value={question.type}
                                    onChange={(e) => updateQuestionType(question.id, e.target.value)}
                                    style={{ minWidth: '140px', marginRight: '20px' }} // Increased spacing here
                                  >
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="text">Text Answer</option>
                                    <option value="file_upload">File Upload</option>
                                  </select>
                                </div>
                                <span className="badge bg-secondary ms-2">{question.points} {question.points === 1 ? 'point' : 'points'}</span>
                              </div>
                            </div>
                            
                            <div className="question-body">
                              <input 
                                type="text" 
                                className="form-control mb-3" 
                                value={question.title}
                                onChange={(e) => updateQuestion(question.id, 'title', e.target.value)}
                                placeholder="Question"
                              />

                              {question.type === "multiple_choice" && (
                                <div className="mt-3">
                                  {question.options.map((option, optIndex) => (
                                    <div key={option.id} className="option-row">
                                      <div className="form-check">
                                        <input 
                                          type="radio" 
                                          className="form-check-input" 
                                          name={`correct-${question.id}`}
                                          checked={option.isCorrect}
                                          onChange={() => {
                                            // Set this option as correct, all others as incorrect
                                            const updatedOptions = question.options.map((opt, i) => ({
                                              ...opt,
                                              isCorrect: i === optIndex
                                            }));
                                            updateQuestion(question.id, 'options', updatedOptions);
                                          }}
                                        />
                                      </div>
                                      <input 
                                        type="text" 
                                        className="form-control"
                                        value={option.text}
                                        onChange={(e) => {
                                          const updatedOptions = [...question.options];
                                          updatedOptions[optIndex] = {
                                            ...updatedOptions[optIndex],
                                            text: e.target.value
                                          };
                                          updateQuestion(question.id, 'options', updatedOptions);
                                        }}
                                        placeholder={`Option ${optIndex + 1}`}
                                      />
                                      {question.options.length > 2 && (
                                        <button 
                                          className="btn btn-sm btn-outline-danger ms-2"
                                          onClick={() => deleteOption(question.id, option.id)}
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  
                                  <button 
                                    className="btn btn-sm btn-outline-primary mt-2"
                                    onClick={() => addOption(question.id)}
                                  >
                                    <i className="fas fa-plus me-1"></i> Add option
                                  </button>
                                </div>
                              )}
                              
                              {question.type === "text" && (
                                <div className="mt-3">
                                  <div className="border rounded p-3" 
                                    style={{ 
                                      background: darkMode ? '#444' : '#f8f9fa',
                                      color: darkMode ? '#ccc' : '#666'
                                    }}>
                                    <p className="mb-2">Text answer field will appear for students</p>
                                    <textarea 
                                      className="form-control"
                                      value={question.sampleAnswer || ''}
                                      onChange={(e) => updateQuestion(question.id, 'sampleAnswer', e.target.value)}
                                      placeholder="Enter a sample or expected answer (optional)"
                                      rows="2"
                                    ></textarea>
                                  </div>
                                </div>
                              )}
                              
                              {question.type === "file_upload" && (
                                <div className="mt-3">
                                  <div 
                                    className="border rounded p-3 text-center" 
                                    style={{ 
                                      background: darkMode ? '#f8f9fa' : '#f8f9fa',
                                      color: darkMode ? '#ccc' : '#666'
                                    }}
                                  >
                                    <i className="fas fa-cloud-upload-alt me-2"></i>
                                    File Upload Area
                                    <div className="mt-2">
                                      <small>Students will be able to upload files here</small>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="question-footer">
                              <div>
                                <div className="form-check">
                                  <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id={`required-${question.id}`}
                                    checked={question.required}
                                    onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                                  />
                                  <label className="form-check-label" htmlFor={`required-${question.id}`}>
                                    Required
                                  </label>
                                </div>
                              </div>
                              
                              <div className="d-flex align-items-center">
                                <input 
                                  type="number" 
                                  className="form-control form-control-sm"
                                  style={{ width: '60px' }}
                                  value={question.points}
                                  onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 0)}
                                  min="0"
                                />
                                <span className="ms-2 me-3">points</span>
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteQuestion(question.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <div className="add-question-wrapper">
              <button 
                className="add-question-button"
                onClick={() => addQuestion("multiple_choice")}
                aria-label="Add question"
              >
                <FaPlus />
              </button>
                </div>
            {/* Save/Cancel Buttons */}
            <div className="d-flex justify-content-between mt-5">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate("/teacher/assignments")}
              >
                Cancel
              </button>
              <button 
                className="btn btn-custom"
                onClick={saveAssignment}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {isEditMode ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  isEditMode ? "Update Assignment" : "Save Assignment"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentEditor;