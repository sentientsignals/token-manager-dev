'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Download, Trash2, Plus, Sparkles } from 'lucide-react';

type Thread = {
  id: string;
  title: string;
  source: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

type Summary = {
  summary: string;
  key_points: string[];
  generated_at: string;
};

export default function ConversationManager() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadSource, setNewThreadSource] = useState('bolt');
  const [newMessage, setNewMessage] = useState('');
  const [newMessageRole, setNewMessageRole] = useState<'user' | 'assistant'>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
      loadSummary(selectedThread.id);
    }
  }, [selectedThread]);

  const loadThreads = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadSummary = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversation_summaries')
        .select('*')
        .eq('thread_id', threadId)
        .maybeSingle();

      if (error) throw error;
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const createThread = async () => {
    if (!newThreadTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('conversation_threads')
        .insert({
          title: newThreadTitle,
          source: newThreadSource,
        })
        .select()
        .single();

      if (error) throw error;

      setNewThreadTitle('');
      setNewThreadSource('bolt');
      setShowAddForm(false);
      loadThreads();
      setSelectedThread(data);
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  const addMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          thread_id: selectedThread.id,
          role: newMessageRole,
          content: newMessage,
        });

      if (error) throw error;

      await supabase
        .from('conversation_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedThread.id);

      setNewMessage('');
      loadMessages(selectedThread.id);
      loadThreads();
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  const deleteThread = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversation_threads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (selectedThread?.id === id) {
        setSelectedThread(null);
        setMessages([]);
        setSummary(null);
      }
      loadThreads();
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const exportThread = () => {
    if (!selectedThread) return;

    let text = `# ${selectedThread.title}\n`;
    text += `Source: ${selectedThread.source}\n`;
    text += `Created: ${new Date(selectedThread.created_at).toLocaleString()}\n\n`;

    if (summary) {
      text += `## AI Summary\n${summary.summary}\n\n`;
      if (summary.key_points.length > 0) {
        text += `### Key Points\n`;
        summary.key_points.forEach((point) => {
          text += `- ${point}\n`;
        });
        text += '\n';
      }
    }

    text += `## Conversation\n\n`;
    messages.forEach((msg) => {
      text += `**${msg.role.toUpperCase()}**:\n${msg.content}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedThread.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateSummary = async () => {
    if (!selectedThread || messages.length === 0) return;

    const conversationText = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const mockSummary = `This conversation covers ${messages.length} messages about ${selectedThread.source}.`;
    const mockKeyPoints = [
      'User initiated conversation',
      `Total of ${messages.length} exchanges`,
      `Last updated: ${new Date(selectedThread.updated_at).toLocaleDateString()}`,
    ];

    try {
      const { error } = await supabase
        .from('conversation_summaries')
        .upsert({
          thread_id: selectedThread.id,
          summary: mockSummary,
          key_points: mockKeyPoints,
          generated_at: new Date().toISOString(),
        });

      if (error) throw error;
      loadSummary(selectedThread.id);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#888' }}>
        Loading conversations...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#0a0a0a',
      color: '#fff',
      display: 'flex',
      overflow: 'hidden',
    }}>
      <div style={{
        width: '300px',
        borderRight: '1px solid #2a2a2a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #2a2a2a',
        }}>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              background: '#2563eb',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <Plus size={18} />
            New Thread
          </button>
        </div>

        {showAddForm && (
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #2a2a2a',
            background: '#1a1a1a',
          }}>
            <input
              type="text"
              placeholder="Thread title"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '8px',
              }}
            />
            <select
              value={newThreadSource}
              onChange={(e) => setNewThreadSource(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0a0a0a',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px',
                marginBottom: '8px',
              }}
            >
              <option value="bolt">Bolt</option>
              <option value="claude">Claude</option>
              <option value="search-ai">Search AI</option>
              <option value="other">Other</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={createThread}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Create
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#2a2a2a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '10px',
        }}>
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                background: selectedThread?.id === thread.id ? '#1a1a1a' : 'transparent',
                border: `1px solid ${selectedThread?.id === thread.id ? '#2563eb' : '#2a2a2a'}`,
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'start',
                gap: '8px',
              }}>
                <MessageSquare size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {thread.title}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: '#888',
                    margin: 0,
                  }}>
                    {thread.source} • {new Date(thread.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {selectedThread ? (
          <>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #2a2a2a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                  {selectedThread.title}
                </h2>
                <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                  {selectedThread.source} • {messages.length} messages
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={generateSummary}
                  style={{
                    padding: '8px 16px',
                    background: '#7c3aed',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                  }}
                >
                  <Sparkles size={16} />
                  Summary
                </button>
                <button
                  onClick={exportThread}
                  style={{
                    padding: '8px 16px',
                    background: '#059669',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                  }}
                >
                  <Download size={16} />
                  Export
                </button>
                <button
                  onClick={() => deleteThread(selectedThread.id)}
                  style={{
                    padding: '8px 16px',
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>

            {summary && (
              <div style={{
                padding: '20px',
                background: '#1a1a1a',
                borderBottom: '1px solid #2a2a2a',
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  AI Summary
                </h3>
                <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '12px' }}>
                  {summary.summary}
                </p>
                {summary.key_points.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                      Key Points
                    </h4>
                    <ul style={{ fontSize: '13px', color: '#ccc', margin: 0, paddingLeft: '20px' }}>
                      {summary.key_points.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px',
            }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: msg.role === 'user' ? '#1a1a1a' : '#0f1419',
                    border: `1px solid ${msg.role === 'user' ? '#2a2a2a' : '#1e3a5f'}`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: msg.role === 'user' ? '#2563eb' : '#059669',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                  }}>
                    {msg.role}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #2a2a2a',
              background: '#0a0a0a',
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                  onClick={() => setNewMessageRole('user')}
                  style={{
                    padding: '6px 12px',
                    background: newMessageRole === 'user' ? '#2563eb' : '#2a2a2a',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  User
                </button>
                <button
                  onClick={() => setNewMessageRole('assistant')}
                  style={{
                    padding: '6px 12px',
                    background: newMessageRole === 'assistant' ? '#2563eb' : '#2a2a2a',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Assistant
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea
                  placeholder="Add a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                />
                <button
                  onClick={addMessage}
                  style={{
                    padding: '12px 20px',
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
          }}>
            Select a conversation thread to view messages
          </div>
        )}
      </div>
    </div>
  );
}
