import React, { useEffect, useState } from "react";
import { fetchCertificates } from "../../utils/certificate";
import CertificateCard from "../../components/CertificateCard";
import CertificateModal from "./Partials/CertificateModal";

function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const data = await fetchCertificates();
        setCertificates(data);
      } catch (err) {
        setError("Failed to load certificates.");
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, []);

  const handleCertificateClick = (certificate) => {
    setSelectedCertificate(certificate);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCertificate(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Your Certificates</h1>
      <p>Here you can view and download your certificates.</p>
      <div className="row">
        {certificates.map((certificate) => (
          <div className="col-md-4 mb-4" key={certificate.id}>
            <CertificateCard
              certificate={certificate}
              onClick={() => handleCertificateClick(certificate)}
            />
          </div>
        ))}
      </div>
      {showModal && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

export default Certificates;