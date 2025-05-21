import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../student/Partials/Sidebar";
import Header from "../instructor/Partials/Header";
import useAxios from "../../utils/useAxios";
import Cookies from "js-cookie";
import Toast from "../plugin/Toast";

function Checkout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [order, setOrder] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const navigate = useNavigate();
  const param = useParams();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Fetch order details
  const fetchOrder = async () => {
    try {
      const response = await useAxios().get(`order/checkout/${param.order_oid}/`);
      setOrder(response.data);
    } catch (error) {
      // console.error("Error fetching order:", error);
      if (error.response && error.response.status === 401) {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        navigate("/");
      }
    }
  };

  // Apply coupon
  const applyCoupon = async () => {
    const formdata = new FormData();
    formdata.append("order_oid", order?.oid);
    formdata.append("coupon_code", coupon);

    try {
      const response = await useAxios().post(`order/coupon/`, formdata);
      fetchOrder();
      Toast().fire({
        icon: response.data.icon,
        title: response.data.message,
      });
    } catch (error) {
      // console.error("Error applying coupon:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to apply coupon.",
      });
    }
  };

  // Handle payment with Yoco
  const payWithYoco = () => {
    setPaymentLoading(true);

    const yoco = new window.YocoSDK({
      publicKey: "your_yoco_public_key", // Replace with your Yoco public key
    });

    yoco.showPopup({
      amountInCents: Math.round(order.total * 100), // Convert total to cents
      currency: "ZAR", // South African Rand
      callback: async (result) => {
        if (result.error) {
          // console.error("Error:", result.error.message);
          Toast().fire({
            icon: "error",
            title: "Payment failed. Please try again.",
          });
          setPaymentLoading(false);
        } else {
          try {
            const response = await useAxios().post(
              `payment/yoco-checkout/${order.oid}/`,
              { token: result.id }
            );
            if (response.status === 200) {
              navigate(`/payment-success/${order.oid}/`);
            } else {
              Toast().fire({
                icon: "error",
                title: "Payment failed. Please try again.",
              });
            }
          } catch (error) {
            // console.error("Payment error:", error);
            Toast().fire({
              icon: "error",
              title: "Payment failed. Please try again.",
            });
          } finally {
            setPaymentLoading(false);
          }
        }
      },
    });
  };

  useEffect(() => {
    const initializeCheckout = async () => {
      await fetchOrder();

      // Dynamically load Yoco SDK
      const script = document.createElement("script");
      script.src = "https://js.yoco.com/sdk/v1/yoco-sdk-web.js";
      script.async = true;
      script.onload = () => {
        // console.log("Yoco SDK loaded");
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup script when component unmounts
        document.body.removeChild(script);
      };
    };

    initializeCheckout();
  }, [navigate, param.order_oid]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar sidebarCollapsed={sidebarCollapsed} />

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarCollapsed ? "80px" : "270px",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />

        {/* Checkout Section */}
        <div style={{ padding: "20px" }}>
          <div className="row mb-2">
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5>Courses in Your Order</h5>
                  <div className="table-responsive">
                    <table className="table">
                      <tbody>
                        {order?.order_items?.map((o, index) => (
                          <tr key={index}>
                            <td>
                              <img
                                src={o.course.image}
                                alt={o.course.title}
                                style={{
                                  width: "100px",
                                  height: "70px",
                                  objectFit: "cover",
                                }}
                                className="rounded"
                              />
                            </td>
                            <td>
                              <h6>{o.course.title}</h6>
                            </td>
                            <td>
                              <h6 className="text-success">${o.price}</h6>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5>Order Summary</h5>
                  <ul className="list-group mb-3">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Sub Total
                      <span>${order.sub_total}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Discount
                      <span>${order.saved}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      Tax
                      <span>${order.tax_fee}</span>
                    </li>
                    <li className="list-group-item d-flex fw-bold justify-content-between align-items-center">
                      Total
                      <span className="fw-bold">${order.total}</span>
                    </li>
                  </ul>

                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Coupon Code"
                      onChange={(e) => setCoupon(e.target.value)}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={applyCoupon}
                    >
                      Apply
                    </button>
                  </div>

                  <div className="d-grid">
                    {paymentLoading ? (
                      <button
                        className="btn btn-success"
                        disabled
                      >
                        Processing <i className="fas fa-spinner fa-spin"></i>
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        onClick={payWithYoco}
                      >
                        Pay With Yoco
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
