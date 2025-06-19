import { useState, useRef, useCallback, useEffect } from 'react';

interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

interface UseRealtimeConversationReturn {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
  sendTextMessage: (text: string) => void;
  userActivated: boolean;
}

export const useRealtimeConversation = (): UseRealtimeConversationReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userActivated, setUserActivated] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);

  const connect = useCallback(async () => {
    // Prevent duplicate connections
    if (isConnected || isConnecting) {
      console.log('Already connected or connecting, skipping...');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      console.log('Starting connection to OpenAI Realtime API...');
      
      // Get ephemeral token from server
      console.log('Fetching ephemeral token...');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const tokenResponse = await fetch(`${apiUrl}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-realtime-preview-2024-12-17',
          voice: 'verse',
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token fetch failed:', tokenResponse.status, errorText);
        throw new Error(`Failed to get session token: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      const ephemeralKey = tokenData.client_secret.value;
      console.log('Ephemeral token received');

      // Create peer connection
      console.log('Creating WebRTC peer connection...');
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Set up audio element for remote audio
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      audioElementRef.current = audioEl;

      pc.ontrack = (e) => {
        console.log('Received remote audio track');
        audioEl.srcObject = e.streams[0];
        // Don't automatically set isSpeaking - only set it when user has activated
        // setIsSpeaking(true); // REMOVED - this was causing automatic activation
      };

      // Get user media
      console.log('Requesting microphone access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = mediaStream;
      
      // Store the audio track reference for enabling/disabling
      const audioTrack = mediaStream.getAudioTracks()[0];
      audioTrackRef.current = audioTrack;
      
      // Initially disable the microphone until user activates
      audioTrack.enabled = false;
      console.log('Microphone access granted (initially disabled)');

      // Add local audio track
      mediaStream.getTracks().forEach(track => {
        pc.addTrack(track, mediaStream);
      });

      // Set up data channel
      console.log('Setting up data channel...');
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.addEventListener('open', () => {
        console.log('Data channel opened successfully');
      });

      dc.addEventListener('error', (e) => {
        console.error('Data channel error:', e);
        setError('Data channel error occurred');
      });

      dc.addEventListener('close', () => {
        console.log('Data channel closed');
      });

      dc.addEventListener('message', (e) => {
        try {
          const event: RealtimeEvent = JSON.parse(e.data);
          handleServerEvent(event);
        } catch (err) {
          console.error('Error parsing server event:', err);
        }
      });

      // Create offer
      console.log('Creating WebRTC offer...');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI
      console.log('Sending offer to OpenAI...');
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-mini-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('OpenAI WebRTC connection failed:', sdpResponse.status, errorText);
        throw new Error(`Failed to establish WebRTC connection: ${sdpResponse.status} - ${errorText}`);
      }

      // Set remote description
      console.log('Setting remote description...');
      const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      setIsConnected(true);
      setIsConnecting(false);
      console.log('Successfully connected to OpenAI Realtime API');

    } catch (err) {
      console.error('Connection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      setIsConnecting(false);
      disconnect();
    }
  }, [isConnected, isConnecting]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting...');
    
    // Reset all state
    setIsConnected(false);
    setIsConnecting(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');
    setUserActivated(false);
    
    // Clean up WebRTC resources
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.remove();
      audioElementRef.current = null;
    }

    audioTrackRef.current = null;

    console.log('Disconnected');
  }, []);

  const handleServerEvent = useCallback((event: RealtimeEvent) => {
    console.log('Server event:', event);

    switch (event.type) {
      case 'session.created':
        console.log('Session created');
        break;
      
      case 'input_audio_buffer.speech_started':
        console.log('Speech started');
        // Only set listening state if user has activated the conversation
        if (userActivated) {
          setIsListening(true);
        }
        break;
      
      case 'input_audio_buffer.speech_stopped':
        console.log('Speech stopped');
        // Only set listening state if user has activated the conversation
        if (userActivated) {
          setIsListening(false);
        }
        break;
      
      case 'response.audio_transcript.delta': {
        const delta = event.delta as { text?: string };
        if (delta?.text) {
          console.log('Transcript delta:', delta.text);
          setTranscript(prev => prev + delta.text);
        }
        break;
      }
      
      case 'response.audio_transcript.done':
        console.log('Transcript done');
        // Only set speaking state if user has activated the conversation
        if (userActivated) {
          setIsSpeaking(false);
        }
        break;
      
      case 'response.done':
        console.log('Response done');
        // Only set speaking state if user has activated the conversation
        if (userActivated) {
          setIsSpeaking(false);
        }
        break;
      
      case 'error': {
        console.error('Server error:', event);
        const errorEvent = event as { message?: string };
        setError(errorEvent.message || 'An error occurred');
        break;
      }
    }
  }, [userActivated]);

  const startListening = useCallback(() => {
    if (!isConnected || !dataChannelRef.current) {
      console.error('Cannot start listening: not connected to Realtime API');
      setError('Not connected to Realtime API. Please try reconnecting.');
      return;
    }
    
    console.log('Starting to listen...');
    setUserActivated(true); // Mark that user has activated the conversation
    
    // Enable the microphone
    if (audioTrackRef.current) {
      audioTrackRef.current.enabled = true;
      console.log('Microphone enabled');
    }
    
    setIsListening(true);
    setTranscript('');
  }, [isConnected]);

  const stopListening = useCallback(() => {
    console.log('Stopping listening...');
    
    // Disable the microphone
    if (audioTrackRef.current) {
      audioTrackRef.current.enabled = false;
      console.log('Microphone disabled');
    }
    
    setIsListening(false);
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (!isConnected || !dataChannelRef.current) {
      console.error('Cannot send message: not connected to Realtime API');
      setError('Not connected to Realtime API. Please try reconnecting.');
      return;
    }

    console.log('Sending text message:', text);
    setUserActivated(true); // Mark that user has activated the conversation

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    };

    dataChannelRef.current.send(JSON.stringify(event));

    // Create response
    const responseEvent = {
      type: 'response.create',
      response: {
        modalities: ['text', 'audio'],
      },
    };

    dataChannelRef.current.send(JSON.stringify(responseEvent));
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    transcript,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendTextMessage,
    userActivated,
  };
}; 