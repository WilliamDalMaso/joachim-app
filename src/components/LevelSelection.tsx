import React, { useState, useEffect } from 'react';
import { BookOpen, Target, TrendingUp, Play } from 'lucide-react';

interface LevelStats {
  total: number;
  categories: Record<string, number>;
  difficulties: Record<number, number>;
}

interface UserProgress {
  progress: Array<{
    level: string;
    completedLessons: number;
    avgAccuracy: number;
  }>;
  finishedLevels: string[];
}

interface LevelSelectionProps {
  userId: string;
  onLevelSelect: (level: string) => void;
  onBack?: () => void;
}

const LevelSelection: React.FC<LevelSelectionProps> = ({
  userId,
  onLevelSelect,
  onBack
}) => {
  const [levels, setLevels] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [levelStats, setLevelStats] = useState<Record<string, LevelStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLevelsAndProgress();
  }, []);

  const loadLevelsAndProgress = async () => {
    try {
      // Load available levels
      const levelsResponse = await fetch('http://localhost:3001/lessons/levels');
      const levelsData = await levelsResponse.json();
      setLevels(levelsData.levels);

      // Load user progress
      const progressResponse = await fetch(`http://localhost:3001/progress/${userId}`);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setUserProgress(progressData);
      }

      // Load stats for each level
      const statsPromises = levelsData.levels.map(async (level: string) => {
        const statsResponse = await fetch(`http://localhost:3001/lessons/stats/${level}`);
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          return [level, stats];
        }
        return [level, null];
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap = Object.fromEntries(statsResults.filter(([_, stats]) => stats !== null));
      setLevelStats(statsMap);
    } catch (error) {
      console.error('Error loading levels and progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelProgress = (level: string) => {
    if (!userProgress) return { completed: 0, total: 0, accuracy: 0 };
    
    const levelProgress = userProgress.progress.find(p => p.level === level);
    const total = levelStats[level]?.total || 0;
    
    return {
      completed: levelProgress?.completedLessons || 0,
      total,
      accuracy: levelProgress?.avgAccuracy || 0
    };
  };

  const isLevelUnlocked = (level: string) => {
    if (level === 'a1') return true; // A1 is always unlocked
    
    const levelIndex = levels.indexOf(level);
    const previousLevel = levels[levelIndex - 1];
    
    if (!previousLevel) return true;
    
    const previousProgress = getLevelProgress(previousLevel);
    return previousProgress.completed >= previousProgress.total;
  };

  const getLevelColor = (level: string) => {
    const progress = getLevelProgress(level);
    const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    
    if (percentage === 100) return 'from-green-500 to-green-600';
    if (percentage >= 50) return 'from-blue-500 to-blue-600';
    if (percentage > 0) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-500 to-gray-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60">Loading levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Choose Your Level</h1>
            <p className="text-white/60 mt-1">Select your English proficiency level</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      {/* Levels Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((level) => {
            const progress = getLevelProgress(level);
            const isUnlocked = isLevelUnlocked(level);
            const isCompleted = progress.completed >= progress.total && progress.total > 0;
            
            return (
              <div
                key={level}
                className={`relative p-6 rounded-lg border transition-all duration-200 ${
                  isUnlocked
                    ? 'border-white/20 hover:border-white/40 cursor-pointer'
                    : 'border-white/10 opacity-50 cursor-not-allowed'
                }`}
                onClick={() => isUnlocked && onLevelSelect(level)}
              >
                {/* Level Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-lg font-semibold">{level.toUpperCase()}</span>
                  </div>
                  {isCompleted && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/60">Progress</span>
                    <span className="font-medium">
                      {progress.completed}/{progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 bg-gradient-to-r ${getLevelColor(level)}`}
                      style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <Target className="w-4 h-4" />
                    <span>{progress.total} lessons</span>
                  </div>
                  {progress.accuracy > 0 && (
                    <div className="flex items-center gap-2 text-white/60">
                      <TrendingUp className="w-4 h-4" />
                      <span>{Math.round(progress.accuracy * 100)}% accuracy</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {isUnlocked && (
                  <button
                    className={`w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      isCompleted
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {isCompleted ? 'Review' : 'Start'}
                  </button>
                )}

                {/* Locked Overlay */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-white/20 rounded-full mx-auto mb-2"></div>
                      <p className="text-white/60 text-sm">Complete previous level</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Stats */}
      {userProgress && (
        <div className="p-6 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {userProgress.progress.reduce((sum, p) => sum + p.completedLessons, 0)}
              </div>
              <div className="text-white/60 text-sm">Total Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {userProgress.finishedLevels.length}
              </div>
              <div className="text-white/60 text-sm">Levels Finished</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {userProgress.progress.length > 0 
                  ? Math.round(userProgress.progress.reduce((sum, p) => sum + (p.avgAccuracy || 0), 0) / userProgress.progress.length * 100)
                  : 0
                }%
              </div>
              <div className="text-white/60 text-sm">Avg Accuracy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelSelection; 