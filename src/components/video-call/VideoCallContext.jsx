import  { createContext, useContext } from 'react';
import useVideoCall from './useVideoCall';

const VideoCallContext = createContext();

export const VideoCallProvider = ({ children, currentUser }) => {
  const videoCall = useVideoCall(currentUser);
  return (
    <VideoCallContext.Provider value={videoCall}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCallContext = () => {
  return useContext(VideoCallContext);
};
