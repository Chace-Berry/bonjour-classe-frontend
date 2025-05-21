import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../utils/auth"; 
import UserData from "../plugin/UserData";

function LoginModal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginFailed(false);

    try {
      const { access, refresh, error } = await login(email, password);
      if (error) {
        setLoginFailed(true);
        return;
      }

      // Close the login modal first
      const loginModal = document.getElementById("loginModal");
      const modalInstance = bootstrap.Modal.getInstance(loginModal);
      modalInstance.hide();

      // Then check user type and redirect after a short delay
      setTimeout(() => {
        const userData = UserData();
        if (userData?.teacher_id) {
          navigate("/teacher/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }, 500);
      
    } catch (error) {
      // console.error("Login error:", error);
      setLoginFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the password field when the Login Modal is shown
  useEffect(() => {
    const loginModalElement = document.getElementById("loginModal");

    const handleModalShown = () => {
      setPassword(""); // Clear the password field
    };

    loginModalElement.addEventListener("shown.bs.modal", handleModalShown);

    return () => {
      loginModalElement.removeEventListener("shown.bs.modal", handleModalShown);
    };
  }, []);

  return (
    <div
      className="modal fade"
      id="loginModal"
      tabIndex="-1"
      aria-labelledby="loginModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="loginModalLabel">
              Sign In
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label htmlFor="loginEmail" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="loginEmail"
                  className="form-control"
                  placeholder="johndoe@gmail.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="loginPassword" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="loginPassword"
                  className="form-control"
                  placeholder="**************"
                  value={password} // Bind the password state
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {loginFailed && (
                <div className="text-danger mb-3">
                  Incorrect email or password.
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary"
                      data-bs-toggle="modal"
                      data-bs-target="#forgotPasswordModal"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
              )}
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
                    Sign In <i className="fas fa-sign-in-alt"></i>
                  </button>
                )}
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <span>
              Don’t have an account?
              <Link
                to="#"
                data-bs-toggle="modal"
                data-bs-target="#registerModal"
                className="ms-1"
              >
                Sign Up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
