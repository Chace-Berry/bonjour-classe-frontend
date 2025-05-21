// Import the additional components we'll need
import React, { useState, useEffect } from "react";
import Modal from 'react-bootstrap/Modal';
import { useNavigate } from "react-router-dom";
import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";
import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";
import Cookies from "js-cookie";
import moment from "moment";
import { FaCheck, FaTimes, FaRegClock } from "react-icons/fa";
// Update the imports to include drag and drop
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MobileNav from "./Partials/Mobile_Nav";

function Quizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  
  // Add states for the Duolingo-style quiz modal
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(5);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [correctQuestions, setCorrectQuestions] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  
  // Add a new state for the quit confirmation dialog
  const [showQuitConfirmation, setShowQuitConfirmation] = useState(false);

  // Add this new state for tracking quiz failure
  const [quizFailed, setQuizFailed] = useState(false);
  
  // Add this for handling sentence building questions
  const [selectedWords, setSelectedWords] = useState([]);
  const [remainingWords, setRemainingWords] = useState([]);

  const [quizCategory, setQuizCategory] = useState("all");
  const [quizSortBy, setQuizSortBy] = useState("newest");

  const navigate = useNavigate();
  
  // French theme colors
  const frenchBlue = "#0055A4";
  const frenchWhite = "#FFFFFF";
  const frenchRed = "#EF4135";

  // Function to start a quiz
  const startQuiz = async (quizId) => {
    setIsLoading(true);
    try {
      // Fetch the quiz questions from the API
      const response = await useAxios().get(`student/quiz/${quizId}/`);
      const quiz = response.data;
      
      // console.log("Quiz loaded:", quiz);
      
      setCurrentQuiz(quiz);
      setQuizQuestions(quiz.questions || []);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowQuizModal(true);
      setShowResult(false);
      setHearts(5); // Reset hearts
      setWrongQuestions([]); // Reset wrong questions
      setCorrectQuestions([]); // Reset correct questions
      setQuizCompleted(false); // Reset quiz completion status
      setQuizFailed(false); // Reset quiz failed status
      setReviewMode(false); // Reset review mode

      // Add this for sentence building questions
      setSelectedWords([]);
      setRemainingWords([]);
    } catch (error) {
      // console.error("Error fetching quiz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answerId) => {
    setSelectedAnswer(answerId);
    setShowResult(false);
  };

  // Add the handleQuit function to the component
  const handleQuit = () => {
    setShowQuitConfirmation(false);
    setShowQuizModal(false);
    // Reset states
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setQuizQuestions([]);
    setCurrentQuiz(null);
    setWrongQuestions([]);
    setCorrectQuestions([]);
    setHearts(5);
    setShowResult(false);
    setQuizCompleted(false);
    setQuizFailed(false); // Add this reset
    setReviewMode(false);
  };

  // Update the checkAnswer function for sentence building
  const checkAnswer = async () => {
    if (quizQuestions[currentQuestion]?.type === 'sentence_building') {
      if (selectedWords.length === 0) return; // Don't check if no words selected
      
      // Create user_order array from the selected words' originalIndex values
      const user_order = selectedWords.map(wordObj => wordObj.originalIndex);
      
      // Get correct_order from the question options
      const correct_order = quizQuestions[currentQuestion].options.correct_order || 
                           Array.from({ length: quizQuestions[currentQuestion].options.words.length }, (_, i) => i);
      
      // Check if arrays match in both length and content
      const isCorrect = 
        user_order.length === correct_order.length &&
        user_order.every((val, idx) => val === correct_order[idx]);
      
      setIsCorrect(isCorrect);
      setShowResult(true);
      
      // Log the answer attempt to backend
      try {
        await useAxios().post('student/quiz-answer-check/', {
          quiz_id: currentQuiz.id,
          question_id: quizQuestions[currentQuestion].id,
          selected_answer: user_order,
          question_type: 'sentence_building'
        });
      } catch (error) {
        // console.error("Error logging sentence building answer:", error);
      }
      
      // Handle result display and progression
      setTimeout(() => {
        if (isCorrect) {
          // Add to correct questions
          setCorrectQuestions(prev => [...prev, currentQuestion]);
          
          if (reviewMode) {
            // Remove from wrong questions
            setWrongQuestions(prev => prev.filter(q => q !== currentQuestion));
          }
          
          // Move to next question or finish quiz
          moveToNextQuestion();
        } else {
          // Lose a heart
          setHearts(prev => prev - 1);
          
          if (!reviewMode) {
            // Add to wrong questions if not already there
            if (!wrongQuestions.includes(currentQuestion)) {
              setWrongQuestions(prev => [...prev, currentQuestion]);
            }
          }
          
          if (hearts <= 1) {
            // No more hearts, show quiz failed screen
            setHearts(0);
            setQuizFailed(true);
            
            // Close quiz after delay
            setTimeout(() => {
              setShowQuizModal(false);
              setQuizFailed(false);
            }, 3000);
          } else {
            // Reset for another attempt
            initializeSentenceBuilding(quizQuestions[currentQuestion]);
          }
        }
        
        setShowResult(false);
      }, 2000);
    } else {
      if (selectedAnswer === null) return;
      
      const currentQ = quizQuestions[currentQuestion];
      const options = currentQ?.options || [];
      
      // Debug logging to help diagnose the issue
      // console.log("=== QUIZ ANSWER DEBUG ===");
      // console.log("Current question:", currentQ);
      // console.log("Selected answer (index):", selectedAnswer);
      // console.log("Options:", options);
      // console.log("Option at selected index:", options[selectedAnswer]);
      
      // Use the backend for answer validation instead of client-side
      try {
        // Call the backend to check the answer
        const response = await useAxios().post('student/quiz-answer-check/', {
          quiz_id: currentQuiz.id,
          question_id: currentQ.id,
          selected_answer: selectedAnswer
        });
        
        // Get the validation result from the backend
        const { is_correct } = response.data;
        // console.log("Backend validation result:", response.data);
        
        setIsCorrect(is_correct);
        setShowResult(true);
        
        // Wait for 2 seconds, then handle the answer
        setTimeout(() => {
          if (is_correct) {
            // Add to correct questions
            setCorrectQuestions(prev => [...prev, currentQuestion]);
            
            if (reviewMode) {
              // Remove from wrong questions
              setWrongQuestions(prev => prev.filter(q => q !== currentQuestion));
            }
            
            // Move to next question or finish quiz
            moveToNextQuestion();
          } else {
            // Lose a heart
            setHearts(prev => prev - 1);
            
            if (!reviewMode) {
              // Add to wrong questions if not already there
              if (!wrongQuestions.includes(currentQuestion)) {
                setWrongQuestions(prev => [...prev, currentQuestion]);
              }
            }
            
            if (hearts <= 1) {
              // No more hearts, show quiz failed screen
              setHearts(0); // Ensure hearts is zero
              setQuizFailed(true);
              
              // Close quiz after delay
              setTimeout(() => {
                setShowQuizModal(false);
                setQuizFailed(false); // Reset for next attempt
              }, 3000);
            } else {
              // Don't move to next question, let them retry
              // Just reset the selected answer and hide the result screen
              setSelectedAnswer(null);
            }
          }
          
          setShowResult(false);
        }, 2000);
        
      } catch (error) {
        // console.error("Error checking answer:", error);
        // Fallback to client-side checking if the API fails
        let isAnswerCorrect = false;
        
        if (currentQ.type === 'true_false' || currentQ.type === 'multiple_choice') {
          // For multiple choice and true/false, find the option marked as correct
          const correctOptionIndex = options.findIndex(option => option.isCorrect === true);
          isAnswerCorrect = selectedAnswer === correctOptionIndex;
        } else if (currentQ.type === 'checkbox') {
          // For checkbox questions, all selected options should match correct options
          const selectedOptions = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer];
          const correctOptions = options.reduce((acc, option, index) => {
            if (option.isCorrect) acc.push(index);
            return acc;
          }, []);
          
          // Check if selected options match correct options (regardless of order)
          isAnswerCorrect = selectedOptions.length === correctOptions.length &&
            selectedOptions.every(opt => correctOptions.includes(opt));
        }
        
        setIsCorrect(isAnswerCorrect);
        setShowResult(true);
        
        // Same timeout logic as above...
        setTimeout(() => {
          // Same logic as in the try block for handling correct/incorrect answers
          if (isAnswerCorrect) {
            // Add to correct questions
            setCorrectQuestions(prev => [...prev, currentQuestion]);
            
            if (reviewMode) {
              // Remove from wrong questions
              setWrongQuestions(prev => prev.filter(q => q !== currentQuestion));
            }
            
            // Move to next question or finish quiz
            moveToNextQuestion();
          } else {
            // Lose a heart
            setHearts(prev => prev - 1);
            
            if (!reviewMode) {
              // Add to wrong questions if not already there
              if (!wrongQuestions.includes(currentQuestion)) {
                setWrongQuestions(prev => [...prev, currentQuestion]);
              }
            }
            
            if (hearts <= 1) {
              // No more hearts, show quiz failed screen
              setHearts(0); // Ensure hearts is zero
              setQuizFailed(true);
              
              // Close quiz after delay
              setTimeout(() => {
                setShowQuizModal(false);
                setQuizFailed(false); // Reset for next attempt
              }, 3000);
            } else {
              // Don't move to next question, let them retry
              // Just reset the selected answer and hide the result screen
              setSelectedAnswer(null);
            }
          }
          
          setShowResult(false);
        }, 2000);
      }
    }
  };

  // Helper function to move to next question
  const moveToNextQuestion = () => {
    if (reviewMode) {
      // If in review mode, check if there are more wrong questions
      if (wrongQuestions.length <= 1) {
        // No more wrong questions, finish quiz
        setQuizCompleted(true);
        setReviewMode(false);
        // Close modal after a delay
        setTimeout(() => {
          setShowQuizModal(false);
        }, 3000);
      } else {
        // Move to next wrong question
        const currentIndex = wrongQuestions.indexOf(currentQuestion);
        const nextIndex = (currentIndex + 1) % wrongQuestions.length;
        setCurrentQuestion(wrongQuestions[nextIndex]);
        setSelectedAnswer(null);
      }
    } else if (currentQuestion < quizQuestions.length - 1) {
      // Move to next regular question
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      // All questions answered, check if review needed
      if (wrongQuestions.length > 0) {
        // Start review mode
        setReviewMode(true);
        setCurrentQuestion(wrongQuestions[0]);
        setSelectedAnswer(null);
      } else {
        // Quiz completed successfully
        setQuizCompleted(true);
        // Close modal after a delay
        setTimeout(() => {
          setShowQuizModal(false);
        }, 3000);
      }
    }
  };

  // Restart quiz function
  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setWrongQuestions([]);
    setCorrectQuestions([]);
    setHearts(5);
    setShowResult(false);
    setReviewMode(false);
    setQuizFailed(false);
  };

  // Skip the current question
  const skipQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz is finished
      setShowQuizModal(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark-mode') || 
                    (localStorage.getItem('appearanceSettings') && 
                      JSON.parse(localStorage.getItem('appearanceSettings')).darkMode);
      setDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Add listener for dark mode changes
    const handleStorageChange = () => {
      checkDarkMode();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchQuizzes = async () => {
    try {
      setFetching(true);
      const response = await useAxios().get(
        `student/quiz-list/${UserData()?.user_id}/`
      );
      setQuizzes(response.data);
      setFetching(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        navigate("/");
      }
    }
  };

  useEffect(() => {
    const userId = UserData()?.user_id;
    if (!userId) {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      navigate("/");
      return;
    }

    fetchQuizzes();
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    if (query === "") {
      fetchQuizzes();
    } else {
      const filtered = quizzes.filter((q) =>
        q.title.toLowerCase().includes(query)
      );
      setQuizzes(filtered);
    }
  };

  // Add this function to initialize sentence building exercises
  const initializeSentenceBuilding = (question) => {
    if (question.type === 'sentence_building' && Array.isArray(question.options?.words)) {
      // Create word objects with original indices
      const wordObjects = question.options.words.map((word, index) => ({
        word,
        originalIndex: index
      }));
      
      // Create a shuffled copy for the word bank
      const shuffled = [...wordObjects];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      setSelectedWords([]);
      setRemainingWords(shuffled);
    }
  };

  // Add this useEffect to initialize sentence building when the question changes
  useEffect(() => {
    if (quizQuestions.length > 0 && currentQuestion < quizQuestions.length) {
      const question = quizQuestions[currentQuestion];
      if (question?.type === 'sentence_building') {
        initializeSentenceBuilding(question);
      }
      setShowResult(false);
      setSelectedAnswer(null);
    }
  }, [quizQuestions, currentQuestion]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute unique courses for filter dropdown
const uniqueCourses = [
  ...new Map(
    quizzes
      .filter(q => q.course_title)
      .map(q => [q.course, { id: q.course, title: q.course_title }])
  ).values(),
];

// Filter and sort quizzes
const filteredQuizzes = quizzes
  .filter(q => quizCategory === "all" || (q.course && String(q.course) === String(quizCategory)))
  .sort((a, b) => {
    if (quizSortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
    if (quizSortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (quizSortBy === "title_asc") return a.title.localeCompare(b.title);
    if (quizSortBy === "title_desc") return b.title.localeCompare(a.title);
    return 0;
  });

  // Add this JSX in your render function where you want to display the sentence building exercise
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: darkMode ? "#121212" : "white" }}>
      {/* Sidebar - only show on non-mobile screens */}
      {!isMobile && <Sidebar sidebarCollapsed={sidebarCollapsed} />}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: !isMobile ? (sidebarCollapsed ? "80px" : "270px") : 0,
          transition: "margin-left 0.3s ease",
          backgroundColor: darkMode ? "#121212" : "white",
          color: darkMode ? "white" : "black",
        }}
      >
        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Quizzes Section */}
        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h4 style={{ color: darkMode ? "white" : "black" }}>My Quizzes</h4>
          </div>

          <div className="mb-4">
  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
    <input
      type="search"
      className="form-control"
      placeholder="Search your quizzes"
      onChange={handleSearch}
      style={{
        flex: 1,
        minWidth: 200,
        backgroundColor: darkMode ? "rgb(255, 255, 255)" : "rgb(247, 247, 247)",
        border: darkMode ? "1px solid rgba(89, 89, 89, 0.8)" : "1px solid rgba(164, 164, 164, 0.8)",
        color: "black"
      }}
    />
    <select
      value={quizCategory}
      onChange={e => setQuizCategory(e.target.value)}
      style={{
        backgroundColor: darkMode ? "rgb(255, 255, 255)" : "rgb(247, 247, 247)",
        border: darkMode ? "1px solid rgba(89, 89, 89, 0.8)" : "1px solid rgba(164, 164, 164, 0.8)",
        color: "black",
        borderRadius: 6,
        padding: "6px 12px",
        minWidth: 160
      }}
    >
      <option value="all">All Courses</option>
      {uniqueCourses.map(course => (
        <option key={course.id} value={course.id}>{course.title}</option>
      ))}
    </select>
    <select
      value={quizSortBy}
      onChange={e => setQuizSortBy(e.target.value)}
      style={{
        backgroundColor: darkMode ? "rgb(255, 255, 255)" : "rgb(247, 247, 247)",
        border: darkMode ? "1px solid rgba(89, 89, 89, 0.8)" : "1px solid rgba(164, 164, 164, 0.8)",
        color: "black",
        borderRadius: 6,
        padding: "6px 12px",
        minWidth: 140
      }}
    >
      <option value="newest">Newest First</option>
      <option value="oldest">Oldest First</option>
      <option value="title_asc">Title (A-Z)</option>
      <option value="title_desc">Title (Z-A)</option>
    </select>
  </div>
</div>

{/* Filtered Count + Clear Filter Button */}
<div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 12 }}>
  <span style={{ color: darkMode ? "#bbb" : "#444", fontSize: 15 }}>
    Showing {filteredQuizzes.length} of {quizzes.length} quizzes
  </span>
  {(quizCategory !== "all" || quizSortBy !== "newest" || quizzes.length !== filteredQuizzes.length) && (
    <button
      onClick={() => {
        setQuizCategory("all");
        setQuizSortBy("newest");
        fetchQuizzes();
      }}
      style={{
        background: "#eee",
        color: "#333",
        border: "none",
        borderRadius: 6,
        padding: "4px 14px",
        fontWeight: 500,
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      Clear
    </button>
  )}
</div>

          {fetching && <p style={{ color: darkMode ? "white" : "black" }}>Loading...</p>}

          {!fetching && filteredQuizzes.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "24px",
                marginTop: "10px",
                alignItems: "flex-start"
              }}
            >
              {filteredQuizzes.map((quiz, index) => (
                <div
                  key={index}
                  onClick={() => startQuiz(quiz.id)}
                  style={{
                    cursor: "pointer",
                    width: 260,
                    minHeight: 180,
                    maxWidth: 280,
                    background: darkMode ? "#23272f" : "#fff",
                    borderRadius: "14px",
                    boxShadow: darkMode
                      ? "0 2px 12px rgba(0,0,0,0.5)"
                      : "0 2px 12px rgba(0,0,0,0.08)",
                    border: "1px solid " + (darkMode ? "#333" : "#eee"),
                    padding: "18px 18px 14px 18px",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.13s, box-shadow 0.13s",
                    position: "relative",
                    outline: "none"
                  }}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") startQuiz(quiz.id);
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 24px rgba(0,0,0,0.13)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      darkMode
                        ? "0 2px 12px rgba(0,0,0,0.5)"
                        : "0 2px 12px rgba(0,0,0,0.08)";
                  }}
                >
                  <h6
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                      color: darkMode ? "white" : "#222",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis", // <-- ellipsis for long titles
                      width: "100%",
                      display: "block"
                    }}
                    title={quiz.title}
                  >
                    {quiz.title}
                  </h6>
                  {quiz.description && (
                    <div style={{
                      fontSize: 13,
                      color: darkMode ? "#bbb" : "#888",
                      marginBottom: 8,
                      minHeight: 32,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {quiz.description}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                    <span>
                      📝 {quiz.num_questions ?? quiz.questions?.length ?? "?"} questions&nbsp;
                      ⏱️ {(quiz.num_questions ?? quiz.questions?.length)
                        ? `${Math.ceil((quiz.num_questions ?? quiz.questions?.length) * 0.5)} min`
                        : "Time: ?"}
                    </span>
                    {quiz.category && (
                      <span style={{
                        background: "#0055A4",
                        color: "#fff",
                        borderRadius: 8,
                        fontSize: 12,
                        padding: "2px 8px",
                        marginLeft: "auto"
                      }}>
                        {quiz.category}
                      </span>
                    )}
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{
                      backgroundColor: "#0055A4",
                      color: "white",
                      marginTop: "auto",
                      borderRadius: 6,
                      fontWeight: 500,
                      letterSpacing: 0.5,
                      fontSize: 14,
                      boxShadow: "none",
                      border: "none",
                      outline: "none",
                      pointerEvents: "none",
                    }}
                    tabIndex={-1}
                  >
                    Start Quiz
                  </button>
                </div>
              ))}
            </div>
          )}

          {!fetching && filteredQuizzes.length === 0 && (
            <div style={{ textAlign: "center", marginTop: "40px", color: darkMode ? "#aaa" : "#555" }}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png"
                alt="No quizzes"
                style={{ width: 80, opacity: 0.5, marginBottom: 16 }}
              />
              <div style={{ fontSize: 18, fontWeight: 500 }}>No quizzes found!</div>
              <div style={{ fontSize: 14 }}>Try a different filter or ask your teacher to assign one.</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Duolingo-style Quiz Modal */}
      <Modal 
        show={showQuizModal} 
        onHide={() => {
          if (!showResult) setShowQuitConfirmation(true);
        }}
        centered
        size="lg"
        backdrop="static"
        className="duolingo-quiz-modal"
      >
        <Modal.Body className="p-0">
          <div style={{ 
            backgroundColor: darkMode ? "#1c2c3a" : "rgb(207, 207, 207)", 
            minHeight: "500px",
            borderRadius: "8px",
            position: "relative",
            padding: "0"
          }}>
            {/* Progress bar for correct answers */}
            <div style={{
              height: "6px",
              backgroundColor: darkMode ? "#2e3e4a" : frenchWhite,
              borderRadius: "8px 8px 0 0",
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${(correctQuestions.length / quizQuestions.length) * 100}%`,
                backgroundColor: frenchRed,
                transition: "width 0.3s ease"
              }}></div>
            </div>
            
            {/* Hearts/Lives indicator - Single heart with number */}
            <div style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "20px",
              padding: "5px 10px"
            }}>
              <span style={{ color: "red", marginRight: "5px", fontSize: "16px" }}>❤️</span>
              <span style={{ color:darkMode?"white":"black", fontWeight: "bold", fontSize: "16px" }}>{hearts}</span>
            </div>
            
            {/* Review mode indicator */}
            {reviewMode && (
              <div style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "20px",
                padding: "5px 10px",
                color: "white"
              }}>
                Review Mode
              </div>
            )}
            
            {quizFailed ? (
              // Quiz failed screen
              <div style={{ 
                padding: "30px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                minHeight: "400px"
              }}>
                <div style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  backgroundColor: frenchRed,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "30px"
                }}>
                  <FaTimes style={{ fontSize: '80px', color: 'white' }} />
                </div>
                
                <h2 style={{ color: darkMode? "white": "black", marginBottom: "20px", textAlign: "center" }}>
                  Quiz Failed!
                </h2>
                
                <p style={{ color: darkMode? "white": "black", fontSize: "20px", textAlign: "center", marginBottom: "30px" }}>
                  You ran out of hearts! Try again.
                </p>
                
                <p style={{ color: darkMode? "white": "black", fontSize: "16px", textAlign: "center" }}>
                  You completed {correctQuestions.length} out of {quizQuestions.length} questions correctly.
                </p>
              </div>
            ) : quizCompleted ? (
              // Quiz completion screen
              <div style={{ 
                padding: "30px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                minHeight: "400px"
              }}>
                <div style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  backgroundColor: "#4CAF50",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "30px"
                }}>
                  <FaCheck style={{ fontSize: '80px', color: 'white' }} />
                </div>
                
                <h2 style={{ color: darkMode? "white": "black", marginBottom: "20px", textAlign: "center" }}>
                  Quiz Completed!
                </h2>
                
                <p style={{ color: darkMode? "white": "black", fontSize: "20px", textAlign: "center" }}>
                  You got {correctQuestions.length} out of {quizQuestions.length} questions correct!
                </p>
              </div>
            ) : (
              // Regular quiz questions
              quizQuestions.length > 0 && currentQuestion < quizQuestions.length && (
                <div style={{ 
                  padding: "30px 20px", 
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "500px"  // Ensure consistent height
                }}>
                  {/* Question content - This is the main content that will expand */}
                  <div style={{ flex: 1 }}>
                    {/* Question number and title - CENTERED */}
                    <div style={{ textAlign: "center", marginBottom: "30px" }}>
                      <h3 style={{ color: darkMode? "white": "black", marginBottom: "10px" }}>
                        Question {reviewMode ? "(Review)" : currentQuestion + 1}
                      </h3>
                      <h2 style={{ 
                        color: darkMode? "white": "black", 
                        fontSize: "24px"
                      }}>
                        {quizQuestions[currentQuestion]?.title || "Select the correct answer"}
                      </h2>
                    </div>
                    
                    {/* Center the "Choose the right answer!" text */}
                    <div style={{
                      textAlign: "center",
                      backgroundColor: frenchWhite,
                      color: "#333",
                      padding: "10px 15px",
                      borderRadius: "20px",
                      width: "fit-content",
                      margin: "0 auto 30px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                    }}>
                      {quizQuestions[currentQuestion]?.description || "Choose the right answer!"}
                    </div>

                    {/* Result overlay when showing feedback */}
                    {showResult && (
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: isCorrect ? "rgba(0,100,0,0.9)" : "rgba(200,0,0,0.9)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 10
                      }}>
                        {isCorrect ? (
                          <>
                            <FaCheck style={{ fontSize: '100px', color: 'white' }} />
                            <h2 style={{ color: 'white', marginTop: '20px' }}>Correct!</h2>
                          </>
                        ) : (
                          <>
                            <FaTimes style={{ fontSize: '100px', color: 'white' }} />
                            <h2 style={{ color: 'white', marginTop: '20px' }}>Incorrect!</h2>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Multiple choice options */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "600px", margin: "0 auto" }}>
                      {Array.isArray(quizQuestions[currentQuestion]?.options) ? (
                        quizQuestions[currentQuestion]?.options.map((option, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              if (showResult) return; // Prevent changing answer during results
                              
                              if (quizQuestions[currentQuestion]?.type === 'checkbox') {
                                // For checkbox, allow multiple selections
                                const currentSelections = Array.isArray(selectedAnswer) ? [...selectedAnswer] : [];
                                const optionIndex = currentSelections.indexOf(idx);
                                
                                if (optionIndex === -1) {
                                  // Add to selections
                                  currentSelections.push(idx);
                                } else {
                                  // Remove from selections
                                  currentSelections.splice(optionIndex, 1);
                                }
                                
                                setSelectedAnswer(currentSelections);
                              } else {
                                // For multiple choice or true/false, just select one option
                                setSelectedAnswer(idx);
                              }
                            }}
                            style={{
                              padding: "14px",
                              backgroundColor: Array.isArray(selectedAnswer) 
                                ? (selectedAnswer.includes(idx) ? frenchWhite : "rgba(255,255,255,0.9)")
                                : (selectedAnswer === idx ? frenchWhite : "rgba(255,255,255,0.9)"),
                              border: Array.isArray(selectedAnswer)
                                ? (selectedAnswer.includes(idx) ? `2px solid ${frenchRed}` : "2px solid transparent")
                                : (selectedAnswer === idx ? `2px solid ${frenchRed}` : "2px solid transparent"),
                              borderRadius: "12px",
                              cursor: showResult ? "default" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              color: "#333"
                            }}
                          >
                            <div style={{ 
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              backgroundColor: frenchBlue,
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "10px",
                              fontWeight: "bold"
                            }}>
                              {idx + 1}
                            </div>
                            <div style={{ flex: 1 }}>{option.text}</div>
                            {quizQuestions[currentQuestion]?.type === 'checkbox' && (
                              <div style={{
                                width: "20px",
                                height: "20px",
                                border: "2px solid #ccc",
                                marginLeft: "10px",
                                backgroundColor: Array.isArray(selectedAnswer) && selectedAnswer.includes(idx) ? frenchRed : "transparent"
                              }} />
                            )}
                          </div>
                        ))
                      ) : (
                        Object.entries(quizQuestions[currentQuestion]?.options || {}).map(([key, value], idx) => {
                          // Skip special fields that aren't options like 'words', 'correct_order', etc.
                          if (['words', 'correct_order', 'translation'].includes(key)) return null;
                          
                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                if (showResult) return; 
                                setSelectedAnswer(idx);
                              }}
                              style={{
                                padding: "14px",
                                backgroundColor: selectedAnswer === idx ? frenchWhite : "rgba(255,255,255,0.9)",
                                border: selectedAnswer === idx ? `2px solid ${frenchRed}` : "2px solid transparent",
                                borderRadius: "12px",
                                cursor: showResult ? "default" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                color: "#333"
                              }}
                            >
                              <div style={{ 
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                backgroundColor: frenchBlue,
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: "10px",
                                fontWeight: "bold"
                              }}>
                                {idx + 1}
                              </div>
                              <div style={{ flex: 1 }}>{value.text || value}</div>
                            </div>
                          );
                        }).filter(Boolean)
                      )}
                    </div>

                    {/* Add this JSX for rendering sentence building questions */}
                    {quizQuestions[currentQuestion]?.type === 'sentence_building' && (
                      <div style={{ padding: "20px 0" }}>
                        {/* Translation hint if provided */}
                        {quizQuestions[currentQuestion]?.options?.translation && (
                          <div style={{
                            backgroundColor: "rgba(255,255,255,0.2)",
                            padding: "10px 15px",
                            marginBottom: "20px",
                            borderRadius: "10px",
                            color: darkMode?"white":"black",
                            textAlign: "center",
                            fontStyle: "italic"
                          }}>
                            {quizQuestions[currentQuestion]?.options?.translation}
                          </div>
                        )}
                        
                        <DragDropContext
                          onDragEnd={(result) => {
                            if (!result.destination) return;
                            
                            const source = result.source;
                            const destination = result.destination;
                            
                            // Moving from word bank to sentence area
                            if (source.droppableId === "word-bank" && destination.droppableId === "sentence-area") {
                              const word = remainingWords[source.index];
                              setRemainingWords(prev => prev.filter((_, i) => i !== source.index));
                              setSelectedWords(prev => {
                                const newSelected = [...prev];
                                newSelected.splice(destination.index, 0, word);
                                return newSelected;
                              });
                            } 
                            // Moving from sentence area to word bank
                            else if (source.droppableId === "sentence-area" && destination.droppableId === "word-bank") {
                              const word = selectedWords[source.index];
                              setSelectedWords(prev => prev.filter((_, i) => i !== source.index));
                              setRemainingWords(prev => {
                                const newRemaining = [...prev];
                                newRemaining.splice(destination.index, 0, word);
                                return newRemaining;
                              });
                            }
                            // Reordering within sentence area
                            else if (source.droppableId === "sentence-area" && destination.droppableId === "sentence-area") {
                              setSelectedWords(prev => {
                                const newItems = [...prev];
                                const [moved] = newItems.splice(source.index, 1);
                                newItems.splice(destination.index, 0, moved);
                                return newItems;
                              });
                            }
                            // Reordering within word bank
                            else if (source.droppableId === "word-bank" && destination.droppableId === "word-bank") {
                              setRemainingWords(prev => {
                                const newItems = [...prev];
                                const [moved] = newItems.splice(source.index, 1);
                                newItems.splice(destination.index, 0, moved);
                                return newItems;
                              });
                            }
                          }}
                        >
                          {/* Sentence building area - where words are arranged */}
                          <Droppable droppableId="sentence-area" direction="horizontal">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{
                                  minHeight: "80px",
                                  backgroundColor: darkMode? "rgba(255, 255, 255, 0.15)":"rgba(0, 0, 0, 0.15)",
                                  borderRadius: "10px",
                                  padding: "15px",
                                  marginBottom: "20px",
                                  display: "flex",
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                  border: snapshot.isDraggingOver ? "2px dashed white" : "2px solid transparent"
                                }}
                              >
                                {selectedWords.length === 0 ? (
                                  <div style={{ color: darkMode?"rgba(255,255,255,0.5)":"black", textAlign: "center", width: "100%" }}>
                                    Drag words here to form a sentence
                                  </div>
                                ) : (
                                  selectedWords.map((wordObj, index) => (
                                    <Draggable 
                                      key={`selected-${index}`} 
                                      draggableId={`selected-${index}`} 
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={{
                                            ...provided.draggableProps.style,
                                            backgroundColor: frenchWhite,
                                            color: "#333",
                                            padding: "8px 15px",
                                            margin: "5px",
                                            borderRadius: "5px",
                                            fontWeight: "500",
                                            boxShadow: snapshot.isDragging 
                                              ? "0 5px 10px rgba(0,0,0,0.3)" 
                                              : "0 2px 4px rgba(0,0,0,0.1)",
                                            transform: snapshot.isDragging 
                                              ? `${provided.draggableProps.style.transform} scale(1.05)` 
                                              : provided.draggableProps.style.transform
                                          }}
                                        >
                                          {wordObj.word}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          {/* Word bank - where available words are shown */}
                          <Droppable droppableId="word-bank" direction="horizontal">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={{
                                  backgroundColor: "rgba(0,0,0,0.2)",
                                  padding: "15px",
                                  borderRadius: "10px",
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: "10px",
                                  justifyContent: "center",
                                  minHeight: "70px",
                                  border: snapshot.isDraggingOver ? "2px dashed white" : "2px solid transparent"
                                }}
                              >
                                {remainingWords.length === 0 ? (
                                  <div style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", width: "100%" }}>
                                    All words have been used
                                  </div>
                                ) : (
                                  remainingWords.map((wordObj, index) => (
                                    <Draggable 
                                      key={`remaining-${index}`} 
                                      draggableId={`remaining-${index}`} 
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={{
                                            ...provided.draggableProps.style,
                                            backgroundColor: frenchBlue,
                                            color: "white",
                                            padding: "8px 15px",
                                            margin: "5px",
                                            borderRadius: "5px",
                                            fontWeight: "500",
                                            boxShadow: snapshot.isDragging 
                                              ? "0 5px 10px rgba(0,0,0,0.3)" 
                                              : "0 2px 4px rgba(0,0,0,0.2)",
                                            transform: snapshot.isDragging 
                                              ? `${provided.draggableProps.style.transform} scale(1.05)` 
                                              : provided.draggableProps.style.transform
                                          }}
                                        >
                                          {wordObj.word}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom action buttons - Non-floating, always at bottom */}
                  <div style={{ 
  marginTop: "40px",  // Add space between question content and button
  display: "flex",
  justifyContent: "center",
  padding: "20px"
}}>
  <button
    onClick={checkAnswer}
    disabled={(quizQuestions[currentQuestion]?.type === 'sentence_building' 
               ? selectedWords.length === 0 
               : selectedAnswer === null) || showResult}
    style={{
      padding: "12px 40px",
      backgroundColor: (quizQuestions[currentQuestion]?.type === 'sentence_building' 
                        ? selectedWords.length > 0 
                        : selectedAnswer !== null) && !showResult 
                      ? frenchRed : "#e5e5e5",
      border: "none",
      borderRadius: "8px",
      color: (quizQuestions[currentQuestion]?.type === 'sentence_building' 
              ? selectedWords.length > 0 
              : selectedAnswer !== null) && !showResult 
            ? "white" : "#999",
      fontWeight: "bold",
      cursor: (quizQuestions[currentQuestion]?.type === 'sentence_building' 
               ? selectedWords.length > 0 
               : selectedAnswer !== null) && !showResult 
             ? "pointer" : "not-allowed"
    }}
  >
    CHECK
  </button>
</div>
                </div>
              )
            )}
          </div>

          {/* Add quit button in top left corner */}
          <div style={{
            position: "absolute",
            top: "15px",
            left: "15px",
            zIndex: 5
          }}>
            <button
              onClick={() => setShowQuitConfirmation(true)}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: darkMode?"white":"black",
                border: "none",
                borderRadius: "4px",
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Quit
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Quit confirmation dialog */}
      {showQuitConfirmation && (
        <div style={{
          position: "fixed", // Change from "absolute" to "fixed"
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000 // Increase z-index significantly to ensure it's above everything else
        }}>
          <div style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            width: "80%",
            maxWidth: "400px",
            textAlign: "center"
          }}>
            <h3 style={{color: "#333", marginBottom: "20px"}}>Are you sure you want to quit?</h3>
            <p style={{color: "#666", marginBottom: "25px"}}>
              If you quit now, you'll lose your progress and have to restart the quiz.
            </p>
            <div style={{display: "flex", justifyContent: "center", gap: "15px"}}>
              <button
                onClick={() => setShowQuitConfirmation(false)}
                style={{
                  backgroundColor: "#ccc",
                  color: "#333",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleQuit}
                style={{
                  backgroundColor: frenchRed,
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Quit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation (shown only on mobile devices) */}
      {isMobile && <MobileNav />}
    </div>
  );
}

export default Quizzes;