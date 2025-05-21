import React, { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useParams, useNavigate } from "react-router-dom";
import useAxios from "../../utils/useAxios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import UserData from "../plugin/UserData";
import { Form, Button, Overlay } from "react-bootstrap";
import { FaPlus, FaChevronDown, FaDotCircle, FaEllipsisV, FaRegDotCircle, FaTimes, FaTrash } from "react-icons/fa";
import { TbGripVertical } from "react-icons/tb";
import InstructorSidebar from "./Partials/InstructorSidebar";
import Header from "./Partials/Header";
import Toast from "../plugin/Toast";

// Generate simple IDs without uuid to avoid dependency issues
const generateId = (prefix = '') => {
  return `${prefix}${Math.random().toString(36).substring(2, 10)}`;
};

const QuizEditor = () => {
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // State variables
  const [openTypeDropdown, setOpenTypeDropdown] = useState(null);
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedLecture, setSelectedLecture] = useState("");
  const [formTitle, setFormTitle] = useState("Untitled Quiz");
  const [formDescription, setFormDescription] = useState("");
  const [publishedStatus, setPublishedStatus] = useState("draft");
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [questions, setQuestions] = useState([
    {
      id: generateId('q'),
      type: "multiple_choice",
      title: "Question 1",
      description: "",
      required: true,
      points: 1,
      options: [
        { id: generateId('opt'), text: "Option 1", isCorrect: true },
        { id: generateId('opt'), text: "Option 2", isCorrect: false }
      ]
    }
  ]);
  
  // Hooks and refs
  const api = useAxios();
  const { quizId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!quizId;
  const apiCallMade = useRef(false);
  const typeButtonRefs = useRef({});
  
  // User data
  const userData = UserData();
  const teacherId = userData?.teacher_id;
  
  // Helper constants 
  const primaryBlue = "#0d6efd"; // Bootstrap primary blue
  const darkBlue = "#0a58ca"; // Darker blue for hover states

  // Add this to the question type options
  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True/False' },
    { value: 'checkbox', label: 'Checkbox (Multiple Answers)' },
    { value: 'sentence_building', label: 'Sentence Building' },
  ];
  
  // Teacher validation
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

  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Helper functions
  const getQuestionTypeName = (type) => {
    switch(type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'True/False';
      case 'checkbox': return 'Checkbox';
      default: return type;
    }
  };
  
  // Toggle dropdown function
  const toggleTypeDropdown = (questionId) => {
    setOpenTypeDropdown(openTypeDropdown === questionId ? null : questionId);
  };

  // Update question type function
  const updateQuestionType = (questionId, newType) => {
    // console.log(`Updating question ${questionId} to type: ${newType}`);
    
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      // Create new question object with the updated type
      const updated = { ...q, type: newType };
      
      // Add necessary properties based on the question type
      if (newType === 'multiple_choice') {
        updated.options = [
          { id: generateId('opt'), text: "Option 1", isCorrect: true },
          { id: generateId('opt'), text: "Option 2", isCorrect: false }
        ];
      } 
      else if (newType === 'true_false') {
        updated.options = [
          { id: generateId('opt'), text: "True", isCorrect: true },
          { id: generateId('opt'), text: "False", isCorrect: false }
        ];
      }
      else if (newType === 'checkbox') {
        updated.options = [
          { id: generateId('opt'), text: "Option 1", isCorrect: true },
          { id: generateId('opt'), text: "Option 2", isCorrect: false },
          { id: generateId('opt'), text: "Option 3", isCorrect: false }
        ];
      }
      else if (newType === 'sentence_building') {
        // Initialize sentence building format with empty values
        updated.options = {
          words: [],
          correct_order: [],
          translation: ""
        };
      }
      
      return updated;
    }));
    
    setOpenTypeDropdown(null);
  };

  // Update question field
  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => {
      if (q.id !== id) return q;
      
      // Handle special case for sentence building options
      if (field === 'options' && q.type === 'sentence_building') {
        return {
          ...q,
          options: value  // Replace the entire options object
        };
      }
      
      // Handle all other cases normally
      return { ...q, [field]: value };
    }));
    
    // Debug logging to help diagnose issues
    if (field === 'options') {
      const question = questions.find(q => q.id === id);
      if (question?.type === 'sentence_building') {
        // console.log("Updated sentence building options:", value);
      }
    }
  };
  
  // Update option field
  const updateOption = (questionId, optionId, field, value) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      const updatedOptions = q.options.map(opt => 
        opt.id === optionId ? { ...opt, [field]: value } : opt
      );
      
      return { ...q, options: updatedOptions };
    }));
  };
  
  // Set correct option (for multiple choice questions)
  const setCorrectOption = (questionId, optionId) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      
      // For multiple choice, only one option can be correct
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        const updatedOptions = q.options.map(opt => ({
          ...opt,
          isCorrect: opt.id === optionId
        }));
        return { ...q, options: updatedOptions };
      }
      
      // For checkbox, toggle the correct state
      if (q.type === 'checkbox') {
        const updatedOptions = q.options.map(opt => 
          opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
        );
        return { ...q, options: updatedOptions };
      }
      
      return q;
    }));
  };
  
  // Handle drag and drop reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setQuestions(items);
  };
  
  // Fetch quiz
  const fetchQuiz = async () => {
    if (!quizId) return;
    
    try {
      const response = await api.get(`/quizzes/${quizId}/`);
      const quiz = response.data;
      // console.log("Quiz loaded:", quiz);
      
      // Populate form with quiz data
      setFormTitle(quiz.title || "");
      setFormDescription(quiz.description || "");
      
      // Set the selected course if one exists
      if (quiz.course) {
        // console.log("Auto-selecting course:", quiz.course);
        setSelectedCourse(quiz.course.toString());
      }

      // Set the selected lecture if one exists
      if (quiz.lecture) {
        // console.log("Auto-selecting lecture:", quiz.lecture);
        setSelectedLecture(quiz.lecture.toString());
      }
      
      setPublishedStatus(quiz.status || "draft");
      
      // Load questions if available
      if (quiz.questions && quiz.questions.length > 0) {
        const formattedQuestions = quiz.questions.map(q => {
          const baseQuestion = {
            id: generateId('q'),
            type: q.type || "multiple_choice",
            title: q.title || "Question",
            description: q.description || "",
            required: q.required !== undefined ? q.required : true,
            points: q.points || 1,
          };

          // Handle options depending on the question type
          if (q.type === 'sentence_building') {
            // For sentence building, options is an object
            baseQuestion.options = {
              words: Array.isArray(q.options?.words) ? q.options.words : [],
              correct_order: Array.isArray(q.options?.correct_order) ? q.options.correct_order : [],
              translation: q.options?.translation || ''
            };
          } else {
            // For multiple choice, true/false, and checkbox, options is an array
            baseQuestion.options = Array.isArray(q.options) ? 
              q.options.map(opt => ({
                id: generateId('opt'),
                text: opt.text || "Option",
                isCorrect: opt.is_correct || false
              })) : 
              // Default options if none provided
              [
                { id: generateId('opt'), text: "Option 1", isCorrect: true },
                { id: generateId('opt'), text: "Option 2", isCorrect: false }
              ];
          }
          
          return baseQuestion;
        });
        
        setQuestions(formattedQuestions);
        
        // Calculate total points
        const total = formattedQuestions.reduce((sum, q) => sum + (parseInt(q.points) || 0), 0);
        setTotalPoints(total);
      }
    } catch (error) {
      // console.error("Error loading quiz:", error);
      Toast().fire({
        icon: 'error',
        title: 'Failed to load quiz details'
      });
    }
  };

  // Load lectures when course is selected
  useEffect(() => {
    const fetchLectures = async () => {
      if (!selectedCourse) {
        setLectures([]);
        return;
      }

      try {
        const response = await api.get(`/course/${selectedCourse}/lectures/`);
        setLectures(response.data);
        // console.log("Lectures loaded:", response.data);
      } catch (error) {
        // console.error("Error loading lectures:", error);
        Toast().fire({
          icon: 'error',
          title: 'Failed to load lectures'
        });
      }
    };

    fetchLectures();
  }, [selectedCourse]); // Only depend on selectedCourse, not api

  // Fetch courses when component mounts
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!teacherId) {
          // console.error("Teacher ID not found");
          return;
        }
        
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
    
    // Check for dark mode
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark-mode') || 
                    (localStorage.getItem('appearanceSettings') && 
                      JSON.parse(localStorage.getItem('appearanceSettings')).darkMode);
      setDarkMode(isDark);
    };

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await fetchCourses();
        if (isEditMode && quizId) {
          await fetchQuiz();
        }
        checkDarkMode();
      } finally {
        setIsLoading(false);
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
    loadInitialData(); // Call this directly without the apiCallMade check
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Calculate total points when questions change
  useEffect(() => {
    const calculatedTotal = questions.reduce((sum, q) => sum + (parseInt(q.points) || 0), 0);
    setTotalPoints(calculatedTotal);
  }, [questions]);

  // Save the quiz
  const saveQuiz = async () => {
    if (!selectedCourse && !selectedLecture) {
      Toast().fire({
        icon: 'error',
        title: 'Please select either a course or a lecture'
      });
      return;
    }
    
    if (!formTitle.trim()) {
      Toast().fire({
        icon: 'error',
        title: 'Please enter a quiz title'
      });
      return;
    }

    // Transform questions to format expected by API
    const formattedQuestions = questions.map((q, index) => {
      const base = {
        title: q.title || `Question ${index + 1}`,
        type: q.type,
        required: q.required,
        points: q.points,
        order: index
      };
      
      if (['multiple_choice', 'true_false', 'checkbox'].includes(q.type)) {
        base.options = q.options.map(opt => ({
          text: opt.text,
          is_correct: opt.isCorrect
        }));
      }
      else if (q.type === 'sentence_building') {
        // Special handling for sentence building questions
        base.options = {
          words: Array.isArray(q.options?.words) ? q.options.words : [],
          correct_order: Array.isArray(q.options?.correct_order) ? q.options.correct_order : 
                        Array.from({ length: (q.options?.words || []).length }, (_, i) => i),
          translation: q.options?.translation || ''
        };
      }
      
      return base;
    });
    
    const quizData = {
      title: formTitle,
      description: formDescription,
      course_id: selectedCourse || null,
      lecture_id: selectedLecture || null,
      status: publishedStatus,
      points: totalPoints,
      questions: formattedQuestions
    };
    
    // Add quiz_id if we're in edit mode
    if (isEditMode) {
      quizData.quiz_id = quizId;
    }

    setIsSaving(true);
    
    try {
      let response;
      if (isEditMode) {
        // console.log("Updating quiz:", quizId, quizData);
        response = await api.put(`/quizzes/${quizId}/update/`, quizData);
        // console.log("Update response:", response);
        
        Toast().fire({
          icon: 'success',
          title: 'Quiz updated successfully'
        });
      } else {
        // console.log("Creating new quiz:", quizData);
        response = await api.post("/quizzes/create/", quizData);
        
        Toast().fire({
          icon: 'success',
          title: 'Quiz created successfully'
        });
        navigate("/teacher/quizzes");
      }
    } catch (error) {
      // console.error("Error saving quiz:", error);
      const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           "Failed to save quiz";
      
      Toast().fire({
        icon: 'error',
        title: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add a new question
  const addQuestion = () => {
    const newId = generateId('q');
    
    const newQuestion = {
      id: newId,
      type: "multiple_choice",
      title: `Question ${questions.length + 1}`,
      description: "",
      required: true,
      points: 1,
      options: [
        { id: generateId('opt'), text: "Option 1", isCorrect: true },
        { id: generateId('opt'), text: "Option 2", isCorrect: false }
      ]
    };
    
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(newId);
  };

  // Delete an option
  const deleteOption = (questionId, optionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !['multiple_choice', 'checkbox'].includes(question.type)) return;
    
    // For multiple_choice, ensure we have at least 2 options
    // For checkbox, ensure we have at least 3 options
    const minOptions = question.type === 'multiple_choice' ? 2 : 3;
    
    if (question.options.length <= minOptions) {
      Toast().fire({
        icon: 'error',
        title: `${getQuestionTypeName(question.type)} questions must have at least ${minOptions} options`
      });
      return;
    }
    
    const updatedOptions = question.options.filter(opt => opt.id !== optionId);
    updateQuestion(questionId, 'options', updatedOptions);
  };

  // Add an option
  const addOption = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !['multiple_choice', 'checkbox'].includes(question.type)) return;
    
    const newOption = {
      id: generateId('opt'),
      text: `Option ${question.options.length + 1}`,
      isCorrect: false
    };
    
    updateQuestion(questionId, 'options', [...question.options, newOption]);
  };

  // Delete a question
  const deleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
    
    if (activeQuestion === questionId) {
      setActiveQuestion(null);
    }
  };

  // Add word to question function
  const addWordToQuestion = (questionId, word) => {
    // Create a copy of the questions array
    const updatedQuestions = questions.map(q => {
      if (q.id !== questionId) return q;
      
      // Find the question to update
      const updatedQuestion = {...q};
      
      // Make sure options exists
      if (!updatedQuestion.options) {
        updatedQuestion.options = { words: [], correct_order: [] };
      }
      
      // Make sure words array exists
      const words = Array.isArray(updatedQuestion.options.words) ? 
        [...updatedQuestion.options.words] : [];
      
      // Add the new word to the words array, but don't automatically add to correct_order
      words.push(word);
      
      // Update the options - keeping the existing correct_order unchanged
      updatedQuestion.options = {
        ...updatedQuestion.options,
        words: words,
        // Don't modify correct_order here
      };
      
      // Reset the input field
      updatedQuestion.newWord = '';
      
      // console.log("Added word to reservoir only:", updatedQuestion);
      return updatedQuestion;
    });
    
    // Update the questions state directly
    setQuestions(updatedQuestions);
  };

  // Loading state
  if (isLoading) {
    return <div className="p-5 text-center">Loading quiz data...</div>;
  }

  // Render component
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
        {/* Header */}
        <div 
          style={{ 
            position: "fixed",
            top: 0,
            right: 0,
            left: sidebarCollapsed ? "80px" : "270px",
            zIndex: 1000,
            transition: "left 0.3s ease",
          }}
        >
          <Header
            sidebarCollapsed={sidebarCollapsed}
            toggleSidebar={toggleSidebar}
          />
        </div>

        {/* Quiz Editor Content */}
        <div style={{ padding: "20px", marginTop: "60px" }}>
          <div className={`quiz-editor ${darkMode ? 'dark-mode' : 'light-mode'}`}>
            <style jsx="true">{`
              .quiz-editor {
                font-family: 'Roboto', Arial, sans-serif;
                padding: 0;
              }
              
              .dark-mode {
                background-color: #121212;
                color: white;
                min-height: 100vh;
              }
              
              .light-mode {
                background-color: rgb(255, 254, 254);
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
                background-color: rgba(54, 6, 151, 0);
                color: Blue;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                border: 1px solid rgb(0, 22, 145);
                padding: 8px 24px;
                border-radius: 4px;
                font-weight: 500;
              }
              
              .btn-custom.outline {
                background-color: transparent;
                color: rgb(60, 0, 165);
                border: 1px solid rgb(66, 0, 181);
              }
              
              .dark-mode .btn-custom.outline {
                background-color: #444;
                color: white;
                border: 1px solid #777;
              }
              
              .btn-custom:hover {
                background-color: rgb(0, 13, 193);
                color: #fff;
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
              
              .form-control, .form-select {
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 12px;
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
                background-color: rgb(0, 13, 160);
              }
              
              input:checked + .toggle-slider:before {
                transform: translateX(24px);
              }
              
              .toggle-label {
                vertical-align: middle;
                margin-left: 5px;
              }
              
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
              
              .action-buttons {
                display: flex;
                justify-content: flex-end;
                margin-top: 20px;
              }
              
              .action-buttons button {
                margin-left: 10px;
              }
              
              .save-button {
                min-width: 100px;
              }
              
              .points-badge {
                background-color: ${primaryBlue};
                color: white;
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 4px;
                margin-left: 10px;
              }
            `}</style>

            {/* Quiz Header Section */}
            <div className="header-card">
              <h2>{isEditMode ? "Edit Quiz" : "Create Quiz"}</h2>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Quiz Title"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={publishedStatus}
                      onChange={(e) => setPublishedStatus(e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label>Select Course</Form.Label>
                    <Form.Select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        setSelectedLecture(""); // Reset lecture when course changes
                      }}
                    >
                      <option value="">Select a Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6 mb-3">
                  <Form.Group>
                    <Form.Label>Select Lecture (Optional)</Form.Label>
                    <Form.Select
                      value={selectedLecture}
                      onChange={(e) => setSelectedLecture(e.target.value)}
                      disabled={!selectedCourse}
                    >
                      <option value="">Select a Lecture</option>
                      {lectures.map(lecture => (
                        <option key={lecture.id} value={lecture.id}>
                          {lecture.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-12 mb-3">
                  <Form.Group>
                    <Form.Label>Description (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Quiz description"
                      rows="3"
                    />
                  </Form.Group>
                </div>
              </div>
            </div>

            {/* Total Points display moved out of header card */}
            <div className="mb-3">
              <span style={{ fontWeight: "500" }}>Total Points: {totalPoints}</span>
            </div>

            {/* Questions Section */}
            <div className="questions-section">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="questions">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {questions.map((question, index) => (
                        <Draggable key={question.id} draggableId={question.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`question-card mb-4 ${activeQuestion === question.id ? 'active' : ''}`}
                              onClick={() => setActiveQuestion(question.id)}
                            >
                              <div className="question-header">
                                <div
                                  {...provided.dragHandleProps}
                                  className="question-drag-handle"
                                >
                                  <TbGripVertical size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <strong>Question {index + 1}</strong>
                                </div>
                                <div className="ms-auto d-flex align-items-center">
                                  <div className="position-relative">
                                    <select
                                      className="form-select"
                                      value={question.type}
                                      onChange={(e) => updateQuestionType(question.id, e.target.value)}
                                      style={{ minWidth: '160px', marginRight: '20px' }}
                                    >
                                      <option value="multiple_choice">Multiple Choice</option>
                                      <option value="true_false">True/False</option>
                                      <option value="checkbox">Checkbox</option>
                                      <option value="sentence_building">Sentence Building</option>
                                    </select>
                                  </div>
                                  <span className="badge bg-secondary ms-2">{question.points} {question.points !== 1 ? 'pts' : 'pt'}</span>
                                </div>
                              </div>
                              
                              <div className="question-body">
                                <Form.Control
                                  type="text"
                                  value={question.title}
                                  onChange={(e) => updateQuestion(question.id, 'title', e.target.value)}
                                  placeholder="Question text"
                                  className="mb-3"
                                />
                                
                                {/* Options for multiple choice or checkbox questions */}
                                {['multiple_choice', 'true_false', 'checkbox'].includes(question.type) && (
                                  <div className="mt-3">
                                    {question.options.map((option, optIndex) => (
                                      <div key={option.id} className="option-row">
                                        {question.type === 'multiple_choice' || question.type === 'true_false' ? (
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
                                        ) : (
                                          <Form.Check
                                            type="checkbox"
                                            checked={option.isCorrect}
                                            onChange={() => setCorrectOption(question.id, option.id)}
                                          />
                                        )}
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
                                        {question.type !== 'true_false' && question.options.length > 2 && (
                                          <button 
                                            className="btn btn-sm btn-outline-danger ms-2"
                                            onClick={() => deleteOption(question.id, option.id)}
                                            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}
                                          >
                                            <FaTimes />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    
                                    {/* Add option button (not for true/false) */}
                                    {question.type !== 'true_false' && (
                                      <button 
                                        className="btn btn-sm btn-outline-primary mt-2"
                                        onClick={() => addOption(question.id)}
                                      >
                                        <FaPlus className="me-1" /> Add option
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Sentence Building Question Editor */}
                                {question.type === 'sentence_building' && (
                                  <div className="mt-3">
                                    <Form.Group className="mb-3">
                                      <Form.Label>Pre-Translated Sentence:</Form.Label>
                                      <Form.Control
                                        type="text"
                                        value={question.options?.translation || ''}
                                        onChange={(e) => {
                                          const updatedOptions = {
                                            ...question.options,
                                            words: question.options?.words || [],
                                            correct_order: question.options?.correct_order || [],
                                            translation: e.target.value
                                          };
                                          updateQuestion(question.id, 'options', updatedOptions);
                                        }}
                                        placeholder="English Version of the sentence of the sentence (e.g., 'I am a student')"
                                      />
                                    </Form.Group>

                                    {/* Wrap both sections in a single DragDropContext */}
                                    <DragDropContext
                                      onDragEnd={(result) => {
                                        if (!result.destination) return;
                                        
                                        const sourceId = result.source.droppableId;
                                        const destId = result.destination.droppableId;
                                        
                                        // console.log("Drag ended:", sourceId, "->", destId);
                                        
                                        // Moving within the word reservoir
                                        if (sourceId === `reservoir-${question.id}` && destId === `reservoir-${question.id}`) {
                                          const words = Array.from(question.options?.words || []);
                                          const [reorderedWord] = words.splice(result.source.index, 1);
                                          words.splice(result.destination.index, 0, reorderedWord);
                                          
                                          const updatedOptions = {
                                            ...question.options,
                                            words,
                                          };
                                          
                                          updateQuestion(question.id, 'options', updatedOptions);
                                        }
                                        
                                        // Moving within the sentence builder area
                                        else if (sourceId === `sentence-${question.id}` && destId === `sentence-${question.id}`) {
                                          const correctOrder = Array.isArray(question.options?.correct_order) ? 
                                            [...question.options.correct_order] : [];
                                          
                                          const [movedIndex] = correctOrder.splice(result.source.index, 1);
                                          correctOrder.splice(result.destination.index, 0, movedIndex);
                                          
                                          const updatedOptions = {
                                            ...question.options,
                                            correct_order: correctOrder
                                          };
                                          
                                          updateQuestion(question.id, 'options', updatedOptions);
                                        }
                                        
                                        // Moving from word reservoir to sentence builder
                                        else if (sourceId === `reservoir-${question.id}` && destId === `sentence-${question.id}`) {
                                          // console.log("Moving from reservoir to sentence");
                                          
                                          // Get the source word index
                                          const sourceIdx = result.source.index;
                                          
                                          // Get current correct order array or create empty one
                                          const correctOrder = Array.isArray(question.options?.correct_order) ? 
                                            [...question.options.correct_order] : [];
                                          
                                          // Insert at the destination position
                                          correctOrder.splice(result.destination.index, 0, sourceIdx);
                                          
                                          // Update the question options
                                          const updatedOptions = {
                                            ...question.options,
                                            correct_order: correctOrder
                                          };
                                          
                                          updateQuestion(question.id, 'options', updatedOptions);
                                        }
                                        
                                        // Moving from sentence builder back to word reservoir
                                        else if (sourceId === `sentence-${question.id}` && destId === `reservoir-${question.id}`) {
                                          // console.log("Moving from sentence back to reservoir");
                                          
                                          // Get the correct order array
                                          const correctOrder = Array.isArray(question.options?.correct_order) ? 
                                            [...question.options.correct_order] : [];
                                          
                                          // Remove the word from the correct order
                                          correctOrder.splice(result.source.index, 1);
                                          
                                          // Update the question options
                                          const updatedOptions = {
                                            ...question.options,
                                            correct_order: correctOrder
                                          };
                                          
                                          updateQuestion(question.id, 'options', updatedOptions);
                                        }
                                      }}
                                    >
                                      {/* Word Reservoir Section */}
                                      <Form.Group className="mb-4">
                                        <Form.Label>
                                          <strong>Word Reservoir</strong> - Add words here first, then drag them to the sentence builder below
                                        </Form.Label>
                                        <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                                          <Droppable droppableId={`reservoir-${question.id}`} direction="horizontal">
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="d-flex flex-wrap gap-2 mb-3"
                                                style={{ 
                                                  minHeight: '60px', 
                                                  border: snapshot.isDraggingOver ? '2px solid #007bff' : '2px dashed #ccc', 
                                                  padding: '10px', 
                                                  backgroundColor: snapshot.isDraggingOver ? '#e8f4ff' : '#f0f0f0',
                                                  borderRadius: '4px',
                                                  transition: 'all 0.2s ease'
                                                }}
                                              >
                                                {Array.isArray(question.options?.words) && question.options.words.length > 0 ? (
                                                  question.options.words.map((word, idx) => (
                                                    <Draggable key={`word-${idx}`} draggableId={`word-${question.id}-${idx}`} index={idx}>
                                                      {(provided, snapshot) => (
                                                        <div
                                                          ref={provided.innerRef}
                                                          {...provided.draggableProps}
                                                          {...provided.dragHandleProps}
                                                          className="d-flex align-items-center"
                                                          style={{ 
                                                            ...provided.draggableProps.style,
                                                            boxShadow: snapshot.isDragging ? '0 5px 10px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)', 
                                                            cursor: 'grab',
                                                            backgroundColor: snapshot.isDragging ? '#007bff' : '#fff',
                                                            color: snapshot.isDragging ? 'white' : 'black',
                                                            padding: '8px 12px',
                                                            margin: '5px',
                                                            borderRadius: '4px',
                                                            fontWeight: 'bold',
                                                            fontSize: '16px',
                                                            transform: snapshot.isDragging ? `${provided.draggableProps.style.transform} scale(1.05)` : provided.draggableProps.style.transform,
                                                            userSelect: 'none',
                                                            transition: 'background-color 0.2s ease'
                                                          }}
                                                        >
                                                          <span className="me-2">{word}</span>
                                                          <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm ms-2 p-1"
                                                            aria-label="Remove word"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              const updatedWords = [...question.options.words];
                                                              updatedWords.splice(idx, 1);
                                                              
                                                              // Also remove any references to this index from correct_order
                                                              const updatedCorrectOrder = Array.isArray(question.options.correct_order) ? 
                                                                question.options.correct_order.filter(i => i !== idx) : [];
                                                              
                                                              // Adjust indices in correct_order that are greater than the removed index
                                                              const adjustedCorrectOrder = updatedCorrectOrder.map(i => 
                                                                i > idx ? i - 1 : i
                                                              );
                                                              
                                                              const updatedOptions = {
                                                                ...question.options,
                                                                words: updatedWords,
                                                                correct_order: adjustedCorrectOrder
                                                              };
                                                              
                                                              updateQuestion(question.id, 'options', updatedOptions);
                                                            }}
                                                            style={{ 
                                                              display: 'flex', 
                                                              alignItems: 'center', 
                                                              justifyContent: 'center', 
                                                              width: '26px', 
                                                              height: '26px',
                                                              color: '#dc3545',
                                                              borderColor: 'transparent'
                                                            }}
                                                          >
                                                            <FaTrash size={14} />
                                                          </button>
                                                        </div>
                                                      )}
                                                    </Draggable>
                                                  ))
                                                ) : (
                                                  <div className="text-center w-100 p-3" style={{ fontWeight: 'bold', color: '#6c757d' }}>
                                                    No words added yet. Use the input below to add words.
                                                  </div>
                                                )}
                                                {provided.placeholder}
                                              </div>
                                            )}
                                          </Droppable>
                                          
                                          {/* Add word input */}
                                          <div className="input-group">
                                            <input
                                              type="text"
                                              className="form-control"
                                              placeholder="Type a new word or phrase"
                                              value={question.newWord || ''}
                                              onChange={(e) => {
                                                updateQuestion(question.id, 'newWord', e.target.value);
                                              }}
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter' && e.target.value.trim()) {
                                                  e.preventDefault();
                                                  const word = e.target.value.trim();
                                                  // console.log("Adding word via Enter:", word);
                                                  addWordToQuestion(question.id, word);
                                                }
                                              }}
                                            />
                                            <button
                                              className="btn btn-primary"
                                              type="button"
                                              onClick={() => {
                                                if (question.newWord?.trim()) {
                                                  const word = question.newWord.trim();
                                                  // console.log("Adding word via button click:", word);
                                                  addWordToQuestion(question.id, word);
                                                }
                                              }}
                                            >
                                              Add Word
                                            </button>
                                          </div>
                                        </div>
                                      </Form.Group>

                                      {/* Sentence Builder Section */}
                                      <Form.Group className="mb-4">
                                        <Form.Label>
                                          <strong>Sentence Builder</strong> - Drag words from above to arrange them in the correct order
                                        </Form.Label>
                                        <div className="border rounded p-3" style={{ backgroundColor: '#f8f9fa' }}>
                                          <Droppable droppableId={`sentence-${question.id}`} direction="horizontal">
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="d-flex flex-wrap gap-2 mb-3"
                                                style={{ 
                                                  minHeight: '60px', 
                                                  border: snapshot.isDraggingOver ? '2px solid #28a745' : '2px dashed #28a745', 
                                                  padding: '10px', 
                                                  backgroundColor: snapshot.isDraggingOver ? '#e8fff0' : '#f0f0f0',
                                                  borderRadius: '4px',
                                                  transition: 'all 0.2s ease'
                                                }}
                                              >
                                                {Array.isArray(question.options?.correct_order) && question.options.correct_order.length > 0 ? (
                                                  question.options.correct_order.map((wordIdx, idx) => {
                                                    // Get the actual word using the index stored in correct_order
                                                    const word = question.options?.words?.[wordIdx] || 'Unknown';
                                                    
                                                    return (
                                                      <Draggable key={`sentence-word-${idx}`} draggableId={`sentence-${question.id}-${idx}`} index={idx}>
                                                        {(provided, snapshot) => (
                                                          <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="d-flex align-items-center"
                                                            style={{ 
                                                              ...provided.draggableProps.style,
                                                              boxShadow: snapshot.isDragging ? '0 5px 10px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)',
                                                              cursor: 'grab',
                                                              backgroundColor: snapshot.isDragging ? '#28a745' : '#e8fff0',
                                                              color: snapshot.isDragging ? 'white' : 'black',
                                                              padding: '8px 12px',
                                                              margin: '5px',
                                                              borderRadius: '4px',
                                                              fontWeight: 'bold',
                                                              fontSize: '16px',
                                                              transform: snapshot.isDragging ? `${provided.draggableProps.style.transform} scale(1.05)` : provided.draggableProps.style.transform,
                                                              userSelect: 'none',
                                                              transition: 'background-color 0.2s ease'
                                                            }}
                                                          >
                                                            <span className="me-2">{word}</span>
                                                            <button
                                                              type="button"
                                                              className="btn btn-outline-danger btn-sm ms-2 p-1"
                                                              aria-label="Remove word"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                const updatedCorrectOrder = [...question.options.correct_order];
                                                                updatedCorrectOrder.splice(idx, 1);
                                                                
                                                                const updatedOptions = {
                                                                  ...question.options,
                                                                  correct_order: updatedCorrectOrder
                                                                };
                                                                
                                                                updateQuestion(question.id, 'options', updatedOptions);
                                                              }}
                                                              style={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center', 
                                                                width: '26px', 
                                                                height: '26px',
                                                                color: '#dc3545',
                                                                borderColor: 'transparent'
                                                              }}
                                                            >
                                                              <FaTrash size={14} />
                                                            </button>
                                                          </div>
                                                        )}
                                                      </Draggable>
                                                    );
                                                  })
                                                ) : (
                                                  <div className="text-center w-100 p-3" style={{ fontWeight: 'bold', color: '#28a745' }}>
                                                    Drag words here to build the correct sentence order.
                                                  </div>
                                                )}
                                                {provided.placeholder}
                                              </div>
                                            )}
                                          </Droppable>

                                          <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                              <button
                                                className="btn btn-outline-secondary btn-sm me-2"
                                                onClick={() => {
                                                  // Clear all words from the sentence
                                                  const updatedOptions = {
                                                    ...question.options,
                                                    correct_order: []
                                                  };
                                                  
                                                  updateQuestion(question.id, 'options', updatedOptions);
                                                }}
                                              >
                                                Clear Sentence
                                              </button>
                                            </div>
                                            
                                            <div className="text-end">
                                              <small className="text-muted">
                                                Drag words from above to arrange them in the correct order.
                                                This will be the solution against which student answers will be checked.
                                              </small>
                                            </div>
                                          </div>
                                        </div>
                                      </Form.Group>
                                    </DragDropContext>
                                  </div>
                                )}
                              </div>
                              
                              <div className="question-footer">
                                <div className="d-flex align-items-center">
                                  <Form.Check
                                    type="checkbox"
                                    label="Required"
                                    checked={question.required}
                                    onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                                  />
                                </div>
                                <div className="d-flex align-items-center">
                                  <Form.Control
                                    type="number"
                                    value={question.points}
                                    onChange={(e) => updateQuestion(question.id, 'points', e.target.value)}
                                    min="0"
                                    max="100"
                                    style={{ width: '70px' }}
                                  />
                                  <span className="ms-2">points</span>
                                  <Button 
                                    variant="outline-danger"
                                    size="sm"
                                    className="ms-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteQuestion(question.id);
                                    }}
                                  >
                                    Delete
                                  </Button>
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

              {/* Add Question Button */}
              <div className="add-question-wrapper">
                <button 
                  className="add-question-button"
                  onClick={() => addQuestion("multiple_choice")}
                  aria-label="Add question"
                >
                  <FaPlus />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-between mt-5">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate('/teacher/quiz')}
              >
                Cancel
              </button>
              <button 
                className="btn btn-custom"
                onClick={saveQuiz}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {isEditMode ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  isEditMode ? "Update Quiz" : "Create Quiz"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizEditor;