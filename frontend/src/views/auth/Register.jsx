import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../utils/auth";

function RegisterModal() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Update the handleSubmit function with more detailed logging
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Log form values before submission
    // console.log("Registration form values:", {
    //   fullName,
    //   email,
    //   password,
    //   password2,
    //   passwordsMatch: password === password2
    // });
    
    try {
      const result = await register(fullName, email, password, password2);
      // console.log("Registration result:", result);
      
      if (result.error) {
        // console.error("Registration failed:", result.error);
        alert(result.error);
        setIsLoading(false);
      } else {
        // console.log("Registration successful, navigating to homepage");
        navigate("/");
        alert("Registration Successful, you have now been logged in");
        setIsLoading(false);
      }
    } catch (err) {
      // console.error("Unexpected error during registration:", err);
      alert("An unexpected error occurred during registration");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="modal fade"
      id="registerModal"
      tabIndex="-1"
      aria-labelledby="registerModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="registerModalLabel">
              Sign Up
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="full_name" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  className="form-control"
                  placeholder="John Doe"
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="johndoe@gmail.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="**************"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password2" className="form-label">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="password2"
                  className="form-control"
                  placeholder="**************"
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                />
              </div>
              <div className="d-grid">
                {isLoading ? (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled
                  >
                    Processing <i className="fas fa-spinner fa-spin"></i>
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary">
                    Sign Up <i className="fas fa-user-plus"></i>
                  </button>
                )}
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <span>
              Already have an account?
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#loginModal"
                className="ms-1"
              >
                Sign In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterModal;
