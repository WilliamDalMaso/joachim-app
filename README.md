# Joachim App - Real-time AI Conversation

A real-time voice and text conversation application built with React, TypeScript, and OpenAI's Realtime API.

## Features

- **Real-time Voice Conversations**: Speak naturally with AI using OpenAI's Realtime API
- **Text Chat**: Send text messages and receive AI responses
- **Voice Activity Detection**: Automatic detection of speech start/stop
- **WebRTC Integration**: Low-latency audio streaming
- **Modern UI**: Clean, responsive interface with dark theme
- **Multiple Bot Modes**: Switch between different conversation modes

## Prerequisites

- Node.js (v18 or higher)
- OpenAI API key with access to Realtime API
- Modern web browser with WebRTC support

## Quick Setup

Run the setup script to automatically install dependencies and configure the project:

```bash
./setup.sh
```

## Manual Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd joachim-app
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install && cd ..
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1: Start the backend server
   npm run server
   
   # Terminal 2: Start the frontend development server
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to access the application.

## Usage

### Voice Conversations
1. Click the voice button (white dot) to start listening
2. Speak naturally - the AI will respond with both voice and text
3. Click again to stop listening

### Text Conversations
1. Type your message in the input field
2. Press Enter or click the send button
3. Receive AI responses in both text and voice

### Bot Modes
- **Listening**: Default mode for voice conversations
- **Reading**: Optimized for text-based interactions
- **Speaking**: Enhanced voice output
- **Writing**: Text-focused responses

## Technical Details

### Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js server for token generation
- **Real-time**: WebRTC connection to OpenAI Realtime API
- **Styling**: Tailwind CSS

### Key Components
- `useRealtimeConversation`: Custom hook managing WebRTC connection
- `ChatInterface`: Main UI component
- Express server: Handles ephemeral token generation

### API Integration
The application uses OpenAI's Realtime API with:
- WebRTC for low-latency audio streaming
- Voice Activity Detection (VAD) for automatic speech detection
- Real-time transcription and response generation

## Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run server`: Start backend server
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Project Structure
```
joachim-app/
├── src/
│   ├── components/
│   │   └── ChatInterface.tsx
│   ├── hooks/
│   │   └── useRealtimeConversation.ts
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── index.js
│   └── package.json
├── package.json
├── setup.sh
└── README.md
```

## Troubleshooting

### Common Issues

1. **"Failed to get session token"**
   - Ensure your OpenAI API key is valid and has Realtime API access
   - Check that the backend server is running on port 3001
   - Verify your `.env` file contains the correct API key

2. **"Failed to establish WebRTC connection"**
   - Ensure you're using a modern browser with WebRTC support
   - Check your internet connection
   - Verify microphone permissions are granted

3. **Audio not working**
   - Check browser microphone permissions
   - Ensure audio devices are properly connected
   - Try refreshing the page

4. **Connection issues**
   - Check that both frontend and backend servers are running
   - Verify CORS settings if accessing from different domains
   - Check browser console for detailed error messages

5. **Setup issues**
   - Run `./setup.sh` to automatically configure the project
   - Ensure Node.js version 18 or higher is installed
   - Check that all dependencies are properly installed

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari (limited WebRTC support)
- Edge

## Security Notes

- Never expose your OpenAI API key in client-side code
- The application uses ephemeral tokens for secure client-side connections
- All API calls are proxied through the backend server

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console for error messages
3. Ensure all prerequisites are met
4. Create an issue with detailed error information 