// src/Frontend/History/TravelHistory.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TravelHistory.css";

const TravelHistory = ({ isOpen, onClose, userId }) => {
  const [history, setHistory] = useState([]);
  const [filterType, setFilterType] = useState("day");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today);
    setToDate(today);
    setFilterDate(today);
    fetchHistory(today, today, "day");
  }, []);

  const fetchHistory = async (from, to, type) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/travel-history?userId=${userId}&fromDate=${from}&toDate=${to}&type=${type}`
      );
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching travel history:", error);
      setHistory([]);
    }
  };

  const handleFilterChange = (e) => {
    const type = e.target.value;
    setFilterType(type);
    if (type === "day") fetchHistory(fromDate, toDate, "day");
    else fetchHistory(filterDate, filterDate, type);
  };

  const handleFromDateChange = (e) => {
    const newFrom = e.target.value;
    setFromDate(newFrom);
    if (filterType === "day" && toDate) {
      fetchHistory(newFrom, toDate, "day");
    }
  };

  const handleToDateChange = (e) => {
    const newTo = e.target.value;
    setToDate(newTo);
    if (filterType === "day" && fromDate) {
      fetchHistory(fromDate, newTo, "day");
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setFilterDate(date);
    if (filterType !== "day") {
      fetchHistory(date, date, filterType);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="travel-history-overlay" onClick={onClose}>
      <div
        className="travel-history-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="travel-history-header">
          <h2>Travel History</h2>
          <button
            className="travel-history-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="travel-history-filters">
          <select value={filterType} onChange={handleFilterChange}>
            <option value="day">Day (Range)</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>

          {filterType === "day" && (
            <>
              <label>From:</label>
              <input type="date" value={fromDate} onChange={handleFromDateChange} />
              <label>To:</label>
              <input type="date" value={toDate} onChange={handleToDateChange} />
            </>
          )}

          {(filterType === "week" || filterType === "month") && (
            <input type="date" value={filterDate} onChange={handleDateChange} />
          )}
        </div>

        <table className="travel-history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th>Distance (km)</th>
              <th>Time Taken</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((item, index) => (
                <tr key={index}>
                  <td data-label="Date">{item.date}</td>
                  <td data-label="From">{item.fromLocation}</td>
                  <td data-label="To">{item.toLocation}</td>
                  <td data-label="Distance (km)">{item.distance}</td>
                  <td data-label="Time Taken">{item.timeTaken}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TravelHistory;
