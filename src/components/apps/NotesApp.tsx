import React, { useState } from 'react';
import { Plus, Trash2, Edit3, CheckCircle, FileText } from 'lucide-react';
import { sound } from '../../utils/audio';

interface NotesAppProps {
  onClose: () => void;
}

interface Note {
  id: string;
  title: string;
  body: string;
  color: string;
  updatedAt: string;
}

const INITIAL_NOTES: Note[] = [
  {
    id: 'n-1',
    title: 'Science Fair Project Ideas',
    body: '1. Model of Mars Rover with solar panels\n2. Volcanic eruption with baking soda & vinegar\n3. Plant growth with different light colors',
    color: 'bg-indigo-950/70 border-indigo-700/50',
    updatedAt: 'Today, 2:15 PM',
  },
  {
    id: 'n-2',
    title: 'Minecraft Wishlist',
    body: '- Diamond armor set\n- Nether portal near base\n- Tame 2 wolves in the taiga biome\n- Redstone secret door behind painting',
    color: 'bg-emerald-950/70 border-emerald-700/50',
    updatedAt: 'Yesterday',
  },
  {
    id: 'n-3',
    title: 'Reading Log - Book 4',
    body: 'Chapter 7 finished! Pippin the Penguin reached the crystal caves and discovered the ancient ice map.',
    color: 'bg-amber-950/70 border-amber-700/50',
    updatedAt: 'Sep 12',
  },
];

export const NotesApp: React.FC<NotesAppProps> = ({ onClose }) => {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [selectedNote, setSelectedNote] = useState<Note | null>(INITIAL_NOTES[0]);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleAddNote = () => {
    sound.playUnlockChime();
    const newNote: Note = {
      id: `n-${Date.now()}`,
      title: 'New Note',
      body: 'Type your tablet notes or ideas here...',
      color: 'bg-cyan-950/70 border-cyan-700/50',
      updatedAt: 'Just now',
    };
    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    sound.playKeyClick();
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (selectedNote?.id === id) {
      setSelectedNote(updated[0] || null);
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col select-none overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="font-display font-bold text-sm sm:text-base text-white">Tablet Notes & Memo</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddNote}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Main Layout: Note list on Left / Note Editor on Right */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
        {/* Notes sidebar */}
        <div className="border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-900/40">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => {
                sound.playKeyClick();
                setSelectedNote(note);
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${note.color} ${
                selectedNote?.id === note.id ? 'ring-2 ring-cyan-400 shadow-md' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-white truncate">{note.title}</h4>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(note.id);
                  }}
                  className="p-1 hover:text-rose-400 text-slate-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 whitespace-pre-line">
                {note.body}
              </p>
              <span className="text-[10px] text-slate-400 block mt-2">{note.updatedAt}</span>
            </div>
          ))}
        </div>

        {/* Note viewer / editor */}
        <div className="md:col-span-2 p-6 flex flex-col bg-slate-950 overflow-y-auto">
          {selectedNote ? (
            <div className="space-y-4 max-w-xl">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedNote({ ...selectedNote, title: val });
                  setNotes((prev) =>
                    prev.map((n) => (n.id === selectedNote.id ? { ...n, title: val } : n))
                  );
                }}
                className="w-full bg-transparent font-display font-bold text-xl sm:text-2xl text-white focus:outline-none border-b border-slate-800 pb-2"
                placeholder="Note Title"
              />

              <textarea
                value={selectedNote.body}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedNote({ ...selectedNote, body: val });
                  setNotes((prev) =>
                    prev.map((n) => (n.id === selectedNote.id ? { ...n, body: val } : n))
                  );
                }}
                rows={12}
                className="w-full bg-transparent text-sm text-slate-200 leading-relaxed focus:outline-none resize-none font-sans"
                placeholder="Write your note here..."
              />

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-900">
                <span>Auto-saved to tablet storage</span>
                <span className="text-cyan-400 font-mono">Synced locally</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
              <FileText className="w-12 h-12 stroke-1" />
              <p className="text-xs">Select or create a note</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
