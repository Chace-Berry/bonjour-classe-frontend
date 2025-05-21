import { useState } from "react";
import apiInstance from "../../utils/axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uuidb64, setUuidb64] = useState(""); // Added uuidb64 state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // Step 1: Email, Step 2: OTP, Step 3: Password Reset

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      // Update the endpoint to match the backend
      const response = await apiInstance.post(`/user/request-otp/`, { email });
      setMessage("OTP sent to your email. Please check your inbox.");
      setStep(2); // Move to OTP verification step
    } catch (error) {
      setError(
        error.response?.data?.detail || "An error occurred. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !otp) {
      setError("Email and OTP are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiInstance.post(`/user/verify-otp/${email}/`, { otp });
      setUuidb64(response.data.uuidb64); // Set uuidb64 from response
      setStep(3); // Move to password reset step
    } catch (error) {
      setError(
        error.response?.data?.error || "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!password || !confirmPassword) {
      setError("Both password fields are required.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      // Send the correct payload to the backend
      const response = await apiInstance.post(`/user/change-password/${email}/`, {
        new_password: password,
        confirm_password: confirmPassword,
      });
      setMessage("Password changed successfully. Redirecting to login...");

      // Close the "Forgot Password" modal
      const forgotPasswordModalElement = document.getElementById("forgotPasswordModal");
      const forgotPasswordModalInstance = bootstrap.Modal.getInstance(forgotPasswordModalElement);
      forgotPasswordModalInstance.hide();

      // Reset the password fields
      setPassword("");
      setConfirmPassword("");

      // Open the "Login" modal after a slight delay
      setTimeout(() => {
        const loginModalElement = document.getElementById("loginModal");
        const loginModalInstance = new bootstrap.Modal(loginModalElement);
        loginModalInstance.show();
      }, 500); // Delay to ensure the Forgot Password modal is fully closed

      setPassword("");
    } catch (error) {
      setError(
        error.response?.data?.error || "An error occurred. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Forgot Password Modal */}
      <div
        className="modal fade"
        id="forgotPasswordModal"
        tabIndex="-1"
        aria-labelledby="forgotPasswordModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="forgotPasswordModalLabel">
                {step === 1 && "Forgot Password"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Create New Password"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {step === 1 && (
                <form onSubmit={handleEmailSubmit}>
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
                  {message && <div className="alert alert-success">{message}</div>}
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? "Processing..." : "Send OTP"}
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleOtpSubmit}>
                  <div className="mb-3">
                    <label htmlFor="otp" className="form-label">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      id="otp"
                      className="form-control"
                      placeholder="Enter the OTP sent to your email"
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      className="form-control"
                      placeholder="Enter new password"
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-control"
                      placeholder="Confirm new password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="d-grid">
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save New Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;
