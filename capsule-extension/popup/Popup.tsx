import React, { useEffect, useState } from "react";
import { Bookmark, LayoutDashboard, Video, Power } from "lucide-react";
import { CONFIG } from "../utils/config";

const Popup: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [videoCount, setVideoCount] = useState<number>(0);

  useEffect(() => {
    chrome.storage.local.get(
      ["capsule-enabled", "capsule-video-count"],
      (result) => {
        if (result["capsule-enabled"] !== undefined)
          setIsEnabled(result["capsule-enabled"]);
        if (result["capsule-video-count"] !== undefined)
          setVideoCount(result["capsule-video-count"]);
      },
    );

    const listener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes["capsule-enabled"])
        setIsEnabled(changes["capsule-enabled"].newValue);
      if (changes["capsule-video-count"])
        setVideoCount(changes["capsule-video-count"].newValue);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const toggleEnabled = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.local.set({ "capsule-enabled": newState });
    chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: "ENABLE_STATE_CHANGED",
              enabled: newState,
            })
            .catch(() => {});
        }
      });
    });
  };

  return (
    <div
      style={{
        width: "280px",
        backgroundColor: "#0A0A0A",
        fontFamily: "DM Sans, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid #1A1A1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              backgroundColor: "#FF2D2D",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(255,45,45,0.35)",
            }}
          >
            <Bookmark size={13} fill="white" color="white" />
          </div>
          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "#FFFFFF",
                letterSpacing: "-0.3px",
              }}
            >
              Capsule
            </div>
            <div style={{ fontSize: "10px", color: "#555", marginTop: "1px" }}>
              YouTube Library
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div
          style={{
            padding: "3px 8px",
            borderRadius: "20px",
            backgroundColor: isEnabled
              ? "rgba(255,45,45,0.12)"
              : "rgba(255,255,255,0.05)",
            border: `1px solid ${isEnabled ? "rgba(255,45,45,0.3)" : "#222"}`,
            fontSize: "9px",
            fontWeight: "700",
            letterSpacing: "0.8px",
            color: isEnabled ? "#FF2D2D" : "#444",
          }}
        >
          {isEnabled ? "ACTIVE" : "PAUSED"}
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          padding: "12px 16px",
          borderBottom: "1px solid #1A1A1A",
          gap: "8px",
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: "#141414",
            borderRadius: "10px",
            padding: "10px 12px",
            border: "1px solid #1E1E1E",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              marginBottom: "4px",
            }}
          >
            <Video size={10} color="#FF2D2D" />
            <span
              style={{
                fontSize: "9px",
                color: "#555",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              SAVED
            </span>
          </div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            {videoCount}
          </div>
          <div style={{ fontSize: "9px", color: "#444", marginTop: "2px" }}>
            videos
          </div>
        </div>

        {/* Toggle card */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#141414",
            borderRadius: "10px",
            padding: "10px 12px",
            border: "1px solid #1E1E1E",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              marginBottom: "4px",
            }}
          >
            <Power size={10} color={isEnabled ? "#FF2D2D" : "#555"} />
            <span
              style={{
                fontSize: "9px",
                color: "#555",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              SIDEBAR
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: isEnabled ? "#E8E8E8" : "#555",
                fontWeight: "600",
              }}
            >
              {isEnabled ? "On" : "Off"}
            </span>
            {/* Toggle switch */}
            <button
              onClick={toggleEnabled}
              style={{
                width: "34px",
                height: "18px",
                borderRadius: "18px",
                backgroundColor: isEnabled ? "#FF2D2D" : "#2A2A2A",
                position: "relative",
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.2s",
                outline: "none",
                boxShadow: isEnabled ? "0 0 8px rgba(255,45,45,0.3)" : "none",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                  position: "absolute",
                  top: "3px",
                  left: isEnabled ? "19px" : "3px",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Divider label */}
      <div style={{ padding: "10px 16px 6px" }}>
        <span
          style={{
            fontSize: "9px",
            color: "#333",
            fontWeight: "600",
            letterSpacing: "0.8px",
          }}
        >
          QUICK ACTIONS
        </span>
      </div>

      {/* Dashboard button */}
      <div style={{ padding: "0 16px 16px" }}>
        <button
          onClick={() => chrome.tabs.create({ url: CONFIG.DASHBOARD_URL })}
          style={{
            width: "100%",
            height: "38px",
            backgroundColor: "#FF2D2D",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.3px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "background-color 0.15s",
            boxShadow: "0 2px 12px rgba(255,45,45,0.25)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#CC2424")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#FF2D2D")
          }
        >
          <LayoutDashboard size={13} />
          Open Dashboard
        </button>

        {/* Version */}
        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            fontSize: "9px",
            color: "#2A2A2A",
            letterSpacing: "1px",
            fontWeight: "600",
          }}
        >
          CAPSULE v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Popup;
