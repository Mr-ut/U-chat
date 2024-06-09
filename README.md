# U Chat App 

### Real-time Chat
  Users can send and receive messages in real-time. The messages are stored in Firebase Firestore, ensuring persistence and reliability.

### Video Calling
  Users can initiate and receive video calls using the PeerJS library. The video call feature includes:

  - Displaying the video streams of both the caller and the receiver.
  - Accepting or declining incoming calls.
  - Ending calls.
  - Sending Images
  - Users can upload and send images in the chat. The images are stored in Firebase Storage and displayed in the chat messages.

### User Blocking
  Users can block and unblock other users. When a user is blocked, they cannot send messages or initiate calls to the blocker.

### User Authentication
  The application uses Firebase Authentication for secure login and signup. Users can create accounts, log in, and manage their sessions securely.

### Notifications
  The application provides real-time notifications for incoming messages and calls, ensuring users do not miss important interactions.

