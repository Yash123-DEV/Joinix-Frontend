"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("https://joinix-backend1.onrender.com", {
  transports: ["websocket"],
});

export default function VideoRoom({ roomId }: { roomId: string }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  const createPeerConnection = useCallback(() => {
    // Clean up existing connection if any
    if (peerRef.current) {
      peerRef.current.close();
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:joinix.metered.live:80",
          username: "a97f911436e3a1ea691c9d14",
          credential: "FgbJfeX6qEHUexDT",
        },
        {
          urls: "turn:joinix.metered.live:443",
          username: "a97f911436e3a1ea691c9d14",
          credential: "FgbJfeX6qEHUexDT",
        },
        {
          urls: "turn:joinix.metered.live:443?transport=tcp",
          username: "a97f911436e3a1ea691c9d14",
          credential: "FgbJfeX6qEHUexDT",
        },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate");
        socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      if (!remoteVideoRef.current) return;

      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      remoteVideoRef.current.srcObject = remoteStream;
      setConnectionStatus("Connected");
    };

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      console.log("ICE connection state:", state);
      setConnectionStatus(state.charAt(0).toUpperCase() + state.slice(1));

      if (state === "failed" || state === "disconnected") {
        console.log("Attempting to restart ICE...");
        // Could implement reconnection logic here
      }
    };

    peer.onnegotiationneeded = async () => {
      console.log("Negotiation needed");
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer });
      } catch (err) {
        console.error("Negotiation error:", err);
      }
    };

    // Add local tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current!);
      });
    }

    return peer;
  }, [roomId]);

  useEffect(() => {
    const start = async () => {
      try {
        console.log("Starting video room for:", roomId);

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: true,
        });

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Set up socket listeners
        socket.emit("joinRoom", roomId);
        socket.emit("checkPeers", roomId);

        socket.on("user-joined", async () => {
          console.log("Remote user joined");
          peerRef.current = createPeerConnection();
        });

        socket.on("offer", async (data: { offer: RTCSessionDescriptionInit }) => {
          console.log("Received offer");
          if (!peerRef.current) {
            peerRef.current = createPeerConnection();
          }

          try {
            await peerRef.current.setRemoteDescription(
              new RTCSessionDescription(data.offer)
            );
            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);
            socket.emit("answer", { roomId, answer });
          } catch (err) {
            console.error("Offer handling error:", err);
          }
        });

        socket.on("answer", async (data: { answer: RTCSessionDescriptionInit }) => {
          console.log("Received answer");
          if (peerRef.current) {
            try {
              await peerRef.current.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
            } catch (err) {
              console.error("Answer handling error:", err);
            }
          }
        });

        socket.on("ice-candidate", async (data: { candidate: RTCIceCandidateInit }) => {
          console.log("Received ICE candidate");
          try {
            if (peerRef.current && data.candidate) {
              await peerRef.current.addIceCandidate(
                new RTCIceCandidate(data.candidate)
              );
            }
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        });

        socket.on("connect", () => {
          console.log("Socket connected");
          setConnectionStatus("Waiting for peer...");
        });

        socket.on("disconnect", () => {
          console.log("Socket disconnected");
          setConnectionStatus("Disconnected");
        });

      } catch (err) {
        console.error("Error starting video room:", err);
        setConnectionStatus("Error - check console");
      }
    };

    start();

    return () => {
      console.log("Cleaning up...");
      
      if (peerRef.current) {
        peerRef.current.close();
      }
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [roomId, createPeerConnection]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div>
        <h2 className="text-lg font-bold mb-2">Your Camera</h2>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="rounded-xl w-full shadow"
          style={{ maxHeight: "300px" }}
        />
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">Friend&apos;s Camera
</h2>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="rounded-xl w-full shadow bg-gray-200"
          style={{ maxHeight: "300px" }}
        />
        <div className="mt-2 text-sm">
          <p className="font-medium">Status: {connectionStatus}</p>
          {peerRef.current && (
            <p className="text-gray-600">
              ICE: {peerRef.current.iceConnectionState} | 
              Signaling: {peerRef.current.signalingState}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}