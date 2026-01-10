
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QAEntry, MediaType, User } from '../types';
import { verifyAnswer } from '../services/geminiService';
import { CHOCOLATE, GOLD } from '../constants';

interface AdminPanelProps {
  onAdd: (entry: QAEntry) => void;
  onUpdate: (entry: QAEntry) => void;
  onCancelEdit: () => void;
  existingEntries: QAEntry[];
  editingEntry: QAEntry | null;
  currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onAdd, onUpdate, onCancelEdit, existingEntries, editingEntry, currentUser }) => {
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [source, setSource] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('none');
  const [mediaName, setMediaName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggestions logic
  const suggestionLists = useMemo(() => {
    const cats = new Set<string>();
    const subCats = new Set<string>();
    const topics = new Set<string>();
    
    existingEntries.forEach(e => {
      if (e.category) cats.add(e.category);
      if (e.subCategory) subCats.add(e.subCategory);
      if (e.topic) topics.add(e.topic);
    });
    
    return {
      categories: Array.from(cats),
      subCategories: Array.from(subCats),
      topics: Array.from(topics)
    };
  }, [existingEntries]);

  useEffect(() => {
    if (editingEntry) {
      setCategory(editingEntry.category);
      setSubCategory(editingEntry.subCategory || '');
      setTopic(editingEntry.topic);
      setQuestion(editingEntry.question);
      setAnswer(editingEntry.answer);
      setSource(editingEntry.source);
      setMediaUrl(editingEntry.mediaUrl || '');
      setMediaType(editingEntry.mediaType || 'none');
      setMediaName(editingEntry.mediaName || '');
      setVerificationResult('');
    } else {
      clearForm();
    }
  }, [editingEntry]);

  const clearForm = () => {
    setCategory('');
    setSubCategory('');
    setTopic('');
    setQuestion('');
    setAnswer('');
    setSource('');
    setMediaUrl('');
    setMediaType('none');
    setMediaName('');
    setVerificationResult('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setMediaUrl(result);
      if (file.type.startsWith('image/')) setMediaType('image');
      else if (file.type.startsWith('video/')) setMediaType('video');
      else setMediaType('document');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !question || !answer) return;

    const entryData: QAEntry = {
      id: editingEntry ? editingEntry.id : Date.now().toString(),
      authorId: editingEntry ? editingEntry.authorId : currentUser.id,
      category,
      subCategory,
      topic,
      question,
      answer,
      source,
      mediaUrl,
      mediaType,
      mediaName,
      createdAt: editingEntry ? editingEntry.createdAt : Date.now(),
      likes: editingEntry ? editingEntry.likes : [],
      dislikes: editingEntry ? editingEntry.dislikes || [] : [],
      comments: editingEntry ? editingEntry.comments : []
    };

    if (editingEntry) {
      onUpdate(entryData);
    } else {
      onAdd(entryData);
    }
    clearForm();
  };

  const handleVerify = async () => {
    if (!question || !answer) return;
    setIsVerifying(true);
    const result = await verifyAnswer(question, answer);
    setVerificationResult(result || '');
    setIsVerifying(false);
  };

  return (
    <div className="max-w-[500px] mx-auto bg-white rounded-lg shadow-sm border border-gray-300 p-4 mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-10 h-10 rounded-full border border-[#D4AF37]/30 shadow-sm overflow-hidden bg-[#2b1810] flex items-center justify-center">
          {currentUser.profilePic ? (
            <img src={currentUser.profilePic} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-[#D4AF37] font-bold">A</span>
          )}
        </div>
        <div className="flex-1 bg-[#F0F2F5] rounded-full px-4 py-2.5 text-gray-600 text-sm hover:bg-[#E4E6E9] cursor-pointer font-medium">
          {editingEntry ? 'Refining Knowledge...' : "What knowledge shall we archive today?"}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#5c4033] uppercase ml-1">Category</label>
            <input 
              list="admin-categories"
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#F9F6F1] border border-[#E5E1DA] rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. Science"
            />
            <datalist id="admin-categories">
              {suggestionLists.categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#5c4033] uppercase ml-1">Sub-Category</label>
            <input 
              list="admin-subcategories"
              value={subCategory} 
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full bg-[#F9F6F1] border border-[#E5E1DA] rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              placeholder="e.g. Physics"
            />
            <datalist id="admin-subcategories">
              {suggestionLists.subCategories.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#5c4033] uppercase ml-1">Topic</label>
          <input 
            list="admin-topics"
            value={topic} 
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-[#F9F6F1] border border-[#E5E1DA] rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            placeholder="Main Topic..."
          />
          <datalist id="admin-topics">
            {suggestionLists.topics.map(t => <option key={t} value={t} />)}
          </datalist>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#5c4033] uppercase ml-1">Question</label>
          <textarea 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-[#F9F6F1] border border-[#E5E1DA] rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] h-16 font-bold"
            placeholder="Ask the question..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#5c4033] uppercase ml-1">Answer</label>
          <textarea 
            value={answer} 
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full bg-[#F9F6F1] border border-[#E5E1DA] rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] h-24"
            placeholder="Detailed answer..."
          />
        </div>

        {/* Media Upload Section */}
        <div className="space-y-2 border-t border-gray-100 pt-2">
          <label className="text-[10px] font-bold text-[#5c4033] uppercase ml-1">Media Attachment</label>
          <div className="flex space-x-2">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center space-x-2 bg-[#F9F6F1] border border-dashed border-[#D4AF37] rounded-md py-3 text-[#2b1810] hover:bg-[#F4E4BC] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs font-bold">Photo / Video / Doc</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,video/*,application/pdf,application/msword,text/plain" 
            />
          </div>
          {mediaUrl && (
            <div className="relative group rounded-md overflow-hidden bg-gray-50 border border-gray-200">
               <div className="p-2 flex items-center space-x-2">
                  <span className="text-xs font-medium text-[#2b1810] truncate max-w-[80%]">{mediaName}</span>
                  <button type="button" onClick={() => {setMediaUrl(''); setMediaType('none'); setMediaName('');}} className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 ml-auto">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               {mediaType === 'image' && <img src={mediaUrl} className="h-24 w-full object-cover" alt="Preview" />}
               {mediaType === 'video' && <video src={mediaUrl} className="h-24 w-full object-cover" />}
               {mediaType === 'document' && <div className="h-24 w-full flex items-center justify-center bg-gray-100"><svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#5c4033] uppercase ml-1">Source Citation</label>
          <input 
            value={source} 
            onChange={(e) => setSource(e.target.value)}
            className="w-full bg-[#F9F6F1] border border-[#E5E1DA] rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            placeholder="Citation or URL"
          />
        </div>

        {verificationResult && (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-[11px] text-blue-800 animate-fade-in italic">
            <strong>Scholar Verification:</strong> {verificationResult}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <button 
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || !question || !answer}
            className="flex-1 px-4 py-2 rounded-md font-bold text-[#2b1810] bg-[#F4E4BC] hover:bg-[#D4AF37] hover:text-white disabled:opacity-50 text-xs uppercase transition-all"
          >
            {isVerifying ? 'Checking...' : 'Verify Pair'}
          </button>
          
          <button 
            type="submit"
            className="flex-[1.5] px-4 py-2 rounded-md font-bold text-[#D4AF37] bg-[#2b1810] shadow-sm hover:brightness-125 transition-all text-xs uppercase"
          >
            {editingEntry ? 'Update Archive' : 'Post to Feed'}
          </button>
          
          {editingEntry && (
             <button type="button" onClick={onCancelEdit} className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 font-bold text-xs uppercase">Cancel</button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminPanel;
