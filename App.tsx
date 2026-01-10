
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { QAEntry, User, Comment, MediaType } from './types';
import { INITIAL_DATA, FB_BLUE, FB_BG } from './constants';
import Navbar from './components/Navbar';
import AdminPanel from './components/AdminPanel';
import QuestionCard from './components/QuestionCard';
import AuthPage from './components/AuthPage';
import AccountSettings from './components/AccountSettings';
import MediaZoomModal from './components/MediaZoomModal';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'feed' | 'account'>('feed');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('app_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('app_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [entries, setEntries] = useState<QAEntry[]>(() => {
    const saved = localStorage.getItem('qa_entries');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    if (!currentUser) return [];
    const saved = localStorage.getItem(`bookmarks_${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'mostLiked'>('newest');
  const [editingEntry, setEditingEntry] = useState<QAEntry | null>(null);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  // Zoom / Lightbox State: stores the ID of the entry being zoomed to remain reactive to state changes
  const [zoomedEntryId, setZoomedEntryId] = useState<string | null>(null);

  // Scroll and Responsive states
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // CRITICAL FIX: Move zoomedEntry useMemo to the top level of hooks.
  // In React, hooks cannot be called conditionally or after a return statement.
  const zoomedEntry = useMemo(() => entries.find(e => e.id === zoomedEntryId), [entries, zoomedEntryId]);

  useEffect(() => {
    localStorage.setItem('qa_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_session', JSON.stringify(currentUser));
      const savedBookmarks = localStorage.getItem(`bookmarks_${currentUser.id}`);
      setBookmarkedIds(savedBookmarks ? JSON.parse(savedBookmarks) : []);
    } else {
      localStorage.removeItem('app_session');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`bookmarks_${currentUser.id}`, JSON.stringify(bookmarkedIds));
    }
  }, [bookmarkedIds, currentUser]);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 50) {
        setScrollDirection('up');
      } else {
        if (currentY > lastScrollY) {
          setScrollDirection('down');
        } else {
          setScrollDirection('up');
        }
      }
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(entries.map(e => e.category)));
    return ['All', ...cats.sort()];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => {
        const matchesSearch = e.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             e.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             e.topic.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
        const matchesBookmark = !showOnlyBookmarked || bookmarkedIds.includes(e.id);
        return matchesSearch && matchesCategory && matchesBookmark;
      })
      .sort((a, b) => {
        if (sortBy === 'mostLiked') {
          const likesA = a.likes?.length || 0;
          const likesB = b.likes?.length || 0;
          if (likesB !== likesA) return likesB - likesA;
          return b.createdAt - a.createdAt;
        }
        return b.createdAt - a.createdAt;
      });
  }, [entries, searchQuery, selectedCategory, showOnlyBookmarked, bookmarkedIds, sortBy]);

  const handleAddEntry = (entry: QAEntry) => {
    setEntries(prev => [{...entry, likes: [], dislikes: [], comments: []}, ...prev]);
  };

  const handleUpdateEntry = (updatedEntry: QAEntry) => {
    setEntries(prev => prev.map(e => e.id === updatedEntry.id ? { ...e, ...updatedEntry } : e));
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this knowledge post?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
      setBookmarkedIds(prev => prev.filter(bid => bid !== id));
      if (editingEntry?.id === id) setEditingEntry(null);
      if (zoomedEntryId === id) setZoomedEntryId(null);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => 
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const handleLike = (id: string) => {
    if (!currentUser) return;
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const likes = e.likes || [];
      const dislikes = e.dislikes || [];
      if (likes.includes(currentUser.id)) {
        return { ...e, likes: likes.filter(uid => uid !== currentUser.id) };
      }
      return { 
        ...e, 
        likes: [...likes, currentUser.id],
        dislikes: dislikes.filter(uid => uid !== currentUser.id)
      };
    }));
  };

  const handleDislike = (id: string) => {
    if (!currentUser) return;
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e;
      const likes = e.likes || [];
      const dislikes = e.dislikes || [];
      if (dislikes.includes(currentUser.id)) {
        return { ...e, dislikes: dislikes.filter(uid => uid !== currentUser.id) };
      }
      return { 
        ...e, 
        dislikes: [...dislikes, currentUser.id],
        likes: likes.filter(uid => uid !== currentUser.id)
      };
    }));
  };

  const handleCommentLike = (qaId: string, commentId: string) => {
    if (!currentUser) return;
    
    const toggleLikeInComments = (comments: Comment[]): Comment[] => {
      return comments.map(c => {
        if (c.id === commentId) {
          const likes = c.likes || [];
          if (likes.includes(currentUser.id)) {
            return { ...c, likes: likes.filter(uid => uid !== currentUser.id) };
          }
          return { ...c, likes: [...likes, currentUser.id] };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: toggleLikeInComments(c.replies) };
        }
        return c;
      });
    };

    setEntries(prev => prev.map(e => {
      if (e.id !== qaId) return e;
      return { ...e, comments: toggleLikeInComments(e.comments) };
    }));
  };

  const handleComment = (qaId: string, text: string, parentId?: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      username: currentUser.displayName || currentUser.username,
      text,
      createdAt: Date.now(),
      replies: [],
      likes: []
    };

    const addCommentToNested = (comments: Comment[], targetId: string): Comment[] => {
      return comments.map(c => {
        if (c.id === targetId) {
          return { ...c, replies: [...(c.replies || []), newComment] };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: addCommentToNested(c.replies, targetId) };
        }
        return c;
      });
    };

    setEntries(prev => prev.map(e => {
      if (e.id !== qaId) return e;
      const comments = e.comments || [];
      if (!parentId) {
        return { ...e, comments: [...comments, newComment] };
      }
      return { ...e, comments: addCommentToNested(comments, parentId) };
    }));
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    const users = JSON.parse(localStorage.getItem('app_users') || '[]');
    const idx = users.findIndex((u: any) => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updatedUser };
      localStorage.setItem('app_users', JSON.stringify(users));
      setAllUsers(users);
    }
  };

  if (!currentUser) {
    return <AuthPage onLogin={(u) => { setCurrentUser(u); setAllUsers(JSON.parse(localStorage.getItem('app_users') || '[]')); }} />;
  }

  const isAdmin = currentUser.role === 'Admin';
  
  // Navigation visibility logic
  const isSecondNavActiveOnMobile = scrollDirection === 'down' && lastScrollY > 50;
  const isFirstNavVisible = isDesktop || !isSecondNavActiveOnMobile;
  const isSecondNavVisible = isDesktop || isSecondNavActiveOnMobile;

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: FB_BG }}>
      <Navbar 
        user={currentUser} 
        onLogout={() => setCurrentUser(null)} 
        onViewAccount={() => setActiveView(activeView === 'feed' ? 'account' : 'feed')}
        activeView={activeView}
        isVisible={isFirstNavVisible}
      />

      {/* Second Nav Bar (Toolbar) */}
      <div 
        className={`fixed left-0 right-0 z-40 bg-white border-b border-[#E5E1DA] transition-all duration-300 ease-in-out transform shadow-sm ${
          isSecondNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
        style={{ top: isDesktop ? '3.5rem' : '0' }}
      >
        <div className="max-w-[500px] mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="relative" ref={categoryMenuRef}>
              <button 
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className={`p-2 rounded-md transition-colors ${isCategoryMenuOpen ? 'bg-[#F4E4BC] text-[#2b1810]' : 'hover:bg-gray-100 text-[#5c4033]'}`}
                title="Categories"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {isCategoryMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSearchQuery('');
                        setIsCategoryMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        selectedCategory === cat ? 'bg-[#F4E4BC] text-[#2b1810] font-bold' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
              className={`p-2 rounded-md transition-colors ${showOnlyBookmarked ? 'bg-[#F4E4BC] text-[#D4AF37]' : 'hover:bg-gray-100 text-[#5c4033]'}`}
              title="Saved Items"
            >
              <svg className="w-5 h-5" fill={showOnlyBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 max-w-[240px] ml-4">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search Feed"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F9F6F1] rounded-full py-1.5 pl-4 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] border border-[#E5E1DA]"
              />
            </div>
          </div>
        </div>
      </div>

      <main 
        className={`max-w-[500px] mx-auto px-4 transition-all duration-300 ${
          isDesktop ? 'pt-32' : 'pt-20'
        }`}
      >
        {activeView === 'account' ? (
          <AccountSettings 
            user={currentUser} 
            onUpdateUser={handleUpdateProfile}
            onBack={() => setActiveView('feed')} 
          />
        ) : (
          <>
            {isAdmin && (
              <AdminPanel 
                onAdd={handleAddEntry} 
                onUpdate={handleUpdateEntry}
                onCancelEdit={() => setEditingEntry(null)}
                existingEntries={entries} 
                editingEntry={editingEntry}
                currentUser={currentUser}
              />
            )}

            {/* Static Inline Toolbar */}
            {(!isDesktop && !isSecondNavActiveOnMobile) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-2 mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div className="relative" ref={categoryMenuRef}>
                    <button 
                      onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                      className={`p-2 rounded-md transition-colors ${isCategoryMenuOpen ? 'bg-[#F4E4BC] text-[#2b1810]' : 'hover:bg-gray-100 text-[#5c4033]'}`}
                      title="Categories"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    
                    {isCategoryMenuOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setSearchQuery('');
                              setIsCategoryMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              selectedCategory === cat ? 'bg-[#F4E4BC] text-[#2b1810] font-bold' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
                    className={`p-2 rounded-md transition-colors ${showOnlyBookmarked ? 'bg-[#F4E4BC] text-[#D4AF37]' : 'hover:bg-gray-100 text-[#5c4033]'}`}
                    title="Saved Items"
                  >
                    <svg className="w-5 h-5" fill={showOnlyBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  <button 
                    onClick={() => setSortBy(sortBy === 'newest' ? 'mostLiked' : 'newest')}
                    className={`p-2 rounded-md transition-colors ${sortBy === 'mostLiked' ? 'bg-[#F4E4BC] text-[#D4AF37]' : 'hover:bg-gray-100 text-[#5c4033]'}`}
                    title="Popularity"
                  >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </button>
                </div>

                <div className="flex-1 max-w-[180px] ml-4">
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Search Feed"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#F9F6F1] rounded-full py-1.5 pl-4 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] border border-[#E5E1DA]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filteredEntries.length > 0 ? (
                filteredEntries.map(entry => (
                  <QuestionCard 
                    key={entry.id} 
                    entry={entry} 
                    isAdmin={isAdmin}
                    currentUser={currentUser}
                    allUsers={allUsers}
                    isBookmarked={bookmarkedIds.includes(entry.id)}
                    onEdit={setEditingEntry}
                    onDelete={handleDeleteEntry}
                    onBookmarkToggle={toggleBookmark}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    onComment={handleComment}
                    onCommentLike={handleCommentLike}
                    onZoom={(e) => setZoomedEntryId(e.id)}
                  />
                ))
              ) : (
                <div className="bg-white rounded-lg p-10 text-center shadow-sm border border-gray-300">
                  <h3 className="text-xl font-bold text-[#2b1810]">No posts available</h3>
                  <p className="text-[#5c4033]">Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Media Zoom Modal */}
      {(zoomedEntry && currentUser) && (
        <MediaZoomModal 
          entry={zoomedEntry}
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setZoomedEntryId(null)} 
          onLike={handleLike}
          onDislike={handleDislike}
          onComment={handleComment}
          onCommentLike={handleCommentLike}
        />
      )}
    </div>
  );
};

export default App;
