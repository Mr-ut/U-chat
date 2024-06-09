import { useEffect, useRef, useState } from "react";
import "./chat.css";
import Peer from 'peerjs';
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import TimeAgo from 'javascript-time-ago'

// English.
import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

const Chat = () => {
  const [chat, setChat] = useState(null);  // Initialize as null to handle loading state
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);

  // video calling
  const [peerId, setPeerId] = useState('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);
  const peerInstance = useRef(null);
  const currentCall = useRef(null);
  const endcRef = useRef();

  useEffect(() => {
    const peer = new Peer(currentUser.id);

    peer.on('open', (id) => {
      setPeerId(id);
      console.log('Peer ID:', id); // Log the peer ID
    });

    peer.on('call', (call) => {
      console.log('Incoming call');
      setIncomingCall(call);
      setIsReceivingCall(true);
      // const getUserMedia = navigator.mediaDevices.getUserMedia;

      // getUserMedia({ video: true, audio: true })
      //   .then((mediaStream) => {
      //     currentUserVideoRef.current.srcObject = mediaStream;
      //     currentUserVideoRef.current.play();
      //     call.answer(mediaStream);
      //     call.on('stream', (remoteStream) => {
      //       remoteVideoRef.current.srcObject = remoteStream;
      //       remoteVideoRef.current.play();
      //     });
      //   })
      //   .catch((err) => {
      //     console.error('Failed to get local stream', err);
      //     alert('Failed to access media devices. Please ensure your camera and microphone are connected and allowed.');
      //   });
    });

    peerInstance.current = peer;

    // Clean up the peer instance on component unmount
    return () => {
      peer.destroy();
    };
  }, [currentUser.id]);

  const call = (remotePeerId) => {
    setShowVideo(true);
    console.log('Initiating call to:', remotePeerId);
    const getUserMedia = navigator.mediaDevices.getUserMedia;

    getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        currentUserVideoRef.current.srcObject = mediaStream;
        currentUserVideoRef.current.play();
        const call = peerInstance.current.call(remotePeerId, mediaStream);

        call.on('stream', (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        });
      })
      .catch((err) => {
        console.error('Failed to get local stream', err);
        alert('Failed to access media devices. Please ensure your camera and microphone are connected and allowed.');
      });
  };

  const endCall = () => {
    setShowVideo(false);

    if (currentCall.current) {
      currentCall.current.close();
    }

    if (currentUserVideoRef.current && currentUserVideoRef.current.srcObject) {
      let tracks = currentUserVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      let tracks = remoteVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const acceptCall = () => {
    console.log('Call Accepted');
  
    // Ensure navigator.mediaDevices.getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support media devices.');
      return;
    }
  
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        // Set the local video stream
        currentUserVideoRef.current.srcObject = mediaStream;
        currentUserVideoRef.current.play();
  
        // Answer the incoming call with the local media stream
        incomingCall.answer(mediaStream);
  
        // Handle the remote stream
        incomingCall.on('stream', (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play();
        });
  
        // Update the state to reflect that the call is accepted
        setIsReceivingCall(false);
      })
      .catch((err) => {
        // Clean up any media tracks if there's an error
        if (currentUserVideoRef.current && currentUserVideoRef.current.srcObject) {
          currentUserVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
  
        console.error('Failed to get local stream', err);
        alert('Failed to access media devices. Please ensure your camera and microphone are connected and allowed.');
      });
  };
  

  const declineCall = () => {
    console.log('Declining call');
    setIncomingCall(null);
    setIsReceivingCall(false);

    if (currentUserVideoRef.current && currentUserVideoRef.current.srcObject) {
      let tracks = currentUserVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      let tracks = remoteVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };



  //video calling ends.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    if (!chatId) return;  // Ensure chatId is defined

    const chatDocRef = doc(db, "chats", chatId);
    const unSub = onSnapshot(chatDocRef, (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (text === "") return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const userIDs = [currentUser.id, user.id];

      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "userchats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          if (chatIndex !== -1) {
            userChatsData.chats[chatIndex].lastMessage = text;
            userChatsData.chats[chatIndex].isSeen = id === currentUser.id;
            userChatsData.chats[chatIndex].updatedAt = Date.now();

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          }
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setImg({
        file: null,
        url: "",
      });

      setText("");
    }
  };

  if (!chat) {
    return <div>Loading...</div>;  // Loading state
  }

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Peer ID: {user.id}</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img onClick={() => call(user.id)} src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>
      <div className="center">
        {chat.messages?.map((message) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={message.createdAt?.toMillis()}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
              <span>{timeAgo.format(message.createdAt.toDate())}</span>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
      {showVideo && (
        <>
          <div className="video-container">
            <video ref={currentUserVideoRef} height={200} autoPlay muted />
            <video ref={remoteVideoRef} height={200} autoPlay />
          </div>
          <button onClick={endCall} style={{ backgroundColor: 'red', color: 'white' }}>End Call</button>
        </>

      )}
{/*       {isReceivingCall && (
        <IncomingCallModal
          caller={user.username}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )} */}
    </div>
  );
};

const IncomingCallModal = ({ caller, onAccept, onDecline }) => {
  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  return (
    <div className="modal">
      <div className="modal-content">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h3>{caller} is calling ...</h3>
        <div className="btn">
          <button onClick={onAccept} style={{ backgroundColor: '#32CD32' }}>Accept</button>
          <button onClick={onDecline} style={{ backgroundColor: 'red' }}>Decline</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
