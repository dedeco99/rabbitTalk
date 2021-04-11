import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

const Room = (props) => {
  const roomId = props.match.params.roomId;
  const socket = useRef();
  const rtcPeerConnection = useRef();
  const [users, setUsers] = useState([]);
  const localVideo = useRef();
  const remoteVideo = useRef();
  const isRoomCreator = useRef(false);

  useEffect(async () => {
    socket.current = io.connect("wss://ehub.rabbitsoftware.dev", {
      transports: ["websocket"],
    });
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localVideo.current.srcObject = localStream;

    socket.current.emit("userConnected", roomId);

    socket.current.on("roomCreated", async () => {
      isRoomCreator.current = true;
    });

    socket.current.on("roomJoined", async () => {
      socket.current.emit("startCall", roomId);
    });

    socket.current.on("startCall", async () => {
      if (isRoomCreator.current) {
        rtcPeerConnection.current = new RTCPeerConnection(iceServers);

        localStream.getTracks().forEach((track) => {
          rtcPeerConnection.current.addTrack(track, localStream);
        });

        rtcPeerConnection.current.ontrack = setRemoteStream;
        rtcPeerConnection.current.onicecandidate = sendIceCandidate;

        let sessionDescription;
        try {
          sessionDescription = await rtcPeerConnection.current.createOffer();
          rtcPeerConnection.current.setLocalDescription(sessionDescription);
        } catch (error) {
          console.error(error);
        }

        socket.current.emit("createOffer", {
          type: "createOffer",
          sdp: sessionDescription,
          roomId,
        });
      }
    });

    socket.current.on("createOffer", async (event) => {
      if (!isRoomCreator.current) {
        rtcPeerConnection.current = new RTCPeerConnection(iceServers);

        localStream.getTracks().forEach((track) => {
          rtcPeerConnection.current.addTrack(track, localStream);
        });

        rtcPeerConnection.current.ontrack = setRemoteStream;
        rtcPeerConnection.current.onicecandidate = sendIceCandidate;
        rtcPeerConnection.current.setRemoteDescription(
          new RTCSessionDescription(event)
        );

        let sessionDescription;
        try {
          sessionDescription = await rtcPeerConnection.current.createAnswer();
          rtcPeerConnection.current.setLocalDescription(sessionDescription);
        } catch (error) {
          console.error(error);
        }

        socket.current.emit("createAnswer", {
          type: "createAnswer",
          sdp: sessionDescription,
          roomId,
        });
      }
    });

    socket.current.on("createAnswer", (event) => {
      rtcPeerConnection.current.setRemoteDescription(
        new RTCSessionDescription(event)
      );
    });

    socket.current.on("sendIceCandidate", (event) => {
      if (rtcPeerConnection.current) {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: event.label,
          candidate: event.candidate,
        });

        rtcPeerConnection.current.addIceCandidate(candidate);
      }
    });
  }, []);

  async function callUser() {
    socket.current.emit("callUser", roomId);
  }

  function setRemoteStream(event) {
    remoteVideo.current.srcObject = event.streams[0];
  }

  function sendIceCandidate(event) {
    if (event.candidate) {
      socket.current.emit("sendIceCandidate", {
        roomId,
        label: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate,
      });
    }
  }

  return (
    <div>
      <ul>
        {users.map((u) => (
          <li key={u} onClick={() => callUser(u)}>
            {u}
          </li>
        ))}
      </ul>
      <video
        style={{ border: "1px solid red" }}
        ref={localVideo}
        muted
        autoPlay
      />
      <video style={{ border: "1px solid green" }} ref={remoteVideo} autoPlay />
    </div>
  );
};

export default Room;
