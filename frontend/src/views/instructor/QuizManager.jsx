import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Row, Col, Card, Button, Table, Badge, Dropdown,
  Modal, Form, Spinner, Tabs, Tab, Alert
} from "react-bootstrap";
import useAxios from "../../utils/useAxios";
import InstructorSidebar from "./Partials/InstructorSidebar";
import Header from "./Partials/Header";
import Toast from "../plugin/Toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faEdit, faTrash, faEye, faDownload, faClipboardCheck,
  faFileExport, faChartBar, faFilter, faSort, faQuestion
} from "@fortawesome/free-solid-svg-icons";
import { format, parseISO, isPast } from "date-fns";
import UserData from "../../views/plugin/UserData";

const QuizManager = () => {
  // State variables
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [submissionToGrade, setSubmissionToGrade] = useState(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [grading, setGrading] = useState(false);
  
  // Add dark mode state
  const [darkMode, setDarkMode] = useState(false);
  
  // Submissions data
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  // Stats for selected quiz
  const [quizStats, setQuizStats] = useState({
    total: 0,
    submitted: 0,
    graded: 0,
    pending: 0,
    averageGrade: 0
  });

  const navigate = useNavigate();
  const api = useAxios();
  
  // Use UserData hook to get teacher_id directly
  const userData = UserData();
  const teacherId = userData?.teacher_id;
  
  // Check for dark mode on component mount
  useEffect(() => {
    // Check if dark mode is enabled in localStorage or body class
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark-mode') || 
                     (localStorage.getItem('appearanceSettings') && 
                      JSON.parse(localStorage.getItem('appearanceSettings')).darkMode);
      setDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Listen for changes to appearance settings
    const handleAppearanceChange = () => {
      checkDarkMode();
    };
    
    window.addEventListener('appearanceChanged', handleAppearanceChange);
    
    return () => {
      window.removeEventListener('appearanceChanged', handleAppearanceChange);
    };
  }, []);

  //useEffect to check for teacher access and redirect if needed
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

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await api.get(`teacher/course-lists/${teacherId}/`);
      setCourses(response.data);
    } catch (error) {
      // console.error("Error fetching courses:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load courses"
      });
    }
  };

  // Fetch all quizzes
  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await api.get(`teacher/quizzes/all/${teacherId}/`);
      
      if (Array.isArray(response.data)) {
        // Add debugging for the first quiz
        // if (response.data.length > 0) {
        //   console.log("First quiz data:", response.data[0]);
        // }
        
        // Map over the quizzes to ensure course data is properly extracted
        const enhancedQuizzes = response.data.map(quiz => {
          // Extract course info from various possible locations
          let courseTitle = null;
          let courseId = null;
          
          if (quiz.course) {
            if (typeof quiz.course === 'object') {
              courseTitle = quiz.course.title;
              courseId = quiz.course.id;
            } else {
              courseId = quiz.course;
            }
          }
          
          if (!courseTitle && quiz.course_name) {
            courseTitle = quiz.course_name;
          }
          
          if (!courseTitle && quiz.course_title) {
            courseTitle = quiz.course_title;
          }
          
          return {
            ...quiz,
            course_name: courseTitle,
            course_id: courseId
          };
        });
        
        setQuizzes(enhancedQuizzes);
      } else {
        // console.error("Unexpected data format:", response.data);
        setQuizzes([]);
      }
    } catch (error) {
      // console.error("Error fetching quizzes:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load quizzes"
      });
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch quizzes for a specific course
  const fetchQuizzesByCourse = async (courseId) => {
    setLoading(true);
    try {
      const url = courseId === "all" 
        ? `teacher/quizzes/all/${teacherId}/` 
        : `teacher/quizzes/${courseId}/`;
      
      const response = await api.get(url);
      
      if (Array.isArray(response.data)) {
        // Map over the quizzes to ensure course data is properly extracted
        const enhancedQuizzes = response.data.map(quiz => {
          // Extract course info from various possible locations
          let courseTitle = null;
          let courseId = null;
          
          if (quiz.course) {
            if (typeof quiz.course === 'object') {
              courseTitle = quiz.course.title;
              courseId = quiz.course.id;
            } else {
              courseId = quiz.course;
            }
          }
          
          if (!courseTitle && quiz.course_name) {
            courseTitle = quiz.course_name;
          }
          
          if (!courseTitle && quiz.course_title) {
            courseTitle = quiz.course_title;
          }
          
          // If we're filtering by course, we know the course name from the courses array
          if (!courseTitle && courseId && courseId !== "all") {
            const matchingCourse = courses.find(c => c.id === courseId || c.id === parseInt(courseId));
            if (matchingCourse) {
              courseTitle = matchingCourse.title;
            }
          }
          
          return {
            ...quiz,
            course_name: courseTitle,
            course_id: courseId
          };
        });
        
        setQuizzes(enhancedQuizzes);
      } else {
        // console.error("Unexpected data format:", response.data);
        setQuizzes([]);
      }
    } catch (error) {
      // console.error("Error fetching quizzes:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load quizzes"
      });
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter quizzes by course
  const handleCourseFilterChange = (courseId) => {
    setSelectedCourse(courseId);
    fetchQuizzesByCourse(courseId);
  };

  // Filter quizzes by status
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  // Create a new quiz
  const handleCreateQuiz = () => {
    navigate("/teacher/quiz/editor");
  };

  // Edit an existing quiz
  const handleEditQuiz = (quizId) => {
    navigate(`/teacher/quiz/editor/${quizId}`);
  };

  // Show delete confirmation modal
  const handleDeleteClick = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteModal(true);
  };

  // Delete quiz
  const confirmDelete = async () => {
    try {
      await api.delete(`quizzes/${quizToDelete.id}/`);
      
      // Close modal and refresh quizzes
      setShowDeleteModal(false);
      setQuizToDelete(null);
      
      // Show success message
      Toast().fire({
        icon: "success",
        title: "Quiz deleted successfully"
      });
      
      // Refresh quizzes list
      if (selectedCourse === "all") {
        fetchQuizzes();
      } else {
        fetchQuizzesByCourse(selectedCourse);
      }
    } catch (error) {
      // console.error("Error deleting quiz:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to delete quiz"
      });
    }
  };

  // View quiz submissions
  const handleViewSubmissions = async (quiz) => {
    setSelectedQuiz(quiz);
    setLoadingSubmissions(true);
    setShowSubmissionsModal(true);
    
    try {
      const response = await api.get(`quizzes/submissions/${quiz.id}/`);
      const submissionsData = Array.isArray(response.data) ? response.data : [];
      setSubmissions(submissionsData);
      
      // Calculate statistics
      const totalStudents = quiz.enrolled_students || 0;
      const submittedCount = submissionsData.length;
      const gradedSubmissions = submissionsData.filter(s => s.status === "graded");
      const gradedCount = gradedSubmissions.length;
      
      // Calculate average grade
      let avgGrade = 0;
      if (gradedCount > 0) {
        const totalGrades = gradedSubmissions.reduce((sum, s) => sum + (parseFloat(s.score) || 0), 0);
        avgGrade = Math.round((totalGrades / gradedCount) * 10) / 10; // Round to 1 decimal
      }
      
      // Update quiz in state to include the actual submissions count
      const updatedQuizzes = quizzes.map(q => {
        if (q.id === quiz.id) {
          return {...q, submissions_count: submittedCount};
        }
        return q;
      });
      setQuizzes(updatedQuizzes);
      
      setQuizStats({
        total: totalStudents,
        submitted: submittedCount,
        graded: gradedCount,
        pending: submittedCount - gradedCount,
        averageGrade: avgGrade
      });
    } catch (error) {
      // console.error("Error fetching submissions:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load submissions"
      });
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Show grade form for a submission
  const handleShowGradeForm = (submission) => {
    setSubmissionToGrade(submission);
    setGrade(submission.score || "");
    setFeedback(submission.feedback || "");
    setShowGradeModal(true);
  };

  // Submit grade for a submission
  const handleSubmitGrade = async () => {
    setGrading(true);
    
    try {
      await api.put(`quizzes/grade-submission/${submissionToGrade.id}/`, {
        score: parseInt(grade),
        feedback: feedback
      });
      
      // Close modal and refresh submissions
      setShowGradeModal(false);
      setSubmissionToGrade(null);
      setGrade("");
      setFeedback("");
      
      // Show success message
      Toast().fire({
        icon: "success",
        title: "Submission graded successfully"
      });
      
      // Refresh submissions
      if (selectedQuiz) {
        handleViewSubmissions(selectedQuiz);
      }
    } catch (error) {
      // console.error("Error grading submission:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to submit grade"
      });
    } finally {
      setGrading(false);
    }
  };

  // Export submissions as CSV
  const exportSubmissions = () => {
    if (!submissions.length) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student,Email,Submission Date,Status,Score,Feedback\r\n";
    
    submissions.forEach(submission => {
      const row = [
        submission.student_name,
        submission.student_email || 'N/A',
        submission.submitted_at ? 
          format(parseISO(submission.submitted_at), 'MMM d, yyyy') : 
          'N/A',
        submission.status,
        submission.score || 'Not graded',
        `"${(submission.feedback || '').replace(/"/g, '""')}"`
      ];
      
      csvContent += row.join(',') + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedQuiz.title}-submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add useEffect to fetch data on component mount
  useEffect(() => {
    if (teacherId) {
      fetchCourses();
      fetchQuizzes();
    }
  }, [teacherId]);

  // Filter quizzes based on status and search query
  const filteredQuizzes = Array.isArray(quizzes) 
    ? quizzes.filter(quiz => {
        // Filter by status
        if (statusFilter !== "all" && quiz.status !== statusFilter) {
          return false;
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return quiz.title?.toLowerCase().includes(query) || 
                 quiz.course_name?.toLowerCase().includes(query);
        }
        
        return true;
      })
    : [];

  // Return the JSX
  return (
    <div>
      {/* Sidebar */}
      <InstructorSidebar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? "80px" : "270px",
          transition: "margin-left 0.3s ease",
        }}
        className={darkMode ? 'dark-mode' : 'light-mode'}
      >
        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Content */}
        <Container fluid className="py-4">
          <Row className="mb-4">
            <Col>
              <h3>Quiz Management</h3>
            </Col>
            <Col className="text-end">
              <Button variant="primary" onClick={handleCreateQuiz}>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Create Quiz
              </Button>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3 mb-md-0">
                    <Form.Label>Filter by Course</Form.Label>
                    <Form.Select
                      value={selectedCourse}
                      onChange={(e) => handleCourseFilterChange(e.target.value)}
                    >
                      <option value="all">All Courses</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3 mb-md-0">
                    <Form.Label>Filter by Status</Form.Label>
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => handleStatusFilterChange(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Search</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search quizzes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-bar"
                      style={{ 
                        backgroundColor: "#fff",
                        color: "#000" // Force black text color
                      }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Quizzes Table */}
          {loading ? (
            <div 
              className="text-center my-5"
              style={{
                color: darkMode ? "black" : "white",
                padding: "20px"
              }}
            >
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <Alert 
              variant={darkMode ? "info" : "info"}
              style={{
                backgroundColor: darkMode ? "#2a3f4a" : "#cff4fc",
                borderColor: darkMode ? "#205e7c" : "#b6effb", 
                color: darkMode ? "#a9d5de" : "#055160"
              }}
            >
              No quizzes found based on your filters. Try changing your filter options or {" "}
              <Alert.Link 
                onClick={handleCreateQuiz}
                style={{ 
                  cursor: "pointer",
                  color: darkMode ? "#8ed6fb" : "#055160",
                  fontWeight: "bold",
                  textDecoration: "underline"
                }}
              >
                create a new quiz
              </Alert.Link>.
            </Alert>
          ) : (
            <Card style={{
              backgroundColor: "transparent",
              color: darkMode ? "#ffffff" : "inherit",
              borderColor: darkMode ? "#333" : "rgba(0, 0, 0, 0)"
            }}>
              <Card.Body style={{
                backgroundColor: "transparent",
                padding: "1.25rem"
              }}>
                <style>
                  {`
                    .custom-transparent-table {
                      --bs-table-color: ${darkMode ? '#ffffff' : 'inherit'};
                      --bs-table-bg: transparent !important;
                      --bs-table-border-color: ${darkMode ? '#444' : 'inherit'};
                      --bs-table-accent-bg: transparent !important;
                      --bs-table-striped-color: ${darkMode ? '#ffffff' : 'inherit'};
                      --bs-table-striped-bg: transparent !important;
                      --bs-table-active-color: ${darkMode ? '#ffffff' : 'inherit'};
                      --bs-table-active-bg: transparent !important;
                      --bs-table-hover-color: ${darkMode ? '#ffffff' : 'inherit'};
                      --bs-table-hover-bg: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.075)'} !important;
                      width: 100%;
                      margin-bottom: 1rem;
                      vertical-align: top;
                      }
                    
                    .custom-transparent-table th,
                    .custom-transparent-table td {
                      background-color: transparent !important;
                      color: ${darkMode ? '#ffffff' : 'inherit'} !important;
                    }
                    
                    .custom-transparent-table tbody tr:hover td,
                    .custom-transparent-table tbody tr:hover th {
                      background-color: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.075)'} !important;
                    }
                  `}
                </style>
                <Table 
                  responsive 
                  hover
                  className={`${darkMode ? "table-dark" : ""} custom-transparent-table`}
                  style={{
                    backgroundColor: "transparent"
                  }}
                >
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Course</th>
                      <th>Lecture</th>
                      <th>Status</th>
                      <th>Points</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuizzes.map((quiz) => (
                      <tr 
                        key={quiz.id}
                        data-quiz-id={quiz.id}
                      >
                        <td>{quiz.title || 'Untitled Quiz'}</td>
                        <td>
                          {quiz.course_name || quiz.course?.title || 'No Course'}
                          {!quiz.course_name && !quiz.course?.title && (
                            <span className="text-muted fst-italic">(Unassigned)</span>
                          )}
                        </td>
                        <td>
                          {quiz.lecture_title || quiz.lecture?.title || 'No Lecture'}
                          {!quiz.lecture_title && !quiz.lecture?.title && (
                            <span className="text-muted fst-italic">(Unassigned)</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {quiz.status === "draft" && (
                              <Badge bg="secondary">Draft</Badge>
                            )}
                            {quiz.status === "published" && (
                              <Badge bg="success">Published</Badge>
                            )}
                          </div>
                        </td>
                        <td>{quiz.points || 0}</td>
                        <td>
                          <div className="d-flex">
                            {/* Remove view submissions button */}
                            <Button
                              variant={darkMode ? "outline-light" : "outline-secondary"}
                              size="sm"
                              className="me-1"
                              onClick={() => handleEditQuiz(quiz.id)}
                              title="Edit quiz"
                              style={{
                                color: darkMode ? "#ffffff" : undefined,
                                borderColor: darkMode ? "#6c757d" : undefined
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteClick(quiz)}
                              title="Delete quiz"
                              style={{
                                color: darkMode ? "#f8d7da" : undefined,
                                borderColor: darkMode ? "#dc3545" : undefined
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Container>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header>
            <Modal.Title>Confirm Delete</Modal.Title>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowDeleteModal(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                color: darkMode ? "#fff" : "#000",
                cursor: "pointer",
                zIndex: 10
              }}
            >
              &#x2715;
            </button>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete the quiz "{quizToDelete?.title}"? 
            This action cannot be undone and will remove all student submissions.
          </Modal.Body>
          <Modal.Footer>
            <Button variant={darkMode ? "outline-light" : "secondary"} onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Quiz
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Submissions Modal */}
        <Modal
          show={showSubmissionsModal}
          onHide={() => setShowSubmissionsModal(false)}
          size="xl"
        >
          <Modal.Header>
            <Modal.Title>
              Submissions - {selectedQuiz?.title}
            </Modal.Title>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowSubmissionsModal(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                color: darkMode ? "#fff" : "#000",
                cursor: "pointer",
                zIndex: 10
              }}
            >
              &#x2715;
            </button>
          </Modal.Header>
          <Modal.Body>
            {loadingSubmissions ? (
              <div className="text-center my-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading submissions...</span>
                </Spinner>
              </div>
            ) : (
              <>
                <Tabs defaultActiveKey="submissions" className="mb-3">
                  <Tab eventKey="submissions" title="Submissions">
                    {submissions.length === 0 ? (
                      <Alert variant={darkMode ? "info bg-dark text-light border-info" : "info"}>
                        No submissions received yet for this quiz.
                      </Alert>
                    ) : (
                      <Table responsive hover className="align-middle">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Submitted</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Correct Answers</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((submission) => (
                            <tr key={submission.id}>
                              <td>{submission.student_name}</td>
                              <td>
                                {submission.submitted_at ?
                                  format(parseISO(submission.submitted_at), "MMM d, yyyy h:mm a") :
                                  "N/A"}
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {submission.status === "pending" ? (
                                    <Badge bg="warning" text="dark">Pending</Badge>
                                  ) : (
                                    <Badge bg="success">Graded</Badge>
                                  )}
                                </div>
                              </td>
                              <td>
                                {submission.score ? (
                                  `${submission.score}/${selectedQuiz?.points || 100}`
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td>
                                {submission.correct_answers || 0}/{submission.total_questions || 0}
                              </td>
                              <td>
                                <div className="d-flex">
                                  <Button
                                    variant={darkMode ? "outline-light" : "outline-primary"}
                                    size="sm"
                                    className="me-1"
                                    onClick={() => handleShowGradeForm(submission)}
                                    title="Review submission"
                                  >
                                    <FontAwesomeIcon icon={faEye} />
                                  </Button>
                                  <Button
                                    variant={darkMode ? "outline-light" : "outline-secondary"}
                                    size="sm"
                                    title="View details"
                                  >
                                    <FontAwesomeIcon icon={faQuestion} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                    
                    <div className="text-end mt-3">
                      <Button
                        variant={darkMode ? "outline-light" : "outline-primary"}
                        onClick={exportSubmissions}
                        disabled={submissions.length === 0}
                      >
                        <FontAwesomeIcon icon={faFileExport} className="me-2" />
                        Export as CSV
                      </Button>
                    </div>
                  </Tab>
                  
                  <Tab eventKey="stats" title="Statistics">
                    <Row>
                      <Col md={3}>
                        <Card bg={darkMode ? "dark" : "light"} text={darkMode ? "light" : "dark"} className="mb-3">
                          <Card.Body className="text-center">
                            <h3>{quizStats.total}</h3>
                            <p className="mb-0">Total Students</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card bg="primary" text="white" className="mb-3">
                          <Card.Body className="text-center">
                            <h3>{quizStats.submitted}</h3>
                            <p className="mb-0">Submissions</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card bg="success" text="white" className="mb-3">
                          <Card.Body className="text-center">
                            <h3>{quizStats.graded}</h3>
                            <p className="mb-0">Graded</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card bg="info" text="white" className="mb-3">
                          <Card.Body className="text-center">
                            <h3>{quizStats.averageGrade}</h3>
                            <p className="mb-0">Avg. Score</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    
                    <Card>
                      <Card.Body>
                        <h5>Submission Rate</h5>
                        <div className="progress mb-3" style={{ height: "25px" }}>
                          <div 
                            className="progress-bar" 
                            role="progressbar" 
                            style={{ 
                              width: `${quizStats.total > 0 ? (quizStats.submitted / quizStats.total) * 100 : 0}%` 
                            }}
                            aria-valuenow={quizStats.submitted}
                            aria-valuemin="0"
                            aria-valuemax={quizStats.total}
                          >
                            {quizStats.total > 0 ? Math.round((quizStats.submitted / quizStats.total) * 100) : 0}%
                          </div>
                        </div>
                        
                        <h5>Performance Distribution</h5>
                        <div className="progress" style={{ height: "25px" }}>
                          {/* This would be replaced with actual performance data */}
                          <div className="progress-bar bg-danger" style={{ width: "10%" }} />
                          <div className="progress-bar bg-warning" style={{ width: "30%" }} />
                          <div className="progress-bar bg-info" style={{ width: "40%" }} />
                          <div className="progress-bar bg-success" style={{ width: "20%" }} />
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <small>0-25%</small>
                          <small>26-50%</small>
                          <small>51-75%</small>
                          <small>76-100%</small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Tab>
                </Tabs>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant={darkMode ? "outline-light" : "secondary"} onClick={() => setShowSubmissionsModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Grade/Review Submission Modal */}
        <Modal show={showGradeModal} onHide={() => setShowGradeModal(false)}>
          <Modal.Header>
            <Modal.Title>Review Quiz Submission</Modal.Title>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setShowGradeModal(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                color: darkMode ? "#fff" : "#000",
                cursor: "pointer",
                zIndex: 10
              }}
            >
              &#x2715;
            </button>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Student</Form.Label>
                <Form.Control
                  type="text"
                  value={submissionToGrade?.student_name || ""}
                  readOnly
                />
              </Form.Group>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Card>
                    <Card.Body>
                      <h6>Score</h6>
                      <h3>{submissionToGrade?.score || 0}/{selectedQuiz?.points || 0}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Body>
                      <h6>Correct Answers</h6>
                      <h3>{submissionToGrade?.correct_answers || 0}/{submissionToGrade?.total_questions || 0}</h3>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Additional Feedback</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                />
              </Form.Group>
            </Form>
            
            <Alert variant="info" className="mb-0 mt-3">
              <strong>Note:</strong> This quiz was auto-graded based on correct answers. You can provide additional feedback to the student.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant={darkMode ? "outline-light" : "secondary"} onClick={() => setShowGradeModal(false)}>
              Cancel
            </Button>
            <Button 
              variant={darkMode ? "custom" : "primary"} 
              onClick={handleSubmitGrade}
              disabled={grading}
              className={darkMode ? "btn-custom" : ""}
            >
              {grading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Submitting...
                </>
              ) : (
                "Save Feedback"
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal dark mode styles */}
        <style>
          {`
            .dark-mode .modal-content {
              background-color: #333 !important;
              color: #fff !important;
            }
            .form-control, body.dark-mode .form-select {
              background-color: #fff!important;
              color: #121212!important;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default QuizManager;