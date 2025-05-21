import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Row, Col, Card, Button, Table, Badge, Dropdown,
  Modal, Form, Spinner, Tabs, Tab, Alert
} from "react-bootstrap";
import useAxios from "../../utils/useAxios";
import Sidebar from "./Partials/InstructorSidebar";
import Header from "./Partials/Header";
import Toast from "../plugin/Toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faEdit, faTrash, faEye, faDownload, faClipboardCheck,
  faFileExport, faChartBar, faClock, faFilter, faSort
} from "@fortawesome/free-solid-svg-icons";
import { format, parseISO, isPast } from "date-fns";
import InstructorSidebar from "./Partials/InstructorSidebar";
import UserData from "../../views/plugin/UserData";

const AssignmentManagement = () => {
  // Existing state variables
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [submissionToGrade, setSubmissionToGrade] = useState(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [grading, setGrading] = useState(false);
  
  // Add dark mode state
  const [darkMode, setDarkMode] = useState(false);
  
  // Submissions data
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  // Stats for selected assignment
  const [assignmentStats, setAssignmentStats] = useState({
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

  // Add this useEffect to check for teacher access and redirect if needed
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

  // Fetch assignments
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      // Use teacher/assignments/all/ endpoint to get all assignments
      const response = await api.get(`teacher/assignments/all/${teacherId}/`);
      
      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        setAssignments(response.data);
      } else {
        // console.error("Unexpected data format:", response.data);
        setAssignments([]);
      }
    } catch (error) {
      // console.error("Error fetching assignments:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load assignments"
      });
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch assignments for a specific course
  const fetchAssignmentsByCourse = async (courseId) => {
    setLoading(true);
    try {
      const url = courseId === "all" 
        ? `teacher/assignments/all/${teacherId}/` 
        : `teacher/assignments/${courseId}/`;
      
      const response = await api.get(url);
      
      if (Array.isArray(response.data)) {
        setAssignments(response.data);
      } else {
        // console.error("Unexpected data format:", response.data);
        setAssignments([]);
      }
    } catch (error) {
      // console.error("Error fetching assignments:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to load assignments"
      });
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter assignments by course
  const handleCourseFilterChange = (courseId) => {
    setSelectedCourse(courseId);
    fetchAssignmentsByCourse(courseId);
  };

  // Filter assignments by status
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  // Create a new assignment
  const handleCreateAssignment = () => {
    navigate("/teacher/assignment/editor");
  };

  // Edit an existing assignment
  const handleEditAssignment = (assignmentId) => {
    navigate(`/teacher/assignment/editor/${assignmentId}`);
  };

  // Show delete confirmation modal
  const handleDeleteClick = (assignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  // Delete assignment
  const confirmDelete = async () => {
    try {
      await api.delete(`teacher/assignment/${assignmentToDelete.id}/`);
      
      // Close modal and refresh assignments
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
      
      // Show success message
      Toast().fire({
        icon: "success",
        title: "Assignment deleted successfully"
      });
      
      // Refresh assignments list
      if (selectedCourse === "all") {
        fetchAssignments();
      } else {
        fetchAssignmentsByCourse(selectedCourse);
      }
    } catch (error) {
      // console.error("Error deleting assignment:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to delete assignment"
      });
    }
  };

  // Update the handleViewSubmissions function to correctly display submission stats
  const handleViewSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    setLoadingSubmissions(true);
    setShowSubmissionsModal(true);
    
    try {
      const response = await api.get(`teacher/assignment-submissions/${assignment.id}/`);
      const submissionsData = Array.isArray(response.data) ? response.data : [];
      setSubmissions(submissionsData);
      
      // Calculate statistics - use the actual number of submissions received from the API
      const totalStudents = assignment.enrolled_students || 0;
      const submittedCount = submissionsData.length;
      const gradedSubmissions = submissionsData.filter(s => s.status === "graded");
      const gradedCount = gradedSubmissions.length;
      
      // Calculate average grade
      let avgGrade = 0;
      if (gradedCount > 0) {
        const totalGrades = gradedSubmissions.reduce((sum, s) => sum + (parseFloat(s.grade) || 0), 0);
        avgGrade = Math.round((totalGrades / gradedCount) * 10) / 10; // Round to 1 decimal
      }
      
      // Update assignment in state to include the actual submissions count
      const updatedAssignments = assignments.map(a => {
        if (a.id === assignment.id) {
          return {...a, submissions_count: submittedCount};
        }
        return a;
      });
      setAssignments(updatedAssignments);
      
      setAssignmentStats({
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
  const handleShowGradeForm = async (submission) => {
    // If selectedAssignment.questions is missing, fetch assignment details
    if (!selectedAssignment?.questions || selectedAssignment.questions.length === 0) {
      const response = await api.get(`teacher/assignment/${submission.assignment}/get/`);
      setSelectedAssignment(response.data);
    }
    setSubmissionToGrade(submission);
    setGrade(submission.grade || "");
    setFeedback(submission.feedback || "");
    setShowGradeModal(true);
  };

  // Submit grade for a submission
  const handleSubmitGrade = async () => {
    setGrading(true);
    
    try {
      await api.put(`teacher/grade-submission/${submissionToGrade.id}/`, {
        grade: parseInt(grade),
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
      if (selectedAssignment) {
        handleViewSubmissions(selectedAssignment);
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
    csvContent += "Student,Email,Submission Date,Status,Grade,Feedback\r\n";
    
    submissions.forEach(submission => {
      const row = [
        submission.student_name,
        submission.student_email || 'N/A',
        submission.submitted_at ? 
          format(parseISO(submission.submitted_at), 'MMM d, yyyy') : 
          'N/A',
        submission.status,
        submission.grade || 'Not graded',
        `"${(submission.feedback || '').replace(/"/g, '""')}"`
      ];
      
      csvContent += row.join(',') + "\r\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedAssignment.title}-submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View test logs for a secure test assignment
  const handleViewTestLogs = (assignment) => {
    // This would typically navigate to a logs view or open a modal
    // For now, just show a toast message
    Toast().fire({
      icon: "info",
      title: "Test logs feature coming soon"
    });
  };

  // Add useEffect to fetch data on component mount
  useEffect(() => {
    if (teacherId) {
      fetchCourses();
      fetchAssignments();
    }
  }, [teacherId]);

  // Filter assignments based on status and search query
  const filteredAssignments = Array.isArray(assignments) 
    ? assignments.filter(assignment => {
        // Filter by status
        if (statusFilter !== "all" && assignment.status !== statusFilter) {
          return false;
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return assignment.title?.toLowerCase().includes(query) || 
                 assignment.course_name?.toLowerCase().includes(query);
        }
        
        return true;
      })
    : [];

  // Helper for due date badge
  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return <Badge bg="info">No deadline</Badge>;
    
    try {
      const date = parseISO(dueDate);
      if (isPast(date)) {
        return <Badge bg="danger">Past Due</Badge>;
      }
      return <Badge bg="success">Upcoming</Badge>;
    } catch (error) {
      // console.error("Error parsing date:", error);
      return <Badge bg="info">No deadline</Badge>;
    }
  };
  
  // Place your logs here, before return:
  // console.log("selectedAssignment", selectedAssignment);
  // console.log("submissionToGrade", submissionToGrade);

  // Return the JSX - This was missing in the original code
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
              <h3>Assignment Management</h3>
            </Col>
            <Col className="text-end">
              <Button variant="primary" onClick={handleCreateAssignment}>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Create Assignment
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
                      <option value="archived">Archived</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Search</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search assignments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-bar"
                      style={{ backgroundColor: darkMode ? "#fff" : "#fff", color: darkMode ? "#fff" : "#000"}}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Assignments Table */}
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
          ) : filteredAssignments.length === 0 ? (
            <Alert 
              variant={darkMode ? "info" : "info"}
              style={{
                backgroundColor: darkMode ? "#2a3f4a" : "#cff4fc",
                borderColor: darkMode ? "#205e7c" : "#b6effb", 
                color: darkMode ? "#a9d5de" : "#055160"
              }}
            >
              No assignments found based on your filters. Try changing your filter options or {" "}
              <Alert.Link 
                onClick={handleCreateAssignment}
                style={{ 
                  cursor: "pointer",
                  color: darkMode ? "#8ed6fb" : "#055160",
                  fontWeight: "bold",
                  textDecoration: "underline"
                }}
              >
                create a new assignment
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
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Submissions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((assignment) => (
                      <tr 
                        key={assignment.id}
                      >
                        <td>{assignment.title}</td>
                        <td>{assignment.course_name}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "5px" }}>
                            {getDueDateStatus(assignment.due_date)}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {assignment.status === "draft" && (
                              <Badge bg="secondary">Draft</Badge>
                            )}
                            {assignment.status === "published" && (
                              <Badge bg="success">Published</Badge>
                            )}
                            {assignment.status === "archived" && (
                              <Badge bg="dark">Archived</Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {assignment.has_test_mode ? (
                              <Badge bg="warning" className="text-dark">
                                <FontAwesomeIcon icon={faClock} className="me-1" />
                                Secure Test
                              </Badge>
                            ) : (
                              <Badge bg="info">Regular</Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          {assignment.submissions_count || 0}/{assignment.enrolled_students || 0}
                        </td>
                        <td>
                          <div className="d-flex">
                            <Button
                              variant={darkMode ? "outline-light" : "outline-primary"}
                              size="sm"
                              className="me-1"
                              onClick={() => handleViewSubmissions(assignment)}
                              title="View submissions"
                              style={{
                                color: darkMode ? "#ffffff" : undefined,
                                borderColor: darkMode ? "#0d6efd" : undefined
                              }}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Button>
                            <Button
                              variant={darkMode ? "outline-light" : "outline-secondary"}
                              size="sm"
                              className="me-1"
                              onClick={() => handleEditAssignment(assignment.id)}
                              title="Edit assignment"
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
                              onClick={() => handleDeleteClick(assignment)}
                              title="Delete assignment"
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
            Are you sure you want to delete the assignment "{assignmentToDelete?.title}"? 
            This action cannot be undone and will remove all student submissions.
          </Modal.Body>
          <Modal.Footer>
            <Button variant={darkMode ? "outline-light" : "secondary"} onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Assignment
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
              Submissions - {selectedAssignment?.title}
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
                        No submissions received yet for this assignment.
                      </Alert>
                    ) : (
                      <Table 
                        responsive 
                        hover
                        className={`align-middle custom-transparent-table ${darkMode ? "table-dark" : ""}`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Submitted</th>
                            <th>Type</th>
                            <th>Secure Mode</th>
                            <th>Status</th>
                            <th>Grade</th>
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
                                {submission.submission_text ? "Text" : "Files"}
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {submission.secure_mode_used ? (
                                    <Badge bg="success">Yes</Badge>
                                  ) : (
                                    <Badge bg="secondary">No</Badge>
                                  )}
                                  {submission.fullscreen_warnings > 0 || submission.tab_switch_warnings > 0 ? (
                                    <div className="d-flex align-items-center">
                                      <Badge bg="warning" text="dark">
                                        Warnings: {submission.fullscreen_warnings + submission.tab_switch_warnings}
                                      </Badge>
                                    </div>
                                  ) : null}
                                </div>
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
                                {submission.grade ? (
                                  `${submission.grade}/${selectedAssignment?.points || 100}`
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td>
                                <div className="d-flex">
                                  <Button
                                    variant={darkMode ? "outline-light" : "outline-primary"}
                                    size="sm"
                                    className="me-1"
                                    onClick={() => handleShowGradeForm(submission)}
                                    title="Grade submission"
                                  >
                                    <FontAwesomeIcon icon={faClipboardCheck} />
                                  </Button>
                                  <Button
                                    variant={darkMode ? "outline-light" : "outline-secondary"}
                                    size="sm"
                                    title="Download submission"
                                  >
                                    <FontAwesomeIcon icon={faDownload} />
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
                      
                      {selectedAssignment?.has_test_mode && (
                        <Button
                          variant={darkMode ? "outline-info" : "outline-info"}
                          className="ms-2"
                          onClick={() => handleViewTestLogs(selectedAssignment)}
                        >
                          <FontAwesomeIcon icon={faEye} className="me-2" />
                          View Test Logs
                        </Button>
                      )}
                    </div>
                  </Tab>
                  
                  <Tab eventKey="stats" title="Statistics">
                    <Row>
                      <Col md={3}>
                        <Card bg={darkMode ? "dark" : "light"} text={darkMode ? "light" : "dark"} className="mb-3">
                          <Card.Body className="text-center">
                            <h3>{assignmentStats.total}</h3>
                            <p className="mb-0">Total Students</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card bg="primary" text="white" className="mb-3">
                          <Card.Body className="text-center">
                            <h3>{assignmentStats.submitted}</h3>
                            <p className="mb-0">Submissions</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card bg="success" text="white" className="mb-3">
                          <Card.Body className="text-center">
                            <h3>{assignmentStats.graded}</h3>
                            <p className="mb-0">Graded</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card bg="info" text="white" className="mb-3">
                          <Card.Body className="text-center">
                            <h3>{assignmentStats.averageGrade}</h3>
                            <p className="mb-0">Avg. Grade</p>
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
                              width: `${assignmentStats.total > 0 ? (assignmentStats.submitted / assignmentStats.total) * 100 : 0}%` 
                            }}
                            aria-valuenow={assignmentStats.submitted}
                            aria-valuemin="0"
                            aria-valuemax={assignmentStats.total}
                          >
                            {assignmentStats.total > 0 ? Math.round((assignmentStats.submitted / assignmentStats.total) * 100) : 0}%
                          </div>
                        </div>
                        
                        <h5>Grading Progress</h5>
                        <div className="progress" style={{ height: "25px" }}>
                          <div 
                            className="progress-bar bg-success" 
                            role="progressbar" 
                            style={{ 
                              width: `${assignmentStats.submitted > 0 ? (assignmentStats.graded / assignmentStats.submitted) * 100 : 0}%` 
                            }}
                            aria-valuenow={assignmentStats.graded}
                            aria-valuemin="0"
                            aria-valuemax={assignmentStats.submitted}
                          >
                            {assignmentStats.submitted > 0 ? Math.round((assignmentStats.graded / assignmentStats.submitted) * 100) : 0}%
                          </div>
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

        {/* Grade Submission Modal */}
        <Modal show={showGradeModal} onHide={() => setShowGradeModal(false)} size="lg">
          <Modal.Header>
            <Modal.Title>Grade Submission</Modal.Title>
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
                color: darkMode ? "#fff" : "#333",
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

              {/* Move GradingQuestionsSection here */}
              {selectedAssignment?.questions && selectedAssignment.questions.length > 0 && (
                <GradingQuestionsSection 
                  questions={selectedAssignment.questions}
                  submission={submissionToGrade}
                  darkMode={darkMode}
                />
              )}

              <Form.Group className="mb-3">
                <Form.Label>Submission Content</Form.Label>
                {submissionToGrade?.submission_text ? (
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={submissionToGrade.submission_text}
                    readOnly
                  />
                ) : submissionToGrade?.files?.length > 0 ? (
                  <ul className="list-group">
                    {submissionToGrade.files.map((file, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        {file.name}
                        <Button
                          variant={darkMode ? "outline-light" : "outline-primary"}
                          size="sm"
                          href={file.url}
                          target="_blank"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No text or files submitted.</p>
                )}
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Grade (out of {selectedAssignment?.points || 100})</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max={selectedAssignment?.points || 100}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Feedback</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide feedback to the student..."
                />
              </Form.Group>
            </Form>
            
            {submissionToGrade?.secure_mode_used && (
              <Alert variant={darkMode ? "info bg-dark text-light border-info" : "info"} className="mb-0 mt-3">
                <strong>Test Mode Info:</strong><br />
                This submission was completed in secure test mode.
                {submissionToGrade.fullscreen_warnings > 0 && (
                  <div>Fullscreen exit warnings: {submissionToGrade.fullscreen_warnings}</div>
                )}
                {submissionToGrade.tab_switch_warnings > 0 && (
                  <div>Tab switch warnings: {submissionToGrade.tab_switch_warnings}</div>
                )}
              </Alert>
            )}
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
                "Submit Grade"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
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
          `}</style>
      </div>
    </div>
  );
};

// Add this component at the bottom of the file:
function GradingQuestionsSection({ questions, submission, darkMode }) {
  const [questionMarks, setQuestionMarks] = React.useState({});

  // Count the number of correct answers (ticks)
  const totalCorrect = Object.values(questionMarks).filter(Boolean).length;

  const handleMark = (qid, value) => {
    setQuestionMarks(prev => ({ ...prev, [qid]: value }));
  };

  // Helper to get the student's answer for a question
  const getStudentAnswer = (q) => {
    if (!submission) return null;
    if (q.type === 'file_upload' && submission.files && submission.files.length > 0) {
      return submission.files
        .filter(file => file.question_id === q.id)
        .map((file, i) => (
          <div key={i}>
            <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
          </div>
        ));
    }
    if (submission.answers && typeof submission.answers === 'object') {
      // For multiple choice, show option text if possible
      if (q.type === "multiple_choice" && Array.isArray(q.options)) {
        const selectedIdx = submission.answers[q.id];
        return (
          <div>
            {q.options.map((opt, i) => (
              <div
                key={i}
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  marginBottom: 2,
                  background: selectedIdx === i
                    ? (darkMode ? "#198754" : "#d1e7dd")
                    : "transparent",
                  color: selectedIdx === i
                    ? (darkMode ? "#fff" : "#155724")
                    : (darkMode ? "#fff" : "#212529"),
                  fontWeight: selectedIdx === i ? "bold" : "normal",
                  border: selectedIdx === i ? "1px solid #198754" : "1px solid transparent"
                }}
              >
                {opt.text}
                {selectedIdx === i && (
                  <span style={{ marginLeft: 8, fontSize: "1.1em" }}>
                    (Selected)
                  </span>
                )}
                {opt.is_correct && (
                  <span style={{ marginLeft: 8, color: "#0d6efd", fontSize: "1em" }}>
                    (Correct)
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      }
      // For text, just show the answer
      return submission.answers[q.id] !== undefined && submission.answers[q.id] !== null && submission.answers[q.id] !== ""
        ? <span>{submission.answers[q.id]}</span>
        : <span className="text-muted">No answer</span>;
    }
    if (submission.submission_text && questions.length === 1) {
      return submission.submission_text;
    }
    return <span className="text-muted">No answer</span>;
  };

  return (
    <div className="mb-4">
      <h5>Questions</h5>
      {questions.map((q, idx) => {
        const isCorrect = questionMarks[q.id] === true;
        const isIncorrect = questionMarks[q.id] === false;
        return (
          <div key={q.id} className="mb-3 p-3 border rounded position-relative" style={{background: darkMode ? '#232323' : '#f8f9fa'}}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>{idx + 1}. {q.title}</strong>
                {q.points !== undefined && (
                  <span className="ms-2 badge bg-secondary">{q.points} pt{q.points === 1 ? "" : "s"}</span>
                )}
                {q.description && <div className="text-muted small mt-1">{q.description}</div>}
              </div>
              <div className="d-flex align-items-center">
                <Button
                  variant={isCorrect ? 'success' : 'outline-success'}
                  size="sm"
                  className="me-2"
                  onClick={() => handleMark(q.id, true)}
                >
                  &#10003; {/* Unicode check mark */}
                </Button>
                <Button
                  variant={isIncorrect ? 'danger' : 'outline-danger'}
                  size="sm"
                  onClick={() => handleMark(q.id, false)}
                >
                  &#x2715; {/* Unicode X mark */}
                </Button>
                {/* Show points next to mark */}
                {q.points !== undefined && (
                  <span className="ms-2" style={{fontWeight: "bold"}}>
                    {q.points} pt{q.points === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2">
              <span className="fw-bold">Student Answer:</span>
              <div className="mt-1">
                {getStudentAnswer(q)}
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-3 text-end">
        <strong>
          Total Correct: {totalCorrect} / {questions.length}
        </strong>
      </div>
    </div>
  );
}


export default AssignmentManagement;