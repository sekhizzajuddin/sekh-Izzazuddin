
import React, { useState, useRef } from 'react';
import { QAEntry, User, Comment } from '../types';
import { getInitials } from './QuestionCard';

interface MediaZoomModalProps {
  entry: QAEntry;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onComment: (qaId: string, text: string, parentId?: string) => void;
  onCommentLike: (qaId: string, commentId: string) => void;
}

const MediaZoomModal: React.FC<MediaZoomModalProps> = ({ 
  entry, currentUser, allUsers, onClose, onLike, onDislike, onComment, onCommentLike 
}) => {
  const [commentText, setCommentText] = useState('');
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasLiked = entry.likes?.includes(currentUser.id);
  const hasDisliked = entry.dislikes?.includes(currentUser.id);

  // Detect scroll to trigger the 90/10 to 40/60 height transition
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 10) {
      if (!isScrolled) setIsScrolled(true);
    } else {
      if (isScrolled) setIsScrolled(false);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(entry.id, commentText);
    setCommentText('');
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!entry.mediaUrl) return;
    const link = document.createElement('a');
    link.href = entry.mediaUrl;
    link.download = entry.mediaName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-98 flex flex-col animate-fade-in overflow-hidden">
      {/* Universal Close Button */}
      <button 
        onClick={onClose}
        className="fixed top-4 right-4 z-[110] p-2 rounded-full bg-white bg-opacity-10 text-white hover:bg-opacity-30 hover:scale-110 transition-all shadow-lg border border-white border-opacity-20"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Media Area: 90% height initially, shrinks to 40% on interaction */}
      <div 
        className={`relative flex items-center justify-center bg-black transition-all duration-700 ease-in-out overflow-hidden ${
          isScrolled ? 'h-[40vh]' : 'h-[90vh]'
        }`}
      >
        {isMediaLoading && entry.mediaType !== 'document' && entry.mediaType !== 'none' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[#D4AF37] font-bold text-xs tracking-widest animate-pulse font-serif">PREPARING ASSET...</span>
          </div>
        )}

        {entry.mediaType === 'image' && (
          <img 
            src={entry.mediaUrl} 
            onLoad={() => setIsMediaLoading(false)}
            className={`max-w-full max-h-full object-contain transition-all duration-700 ${
              isMediaLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`} 
            alt={entry.mediaName} 
          />
        )}
        
        {entry.mediaType === 'video' && (
          <video 
            src={entry.mediaUrl} 
            controls 
            autoPlay
            onLoadedData={() => setIsMediaLoading(false)}
            className={`max-w-full max-h-full transition-all duration-700 ${
              isMediaLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          />
        )}

        {entry.mediaType === 'document' && (
          <div className="w-full max-w-5xl h-[85%] flex flex-col bg-white rounded shadow-2xl overflow-hidden animate-scale-in">
             <iframe src={entry.mediaUrl} className="w-full h-full border-none" title="Doc Preview" />
          </div>
        )}

        {/* Float Download */}
        <button 
          onClick={handleDownload}
          className={`absolute bottom-6 left-6 p-4 rounded-full bg-[#D4AF37] text-white shadow-xl hover:scale-110 transition-all flex items-center space-x-2 z-20 ${
            isScrolled ? 'opacity-50 scale-75' : 'opacity-100 scale-100'
          }`}
          title="Download"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>

      {/* Interaction Panel: 10% height initially, expands to 60% on scroll */}
      <div 
        className={`bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.3)] flex flex-col transition-all duration-700 ease-in-out border-t border-[#D4AF37]/40 ${
          isScrolled ? 'h-[60vh]' : 'h-[10vh]'
        }`}
      >
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto custom-scrollbar bg-[#FDFBF7]"
        >
          {/* Header Bar - More compact to allow content visibility in 10% state */}
          <div className="sticky top-0 z-10 bg-white border-b border-[#E5E1DA] p-2 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#2b1810] flex-shrink-0 flex items-center justify-center text-[#D4AF37] font-black text-[10px] border border-[#D4AF37]/30">
                {getInitials(entry.category)}
              </div>
              <div className="truncate">
                <h4 className="font-serif font-bold text-[#2b1810] text-xs truncate leading-none mb-0.5">{entry.category}</h4>
                <p className="text-[9px] text-[#5c4033] font-bold uppercase tracking-tight">{entry.topic}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mr-2">
              <div className="flex items-center space-x-1 text-[10px] font-bold text-[#D4AF37]">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M14 10h4.704a1 1 0 01.94 1.347l-2.292 6.084A2 2 0 0115.462 19H8c-1.105 0-2-.895-2-2v-9a2 2 0 01.586-1.414l2.828-2.828A2 2 0 0110.828 3h.672a2 2 0 012 2v5z" /></svg>
                <span>{entry.likes?.length || 0}</span>
              </div>
              {!isScrolled && (
                <div className="animate-bounce text-[#D4AF37]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area: Visible even in 10% state via scrolling */}
          <div className="p-4 max-w-4xl mx-auto space-y-6">
            {/* Question & Answer Content */}
            <div className="space-y-3">
              <h3 className="text-xl font-serif font-black text-[#2b1810] leading-tight border-l-4 border-[#D4AF37] pl-3">
                {entry.question}
              </h3>
              <p className="text-base text-[#2b1810] leading-relaxed">
                {entry.answer}
              </p>
              <div className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest bg-[#F4E4BC]/20 p-2 rounded inline-block">
                Reference: <span className="text-[#2b1810] normal-case ml-1">{entry.source}</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex space-x-3 border-y border-[#E5E1DA] py-4">
              <button 
                onClick={() => onLike(entry.id)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                  hasLiked ? 'bg-[#2b1810] text-[#D4AF37] shadow-lg' : 'bg-white border border-[#E5E1DA] text-[#2b1810] hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.704a1 1 0 01.94 1.347l-2.292 6.084A2 2 0 0115.462 19H8c-1.105 0-2-.895-2-2v-9a2 2 0 01.586-1.414l2.828-2.828A2 2 0 0110.828 3h.672a2 2 0 012 2v5z" />
                </svg>
                <span className="font-bold uppercase text-[10px] tracking-widest">Admire</span>
              </button>
              
              <button 
                onClick={() => onDislike(entry.id)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                  hasDisliked ? 'bg-red-900 text-white shadow-lg' : 'bg-white border border-[#E5E1DA] text-[#2b1810] hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 transform rotate-180" fill={hasDisliked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.704a1 1 0 01.94 1.347l-2.292 6.084A2 2 0 0115.462 19H8c-1.105 0-2-.895-2-2v-9a2 2 0 01.586-1.414l2.828-2.828A2 2 0 0110.828 3h.672a2 2 0 012 2v5z" />
                </svg>
                <span className="font-bold uppercase text-[10px] tracking-widest">Critique</span>
              </button>
            </div>

            {/* Discussions */}
            <div className="pb-12">
              <h5 className="text-xs font-black text-[#2b1810] uppercase tracking-widest mb-6 flex items-center">
                Knowledge Pool <span className="ml-2 w-5 h-5 flex items-center justify-center bg-[#D4AF37] text-white rounded-full text-[9px]">{entry.comments?.length || 0}</span>
              </h5>
              {entry.comments?.length > 0 ? (
                <div className="space-y-6">
                  {entry.comments.map(c => (
                    <CommentItemSimple 
                      key={c.id} 
                      comment={c} 
                      allUsers={allUsers} 
                      currentUserId={currentUser.id}
                      onLike={(cid) => onCommentLike(entry.id, cid)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                  <p className="italic text-xs">No insights contributed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Discussion Input - Sticky at bottom of Interaction Panel */}
        <div className="p-3 bg-white border-t border-[#E5E1DA] shadow-inner">
          <form onSubmit={handleCommentSubmit} className="max-w-4xl mx-auto flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#2b1810] flex-shrink-0 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/30 overflow-hidden text-[10px] font-bold">
               {currentUser.profilePic ? <img src={currentUser.profilePic} className="w-full h-full object-cover" alt="" /> : getInitials(currentUser.displayName || currentUser.username)}
            </div>
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Post a scholarly comment..."
              className="flex-1 bg-[#F9F6F1] border border-[#E5E1DA] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
            />
            <button 
              type="submit" 
              disabled={!commentText.trim()}
              className="bg-[#2b1810] text-[#D4AF37] p-2 rounded-full hover:brightness-125 disabled:opacity-20 transition-all shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const CommentItemSimple: React.FC<{ 
  comment: Comment; 
  allUsers: User[]; 
  currentUserId: string;
  onLike: (id: string) => void;
}> = ({ comment, allUsers, currentUserId, onLike }) => {
  const author = allUsers.find(u => u.id === comment.userId);
  const displayName = author?.displayName || author?.username || comment.username;
  const profilePic = author?.profilePic;
  const initials = getInitials(displayName);
  const hasLiked = comment.likes?.includes(currentUserId);

  return (
    <div className="flex items-start space-x-3 group animate-fade-in">
      <div className="w-9 h-9 rounded-full bg-[#2b1810] flex-shrink-0 flex items-center justify-center text-[9px] font-black text-[#D4AF37] overflow-hidden border border-[#D4AF37]/20 shadow-sm">
         {profilePic ? <img src={profilePic} className="w-full h-full object-cover" alt="" /> : initials}
      </div>
      <div className="flex-1">
        <div className="bg-white border border-[#E5E1DA] rounded-xl rounded-tl-none px-3 py-2 shadow-sm">
           <div className="flex justify-between items-center mb-1">
             <p className="text-[10px] font-black text-[#2b1810] uppercase tracking-tighter">{displayName}</p>
             <span className="text-[8px] text-gray-400 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</span>
           </div>
           <p className="text-xs text-[#2b1810] leading-relaxed">{comment.text}</p>
        </div>
        <div className="flex space-x-4 mt-1.5 ml-1">
          <button 
            onClick={() => onLike(comment.id)} 
            className={`flex items-center space-x-1 text-[9px] font-black uppercase tracking-widest hover:underline transition-colors ${
              hasLiked ? 'text-[#D4AF37]' : 'text-[#5c4033] opacity-50'
            }`}
          >
            <span>Respect {comment.likes?.length > 0 && `(${comment.likes.length})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaZoomModal;
