'use client'

import { useState, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { HistoryItem } from '../types/history';
import { Input } from '@/components/ui/input';

interface Props {
  history: HistoryItem[];
  onHistoryItemClick: (item: HistoryItem) => void;
  onNewChat: () => void;
  onDeleteHistory: (index: number) => void;
  onEditHistory: (index: number, newPrompt: string) => void;
}

export default function GenerationHistory({ 
  history, 
  onHistoryItemClick, 
  onNewChat,
  onDeleteHistory,
  onEditHistory 
}: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (index: number, prompt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditValue(prompt);
  };

  const saveEdit = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editValue.trim()) {
      onEditHistory(index, editValue.trim());
    }
    setEditingIndex(null);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      saveEdit(index);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    }
  };

  const handleBlur = (index: number) => {
    saveEdit(index);
  };

  return (
    <div className="w-64 h-full border-r border-border bg-background">
      <div className="p-4">
        <Button 
          variant="outline" 
          className="w-full mb-4 flex items-center gap-2"
          onClick={onNewChat}
        >
          <PlusCircle size={16} />
          New Chat
        </Button>
      </div>
      <div className="px-2 space-y-2">
        {history.map((item, index) => (
          <div 
            key={index} 
            className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors group relative"
            onClick={() => onHistoryItemClick(item)}
          >
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => startEditing(index, item.prompt, e)}
              >
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteHistory(index);
                }}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
            {editingIndex === index ? (
              <div className="flex items-center gap-2" onClick={handleInputClick}>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onBlur={() => handleBlur(index)}
                  className="h-6 text-sm bg-background"
                  autoFocus
                />
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground truncate pr-16">
                {item.prompt}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(item.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 