import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Endpoint to generate ephemeral tokens for Realtime API
app.post('/session', async (req, res) => {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.' 
      });
    }

    const { model = 'gpt-4o-realtime-preview-2025-06-03', voice = 'verse' } = req.body;
    
    console.log('Creating session with model:', model, 'voice:', voice);
    
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 401) {
        return res.status(401).json({ 
          error: 'Invalid OpenAI API key. Please check your API key in the .env file.' 
        });
      } else if (response.status === 403) {
        return res.status(403).json({ 
          error: 'Access denied. You may not have access to the Realtime API. Please check your OpenAI account permissions.' 
        });
      }
      
      return res.status(response.status).json({ 
        error: `OpenAI API error: ${response.status} - ${errorText}` 
      });
    }

    const data = await response.json();
    console.log('Session created successfully');
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error. Please check the server logs for details.' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables');
    console.warn('   Please create a .env file with your OpenAI API key:');
    console.warn('   OPENAI_API_KEY=your_api_key_here');
  } else {
    console.log('✅ OpenAI API key configured');
  }
}); 