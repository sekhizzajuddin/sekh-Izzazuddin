
import React, { useState } from 'react';
import { QAEntry, Comment, User, MediaType } from '../types';
import { CHOCOLATE, GOLD, GOLD_LIGHT, FB_TEXT_SECONDARY } from '../constants';

interface QuestionCardProps {
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
  onZoom: (entry: QAEntry) => void;
}

export const getInitials = (name: string): string => {
  if (!name) return "?";
  const names = name.split(' ').filter(n => n.length > 0);
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return names[0].substring(0, 2).toUpperCase();
};

const CommentItem: React.FC<{ 
  comment: Comment; 
  onReply: (parentId: string, text: string) => void;
  onLike: (commentId: string) => void;
  depth?: number;
  currentUserId: string;
  allUsers: User[];
}> = ({ comment, onReply, onLike, depth = 0, currentUserId, allUsers }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(comment.id, replyText);
    setReplyText('');
    setIsReplying(false);
  };

  const author = allUsers.find(u => u.id === comment.userId);
  const isPrivate = author?.isPrivate || false;
  const displayName = isPrivate ? 'Private User' : (author?.displayName || author?.username || comment.username);
  const profilePic = isPrivate ? null : author?.profilePic;
  const initials = getInitials(displayName);

  const hasLiked = comment.likes?.includes(currentUserId);

  return (
    <div className={`mt-2 relative ${depth > 0 ? 'ml-8' : ''}`}>
      <div className="flex items-start space-x-2">
        <div className="w-8 h-8 rounded-full bg-[#2b1810] flex-shrink-0 flex items-center justify-center text-[10px] font-black text-[#D4AF37] overflow-hidden border border-[#D4AF37]/20 shadow-inner">
           {profilePic ? (
             <img src={profilePic} alt="" className="w-full h-full object-cover" />
           ) : initials}
        </div>
        <div className="flex-1">
          <div className="bg-[#F9F6F1] rounded-2xl px-3 py-2 inline-block max-w-full border border-[#E5E1DA] shadow-sm">
            <p className={`text-xs font-bold ${isPrivate ? 'text-[#5c4033] italic' : 'text-[#2b1810]'}`}>{displayName}</p>
            <p className="text-sm text-[#2b1810] leading-tight">{comment.text}</p>
          </div>
          <div className="flex items-center space-x-3 mt-1 ml-2">
            <button 
              onClick={() => onLike(comment.id)}
              className={`text-[12px] font-bold hover:underline ${hasLiked ? 'text-[#D4AF37]' : 'text-[#5c4033]'}`}
            >
              Like {comment.likes?.length > 0 && `(${comment.likes.length})`}
            </button>
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="text-[12px] font-bold text-[#5c4033] hover:underline"
            >
              Reply
            </button>
          </div>
          
          {isReplying && (
            <form onSubmit={handleReplySubmit} className="mt-2 flex gap-2">
              <input 
                type="text" 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 bg-white border border-[#D4AF37]/20 rounded-full px-4 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                autoFocus
              />
            </form>
          )}

          {comment.replies && comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} onLike={onLike} depth={depth + 1} currentUserId={currentUserId} allUsers={allUsers} />
          ))}
        </div>
      </div>
    </div>
  );
};

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  entry, isAdmin, isBookmarked, currentUser, allUsers, onEdit, onDelete, onBookmarkToggle, onLike, onDislike, onComment, onCommentLike, onZoom
}) => {
  const [showSource, setShowSource] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  // Find the author of the post
  const author = allUsers.find(u => u.id === entry.authorId);
  const authorDisplayName = author?.displayName || author?.username || "Scholar";
  const authorPic = author?.profilePic;

  const hasLiked = entry.likes?.includes(currentUser.id);
  const hasDisliked = entry.dislikes?.includes(currentUser.id);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(entry.id, commentText);
    setCommentText('');
    setShowComments(true);
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

  const userDisplayName = currentUser.displayName || currentUser.username;
  const userInitials = getInitials(userDisplayName);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E1DA] mb-4 flex flex-col overflow-hidden max-w-[500px] mx-auto transition-all hover:shadow-md">
      {/* Post Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* CONTENT POSTER PROFILE PIC REPLACEMENT */}
          <div className="w-10 h-10 rounded-full bg-[#2b1810] flex items-center justify-center text-[#D4AF37] font-black text-sm border border-[#D4AF37]/30 shadow-sm overflow-hidden">
            {authorPic ? (
              <img src={authorPic} alt={authorDisplayName} className="w-full h-full object-cover" />
            ) : (
              getInitials(authorDisplayName)
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-[15px] font-bold text-[#2b1810] hover:underline cursor-pointer font-serif">{entry.category}</p>
              {entry.subCategory && (
                <span className="px-1.5 py-0.5 bg-[#F4E4BC] text-[#2b1810] text-[10px] font-bold rounded uppercase tracking-tighter">
                  {entry.subCategory}
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#5c4033] flex items-center space-x-1">
              <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="font-bold text-[#D4AF37]">{entry.topic}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {isAdmin && (
            <>
              <button onClick={() => onEdit(entry)} className="p-2 rounded-full hover:bg-[#F4E4BC] text-[#2b1810]/60 hover:text-[#2b1810] transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
              <button onClick={() => onDelete(entry.id)} className="p-2 rounded-full hover:bg-red-50 text-red-200 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </>
          )}
          <button onClick={() => onBookmarkToggle(entry.id)} className={`p-2 rounded-full hover:bg-[#F9F6F1] transition-colors ${isBookmarked ? 'text-[#D4AF37]' : 'text-[#2b1810]/30'}`}>
            <svg className="w-5 h-5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </button>
        </div>
      </div>

      <div className="px-4 py-1">
        <h3 className="text-[17px] font-bold text-[#2b1810] mb-2">{entry.question}</h3>
        
        {/* Media Rendering Section */}
        {entry.mediaUrl && (
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-100 bg-black bg-opacity-5 relative group min-h-[100px] flex items-center justify-center">
            {isMediaLoading && entry.mediaType !== 'document' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {entry.mediaType === 'image' && (
              <img 
                src={entry.mediaUrl} 
                onLoad={() => setIsMediaLoading(false)}
                className={`w-full max-h-[400px] object-cover cursor-pointer hover:brightness-95 transition-opacity duration-300 ${isMediaLoading ? 'opacity-0' : 'opacity-100'}`} 
                onClick={() => onZoom(entry)}
                alt="Post Media"
              />
            )}
            {entry.mediaType === 'video' && (
              <video 
                src={entry.mediaUrl} 
                controls 
                onLoadedData={() => setIsMediaLoading(false)}
                className={`w-full max-h-[400px] bg-black cursor-pointer transition-opacity duration-300 ${isMediaLoading ? 'opacity-0' : 'opacity-100'}`} 
                onClick={(e) => {
                  if ((e.target as any).tagName !== 'VIDEO_CONTROLS') {
                    onZoom(entry);
                  }
                }}
              />
            )}
            {entry.mediaType === 'document' && (
              <div className="p-4 bg-gray-50 flex flex-col items-center w-full">
                <div className="flex items-center space-x-3 mb-3 w-full">
                  <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-[#2b1810] truncate">{entry.mediaName || 'Document Attachment'}</p>
                    <p className="text-xs text-[#5c4033]">Document File</p>
                  </div>
                </div>
                <div className="flex w-full space-x-2">
                  <button 
                    onClick={() => setShowDocPreview(!showDocPreview)}
                    className="flex-1 py-2 bg-white border border-[#E5E1DA] rounded text-xs font-bold text-[#2b1810] hover:bg-gray-100"
                  >
                    {showDocPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button 
                    onClick={() => onZoom(entry)}
                    className="flex-1 py-2 bg-[#2b1810] text-[#D4AF37] rounded text-xs font-bold hover:brightness-125"
                  >
                    Zoom/Open
                  </button>
                </div>
                {showDocPreview && (
                  <div className="w-full mt-3 h-64 bg-white border border-[#E5E1DA] rounded-md overflow-hidden animate-fade-in shadow-inner">
                    <iframe src={entry.mediaUrl} className="w-full h-full border-none" title="Doc Preview" />
                  </div>
                )}
              </div>
            )}
            
            {/* Quick Download Button on Preview (Overlay) */}
            <button 
              onClick={handleDownload}
              className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70 z-10"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          </div>
        )}

        <p className="text-[15px] text-[#2b1810] leading-normal">{entry.answer}</p>
        
        <div className="mt-4 flex items-center space-x-2">
          <button 
            onClick={() => setShowSource(!showSource)}
            className="px-4 py-1.5 rounded bg-[#2b1810] text-[#D4AF37] font-bold text-xs uppercase tracking-wider hover:brightness-125 transition-all shadow-sm"
          >
            {showSource ? 'Hide Source' : 'Source'}
          </button>
        </div>

        {showSource && (
          <div className="mt-2 p-3 bg-[#F4E4BC]/30 border-l-2 border-[#D4AF37] rounded-md text-[13px] text-[#2b1810] italic animate-fade-in">
            <span className="font-bold not-italic text-[#D4AF37]">Reference:</span> {entry.source}
          </div>
        )}
      </div>

      <div className="px-4 py-2 flex items-center justify-between text-[13px] text-[#5c4033] mt-2 border-b border-[#F9F6F1] pb-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded-full bg-[#2b1810] flex items-center justify-center border border-[#D4AF37]/30">
              <svg className="w-2.5 h-2.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24"><path d="M14 10h4.704a1 1 0 01.94 1.347l-2.292 6.084A2 2 0 0115.462 19H8c-1.105 0-2-.895-2-2v-9a2 2 0 01.586-1.414l2.828-2.828A2 2 0 0110.828 3h.672a2 2 0 012 2v5z" /></svg>
            </div>
            <span className="hover:underline cursor-pointer font-bold">{entry.likes?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded-full bg-red-800 flex items-center justify-center border border-red-400">
              <svg className="w-2.5 h-2.5 text-white transform rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M14 10h4.704a1 1 0 01.94 1.347l-2.292 6.084A2 2 0 0115.462 19H8c-1.105 0-2-.895-2-2v-9a2 2 0 01.586-1.414l2.828-2.828A2 2 0 0110.828 3h.672a2 2 0 012 2v5z" /></svg>
            </div>
            <span className="hover:underline cursor-pointer font-bold">{entry.dislikes?.length || 0}</span>
          </div>
        </div>
        <div className="hover:underline cursor-pointer font-medium" onClick={() => setShowComments(!showComments)}>
          {entry.comments?.length || 0} comments
        </div>
      </div>

      <div className="mx-3 py-1 flex items-center">
        <button 
          onClick={() => onLike(entry.id)}
          className={`flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-[#F9F6F1] transition-colors ${hasLiked ? 'text-[#D4AF37]' : 'text-[#2b1810]/70'}`}
        >
          <svg className="w-5 h-5" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.704a1 1 0 01.94 1.347l-2.292 6.084A2 2 0 0115.462 19H8c-1.105 0-2-.895-2-2v-9a2 2 0 01.586-1.414l2.828-2.828A2 2 0 0110.828 3h.672a2 2 0 012 2v5z" /></svg>
          <span className="text-[14px] font-bold">Like</span>
        </button>
        <button 
          onClick={() => onDislike(entry.id)}
          className={`flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-[#F9F6F1] transition-colors ${hasDisliked ? 'text-red-600' : 'text-[#2b1810]/70'}`}
        >
          <svg className="w-5 h-5 transform rotate-180" fill={hasDisliked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.704a1 1 0 01.94 1.347l-2.292 6.084A2 2 0 0115.462 19H8c-1.105 0-2-.895-2-2v-9a2 2 0 01.586-1.414l2.828-2.828A2 2 0 0110.828 3h.672a2 2 0 012 2v5z" /></svg>
          <span className="text-[14px] font-bold">Dislike</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center space-x-2 py-1.5 rounded-md hover:bg-[#F9F6F1] transition-colors ${showComments ? 'text-[#D4AF37]' : 'text-[#2b1810]/70'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-[14px] font-bold">Comment</span>
        </button>
      </div>

      {showComments && (
        <div className="bg-white px-4 py-2 border-t border-[#F9F6F1]">
          <form onSubmit={handleCommentSubmit} className="flex space-x-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[#2b1810] flex-shrink-0 flex items-center justify-center text-[10px] font-black text-[#D4AF37] shadow-sm overflow-hidden border border-[#D4AF37]/30">
               {currentUser.profilePic ? (
                 <img src={currentUser.profilePic} alt="" className="w-full h-full object-cover" />
               ) : userInitials}
            </div>
            <input 
              type="text" 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-[#F9F6F1] border border-[#E5E1DA] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            />
          </form>
          <div className="max-h-96 overflow-y-auto custom-scrollbar pb-2">
            {entry.comments?.map(comment => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                currentUserId={currentUser.id}
                allUsers={allUsers}
                onReply={(parentId, text) => onComment(entry.id, text, parentId)} 
                onLike={(commentId) => onCommentLike(entry.id, commentId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
