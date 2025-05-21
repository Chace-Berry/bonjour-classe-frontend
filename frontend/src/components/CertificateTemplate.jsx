import React, { useState } from 'react';
import { fabric } from 'fabric';

const CertificateTemplate = () => {
  const [canvas, setCanvas] = useState(null);
  const [template, setTemplate] = useState({
    title: 'Certificate of Completion',
    studentName: 'Student Name',
    courseName: 'Course Name',
    completionDate: new Date().toLocaleDateString(),
  });

  const initCanvas = () => {
    const newCanvas = new fabric.Canvas('certificateCanvas', {
      width: 800,
      height: 600,
      backgroundColor: '#fff',
    });
    setCanvas(newCanvas);
    drawTemplate(newCanvas);
  };

  const drawTemplate = (canvas) => {
    const title = new fabric.Text(template.title, {
      fontSize: 30,
      left: 100,
      top: 50,
      fontFamily: 'Arial',
      fill: '#000',
    });

    const studentText = new fabric.Text(`This certifies that`, {
      fontSize: 20,
      left: 100,
      top: 150,
      fontFamily: 'Arial',
      fill: '#000',
    });

    const name = new fabric.Text(template.studentName, {
      fontSize: 24,
      left: 100,
      top: 200,
      fontFamily: 'Arial',
      fill: '#000',
    });

    const courseText = new fabric.Text(`has completed the course`, {
      fontSize: 20,
      left: 100,
      top: 250,
      fontFamily: 'Arial',
      fill: '#000',
    });

    const courseName = new fabric.Text(template.courseName, {
      fontSize: 24,
      left: 100,
      top: 300,
      fontFamily: 'Arial',
      fill: '#000',
    });

    const dateText = new fabric.Text(`Date: ${template.completionDate}`, {
      fontSize: 20,
      left: 100,
      top: 350,
      fontFamily: 'Arial',
      fill: '#000',
    });

    canvas.add(title, studentText, name, courseText, courseName, dateText);
    canvas.renderAll();
  };

  const handleDownload = () => {
    if (canvas) {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
      });
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'certificate.png';
      link.click();
    }
  };

  React.useEffect(() => {
    initCanvas();
  }, []);

  return (
    <div>
      <canvas id="certificateCanvas" />
      <button onClick={handleDownload}>Download Certificate</button>
    </div>
  );
};

export default CertificateTemplate;