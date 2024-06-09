import { useState, useRef, useEffect } from 'react';
import Peer from 'peerjs';

const useVideoCall = (currentUser) => {
  const [peerId, setPeerId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const currentUserVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerInstance = useRef(null);

  useEffect(() => {
    const peer = new Peer(currentUser.id);

    peer.on('open', (id) => {
      setPeerId(id);
      console.log('Peer ID:', id);
    });

    peer.on('call', (call) => {
      setIncomingCall(call);
      setIsReceivingCall(true);
    });

    peerInstance.current = peer;

    return () => {
      peer.destroy();
    };
  }, [currentUser.id]);

  const callUser = (remotePeerId) => {
    setShowVideo(true);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(mediaStream => {
        currentUserVideoRef.current.srcObject = mediaStream;
        currentUserVideoRef.current.play();

        const call = peerInstance.current.call(remotePeerId, mediaStream);
        call.on('stream', (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        });
      })
      .catch(error => {
        console.error('Failed to get local stream', error);
      });
  };

  const acceptCall = () => {
    setShowVideo(true);
    setIsReceivingCall(false);
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(mediaStream => {
        currentUserVideoRef.current.srcObject = mediaStream;
        currentUserVideoRef.current.play();
        incomingCall.answer(mediaStream);
        incomingCall.on('stream', (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        });
      })
      .catch(error => {
        console.error('Failed to get local stream', error);
      });
  };

  const declineCall = () => {
    setIncomingCall(null);
    setIsReceivingCall(false);
    setShowVideo(false);

    if (currentUserVideoRef.current && currentUserVideoRef.current.srcObject) {
      let tracks = currentUserVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      let tracks = remoteVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const endCall = () => {
    setShowVideo(false);

    if (currentUserVideoRef.current && currentUserVideoRef.current.srcObject) {
      let tracks = currentUserVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      let tracks = remoteVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  return {
    peerId,
    incomingCall,
    isReceivingCall,
    showVideo,
    currentUserVideoRef,
    remoteVideoRef,
    callUser,
    acceptCall,
    declineCall,
    endCall
  };
};

export default useVideoCall;
