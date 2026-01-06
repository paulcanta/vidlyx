import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PencilSimple,
  Export,
  CaretRight,
  Folder,
  Play
} from '@phosphor-icons/react';
import saveService from '../../services/saveService';
import { SaveEditModal } from '../../components/Save';
import DeleteButton from '../../components/common/DeleteButton';
import { formatTimestamp, formatDate } from '../../utils/formatters';

function SaveView() {
  const { saveId } = useParams();
  const navigate = useNavigate();
  const [save, setSave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadSave();
  }, [saveId]);

  const loadSave = async () => {
    try {
      setLoading(true);
      const response = await saveService.getById(saveId);
      setSave(response.data);
    } catch (error) {
      console.error('Failed to load save:', error);
      alert('Failed to load save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (updatedData) => {
    try {
      await saveService.update(saveId, updatedData);
      await loadSave();
    } catch (error) {
      console.error('Failed to update save:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      await saveService.delete(saveId);
      navigate('/app/collection');
    } catch (error) {
      console.error('Failed to delete save:', error);
      alert('Failed to delete save. Please try again.');
    }
  };

  const handleExport = () => {
    // Create export data
    const exportData = {
      title: save.title,
      video_title: save.video_title,
      video_url: save.video_url,
      notes: save.notes,
      created_at: save.created_at,
      folders: save.folders,
      frames: save.frames,
      transcript_selections: save.transcript_selections
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${save.title || 'save'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  if (!save) {
    return (
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Save not found
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      {/* Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <Link
          to="/app/collection"
          style={{
            color: '#7c3aed',
            textDecoration: 'none'
          }}
        >
          Collection
        </Link>
        <CaretRight size={16} />
        <span style={{ color: '#111827', fontWeight: '500' }}>
          {save.title || 'Untitled Save'}
        </span>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#111827',
            margin: '0 0 0.5rem 0'
          }}>
            {save.title || 'Untitled Save'}
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            <span>Created {formatDate(save.created_at)}</span>
            {save.folders && save.folders.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {save.folders.map((folder, index) => (
                  <span
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      background: '#f3f4f6',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}
                  >
                    <Folder size={12} weight="fill" />
                    {folder}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setEditing(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'white',
              color: '#7c3aed',
              border: '1px solid #7c3aed',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <PencilSimple size={18} />
            Edit
          </button>
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Export size={18} />
            Export
          </button>
          <DeleteButton
            onDelete={handleDelete}
            confirmText="Delete this save permanently?"
          />
        </div>
      </div>

      {/* Source Video Section */}
      <section style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#111827',
          margin: '0 0 1rem 0'
        }}>
          Source Video
        </h2>
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {save.thumbnail_url && (
            <img
              src={save.thumbnail_url}
              alt={save.video_title}
              style={{
                width: '160px',
                height: '90px',
                objectFit: 'cover',
                borderRadius: '8px',
                flexShrink: 0
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.5rem 0'
            }}>
              {save.video_title || 'Untitled Video'}
            </h3>
            {save.video_id && (
              <Link
                to={`/app/video/${save.video_id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#7c3aed',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Play size={16} weight="fill" />
                View Full Analysis
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Notes Section */}
      {save.notes && (
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1rem 0'
          }}>
            Notes
          </h2>
          <p style={{
            color: '#374151',
            lineHeight: '1.6',
            margin: 0,
            whiteSpace: 'pre-wrap'
          }}>
            {save.notes}
          </p>
        </section>
      )}

      {/* Frames Section */}
      {save.frames && save.frames.length > 0 && (
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1rem 0'
          }}>
            Frames ({save.frames.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {save.frames.map((frame, index) => (
              <div
                key={index}
                style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#f3f4f6'
                }}
              >
                <img
                  src={frame.url || frame.thumbnail_url}
                  alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  right: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {formatTimestamp(frame.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transcript Selections Section */}
      {save.transcript_selections && save.transcript_selections.length > 0 && (
        <section style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1rem 0'
          }}>
            Transcript Selections
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {save.transcript_selections.map((selection, index) => (
              <blockquote
                key={index}
                style={{
                  margin: 0,
                  padding: '1rem',
                  background: '#f9fafb',
                  borderLeft: '4px solid #7c3aed',
                  borderRadius: '0 8px 8px 0',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#7c3aed',
                  marginBottom: '0.5rem'
                }}>
                  [{formatTimestamp(selection.start)}]
                </div>
                <p style={{
                  margin: 0,
                  color: '#374151',
                  lineHeight: '1.6',
                  fontSize: '0.875rem'
                }}>
                  {selection.text}
                </p>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Edit Modal */}
      {editing && (
        <SaveEditModal
          save={save}
          onSave={handleEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

export default SaveView;
