"use client";

import { useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://joinix-backend1.onrender.com", {
    transports: ["websocket", "polling"],
});

export default function VideoRoom ({roomId}: {roomId: string}) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const peerRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const start = async () => {
            try {
                console.log("🚀 Starting video room for roomId:", roomId);
                
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 640 }, 
                        height: { ideal: 480 },
                        facingMode: "user" // Front camera for mobile
                    }, 
                    audio: true 
                });
                localStreamRef.current = stream;
                console.log("✅ Local stream obtained:", stream);
                console.log("Video tracks:", stream.getVideoTracks().length);
                console.log("Audio tracks:", stream.getAudioTracks().length);

                if(localStreamRef.current) {
                    localVideoRef.current!.srcObject = stream;
                    console.log("✅ Local video set");
                }

                socket.emit("joinRoom", roomId);
                console.log("📤 Joined room:", roomId);
                
                socket.emit("checkPeers", roomId);
                console.log("📤 Checking for peers in room:", roomId);

                socket.on("user-joined", async () => {
                    console.log("👤 User joined event received");
                    
                    if (peerRef.current) {
                        console.log("⚠️ Peer already exists, skipping");
                        return;
                    }
                    
                    const peer = createPeer(roomId, true); // isInitiator = true
                    peerRef.current = peer;
                    
                    localStreamRef.current?.getTracks().forEach(track => {
                        console.log("📤 Adding local track to peer:", track.kind);
                        peer.addTrack(track, localStreamRef.current!);
                    });

                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit("offer", { roomId, offer });
                    console.log("📤 Offer sent");
                });

                socket.on("offer", async (data: {offer: RTCSessionDescriptionInit }) => {
                    console.log("📥 Offer received");
                    
                    const peer = createPeer(roomId, false); // isInitiator = false
                    peerRef.current = peer;
                    
                    localStreamRef.current?.getTracks().forEach(track => {
                        console.log("📤 Adding local track to peer:", track.kind);
                        peer.addTrack(track, localStreamRef.current!);
                    });
                    
                    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    socket.emit("answer", { roomId, answer });
                    console.log("📤 Answer sent");
                });

                socket.on("answer", async (data: { answer: RTCSessionDescriptionInit }) => {
                    console.log("📥 Answer received");
                    await peerRef.current?.setRemoteDescription(
                        new RTCSessionDescription(data.answer)
                    );
                    console.log("✅ Remote description set");
                });

                socket.on("ice-candidate", async (data:{ candidate: RTCIceCandidateInit }) => {
                    console.log("📥 ICE candidate received");
                    try {
                        await peerRef.current?.addIceCandidate(data.candidate);
                        console.log("✅ ICE candidate added");
                    } catch (error) {
                        console.error("❌ Error adding received ICE candidate", error);
                    }
                });

                // Additional socket events for debugging
                socket.on("connect", () => {
                    console.log("🔌 Socket connected");
                });

                socket.on("disconnect", () => {
                    console.log("🔌 Socket disconnected");
                });

            } catch (error) {
                console.error("❌ Error in start function:", error);
            }
        }

        start();

        return () => {
            console.log("🧹 Cleaning up...");
            peerRef.current?.close();
            socket.disconnect();
        };

    }, [roomId]);

    const createPeer = (roomId: string, isInitiator: boolean) => {
        console.log("🔗 Creating peer connection, isInitiator:", isInitiator);
        
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                {
                    urls: "turn:openrelay.metered.ca:80",
                    username: "openrelayproject",
                    credential: "openrelayproject",
                },
            ],
        });

        peer.onicecandidate = (event) => {
            if(event.candidate) {
                console.log("📤 Sending ICE candidate");
                socket.emit("ice-candidate", { roomId, candidate: event.candidate });
            } else {
                console.log("✅ ICE gathering complete");
            }
        };

        peer.ontrack = (event) => {
            console.log("🎥 Remote track received!", event);
            console.log("Stream count:", event.streams.length);
            
            if(event.streams.length > 0) {
                const remoteStream = event.streams[0];
                console.log("Remote stream tracks:", remoteStream.getTracks().map(t => t.kind));
                
                if(remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                    console.log("✅ Remote video stream set!");
                } else {
                    console.error("❌ Remote video ref is null");
                }
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log("🧊 ICE Connection State:", peer.iceConnectionState);
        };

        peer.onconnectionstatechange = () => {
            console.log("🔗 Connection State:", peer.connectionState);
        };

        peer.onsignalingstatechange = () => {
            console.log("📡 Signaling State:", peer.signalingState);
        };

        return peer;
    }

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
                    style={{ maxHeight: '300px' }}
                    onLoadedMetadata={() => console.log("✅ Local video loaded")}
                />
            </div>
            <div>
                <h2 className="text-lg font-bold mb-2">Friend&apos;s Camera</h2>
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="rounded-xl w-full shadow bg-gray-200" 
                    style={{ maxHeight: '300px' }}
                    onLoadedMetadata={() => console.log("✅ Remote video loaded")}
                    onError={(e) => console.error("❌ Remote video error:", e)}
                />
                <p className="text-sm text-gray-600 mt-2">
                    {peerRef.current ? 
                        `Connection: ${peerRef.current.connectionState}` : 
                        "Waiting for connection..."
                    }
                </p>
            </div>
        </div>
    )
}