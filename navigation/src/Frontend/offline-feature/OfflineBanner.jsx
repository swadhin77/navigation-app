import React, { useContext } from "react";
import { OfflineContext } from "./OfflineProvider";
import "./offline.css";

export default function OfflineBanner() {

  const { isOffline } = useContext(OfflineContext);

  return (
    <div className={`offline-wrapper ${isOffline ? "show" : ""}`}>
      
      <div className="offline-banner">

        <div className="offline-icon">
          ⚠
        </div>

        <div className="offline-text">
          Offline Mode — Limited Navigation Features
        </div>

      </div>

    </div>
  );

}