import VideoRoom from "@/features/auth/components/videoRoom";

export default async function RoomPage({ 
  params 
}: { 
  params: Promise<{ room: string }> 
}) {
  const { room } = await params;
  
  return (
    <div>
      <h1 className="text-xl font-bold p-4">Room: {room}</h1>
      <VideoRoom roomId={room} />
    </div>
  );
}


//const roomId = params.room;