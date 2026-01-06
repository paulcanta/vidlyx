import React from 'react';
import {
  Star,
  CheckCircle,
  Warning,
  User,
  GraduationCap,
  Briefcase,
  Code,
  Lightning
} from '@phosphor-icons/react';

/**
 * QualityAssessment Component
 * Displays quality ratings and audience suitability
 */
function QualityAssessment({
  contentQuality = 0,
  productionValue = 0,
  informationDensity = 0,
  practicalValue = 0,
  suitableFor = [],
  notIdealFor = [],
  videoType = 'educational'
}) {
  const ratings = [
    { id: 'content', label: 'Content Quality', value: contentQuality, color: '#6366f1' },
    { id: 'production', label: 'Production Value', value: productionValue, color: '#2563eb' },
    { id: 'density', label: 'Information Density', value: informationDensity, color: '#059669' },
    { id: 'practical', label: 'Practical Value', value: practicalValue, color: '#dc2626' }
  ];

  // Default audience suggestions based on video type
  const defaultAudiences = {
    educational: [
      { label: 'Students learning the topic', icon: GraduationCap },
      { label: 'Self-learners', icon: User },
      { label: 'Professionals upskilling', icon: Briefcase }
    ],
    tutorial: [
      { label: 'Developers', icon: Code },
      { label: 'Beginners', icon: GraduationCap },
      { label: 'Hands-on learners', icon: Lightning }
    ],
    review: [
      { label: 'Potential buyers', icon: User },
      { label: 'Comparison shoppers', icon: Briefcase }
    ],
    podcast: [
      { label: 'Topic enthusiasts', icon: User },
      { label: 'Commuters', icon: Lightning }
    ]
  };

  const audiences = suitableFor.length > 0 ? suitableFor : defaultAudiences[videoType] || defaultAudiences.educational;

  const renderProgressBar = (value, color) => {
    const segments = 10;
    const filled = Math.round(value);

    return (
      <div className="progress-bar">
        {[...Array(segments)].map((_, i) => (
          <div
            key={i}
            className={`progress-segment ${i < filled ? 'filled' : ''}`}
            style={{ '--segment-color': color }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="quality-assessment">
      <div className="assessment-header">
        <div className="header-title">
          <Star size={16} weight="fill" />
          <span>Quality Assessment</span>
        </div>
      </div>

      {/* Ratings */}
      <div className="ratings-section">
        {ratings.map(rating => (
          <div key={rating.id} className="rating-row">
            <div className="rating-label">{rating.label}</div>
            <div className="rating-bar">
              {renderProgressBar(rating.value, rating.color)}
            </div>
            <div className="rating-value">{rating.value}/10</div>
          </div>
        ))}
      </div>

      {/* Audience Suitability */}
      <div className="audience-section">
        <div className="section-title">Suitable For</div>
        <div className="audience-list">
          {audiences.map((audience, index) => {
            const label = typeof audience === 'string' ? audience : audience.label;
            return (
              <div key={index} className="audience-item suitable">
                <CheckCircle size={14} weight="fill" />
                <span>{label}</span>
              </div>
            );
          })}
        </div>

        {notIdealFor.length > 0 && (
          <>
            <div className="section-title not-ideal">Not Ideal For</div>
            <div className="audience-list">
              {notIdealFor.map((audience, index) => (
                <div key={index} className="audience-item not-suitable">
                  <Warning size={14} weight="fill" />
                  <span>{typeof audience === 'string' ? audience : audience.label}</span>
                  {audience.reason && (
                    <span className="reason">({audience.reason})</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .quality-assessment {
    display: flex;
    flex-direction: column;
    background: #f9fafb;
    border-radius: 10px;
    overflow: hidden;
  }

  .assessment-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ratings-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .rating-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .rating-label {
    flex: 0 0 140px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #374151;
    text-align: left;
  }

  .rating-bar {
    flex: 1;
  }

  .rating-value {
    flex: 0 0 40px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    font-family: 'SF Mono', Monaco, monospace;
    text-align: right;
  }

  .progress-bar {
    display: flex;
    gap: 2px;
    height: 10px;
  }

  .progress-segment {
    flex: 1;
    background: #e5e7eb;
    border-radius: 2px;
    transition: background 0.2s;
  }

  .progress-segment.filled {
    background: var(--segment-color, #6366f1);
  }

  .audience-section {
    padding: 1rem;
  }

  .section-title {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #059669;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.5rem;
  }

  .section-title.not-ideal {
    color: #d97706;
    margin-top: 1rem;
  }

  .audience-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .audience-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    padding: 0.375rem 0;
    text-align: left;
  }

  .audience-item.suitable {
    color: #059669;
  }

  .audience-item.suitable span {
    color: #374151;
  }

  .audience-item.not-suitable {
    color: #d97706;
  }

  .audience-item.not-suitable span {
    color: #374151;
  }

  .audience-item .reason {
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
  }

  @media (max-width: 640px) {
    .rating-label {
      flex: 0 0 100px;
      font-size: 0.75rem;
    }

    .rating-row {
      flex-wrap: wrap;
    }

    .rating-bar {
      order: 3;
      flex: 1 0 100%;
      margin-top: 0.25rem;
    }
  }
`;

export default QualityAssessment;
