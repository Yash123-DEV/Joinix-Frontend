"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinRoomForm() {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomId.trim()) {
      setError("Room ID is required");
      return;
    }

    try {
      const res = await fetch("https://joinix-backend-1.onrender.com/api/rooms/join", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({ roomId }),

      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join room");
      } else {
        // Success: redirect to room page
        router.push(`/room/${roomId}`);
      }
    } catch (err) {
      console.error("Error joining room:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleJoinRoom} className="space-y-4 p-4 border rounded-xl max-w-md mx-auto mt-8 shadow-lg">
      <h2 className="text-xl font-semibold text-center">Join a Room</h2>
      
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Join Room
      </button>
    </form>
  );
}
