import VideoRoom from "@/features/auth/components/videoRoom";

export default function RoomPage({ params }: { params: { room: string } }) {
  return (
    <div>
      <h1 className="text-xl font-bold p-4">Room: {params.room}</h1>
      <VideoRoom roomId={params.room} />
    </div>
  );
}



//const roomId = params.room;