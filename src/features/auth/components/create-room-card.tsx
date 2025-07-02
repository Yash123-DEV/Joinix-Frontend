"use client";

import { useEffect, useState } from "react";
import { createRoom } from "@/lib/api";
// import { useRouter } from "next/navigation";

export default function CreateRoomCard() {
    //const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roomData, setRoomData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Get userId from localStorage once component mounts
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserId(parsed.id);
    }
  }, []);

  const handleCreateRoomClick = async () => {
    if (!userId) {
      setError("User ID is missing. Please login again.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const room = await createRoom(userId);
      setRoomData(room);
      console.log("Room created:", room);
      localStorage.setItem("room", JSON.stringify(room));
      localStorage.setItem("roomId", room.roomId);

      //router.push(`/room/${room.roomId}`);


    } catch (err: any) {
      console.error("Create room error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-2">Create Room</h2>
      <button
        onClick={handleCreateRoomClick}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Creating..." : "Create Room"}
      </button>

      {error && <p className="text-red-600 mt-2">{error}</p>}
      {roomData && (
        <p className="text-green-600 mt-2">
          Room created with code: {roomData.roomId}
        </p>
      )}
    </div>
  );
}
