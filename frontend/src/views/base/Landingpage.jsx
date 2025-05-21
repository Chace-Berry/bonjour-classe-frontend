import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Typewriter from "typewriter-effect";
import logo from "../../assets/logo.png";
import "aos/dist/aos.css";
import AOS from "aos";
import axios from "axios"; // Make sure axios is imported
import useAxios from "../../utils/useAxios";
import { createPortal } from "react-dom";
import "../../styles/fonts.css"; // Import the font CSS

function LandingPage() {
  const [showTypewriter, setShowTypewriter] = useState(true);
  const [showTeacherPopup, setShowTeacherPopup] = useState(false);
  const videoRef = useRef(null);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [subscriptionPackages, setSubscriptionPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add slide up animation for the teacher popup
  React.useEffect(() => {
    // Create style element for popup animation if it doesn't exist
    if (!document.getElementById('popup-animation-style')) {
      const style = document.createElement('style');
      style.id = 'popup-animation-style';
      style.innerHTML = `
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .teacher-popup {
          animation: slideUp 0.3s ease-out;
        }
        body.popup-open {
          overflow: hidden;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add/remove overflow hidden to body when popup is shown/hidden
    if (showTeacherPopup) {
      document.body.classList.add('popup-open');
    } else {
      document.body.classList.remove('popup-open');
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('popup-open');
    };
  }, [showTeacherPopup]);

  // Fetch subscription packages from the backend
  useEffect(() => {
    const fetchSubscriptionPackages = async () => {
      try {
        setLoading(true);
        
        // Use the full URL to ensure we're hitting the right endpoint
        const response = await useAxios().get(`/landingpage/subscription-packages/`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // Check if the response has data and it's an array
        if (response.data && Array.isArray(response.data)) {
          // Format the packages for display
          const formattedPackages = response.data.map(pkg => ({
            id: pkg.id,
            name: pkg.name,
            price: pkg.price,
            currency: "R",
            period: "month",
            duration: pkg.duration ? `${pkg.duration} days` : "30 days",
            features: Array.isArray(pkg.features)
              ? pkg.features
              : (typeof pkg.features === "string" && pkg.features.length > 0
                  ? pkg.features.split(',').map(f => f.trim())
                  : [
                      "Access to premium content",
                      "Expert teacher support",
                      `Course access for ${pkg.duration || 30} days`
                    ]),
            active_courses: pkg.active_courses || [],
            included_categories: pkg.included_categories || [],
            include_all_courses: pkg.include_all_courses // <-- ADD THIS LINE
          }));
          
          setSubscriptionPackages(formattedPackages);
        } else {
          // console.error("API returned non-array data:", response.data);
          setSubscriptionPackages([]);
          setError("Invalid data format received");
        }
        
        setLoading(false);
      } catch (err) {
        // console.error("Error fetching subscription packages:", err);
        setError("Failed to load subscription packages");
        setLoading(false);
        
        // Set default packages
        setSubscriptionPackages([
          {
            id: 1,
            name: "Basic Plan",
            price: 200,
            currency: "R",
            period: "month",
            duration: "30 days",
            features: ["Access to beginner courses", "Weekly homework review", "Basic learning materials"],
            active_courses: [],
            included_categories: []
          },
          {
            id: 2,
            name: "Pro Plan",
            price: 600,
            currency: "R",
            period: "month",
            duration: "30 days",
            features: ["Access to all courses", "Unlimited homework review", "1-on-1 weekly sessions", "Premium learning materials"],
            active_courses: [],
            included_categories: []
          }
        ]);
      }
    };

    fetchSubscriptionPackages();
  }, []);

  // Original AOS initialization and typewriter effect
  useEffect(() => {
    AOS.init({ duration: 1000 });

    const timeout = setTimeout(() => {
      setShowTypewriter(false);
      
      if (videoRef.current) {
        easeVideoPause(videoRef.current);
      }
    }, 8500);

    return () => clearTimeout(timeout);
  }, []);
  // Function to smoothly ease the video to a pause
  const easeVideoPause = (videoElement) => {
    const originalRate = videoElement.playbackRate;
    const duration = 1500; // Duration of ease-out in milliseconds
    const steps = 30; // Number of steps for smoother transition
    const stepTime = duration / steps;
    let currentStep = 0;
    
    // Create interval to gradually reduce playback rate
    const slowdownInterval = setInterval(() => {
      currentStep++;
      
      // Calculate new rate using easeOutQuad function
      const progress = currentStep / steps;
      const easeOutValue = 1 - Math.pow(1 - progress, 2);
      const newRate = originalRate * (1 - easeOutValue);
      
      // Apply the new playback rate
      videoElement.playbackRate = Math.max(0.1, newRate);
      
      // When we're done with steps, pause the video and clear the interval
      if (currentStep >= steps) {
        videoElement.pause();
        setIsVideoPaused(true);
        clearInterval(slowdownInterval);
      }
    }, stepTime);
  };

  // Add effect to handle video playing state
  useEffect(() => {
    if (videoRef.current) {
      const videoElement = videoRef.current;
      
      // Event listeners for play and pause
      const handlePlay = () => setIsVideoPaused(false);
      const handlePause = () => setIsVideoPaused(true);
      
      // Add event listeners
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      
      // Set initial state
      setIsVideoPaused(videoElement.paused);
      
      // Clean up event listeners
      return () => {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
      };
    }  }, [videoRef]);

  return (
    <>      {/* Inline CSS */}
      <style>
        {`
          .typewriter-effect {
            font-family: "Atop", sans-serif;
            font-size: 2rem; /* Adjust size as needed */
            white-space: nowrap;
            overflow: hidden;
            display: inline-block;
            animation: typing 3s steps(30, end), blink 0.5s step-end infinite alternate;
          }

          @keyframes typing {
            from {
              width: 0;
            }
            to {
              width: 100%;
            }
          }

          @keyframes blink {
            from {
              border-right-color: transparent;
            }
            to {
              border-right-color: black;
            }
          }

          .falling-text {
            animation: fall-in 1s ease-in-out forwards;
            animation-delay: 6.8s; /* Delay to sync with the typewriter effect */
          }

          @keyframes fall-in {
            0% {
              opacity: 0;
              transform: translateY(-50px); /* Start above the big text */
            }
            100% {
              opacity: 1;
              transform: translateY(0); /* End in its original position */
            }
          }          body {
            font-family: "Atop", sans-serif;
          }
          
          /* Class for elements that should use Atop font */
          .atop-font {
            font-family: "Atop", sans-serif !important;
          }        `}
      </style>

      {/* Bootstrap CSS */}
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />

      {/* Bootstrap Bundle with Popper */}
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"
        defer
      ></script>

      {/* Header */}
      <header
        className="navbar navbar-expand-lg navbar-light bg-light"
        style={{
          position: "sticky", // Make the header sticky
          top: 0, // Stick to the top of the viewport
          zIndex: 10, // Ensure it stays above other content
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)", // Optional: Add a subtle shadow for better visibility
        }}
      >
        <div className="container">
          <Link className="navbar-brand" to="/">
            <img
              src={logo}
              alt="Bonjour Classe Logo"
              style={{ height: "50px" }}
            />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#home">
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about">
                  About
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#benefits">
                  Benefits
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#pricing">
                  Pricing
                </a>
              </li>
              <li className="nav-item">
                <Link
                  className="btn ms-2"
                  to="#"
                  style={{
                    backgroundColor: "#B22234", // Royal French red color
                    color: "white", // White text for contrast
                    border: "none", // Remove border
                  }}
                  data-bs-toggle="modal"
                  data-bs-target="#registerModal" // Trigger the Register modal
                >
                  Sign Up
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className="btn btn-outline-primary ms-2"
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#loginModal" 
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="hero-section text-center py-5 bg-light"
        style={{
          position: "relative",
          height: "100vh", // Full viewport height
          display: "flex", // Use Flexbox
          alignItems: "center", // Center vertically
          justifyContent: "center", // Center horizontally
          overflow: "hidden", // Ensure the video doesn't overflow
        }}
      >        {/* Background Video */}
        <video
          ref={videoRef} // Add this ref
          autoPlay
          loop
          muted
          playsInline
          controls={!isVideoPaused}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            height: "100%",
            objectFit: "cover", 
            zIndex: 0, 
          }}
        >
          <source src="https://i.imgur.com/I43zIeb.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay */}
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Add a dark overlay
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1, 
          }}
        ></div>

        {/* Content */}
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          {/* Typewriter Effect */}
          {showTypewriter ? (
            <h1
              className="display-4"
              style={{
                color: "white",
              }}
            >
              <span
                style={{
                  fontFamily: "Atop, sans-serif", // Ensure the font is applied immediately
                }}
              >
                <Typewriter
                  options={{
                    strings: ["Bonjour", "Welcome to Bonjour Classe"],
                    autoStart: true,
                    loop: false, // Stop after finishing
                    deleteSpeed: 50,
                  }}
                />
              </span>
            </h1>
          ) : (            <h1
              className="display-4 atop-font"
              style={{
                color: "white", // Set the static text color to white
                fontFamily: "Atop, sans-serif", // Use the custom font
              }}
            >
              Welcome to Bonjour Classe!
            </h1>
          )}

          {/* Falling Text Animation */}
          <p
            className="lead falling-text"
            style={{
              color: "white", // Set the text color to white
              opacity: 0, // Initially hidden
              transform: "translateY(-50px)", // Start above the big text
            }}
          >
            Learn French with our expert teacher.
          </p>

          <Link
            to="#"
            className="btn btn-lg mt-3"
            style={{
              backgroundColor: "#B22234",
              color: "white",
              border: "none",
            }}
            data-bs-toggle="modal"
            data-bs-target="#registerModal" // Matches the Register Modal ID
          >
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section py-5">
        <div className="container">
          <h2 className="text-center mb-5">About Us</h2>
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div 
                className="card border-0 shadow" 
                data-aos="slide-right" 
                data-aos-duration="1200"
              >
                <div className="row g-0">
                  <div className="col-md-4">
                    <img
                      src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=1000"
                      alt="About Bonjour Classe"
                      className="img-fluid rounded-start h-100"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="card-body p-4">
                      <h3 className="card-title mb-3"></h3>
                      <p className="card-text">
                        Bonjour Classe is a platform designed to help you master French with the guidance of our expert teacher, who has over 23 years of experience.
                      </p>
                      <p className="card-text">
                        Our mission is to make learning French accessible, engaging, and effective for students of all levels. Whether you're a beginner taking your first steps in French or an advanced student looking to perfect your skills, we have the resources and expertise to support your journey.
                      </p>
                      <p className="card-text">
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-4">Why Choose Bonjour Classe?</h2>
          <div className="row">            <div className="col-md-4 mb-4" data-aos="fade-up">
              <div 
                className="card text-center h-100 shadow-sm" 
                onClick={() => setShowTeacherPopup(true)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">Expert Teacher</h5>
                  <p className="card-text flex-grow-1">
                    Learn from a French teacher with 23+ years of experience.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4 mb-4" data-aos="fade-up" data-aos-delay="200">
              <div className="card text-center h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">Interactive Lessons</h5>
                  <p className="card-text flex-grow-1">
                    Engage in interactive lessons designed to make learning fun
                    and effective.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4 mb-4" data-aos="fade-up" data-aos-delay="400">
              <div className="card text-center h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">Flexible Scheduling</h5>
                  <p className="card-text flex-grow-1">
                    Learn at your own pace with flexible lesson schedules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Now dynamic */}
      <section id="pricing" className="pricing-section py-5">
        <div className="container">
          <h2 className="text-center mb-4">Pricing</h2>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading subscription packages...</p>
            </div>
          ) : error ? (
            <div className="text-center py-3">
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            </div>
          ) : (
            <div className="d-flex justify-content-center gap-4" style={{ flexWrap: "wrap" }}>
              {Array.isArray(subscriptionPackages) && subscriptionPackages.map(pkg => (
                <div key={pkg.id} className="col-md-4" data-aos="fade-up">
                  <div className="card text-center h-100 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title">{pkg.name}</h5>
                      <p className="card-text">
                        <span className="fs-3 fw-bold">{pkg.currency}{pkg.price}</span>
                        /{pkg.period}
                      </p>
                      <p className="badge bg-info mb-3">Duration: {pkg.duration}</p>
                      
                      <ul className="list-unstyled text-start mb-4">
                        {/* Features */}
                        {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
                          pkg.features.map((feature, index) => (
                            <li key={`feature-${index}`}>
                              <span style={{ color: "#0bde00", fontWeight: "bold" }}>✓</span>{" "}
                              {typeof feature === "string" ? feature : feature.name}
                            </li>
                          ))
                        ) : (
                          <li>
                            <span style={{ color: "#0bde00", fontWeight: "bold" }}>✓</span>{" "}
                            Premium French learning experience
                          </li>
                        )}

                        {/* Included Courses */}
                        <li className="mt-2">
                          <span style={{ color: "#0bde00", fontWeight: "bold" }}>✓</span>{" "}
                          <strong>Included Courses:</strong>{" "}
                          {(pkg.include_all_courses === 1 ||
                            pkg.include_all_courses === true ||
                            pkg.include_all_courses === "1") ? (
                            "All Courses"
                          ) : pkg.active_courses && pkg.active_courses.length > 0 ? (
                            pkg.active_courses.map(c => c.title).join(", ")
                          ) : (
                            "None"
                          )}
                        </li>
                        <li className="mt-2">
                          <span style={{ color: "#0bde00", fontWeight: "bold" }}>✓</span>{" "}
                          <strong>Included Categories:</strong>{" "}
                          {pkg.included_categories && pkg.included_categories.length > 0 ? (
                            pkg.included_categories.map(cat => cat.title).join(", ")
                          ) : (
                            "None"
                          )}
                        </li>
                      </ul>

                      <div className="mt-auto">
                        <Link
                          to="#"
                          className="btn"
                          style={{
                            backgroundColor: "#B22234",
                            color: "white",
                            border: "none",
                          }}
                          data-bs-toggle="modal"
                          data-bs-target="#registerModal"
                        >
                          Get Started
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>      </section>

      {/* Teacher Profile Popup */}
      {showTeacherPopup && createPortal(        <div 
          className="teacher-popup-overlay"
          onClick={() => setShowTeacherPopup(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div            className="teacher-popup"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '30px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '80vh',
              marginTop: '40px',
              overflowY: 'auto',
              boxShadow: '0 5px 25px rgba(0, 0, 0, 0.2)',
              transform: 'translateY(0)',
              animation: 'slideUp 0.3s ease-out',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowTeacherPopup(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>

            <div className="teacher-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>              <div className="teacher-image" style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                overflow: 'hidden',
                border: '3px solid #3A3A6B',
                marginRight: '20px'
              }}>
                <img 
                  src="https://imgs.search.brave.com/rSfjKI6dGwDEZaxU_jfIO-mLYYLiDJTp1mCN5OYCOOk/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA4LzIyLzU2LzU4/LzM2MF9GXzgyMjU2/NTgwN19MS00zRWFt/UXAxUnk4VFozSFhV/eHZJY3ZqYmtiRWEy/SS5qcGc" 
                  alt="Julie Ngalula" 
                  style={{ width: '150%', height: '150%', objectFit: 'cover',marginLeft: '-23%' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/100';
                  }}
                />
              </div><div className="teacher-info">
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 5px 0', color: '#3A3A6B' }}>Julie Ngalula</h2>
                <p style={{ fontSize: '1rem', color: '#666', margin: 0 }}>French Teacher</p>
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '5px 0 0 0' }}>
                  <strong>Position:</strong> French Language Educator<br />
                  <strong>Location:</strong> Johannesburg, South Africa<br />
                  <strong>Languages:</strong> English, French, Lingala, Chiluba
                </p>
              </div>
            </div>

            <div className="teacher-bio" style={{ marginBottom: '20px' }}>
              <p style={{ lineHeight: '1.6', fontSize: '1rem' }}>
                Julie Ngalula is a passionate and experienced French teacher with a strong background in language education. With over 20 years of teaching experience, she has worked across multiple levels—from high school classrooms in the DRC to Cambridge curriculum schools in South Africa.
              </p>
            </div>

            <div className="teacher-qualifications" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#3A3A6B', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Qualifications</h3>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>Honors in French – Higher Institute of Bukavu, DRC (1992)</li>
                <li>B.Ed. in French and African Linguistics – Gombe Superior Institute of Pedagogy, DRC (1986)</li>
                <li>Matric/State Diploma in Pedagogy – Motema-Mpiko High School, DRC (1984)</li>
                <li>Professional Childcare Certificate – Professional Child Institute, Johannesburg (2010)</li>
              </ul>
            </div>

            <div className="teacher-experience" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#3A3A6B', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Teaching Experience</h3>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>Poplar Academy (2013–Present) – Teaching French to nursery, primary, and high school learners following the Cambridge curriculum.</li>
                <li>Rhema South Africa (2010–2013) – Providing aftercare and academic support for students outside the classroom.</li>
                <li>Private French Tutor (2005–2010) – Tutoring French to adults and children at various levels.</li>
                <li>Lycée Motema-Mpiko, DRC (1989–2005) – High school French teacher, focused on grammar, student performance, and extracurricular support.</li>
              </ul>
            </div>

            <div className="teacher-skills" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#3A3A6B', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Skills & Strengths</h3>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>Teaching & Curriculum Design</li>
                <li>Student Counseling & Conflict Resolution</li>
                <li>Classroom Management</li>
                <li>Leadership & Planning</li>
                <li>Computer Literacy</li>
              </ul>
            </div>            <div className="cta-button" style={{ textAlign: 'center', marginTop: '30px' }}>
              <Link 
                to="#" 
                className="btn btn-primary btn-lg" 
                style={{ borderRadius: '30px', padding: '10px 30px', backgroundColor: '#3A3A6B', border: 'none' }}
                data-bs-toggle="modal"
                data-bs-target="#registerModal"
                onClick={() => setShowTeacherPopup(false)}
              >
                Start Learning with Julie
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Footer */}
      <footer className="footer bg-dark text-white py-4">
        <div className="container text-center">
          <p>&copy; 2025 Bonjour Classe. All rights reserved.</p>
        </div>
      </footer>

    </>
  );
}

export default LandingPage;