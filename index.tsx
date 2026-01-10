
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
export type Role = 'Admin' | 'User';

export interface User {
  id: string;
  username: string;
  role: Role;
  password?: string;
  displayName?: string;
  profilePic?: string;
  isPrivate?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: number;
  replies: Comment[];
  likes: string[];
}

export type MediaType = 'image' | 'video' | 'document' | 'none';

export interface QAEntry {
  id: string;
  authorId: string;
  category: string;
  subCategory: string;
  topic: string;
  question: string;
  answer: string;
  source: string;
  createdAt: number;
  likes: string[];
  dislikes: string[];
  comments: Comment[];
  mediaUrl?: string;
  mediaType?: MediaType;
  mediaName?: string;
}

// --- CONSTANTS ---
export const DEFAULT_ADMIN = {
  username: 'Admin_Izzaz',
  password: 'Izzaz7603',
  role: 'Admin' as const
};

export const INITIAL_DATA: QAEntry[] = [
  {
    id: '1',
    authorId: 'admin-id',
    category: 'Technology',
    subCategory: 'Artificial Intelligence',
    topic: 'Large Language Models',
    question: 'How does the attention mechanism improve model performance?',
    answer: 'The attention mechanism allows models to focus on specific parts of the input sequence when producing an output, effectively giving different weights to different words depending on their relevance in context.',
    source: 'Vaswani et al. (2017), "Attention Is All You Need"',
    createdAt: Date.now() - 1000000,
    likes: [],
    dislikes: [],
    comments: []
  },
  {
    id: '2',
    authorId: 'admin-id',
    category: 'Science',
    subCategory: 'Quantum Physics',
    topic: 'Entanglement',
    question: 'What is Quantum Entanglement in simple terms?',
    answer: 'Quantum entanglement is a phenomenon where particles share spatial proximity such that the state of each particle cannot be described independently.',
    source: 'Niels Bohr Institute',
    createdAt: Date.now() - 500000,
    likes: [],
    dislikes: [],
    comments: []
  }
];

// --- SERVICES ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
export const verifyAnswer = async (question: string, answer: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Verify the accuracy of this Q&A pair. 
      Question: ${question}
      Answer: ${answer}`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Verification unavailable.";
  }
};

// --- UTILS ---
export const getInitials = (name: string): string => {
  if (!name) return "?";
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
  return names[0].substring(0, 2).toUpperCase();
};

// --- COMPONENTS ---

const MediaZoomModal: React.FC<{
  entry: QAEntry;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onComment: (qaId: string, text: string, parentId?: string) => void;
  onCommentLike: (qaId: string, commentId: string) => void;
}> = ({ entry, currentUser, allUsers, onClose, onLike, onDislike, onComment, onCommentLike }) => {
  const [commentText, setCommentText] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  const hasLiked = entry.likes?.includes(currentUser.id);
  const hasDisliked = entry.dislikes?.includes(currentUser.id);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-98 flex flex-col animate-fade-in overflow-hidden">
      <button onClick={onClose} className="fixed top-4 right-4 z-[110] p-2 rounded-full bg-white bg-opacity-10 text-white hover:bg-opacity-30 border border-white border-opacity-20 transition-all">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" /></svg>
      </button>

      <div className={`relative flex items-center justify-center bg-black transition-all duration-700 ease-in-out ${isScrolled ? 'h-[40vh]' : 'h-[90vh]'}`}>
        {isMediaLoading && entry.mediaType !== 'document' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {entry.mediaType === 'image' && <img src={entry.mediaUrl} onLoad={() => setIsMediaLoading(false)} className="max-w-full max-h-full object-contain transition-opacity duration-700" />}
        {entry.mediaType === 'video' && <video src={entry.mediaUrl} controls autoPlay onLoadedData={() => setIsMediaLoading(false)} className="max-w-full max-h-full transition-opacity duration-700" />}
        {entry.mediaType === 'document' && <iframe src={entry.mediaUrl} className="w-full h-full max-w-5xl bg-white rounded shadow-2xl" />}
      </div>

      <div className={`bg-white shadow-2xl flex flex-col transition-all duration-700 border-t border-[#D4AF37]/40 ${isScrolled ? 'h-[60vh]' : 'h-[10vh]'}`}>
        <div onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar bg-[#FDFBF7]">
          <div className="sticky top-0 z-10 bg-white border-b p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-[#2b1810] flex items-center justify-center text-[#D4AF37] text-[10px] font-black">{getInitials(entry.category)}</div>
              <h4 className="font-serif font-bold text-[#2b1810] text-xs truncate">{entry.category}</h4>
            </div>
          </div>
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h3 className="text-2xl font-serif font-black text-[#2b1810] border-l-4 border-[#D4AF37] pl-4">{entry.question}</h3>
            <p className="text-lg text-[#2b1810] leading-relaxed">{entry.answer}</p>
            <div className="flex space-x-4 border-y py-4">
              <button onClick={() => onLike(entry.id)} className={`flex-1 py-3 rounded-xl flex items-center justify-center space-x-2 ${hasLiked ? 'bg-[#2b1810] text-[#D4AF37]' : 'bg-white border text-[#2b1810]'}`}>Admire ({entry.likes?.length})</button>
              <button onClick={() => onDislike(entry.id)} className={`flex-1 py-3 rounded-xl flex items-center justify-center space-x-2 ${hasDisliked ? 'bg-red-900 text-white' : 'bg-white border text-[#2b1810]'}`}>Critique ({entry.dislikes?.length})</button>
            </div>
            <div className="space-y-4 pb-12">
               {entry.comments?.map(c => (
                 <div key={c.id} className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#2b1810] border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-[10px] font-bold overflow-hidden">
                       {allUsers.find(u => u.id === c.userId)?.profilePic ? <img src={allUsers.find(u => u.id === c.userId)?.profilePic} className="w-full h-full object-cover" /> : getInitials(c.username)}
                    </div>
                    <div className="bg-white border p-3 rounded-xl rounded-tl-none shadow-sm flex-1">
                       <p className="text-xs font-black uppercase tracking-tighter mb-1">{c.username}</p>
                       <p className="text-sm">{c.text}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
        <div className="p-3 bg-white border-t">
          <form onSubmit={(e) => { e.preventDefault(); if(commentText.trim()) { onComment(entry.id, commentText); setCommentText(''); } }} className="max-w-4xl mx-auto flex items-center space-x-2">
            <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Contribute to the pool..." className="flex-1 bg-[#F9F6F1] border rounded-full px-5 py-2 text-sm focus:ring-1 focus:ring-[#D4AF37] outline-none" />
            <button type="submit" className="bg-[#2b1810] text-[#D4AF37] p-2 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeWidth={2} /></svg></button>
          </form>
        </div>
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{
  entry: QAEntry;
  isAdmin: boolean;
  isBookmarked: boolean;
  currentUser: User;
  allUsers: User[];
  onEdit: (entry: QAEntry) => void;
  onDelete: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onComment: (qaId: string, text: string, parentId?: string) => void;
  onCommentLike: (qaId: string, commentId: string) => void;
  onZoom: (id: string) => void;
}> = ({ entry, isAdmin, isBookmarked, currentUser, allUsers, onEdit, onDelete, onBookmarkToggle, onLike, onDislike, onComment, onCommentLike, onZoom }) => {
  const author = allUsers.find(u => u.id === entry.authorId);
  const authorPic = author?.profilePic;
  const authorName = author?.displayName || author?.username || "Scholar";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E1DA] mb-4 flex flex-col overflow-hidden max-w-[500px] mx-auto">
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#2b1810] flex items-center justify-center text-[#D4AF37] font-black border border-[#D4AF37]/30 overflow-hidden">
            {authorPic ? <img src={authorPic} className="w-full h-full object-cover" /> : getInitials(authorName)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-[15px] font-bold text-[#2b1810] font-serif">{entry.category}</p>
              {entry.subCategory && <span className="px-1.5 py-0.5 bg-[#F4E4BC] text-[#2b1810] text-[10px] font-bold rounded uppercase">{entry.subCategory}</span>}
            </div>
            <p className="text-[12px] text-[#5c4033] font-bold text-[#D4AF37]">{entry.topic}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {isAdmin && (
            <button onClick={() => onDelete(entry.id)} className="p-2 text-red-200 hover:text-red-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg>
            </button>
          )}
          <button onClick={() => onBookmarkToggle(entry.id)} className={`p-2 transition-colors ${isBookmarked ? 'text-[#D4AF37]' : 'text-gray-300'}`}>
            <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeWidth={2} /></svg>
          </button>
        </div>
      </div>
      <div className="px-4 py-1" onClick={() => entry.mediaUrl && onZoom(entry.id)}>
        <h3 className="text-[17px] font-bold text-[#2b1810] mb-2 cursor-pointer">{entry.question}</h3>
        {entry.mediaUrl && (
          <div className="mb-3 rounded-lg overflow-hidden border bg-black/5 cursor-pointer hover:brightness-95 transition-all">
            {entry.mediaType === 'image' && <img src={entry.mediaUrl} className="w-full max-h-96 object-cover" />}
            {entry.mediaType === 'video' && <video src={entry.mediaUrl} className="w-full max-h-96" />}
          </div>
        )}
        <p className="text-[15px] leading-normal mb-4">{entry.answer}</p>
      </div>
      <div className="px-3 py-1 flex items-center border-t">
        <button onClick={() => onLike(entry.id)} className={`flex-1 py-2 flex items-center justify-center space-x-2 rounded-md ${entry.likes.includes(currentUser.id) ? 'text-[#D4AF37]' : 'text-gray-500'}`}>Like ({entry.likes.length})</button>
        <button onClick={() => onComment(entry.id, "", "")} className="flex-1 py-2 flex items-center justify-center space-x-2 text-gray-500">Comment ({entry.comments.length})</button>
      </div>
    </div>
  );
};

const AuthPage: React.FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  /**
   * Fix for type error where 'role' property was inferred as 'string' instead of 'Role' union type.
   * Explicitly casting string literals 'Admin' and 'User' to 'Role' ensures type compatibility with the User interface.
   */
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    if (isLogin) {
      const u = users.find((u:any) => u.username === username && u.password === password);
      if (u) onLogin(u);
      else if(username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) onLogin({ id: 'admin-id', username, role: 'Admin' as Role, displayName: 'Admin' });
      else alert("Invalid credentials");
    } else {
      const newUser: User = { id: `u-${Date.now()}`, username, password, role: 'User' as Role, displayName: username };
      users.push(newUser);
      localStorage.setItem('app_users', JSON.stringify(users));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl border border-[#E5E1DA]">
        <h2 className="text-4xl font-serif font-black text-[#2b1810] mb-6 text-center">Academic</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 border rounded-xl outline-none focus:ring-1 focus:ring-[#D4AF37]" placeholder="Username" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 border rounded-xl outline-none focus:ring-1 focus:ring-[#D4AF37]" placeholder="Password" required />
          <button type="submit" className="w-full py-4 bg-[#2b1810] text-[#D4AF37] font-bold rounded-xl shadow-lg hover:brightness-110">{isLogin ? 'Enter Portal' : 'Join Community'}</button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-[#5c4033] font-bold text-sm hover:underline">{isLogin ? 'Create Account' : 'Back to Login'}</button>
      </div>
    </div>
  );
};

const AccountSettings: React.FC<{ user: User; onUpdate: (u: User) => void; onBack: () => void }> = ({ user, onUpdate, onBack }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [profilePic, setProfilePic] = useState(user.profilePic || '');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = (ev) => { setProfilePic(ev.target?.result as string); };
      r.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg border">
        <button onClick={onBack} className="mb-4 text-[#2b1810] font-bold flex items-center"><svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={2} /></svg> Back</button>
        <h2 className="text-2xl font-serif font-bold mb-6">Profile Settings</h2>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-[#2b1810] border-2 border-[#D4AF37] overflow-hidden flex items-center justify-center text-[#D4AF37] text-2xl font-bold">
              {profilePic ? <img src={profilePic} className="w-full h-full object-cover" /> : getInitials(displayName)}
            </div>
            <button onClick={() => fileRef.current?.click()} className="bg-[#F4E4BC] px-4 py-2 rounded-lg text-xs font-bold uppercase border border-[#D4AF37]">Upload From Device</button>
            <input type="file" ref={fileRef} onChange={handleFile} className="hidden" accept="image/*" />
          </div>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full p-4 border rounded-xl" placeholder="Display Name" />
          <button onClick={() => onUpdate({ ...user, displayName, profilePic })} className="w-full py-4 bg-[#2b1810] text-[#D4AF37] font-bold rounded-xl">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

const AdminPanel: React.FC<{ onAdd: (e: QAEntry) => void; existing: QAEntry[]; currentUser: User }> = ({ onAdd, existing, currentUser }) => {
  const [form, setForm] = useState({ category: '', subCategory: '', topic: '', question: '', answer: '', source: '', mediaUrl: '', mediaType: 'none' as MediaType });
  const [isVerifying, setIsVerifying] = useState(false);
  
  const suggestions = useMemo(() => ({
    cats: [...new Set(existing.map(e => e.category))],
    subs: [...new Set(existing.map(e => e.subCategory))],
    topics: [...new Set(existing.map(e => e.topic))]
  }), [existing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, id: Date.now().toString(), authorId: currentUser.id, createdAt: Date.now(), likes: [], dislikes: [], comments: [] });
    setForm({ category: '', subCategory: '', topic: '', question: '', answer: '', source: '', mediaUrl: '', mediaType: 'none' });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mb-4 max-w-[500px] mx-auto">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input list="cats" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="Category" className="p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]" required />
          <datalist id="cats">{suggestions.cats.map(c => <option key={c} value={c}/>)}</datalist>
          <input list="subs" value={form.subCategory} onChange={e => setForm({...form, subCategory: e.target.value})} placeholder="Sub-Category" className="p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-[#D4AF37]" />
          <datalist id="subs">{suggestions.subs.map(c => <option key={c} value={c}/>)}</datalist>
        </div>
        <input list="topics" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} placeholder="Topic" className="w-full p-2 border rounded text-sm" />
        <datalist id="topics">{suggestions.topics.map(c => <option key={c} value={c}/>)}</datalist>
        <textarea value={form.question} onChange={e => setForm({...form, question: e.target.value})} placeholder="Question" className="w-full p-2 border rounded text-sm h-16" required />
        <textarea value={form.answer} onChange={e => setForm({...form, answer: e.target.value})} placeholder="Answer" className="w-full p-2 border rounded text-sm h-24" required />
        <div className="flex space-x-2">
           <button type="button" onClick={async () => { setIsVerifying(true); const r = await verifyAnswer(form.question, form.answer); alert(r); setIsVerifying(false); }} className="flex-1 py-2 bg-[#F4E4BC] text-xs font-bold rounded">{isVerifying ? 'Verifying...' : 'AI Verify'}</button>
           <button type="submit" className="flex-[2] py-2 bg-[#2b1810] text-[#D4AF37] text-xs font-bold rounded uppercase">Archive Knowledge</button>
        </div>
      </form>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const s = localStorage.getItem('app_session');
    return s ? JSON.parse(s) : null;
  });
  const [allUsers, setAllUsers] = useState<User[]>(() => JSON.parse(localStorage.getItem('app_users') || '[]'));
  const [entries, setEntries] = useState<QAEntry[]>(() => {
    const s = localStorage.getItem('qa_entries');
    return s ? JSON.parse(s) : INITIAL_DATA;
  });
  const [activeView, setActiveView] = useState<'feed' | 'account'>('feed');
  const [zoomedId, setZoomedId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('qa_entries', JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem('app_session', JSON.stringify(currentUser)); }, [currentUser]);

  if (!currentUser) return <AuthPage onLogin={u => { setCurrentUser(u); setAllUsers(JSON.parse(localStorage.getItem('app_users') || '[]')); }} />;

  const handleLike = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, likes: e.likes.includes(currentUser.id) ? e.likes.filter(u => u !== currentUser.id) : [...e.likes, currentUser.id] } : e));
  };

  const handleComment = (id: string, text: string) => {
    if(!text) return;
    const c: Comment = { id: Date.now().toString(), userId: currentUser.id, username: currentUser.displayName || currentUser.username, text, createdAt: Date.now(), replies: [], likes: [] };
    setEntries(prev => prev.map(e => e.id === id ? { ...e, comments: [...e.comments, c] } : e));
  };

  const handleProfileUpdate = (u: User) => {
    setCurrentUser(u);
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    const idx = users.findIndex((old:any) => old.id === u.id);
    if(idx !== -1) users[idx] = u; else users.push(u);
    localStorage.setItem('app_users', JSON.stringify(users));
    setAllUsers(users);
    setActiveView('feed');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-12">
      <nav className="fixed top-0 inset-x-0 h-14 bg-white border-b flex items-center justify-between px-4 z-50">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setActiveView('feed')}>
          <div className="w-8 h-8 rounded-full bg-[#2b1810] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-serif italic">A</div>
          <span className="font-bold text-[#2b1810] font-serif">Academic</span>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setActiveView('account')} className="flex items-center space-x-2 hover:bg-gray-100 p-1 px-2 rounded-full transition-all">
            <div className="w-8 h-8 rounded-full bg-[#2b1810] border overflow-hidden flex items-center justify-center text-[#D4AF37] text-[10px] font-bold">
              {currentUser.profilePic ? <img src={currentUser.profilePic} className="w-full h-full object-cover" /> : getInitials(currentUser.displayName || currentUser.username)}
            </div>
            <span className="text-sm font-bold hidden md:block">{currentUser.displayName || currentUser.username}</span>
          </button>
          <button onClick={() => setCurrentUser(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">Logout</button>
        </div>
      </nav>

      <main className="pt-20 px-4">
        {activeView === 'account' ? (
          <AccountSettings user={currentUser} onUpdate={handleProfileUpdate} onBack={() => setActiveView('feed')} />
        ) : (
          <div className="max-w-[500px] mx-auto">
            {currentUser.role === 'Admin' && <AdminPanel onAdd={e => setEntries([e, ...entries])} existing={entries} currentUser={currentUser} />}
            <div className="space-y-4">
               {entries.map(e => (
                 <QuestionCard key={e.id} entry={e} isAdmin={currentUser.role === 'Admin'} isBookmarked={false} currentUser={currentUser} allUsers={allUsers} onLike={handleLike} onComment={handleComment} onZoom={setZoomedId} onBookmarkToggle={()=>{}} onCommentLike={()=>{}} onDelete={id => setEntries(prev => prev.filter(e => e.id !== id))} onEdit={()=>{}} onDislike={()=>{}} />
               ))}
            </div>
          </div>
        )}
      </main>

      {zoomedId && (
        <MediaZoomModal 
          entry={entries.find(e => e.id === zoomedId)!} 
          currentUser={currentUser} 
          allUsers={allUsers} 
          onClose={() => setZoomedId(null)} 
          onLike={handleLike} 
          onDislike={()=>{}} 
          onComment={handleComment} 
          onCommentLike={()=>{}} 
        />
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
