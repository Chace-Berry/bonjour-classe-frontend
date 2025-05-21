import { useState, useEffect } from "react";
import moment from "moment";

import Sidebar from "./Partials/Sidebar";
import Header from "./Partials/Header";

import useAxios from "../../utils/useAxios";
import UserData from "../plugin/UserData";

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    useAxios()
      .get(`teacher/course-order-list/${UserData()?.teacher_id}/`)
      .then((res) => {
        console.log(res.data);
        setOrders(res.data);
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
            {/* Card Header */}
            <div className="card-header border-bottom-0">
              <h3 className="mb-0">Orders</h3>
              <span>
                Order Dashboard is a quick overview of all current orders.
              </span>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="table mb-0 text-nowrap table-hover table-centered">
                <thead className="table-light">
                  <tr>
                    <th>Courses</th>
                    <th>Amount</th>
                    <th>Invoice</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((o, index) => (
                    <tr key={index}>
                      <td>
                        <h5 className="mb-0">
                          <a
                            href="#"
                            className="text-inherit text-decoration-none text-dark"
                          >
                            {o.course.title}
                          </a>
                        </h5>
                      </td>
                      <td>${o.price}</td>
                      <td>#{o.order.oid}</td>
                      <td>{moment(o.date).format("DD MMM, YYYY")}</td>
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

export default Orders;
