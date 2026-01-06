/**
 * GeneratingOverlay Component
 * Full-screen overlay showing AI generation progress
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  SpinnerGap,
  Lightning,
  FileText,
  CheckCircle,
  Sparkle
} from '@phosphor-icons/react';
import './GeneratingOverlay.css';

const PROGRESS_STAGES = [
  { id: 'connecting', label: 'Connecting to AI...', icon: Lightning, duration: 2000 },
  { id: 'analyzing', label: 'Analyzing video content...', icon: Brain, duration: 8000 },
  { id: 'processing', label: 'Processing transcript...', icon: FileText, duration: 10000 },
  { id: 'generating', label: 'Generating summary...', icon: Sparkle, duration: 15000 },
  { id: 'finalizing', label: 'Finalizing results...', icon: CheckCircle, duration: 5000 },
];

function GeneratingOverlay({
  isVisible,
  title = 'Generating Analysis',
  subtitle = 'Claude AI is processing your video'
}) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState('');

  // Animate dots
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Progress through stages
  useEffect(() => {
    if (!isVisible) {
      setCurrentStage(0);
      setProgress(0);
      return;
    }

    let stageTimeout;
    let progressInterval;

    const advanceStage = () => {
      setCurrentStage(prev => {
        const next = prev + 1;
        if (next >= PROGRESS_STAGES.length) {
          // Loop back to analyzing stage while waiting
          return 1;
        }
        return next;
      });
    };

    // Advance stages based on duration
    const scheduledStageAdvance = () => {
      const stage = PROGRESS_STAGES[currentStage];
      if (stage) {
        stageTimeout = setTimeout(() => {
          advanceStage();
          scheduledStageAdvance();
        }, stage.duration);
      }
    };

    scheduledStageAdvance();

    // Animate progress bar (simulated progress)
    progressInterval = setInterval(() => {
      setProgress(prev => {
        // Progress based on current stage
        const stageProgress = (currentStage / PROGRESS_STAGES.length) * 100;
        const target = Math.min(stageProgress + 15, 90); // Never reach 100% until done
        if (prev < target) {
          return prev + 0.5;
        }
        return prev;
      });
    }, 100);

    return () => {
      clearTimeout(stageTimeout);
      clearInterval(progressInterval);
    };
  }, [isVisible, currentStage]);

  if (!isVisible) return null;

  const stage = PROGRESS_STAGES[currentStage] || PROGRESS_STAGES[0];
  const StageIcon = stage.icon;

  return (
    <div className="generating-overlay">
      <div className="generating-content">
        {/* Main spinner */}
        <div className="generating-spinner-container">
          <div className="generating-spinner-outer">
            <SpinnerGap size={80} weight="bold" className="generating-spinner" />
          </div>
          <div className="generating-spinner-inner">
            <Brain size={36} weight="duotone" className="generating-brain" />
          </div>
        </div>

        {/* Title */}
        <h2 className="generating-title">{title}</h2>
        <p className="generating-subtitle">{subtitle}</p>

        {/* Progress bar */}
        <div className="generating-progress-container">
          <div className="generating-progress-bar">
            <div
              className="generating-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="generating-progress-text">{Math.round(progress)}%</span>
        </div>

        {/* Current stage */}
        <div className="generating-stage">
          <StageIcon size={20} weight="bold" className="generating-stage-icon" />
          <span className="generating-stage-text">
            {stage.label}{dots}
          </span>
        </div>

        {/* Stage indicators */}
        <div className="generating-stages">
          {PROGRESS_STAGES.map((s, idx) => (
            <div
              key={s.id}
              className={`generating-stage-dot ${idx <= currentStage ? 'active' : ''} ${idx === currentStage ? 'current' : ''}`}
              title={s.label}
            />
          ))}
        </div>

        {/* Info text */}
        <p className="generating-info">
          This may take 30-60 seconds depending on video length
        </p>
      </div>
    </div>
  );
}

export default GeneratingOverlay;
