import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import fs from 'fs/promises';

// Import our modules
import { 
  initDb, 
  saveUser, 
  saveProgress, 
  getDoneLessons, 
  markLevelFinished, 
  levelIsFinished, 
  getUserProgress,
  saveUserSession,
  updateSessionProgress,
  endUserSession
} from './database.js';
import { 
  getRandomLesson, 
  countTotalLessons, 
  getNextLevel, 
  isValidLevel, 
  getAvailableLevels,
  getLessonStats
} from './lessons.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDb();

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create audio directory
const AUDIO_DIR = path.join(__dirname, 'audio');
fs.mkdir(AUDIO_DIR, { recursive: true }).catch(console.error);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Joachim App API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      session: '/session (POST)',
      lessons: '/lessons',
      progress: '/progress/:userId',
      audio: '/audio/:lessonId'
    },
    timestamp: new Date().toISOString()
  });
});

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

    const { model = 'gpt-4o-mini-realtime-preview-2024-12-17', voice = 'verse', instructions } = req.body;
    
    console.log('Creating session with model:', model, 'voice:', voice);
    
    const sessionData = {
      model,
      voice,
    };

    // Add instructions if provided
    if (instructions) {
      sessionData.instructions = instructions;
    }
    
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
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

// Get available levels
app.get('/lessons/levels', (req, res) => {
  const levels = getAvailableLevels();
  res.json({ levels });
});

// Get lesson statistics for a level
app.get('/lessons/stats/:level', async (req, res) => {
  try {
    const { level } = req.params;
    if (!isValidLevel(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }
    
    const stats = await getLessonStats(level);
    res.json(stats);
  } catch (error) {
    console.error('Error getting lesson stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a random lesson for a user and level
app.get('/lessons/random/:level/:userId', async (req, res) => {
  try {
    const { level, userId } = req.params;
    
    if (!isValidLevel(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    // Get completed lessons for this user and level
    const completedLessons = await getDoneLessons(userId, level);
    
    // Get a random lesson that hasn't been completed
    const lesson = await getRandomLesson(level, completedLessons);
    
    if (!lesson) {
      // Check if level is finished
      const isFinished = await levelIsFinished(userId, level);
      if (!isFinished) {
        await markLevelFinished(userId, level);
      }
      
      const nextLevel = getNextLevel(level);
      return res.json({
        levelCompleted: true,
        currentLevel: level,
        nextLevel,
        message: nextLevel 
          ? `🎉 You completed all ${level.toUpperCase()} lessons! Ready for ${nextLevel.toUpperCase()}?`
          : '🎉 Congratulations! You completed all available levels!'
      });
    }

    // Generate or get audio for the lesson
    const audioUrl = await ensureAudio(lesson.id, lesson.prompt);
    
    res.json({
      lesson,
      audioUrl,
      progress: {
        completed: completedLessons.length,
        total: await countTotalLessons(level)
      }
    });
  } catch (error) {
    console.error('Error getting random lesson:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit lesson answer and get feedback
app.post('/lessons/submit', async (req, res) => {
  try {
    const { userId, level, lessonId, userAnswer } = req.body;
    
    if (!userId || !level || !lessonId || !userAnswer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the lesson to compare answers
    const lesson = await getLessonById(level, lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Calculate accuracy score (simple comparison for now)
    const accuracy = calculateAccuracy(userAnswer, lesson.answer);
    
    // Save progress
    await saveProgress(userId, level, lessonId, userAnswer, accuracy);
    
    // Generate feedback using GPT
    const feedback = await generateFeedback(lesson.answer, userAnswer);
    
    res.json({
      correctAnswer: lesson.answer,
      userAnswer,
      accuracy,
      feedback,
      progress: {
        completed: (await getDoneLessons(userId, level)).length,
        total: await countTotalLessons(level)
      }
    });
  } catch (error) {
    console.error('Error submitting lesson:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user progress
app.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const progress = await getUserProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start a new session
app.post('/session/start', async (req, res) => {
  try {
    const { userId, level } = req.body;
    
    if (!userId || !level) {
      return res.status(400).json({ error: 'Missing userId or level' });
    }
    
    if (!isValidLevel(level)) {
      return res.status(400).json({ error: 'Invalid level' });
    }

    // Save user if not exists
    await saveUser(userId);
    
    // Create session
    const sessionId = `${userId}_${Date.now()}`;
    await saveUserSession(userId, sessionId, level);
    
    res.json({ sessionId, level });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End session
app.post('/session/end', async (req, res) => {
  try {
    const { sessionId, lessonsCompleted } = req.body;
    
    if (lessonsCompleted !== undefined) {
      await updateSessionProgress(sessionId, lessonsCompleted);
    }
    
    await endUserSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to ensure audio exists
async function ensureAudio(lessonId, text) {
  const audioPath = path.join(AUDIO_DIR, `${lessonId}.mp3`);
  
  try {
    // Check if audio already exists
    await fs.access(audioPath);
    return `/audio/${lessonId}`;
  } catch {
    // Generate new audio
    try {
      const response = await client.audio.speech.create({
        model: "tts-1",
        input: text,
        voice: "alloy",
        response_format: "mp3",
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(audioPath, buffer);
      
      return `/audio/${lessonId}`;
    } catch (error) {
      console.error('Error generating audio:', error);
      return null;
    }
  }
}

// Serve audio files
app.get('/audio/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const audioPath = path.join(AUDIO_DIR, `${lessonId}.mp3`);
    
    // Check if file exists
    await fs.access(audioPath);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.sendFile(audioPath);
  } catch (error) {
    res.status(404).json({ error: 'Audio file not found' });
  }
});

// Helper function to calculate accuracy
function calculateAccuracy(userAnswer, correctAnswer) {
  const user = userAnswer.toLowerCase().trim();
  const correct = correctAnswer.toLowerCase().trim();
  
  if (user === correct) return 1.0;
  
  // Simple similarity calculation (can be improved)
  const userWords = user.split(' ');
  const correctWords = correct.split(' ');
  const commonWords = userWords.filter(word => correctWords.includes(word));
  
  return commonWords.length / Math.max(userWords.length, correctWords.length);
}

// Helper function to generate feedback using GPT
async function generateFeedback(correctAnswer, userAnswer) {
  try {
    const prompt = `
Frase original: "${correctAnswer}"
Transcrição do usuário: "${userAnswer}"

Analise as diferenças e forneça um feedback de até 5 linhas e emojis. Responda em português brasileiro.
Caso o aluno erre, explique o porquê errou e o que é o correto.
Seja bem humorado e tire sarro dos erros do aluno. Nunca chame o usuário de 'aluno' ou 'estudante'.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um tutor Americano de inglês Americano para brasileiros. Fale direto com o aluno. Responda em português brasileiro, com até 5 linhas e emojis."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 200
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating feedback:', error);
    return "❌ Erro ao gerar feedback. Tente novamente mais tarde.";
  }
}

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