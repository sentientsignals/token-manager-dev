'use client';

import { useState } from 'react';
import { Zap, Percent, Grid3x3, Sparkles, Key, MessageSquare } from 'lucide-react';
import TokenManager from '@/components/TokenManager';
import ConversationManager from '@/components/ConversationManager';

type Tab = {
  id: string;
  label: string;
  url?: string;
  icon: React.ReactNode;
  component?: React.ReactNode;
};

const tabs: Tab[] = [
  { id: 'bolt', label: 'Bolt', url: 'https://bolt.new', icon: <Zap size={24} /> },
  { id: 'claude', label: 'Claude', url: 'https://claude.ai', icon: <Sparkles size={24} /> },
  { id: 'conversations', label: 'Threads', component: <ConversationManager />, icon: <MessageSquare size={24} /> },
  { id: 'tokens', label: 'Tokens', component: <TokenManager />, icon: <Key size={24} /> },
  { id: 'taxcalc', label: 'Tax Calc', url: 'https://transaction-tax-calc.vercel.app', icon: <Percent size={24} /> },
  { id: 'linksort', label: 'LinkSort', url: 'https://linksort.vercel.app', icon: <Grid3x3 size={24} /> },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('bolt');

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0a',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      <div style={{
        flex: 1,
        position: 'relative',
        paddingTop: 'env(safe-area-inset-top)',
        overflow: 'hidden',
      }}>
        {tabs.map((tab) => (
          tab.url ? (
            <iframe
              key={tab.id}
              src={tab.url}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                display: activeTab === tab.id ? 'block' : 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              key={tab.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: activeTab === tab.id ? 'block' : 'none',
                overflow: 'auto',
              }}
            >
              {tab.component}
            </div>
          )
        ))}
      </div>

      <div style={{
        height: '60px',
        background: '#0a0a0a',
        borderTop: '0.5px solid #1e1e1e',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? '#fff' : '#444',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {tab.icon}
            <span style={{ fontSize: '11px' }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
