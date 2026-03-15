'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Copy, Trash2, Check } from 'lucide-react';

type GitHubToken = {
  id: string;
  name: string;
  token: string;
  scopes: string;
  created_at: string;
  last_used_at: string;
};

export default function TokenManager() {
  const [tokens, setTokens] = useState<GitHubToken[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenValue, setNewTokenValue] = useState('');
  const [newTokenScopes, setNewTokenScopes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('github_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToken = async () => {
    if (!newTokenName.trim() || !newTokenValue.trim()) return;

    try {
      const { error } = await supabase
        .from('github_tokens')
        .insert({
          name: newTokenName,
          token: newTokenValue,
          scopes: newTokenScopes,
        });

      if (error) throw error;

      setNewTokenName('');
      setNewTokenValue('');
      setNewTokenScopes('');
      setShowAddForm(false);
      loadTokens();
    } catch (error) {
      console.error('Error adding token:', error);
    }
  };

  const deleteToken = async (id: string) => {
    try {
      const { error } = await supabase
        .from('github_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTokens();
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  };

  const copyToken = async (token: string, id: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedId(id);

      await supabase
        .from('github_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id);

      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying token:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#888' }}>
        Loading tokens...
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#0a0a0a',
      color: '#fff',
      padding: '20px',
      overflow: 'auto',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            margin: 0,
          }}>
            GitHub Tokens
          </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
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
            Add Token
          </button>
        </div>

        {showAddForm && (
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
            }}>
              Add New Token
            </h2>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <input
                type="text"
                placeholder="Token name (e.g., Main Token, Bolt Token #2)"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                style={{
                  padding: '12px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
              <input
                type="text"
                placeholder="Token value (ghp_...)"
                value={newTokenValue}
                onChange={(e) => setNewTokenValue(e.target.value)}
                style={{
                  padding: '12px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}
              />
              <input
                type="text"
                placeholder="Scopes (optional, e.g., repo, workflow)"
                value={newTokenScopes}
                onChange={(e) => setNewTokenScopes(e.target.value)}
                style={{
                  padding: '12px',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={addToken}
                  style={{
                    flex: 1,
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
                  Save Token
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#2a2a2a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {tokens.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#666',
          }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No tokens saved yet</p>
            <p style={{ fontSize: '14px' }}>Add your first GitHub token to get started</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {tokens.map((token) => (
              <div
                key={token.id}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '12px',
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '4px',
                    }}>
                      {token.name}
                    </h3>
                    {token.scopes && (
                      <p style={{
                        fontSize: '12px',
                        color: '#888',
                        margin: 0,
                      }}>
                        Scopes: {token.scopes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteToken(token.id)}
                    style={{
                      padding: '8px',
                      background: '#2a2a2a',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: '#0a0a0a',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}>
                  <code style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {token.token}
                  </code>
                  <button
                    onClick={() => copyToken(token.token, token.id)}
                    style={{
                      padding: '6px 12px',
                      background: copiedId === token.id ? '#059669' : '#2563eb',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'background 0.2s',
                    }}
                  >
                    {copiedId === token.id ? (
                      <>
                        <Check size={14} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '8px',
                  marginBottom: 0,
                }}>
                  Created: {new Date(token.created_at).toLocaleDateString()}
                  {token.last_used_at !== token.created_at && (
                    <> • Last used: {new Date(token.last_used_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
