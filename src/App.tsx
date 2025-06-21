import React from 'react';
import ChatInterface from './components/ChatInterface';
import UpdateNotification from './components/UpdateNotification';
import { Demo } from './components/Demo';

function App() {
  return (
    <>
      <Demo />
      <ChatInterface />
      <UpdateNotification />
    </>
  );
}

export default App;