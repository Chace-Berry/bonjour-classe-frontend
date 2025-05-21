import React, { useState, useEffect } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { getCertificates } from "../../../utils/certificate";
import Toast from "../../plugin/Toast";
import { IMG_BASE_URL } from "../../../utils/constants";
import JSZip from "jszip";

const CertificateModal = ({
  show,
  handleClose,
  studentId,
  courseId,
  completionDate,
}) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      const isDark =
        document.body.classList.contains("dark-mode") ||
        (localStorage.getItem("appearanceSettings") &&
          JSON.parse(localStorage.getItem("appearanceSettings")).darkMode);
      setDarkMode(isDark);
    };

    checkDarkMode();

    // Add listener for dark mode changes
    const handleStorageChange = () => {
      checkDarkMode();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  useEffect(() => {
    if (show && courseId) {
      loadCertificate();
    }
  }, [show, courseId]);

  const loadCertificate = async () => {
    try {
      setLoading(true);
      setError(null);

      // console.log(
      //   `Loading certificate for course ID: ${courseId}, completion date: ${completionDate}`
      // );

      const certificateData = await getCertificates(
        studentId,
        courseId,
        completionDate
      );
      // console.log("Certificate data received:", certificateData);

      if (Array.isArray(certificateData)) {
        if (certificateData.length > 0) {
          setCertificate(certificateData[0]);
        } else {
          setError("No certificate found for this course");
        }
      } else {
        setCertificate(certificateData);
      }
    } catch (err) {
      // console.error("Error loading certificate:", err);
      setError(
        "Failed to load certificate: " + (err.message || "Unknown error")
      );
      Toast().fire({
        icon: "error",
        title: "Failed to load certificate",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificate) return;

    try {
      setDownloadLoading(true);

      // Get PDF and PNG URLs
      let pdfUrl = null;
      let pngUrl = null;

      if (certificate.download_pdf) {
        pdfUrl = certificate.download_pdf;
      } else if (certificate.pdf_url) {
        pdfUrl = certificate.pdf_url;
      } else {
        throw new Error("No PDF URL available");
      }

      if (certificate.download_png) {
        pngUrl = certificate.download_png;
      } else if (certificate.image_url) {
        pngUrl = certificate.image_url;
      } else {
        throw new Error("No PNG URL available");
      }

      const baseUrl = IMG_BASE_URL;

      if (pdfUrl.startsWith("/")) {
        pdfUrl = `${baseUrl}${pdfUrl}`;
      }

      if (pngUrl.startsWith("/")) {
        pngUrl = `${baseUrl}${pngUrl}`;
      }

      // console.log("Downloading certificate files...");
      // console.log("PDF URL:", pdfUrl);
      // console.log("PNG URL:", pngUrl);

      // Get auth token from localStorage
      const token = localStorage.getItem("access");

      // Use Promise.all with fetch for both files
      Promise.all([
        fetch(pdfUrl, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }),
        fetch(pngUrl, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }),
      ])
        .then(([pdfResponse, pngResponse]) => {
          if (!pdfResponse.ok || !pngResponse.ok) {
            throw new Error(
              `Failed to download certificate files: PDF status: ${pdfResponse.status}, PNG status: ${pngResponse.status}`
            );
          }

          return Promise.all([pdfResponse.blob(), pngResponse.blob()]);
        })
        .then(([pdfBlob, pngBlob]) => {
          // console.log("PDF Blob size:", pdfBlob.size, "bytes");
          // console.log("PNG Blob size:", pngBlob.size, "bytes");

          // Verify blobs are not empty
          if (pdfBlob.size === 0 || pngBlob.size === 0) {
            throw new Error("Received empty file(s) from server");
          }

          // Create ZIP file with both files
          const zip = new JSZip();

          // Extract filename from URL or use default names
          const courseName =
            certificate.course_title
              ?.replace(/[^a-z0-9]/gi, "_")
              .toLowerCase() || "certificate";
          const certId = certificate.certificate_id || "cert";

          // Add files to zip with better naming
          zip.file(`${courseName}_certificate_${certId}.pdf`, pdfBlob);
          zip.file(`${courseName}_certificate_${certId}.png`, pngBlob);

          // Generate ZIP blob
          return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
        })
        .then((zipBlob) => {
          // Create download link with specific attributes
          const blobUrl = window.URL.createObjectURL(zipBlob);
          const courseName =
            certificate.course_title
              ?.replace(/[^a-z0-9]/gi, "_")
              .toLowerCase() || "certificate";
          const certId = certificate.certificate_id || "cert";

          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `${courseName}_certificate_${certId}.zip`;
          link.target = "_self";

          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
          }, 100);

          Toast().fire({
            icon: "success",
            title: "Certificate downloaded successfully",
          });
        })
        .catch((error) => {
          // console.error("Error downloading certificate:", error);
          Toast().fire({
            icon: "error",
            title: "Failed to download certificate",
          });
        })
        .finally(() => {
          setDownloadLoading(false);
        });
    } catch (err) {
      // console.error("Error in download handler:", err);
      Toast().fire({
        icon: "error",
        title: "Failed to start download process",
      });
      setDownloadLoading(false);
    }
  };

  const getImageUrl = () => {
    if (!certificate) return null;

    if (certificate.download_png) {
      return certificate.download_png.startsWith("/")
        ? `${IMG_BASE_URL}${certificate.download_png}`
        : certificate.download_png;
    }

    if (certificate.image_url) {
      return certificate.image_url;
    }

    return null;
  };

  // Rest of your component...

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      centered
      className="certificate-modal"
    >
      {/* Modal header */}
      <Modal.Header
        style={{
          backgroundColor: "white",
          borderBottom: darkMode ? "1px solid #444" : "1px solid #dee2e6",
        }}
      >
        <Modal.Title className="text-muted">Course Certificate</Modal.Title>
        <button
          onClick={handleClose}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "1.2rem",
            padding: "0.25rem 0.5rem",
            cursor: "pointer",
            color: "#000", 
            transition: "color 0.15s ease-in-out",
          }}
          aria-label="Close"
          className="custom-close-button"
          onMouseOver={(e) =>
            (e.currentTarget.style.color = "#555") 
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.color = "#000") 
          }
        >
          &#x2715; 
        </button>
      </Modal.Header>

      {/* Modal body */}
      <Modal.Body
        className="p-0"
        style={{
          backgroundColor: "white",

        }}
      >
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-3">Loading your certificate...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : certificate ? (
          <div className="certificate-container p-0">
            {/* Certificate image display */}
            <div className="certificate-image-container text-center py-4 border-top border-bottom">
              <img
                src={getImageUrl()}
                alt="Certificate"
                className="img-fluid certificate-image"
                style={{
                  maxHeight: "350px",
                  objectFit: "contain",
                  width: "auto",
                }}
                onError={(e) => {
                  // console.error("Image failed to load");
                  e.target.src =
                    "https://via.placeholder.com/800x600?text=Certificate+Not+Available";
                  e.target.style.opacity = 0.7;
                }}
              />
            </div>

            {/* Social sharing and download section */}
            <div className="d-flex justify-content-between align-items-center px-4 py-3">
              <div className="d-flex align-items-center">
                <span className="me-2 text-muted">Share:</span>
                <div className="d-flex gap-2">
                  {/* Social buttons */}
                  {["twitter", "facebook", "linkedin", "instagram"].map(
                    (platform) => (
                      <button
                        key={platform}
                        onClick={() => handleShare(platform)}
                        className="btn rounded-circle p-0 d-flex align-items-center justify-content-center"
                        style={{
                          backgroundColor:
                            platform === "twitter"
                              ? "#1DA1F2"
                              : platform === "facebook"
                                ? "#4267B2"
                                : platform === "linkedin"
                                  ? "#0e76a8"
                                  : "#C13584",
                          color: "white",
                          width: "36px",
                          height: "36px",
                          border: "none",
                        }}
                      >
                        <i
                          className={`fab fa-${
                            platform === "twitter"
                              ? "twitter"
                              : platform === "facebook"
                                ? "facebook-f"
                                : platform === "linkedin"
                                  ? "linkedin-in"
                                  : "instagram"
                          }`}
                        ></i>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Download button */}
              <Button
                variant="success"
                onClick={handleDownload}
                className="px-4"
                disabled={downloadLoading}
              >
                {downloadLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating ZIP...
                  </>
                ) : (
                  <>
                    <i className="fas fa-download me-2"></i>
                    Download ZIP
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="alert alert-info m-3">
            No certificate found for this course. Try refreshing the page.
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default CertificateModal;
