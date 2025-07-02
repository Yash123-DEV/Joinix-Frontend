"use client";

import { useEffect, useRef } from "react";
import io from "socket.io-client";


const socket = io("https://joinix-backend-1.onrender.com");

export default function VideoRoom ({roomId}: {roomId: string}) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const peerRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const start = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;

            

            if(localStreamRef.current) {
                localVideoRef.current!.srcObject = stream;
            }

            socket.emit("joinRoom", roomId);

            socket.on("user-joined", async () => {
                if (peerRef.current) return;
                const peer = createPeer(roomId);
                peerRef.current = peer;
                stream.getTracks().forEach((track) => peer.addTrack(track, stream));
            });

            socket.on("offer", async (data: {offer: RTCSessionDescriptionInit }) => {
                const peer = createPeer(roomId, false);
                peerRef.current = peer;
                stream.getTracks().forEach((track) => peer.addTrack(track, stream));
                await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit("answer", { roomId, answer });
            });

            socket.on("answer", async (data: { answer: RTCSessionDescriptionInit }) => {
                await peerRef.current?.setRemoteDescription(
                new RTCSessionDescription(data.answer)
                );
            });

            socket.on("ice-candidate", async (data:{ candidate: RTCIceCandidateInit }) => {
                try {
                    await peerRef.current?.addIceCandidate(data.candidate);
                } catch (error) {
                console.error("Error adding received ICE candidate", error);
                }
            });
        }

        start();

        return () => {
    peerRef.current?.close();
    socket.disconnect();
  };

    }, [roomId]);

      const createPeer = (roomId: string, isInitiator = true) => {
        const peer = new RTCPeerConnection({
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
       ],
    });


    peer.onicecandidate = (event) => {
        if(event.candidate) {
            socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
    };

    peer.ontrack = (event) => {
        if(remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
        }
    };

    if(isInitiator) {
        peer.onnegotiationneeded = async () => {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit("offer", {roomId, offer});
        };
    }

    return peer;


}
return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div>
        <h2 className="text-lg font-bold mb-2">Your Camera</h2>
        <video ref={localVideoRef} autoPlay playsInline muted className="rounded-xl w-full shadow" />
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">Friend&apos;s Camera</h2>
        <video ref={remoteVideoRef} autoPlay playsInline className="rounded-xl w-full shadow" />
      </div>
    </div>
)

}