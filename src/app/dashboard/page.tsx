

import CreateRoomCard from "@/features/auth/components/create-room-card";
import { Separator } from "@/components/ui/separator";
import JoinRoomForm from "@/features/auth/components/join-room-form";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <CreateRoomCard/>
      <Separator/>
      <JoinRoomForm/>
    </div>
  );
}