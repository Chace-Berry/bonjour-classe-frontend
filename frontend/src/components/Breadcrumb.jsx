import React from "react";
import { Link } from "react-router-dom";

function Breadcrumb({ title, items = [] }) {
  return (
    <div className="breadcrumb-wrapper py-3 px-4 border-bottom">
      <h1 className="h4 mb-0">{title}</h1>
      {items && items.length > 0 && (
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 mt-1">
            <li className="breadcrumb-item">
                <Link to="/student/dashboard">Dashboard</Link>
            </li>
            {items.map((item, index) => (
              <li 
                key={index} 
                className={`breadcrumb-item ${index === items.length - 1 ? 'active' : ''}`}
                aria-current={index === items.length - 1 ? 'page' : undefined}
              >
                {item.link ? (
                  <Link to={item.link}>{item.label}</Link>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}

export default Breadcrumb;