import React from 'react';
import {
  Compass,
  ArrowRight,
  BookOpen,
  Video,
  Article,
  Link as LinkIcon
} from '@phosphor-icons/react';

/**
 * RelatedTopics Component
 * Shows recommendations for deeper understanding
 */
function RelatedTopics({
  topics = [],
  videoType = 'educational',
  onTopicClick
}) {
  // Default recommendations based on video type
  const getDefaultTopics = () => {
    const defaults = {
      educational: [
        { title: 'Prerequisites for this topic', type: 'concept' },
        { title: 'Advanced techniques', type: 'concept' },
        { title: 'Practical applications', type: 'article' }
      ],
      tutorial: [
        { title: 'Related tutorials', type: 'video' },
        { title: 'Official documentation', type: 'article' },
        { title: 'Common patterns', type: 'concept' }
      ],
      review: [
        { title: 'Alternative products', type: 'article' },
        { title: 'Comparison guides', type: 'article' },
        { title: 'User experiences', type: 'video' }
      ],
      podcast: [
        { title: 'Related episodes', type: 'video' },
        { title: 'Guest background', type: 'article' },
        { title: 'Topic deep-dive', type: 'concept' }
      ]
    };
    return defaults[videoType] || defaults.educational;
  };

  const displayTopics = topics.length > 0 ? topics : getDefaultTopics();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return Video;
      case 'article': return Article;
      case 'concept': return BookOpen;
      case 'link': return LinkIcon;
      default: return BookOpen;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'video': return '#dc2626';
      case 'article': return '#2563eb';
      case 'concept': return '#7c3aed';
      case 'link': return '#059669';
      default: return '#6b7280';
    }
  };

  return (
    <div className="related-topics">
      <div className="topics-header">
        <div className="header-title">
          <Compass size={16} weight="fill" />
          <span>Related Topics</span>
        </div>
      </div>

      <div className="topics-intro">
        For deeper understanding, explore:
      </div>

      <div className="topics-list">
        {displayTopics.map((topic, index) => {
          const Icon = getTypeIcon(topic.type);
          const color = getTypeColor(topic.type);
          const title = typeof topic === 'string' ? topic : topic.title;
          const type = typeof topic === 'string' ? 'concept' : topic.type;

          return (
            <button
              key={index}
              className="topic-item"
              style={{ '--topic-color': color }}
              onClick={() => onTopicClick?.(topic)}
            >
              <div className="topic-icon">
                <Icon size={16} weight="duotone" />
              </div>
              <span className="topic-title">{title}</span>
              <span className="topic-type">{type}</span>
              <ArrowRight size={14} className="topic-arrow" />
            </button>
          );
        })}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .related-topics {
    display: flex;
    flex-direction: column;
    background: #f9fafb;
    border-radius: 10px;
    overflow: hidden;
  }

  .topics-header {
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

  .topics-intro {
    padding: 0.75rem 1rem 0.5rem;
    font-size: 0.8125rem;
    color: #6b7280;
    text-align: left;
  }

  .topics-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0 1rem 1rem;
  }

  .topic-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
  }

  .topic-item:hover {
    border-color: var(--topic-color, #6366f1);
    background: color-mix(in srgb, var(--topic-color) 5%, white);
  }

  .topic-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: color-mix(in srgb, var(--topic-color) 10%, white);
    border-radius: 6px;
    color: var(--topic-color, #6366f1);
    flex-shrink: 0;
  }

  .topic-title {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .topic-type {
    font-size: 0.625rem;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.25rem 0.5rem;
    background: #f3f4f6;
    border-radius: 4px;
  }

  .topic-arrow {
    color: #9ca3af;
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .topic-item:hover .topic-arrow {
    color: var(--topic-color, #6366f1);
    transform: translateX(2px);
  }

  @media (max-width: 640px) {
    .topic-item {
      padding: 0.625rem;
    }

    .topic-icon {
      width: 28px;
      height: 28px;
    }

    .topic-type {
      display: none;
    }
  }
`;

export default RelatedTopics;
