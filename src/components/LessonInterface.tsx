import React, { useState, useEffect, useRef } from 'react';
import { Play, Volume2, Check, X, ArrowRight, BookOpen, Target } from 'lucide-react';

interface Lesson {
  id: string;
  prompt: string;
  answer: string;
  difficulty: number;
  category: string;
}

interface LessonInterfaceProps {
  userId: string;
  level: string;
  onLevelComplete?: (level: string, nextLevel?: string) => void;
  onSessionEnd?: (lessonsCompleted: number) => void;
}

const LessonInterface: React.FC<LessonInterfaceProps> = ({
  userId,
  level,
  onLevelComplete,
  onSessionEnd
}) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [levelCompleted, setLevelCompleted] = useState(false);
  const [nextLevel, setNextLevel] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Start session and load first lesson
  useEffect(() => {
    startSession();
  }, [level]);

  const startSession = async () => {
    try {
      const response = await fetch('http://localhost:3001/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, level })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        loadNextLesson();
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const loadNextLesson = async () => {
    setIsLoading(true);
    setFeedback(null);
    setShowFeedback(false);
    setUserAnswer('');

    try {
      const response = await fetch(`http://localhost:3001/lessons/random/${level}/${userId}`);
      const data = await response.json();

      if (data.levelCompleted) {
        setLevelCompleted(true);
        setNextLevel(data.nextLevel);
        if (onLevelComplete) {
          onLevelComplete(level, data.nextLevel);
        }
        return;
      }

      setCurrentLesson(data.lesson);
      setProgress(data.progress);
      setAudioUrl(data.audioUrl ? `http://localhost:3001${data.audioUrl}` : null);
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSubmit = async () => {
    if (!currentLesson || !userAnswer.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/lessons/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          level,
          lessonId: currentLesson.id,
          userAnswer: userAnswer.trim()
        })
      });

      const data = await response.json();
      setFeedback(data.feedback);
      setShowFeedback(true);
      setProgress(data.progress);
      setLessonsCompleted(prev => prev + 1);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    loadNextLesson();
  };

  const handleEndSession = async () => {
    if (sessionId) {
      try {
        await fetch('http://localhost:3001/session/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, lessonsCompleted })
        });
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
    
    if (onSessionEnd) {
      onSessionEnd(lessonsCompleted);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showFeedback) {
        handleContinue();
      } else {
        handleSubmit();
      }
    }
  };

  if (levelCompleted) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          
          <h2 className="text-2xl font-bold">🎉 Level Complete!</h2>
          <p className="text-white/70">
            {nextLevel 
              ? `You completed all ${level.toUpperCase()} lessons! Ready for ${nextLevel.toUpperCase()}?`
              : 'Congratulations! You completed all available levels!'
            }
          </p>
          
          <div className="space-y-3">
            {nextLevel && (
              <button
                onClick={() => onLevelComplete?.(level, nextLevel)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Continue to {nextLevel.toUpperCase()}
              </button>
            )}
            
            <button
              onClick={handleEndSession}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60">Loading lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      {/* Progress Bar */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">Progress</span>
          <span className="text-sm font-medium">
            {progress.completed}/{progress.total}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress.completed / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Audio Player */}
        {audioUrl && (
          <div className="text-center space-y-4">
            <button
              onClick={playAudio}
              disabled={isPlaying}
              className="w-16 h-16 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Volume2 className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </button>
            <p className="text-white/60 text-sm">Listen to the audio and type what you hear</p>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={handleAudioEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        )}

        {/* Input Area */}
        {!showFeedback && (
          <div className="space-y-4">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type what you heard..."
              className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder:text-white/50 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
              disabled={isSubmitting}
            />
            
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Checking...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Submit Answer
                </>
              )}
            </button>
          </div>
        )}

        {/* Feedback */}
        {showFeedback && feedback && (
          <div className="space-y-4">
            <div className="bg-white/10 border border-white/20 rounded-lg p-4">
              <h3 className="font-medium mb-2">Feedback:</h3>
              <p className="text-white/90">{feedback}</p>
            </div>
            
            <button
              onClick={handleContinue}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Continue
            </button>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/60">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">Level {level.toUpperCase()}</span>
          </div>
          
          <div className="flex items-center gap-2 text-white/60">
            <Target className="w-4 h-4" />
            <span className="text-sm">{lessonsCompleted} completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonInterface; 