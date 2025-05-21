import { useState, useEffect } from "react";
import moment from "moment";

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";

import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";

function Students() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    useAxios()
      .get(`teacher/student-lists/${UserData()?.teacher_id}/`)
      .then((res) => {
        console.log("res.data: ", res.data);
        setStudents(res.data);
      });
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: "270px",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div style={{ padding: "20px" }}>
          <h4 className="mb-4">
            <i className="fas fa-users"></i> Students
          </h4>

          <div className="card mb-4">
            {/* Card body */}
            <div className="p-4 d-flex justify-content-between align-items-center">
              <div>
                <h3 className="mb-0">Students</h3>
                <span>Meet people taking your course.</span>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="row">
            {students?.map((s, index) => (
              <div className="col-lg-4 col-md-6 col-12" key={index}>
                <div className="card mb-4">
                  <div className="card-body">
                    <div className="text-center">
                      <img
                        src={`https://127.0.0.1:8000${s.image}`}
                        className="rounded-circle avatar-xl mb-3"
                        style={{
                          width: "70px",
                          height: "70px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                        alt="avatar"
                      />
                      <h4 className="mb-1">{s.full_name}</h4>
                      <p className="mb-0">
                        <i className="fas fa-map-pin me-1" /> {s.country}
                      </p>
                    </div>
                    <div className="d-flex justify-content-between py-2 mt-4 fs-6">
                      <span>Enrolled</span>
                      <span className="text-dark">
                        {moment(s.date).format("DD MMM YYYY")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Students;
