import React from 'react';

const CertificateCard = ({ certificate }) => {
  const { studentName, courseName, completionDate, filePath } = certificate;

  const handleDownload = () => {
    window.open(filePath, '_blank');
  };

  return (
    <div className="certificate-card border rounded p-4 shadow-lg">
      <h2 className="text-xl font-bold">{courseName}</h2>
      <p className="text-gray-700">Awarded to: {studentName}</p>
      <p className="text-gray-500">Completion Date: {new Date(completionDate).toLocaleDateString()}</p>
      <button 
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
        onClick={handleDownload}
      >
        Download Certificate
      </button>
    </div>
  );
};

export default CertificateCard;