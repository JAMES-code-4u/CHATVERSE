import React from "react";
import { useSocket } from "../context/SocketContext";

export default function IncomingCallAlert({ callData, onAccept, onReject }) {
  const isVideo = callData?.callType === "video";

  return (
    <div className="fixed top-6 right-6 z-[9998] w-80 bg-white rounded-3xl shadow-2xl shadow-primary/20 border border-outline-variant p-5 fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          {callData?.callerInfo?.avatar ? (
            <img src={callData.callerInfo.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[10px]">
              {isVideo ? "videocam" : "call"}
            </span>
          </div>
        </div>
        <div>
          <p className="font-semibold text-on-surface text-sm">{callData?.callerInfo?.username || "Someone"}</p>
          <p className="text-xs text-on-surface-variant">
            Incoming {isVideo ? "video" : "voice"} call...
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onReject}
          className="flex-1 py-2.5 rounded-2xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">call_end</span>
          Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 rounded-2xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">{isVideo ? "videocam" : "call"}</span>
          Accept
        </button>
      </div>
    </div>
  );
}