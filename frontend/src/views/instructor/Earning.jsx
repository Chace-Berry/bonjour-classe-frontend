import { useState, useEffect } from "react";
import moment from "moment";

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";


import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";

function Earning() {
  const [stats, setStats] = useState([]);
  const [earning, setEarning] = useState([]);
  const [bestSellingCourse, setBestSellingCourse] = useState([]);

  useEffect(() => {
    useAxios()
      .get(`teacher/summary/${UserData()?.user_id}/`)
      .then((res) => {
        setStats(res.data[0]);
      });

    useAxios()
      .get(`teacher/all-months-earning/${UserData()?.user_id}/`)
      .then((res) => {
        setEarning(res.data);
      });

    useAxios()
      .get(`teacher/best-course-earning/${UserData()?.user_id}/`)
      .then((res) => {
        setBestSellingCourse(res.data);
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
          <div className="card mb-4">
            <div className="card-body">
              <h3 className="mb-0">Earnings</h3>
              <p className="mb-0">
                You have full control to manage your earnings and revenue.
              </p>
            </div>
          </div>

          {/* Earnings Overview */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Earnings Overview</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-xl-6 col-lg-6 col-md-12 col-12 mb-3 mb-lg-0">
                  <div className="border p-3 rounded shadow-sm">
                    <i className="fe fe-shopping-cart icon-shape icon-sm rounded-3 bg-light-success text-dark-success mt-2" />
                    <h3 className="display-4 fw-bold mt-3 mb-0">
                      ${stats.total_revenue?.toFixed(2)}
                    </h3>
                    <span>Total Revenue</span>
                  </div>
                </div>
                <div className="col-xl-6 col-lg-6 col-md-12 col-12 mb-3 mb-lg-0">
                  <div className="border p-3 rounded shadow-sm">
                    <i className="fe fe-shopping-cart icon-shape icon-sm rounded-3 bg-light-success text-dark-success mt-2" />
                    <h3 className="display-4 fw-bold mt-3 mb-0">
                      ${stats.monthly_revenue?.toFixed(2)}
                    </h3>
                    <span>Monthly Revenue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Best Selling Courses */}
          <div className="card mb-4">
            <div className="card-header border-bottom-0">
              <h3 className="mb-0 h4">Best Selling Courses</h3>
            </div>
            <div className="table-responsive">
              <table className="table mb-0 text-nowrap table-hover table-centered text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th>Courses</th>
                    <th>Sales</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellingCourse?.map((b, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={"https://127.0.0.1:8000" + b.course_image}
                            alt={b.course_title}
                            style={{
                              width: "100px",
                              height: "70px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                            className="rounded img-4by3-lg"
                          />
                          <h5 className="mb-0 ms-3">{b.course_title}</h5>
                        </div>
                      </td>
                      <td>{b.sales}</td>
                      <td>${b.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Earning History */}
          <div className="card mb-4">
            <div className="card-header border-bottom-0">
              <h3 className="h4 mb-3">Earning History</h3>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Month</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {earning?.map((e, index) => (
                    <tr key={index}>
                      <td>
                        {moment()
                          .month(e.month - 1)
                          .format("MMMM")}
                      </td>
                      <td>${e.total_earning?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Earning;
