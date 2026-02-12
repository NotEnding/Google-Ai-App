
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Photo, ViewMode, CATEGORIES } from './types';
import { GeminiService } from './services/geminiService';
import { Timeline } from './components/Timeline';
import { PhotoCard } from './components/PhotoCard';

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TIMELINE);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gemini = GeminiService.getInstance();

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        await window.aistudio.openSelectKey();
      }
    };
    checkKey();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: Photo[] = [];

    for (const file of Array.from(files) as File[]) {
      const reader = new FileReader();
      const photoData = await new Promise<{base64: string, url: string}>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          const url = reader.result as string;
          resolve({ base64, url });
        };
        reader.readAsDataURL(file);
      });

      const analysis = await gemini.analyzeImage(photoData.base64, file.type);
      
      const photo: Photo = {
        id: Math.random().toString(36).substr(2, 9),
        url: photoData.url,
        base64: photoData.base64,
        mimeType: file.type,
        name: file.name,
        timestamp: analysis.guessedDate ? new Date(analysis.guessedDate).getTime() : Date.now(),
        category: analysis.category.toLowerCase(),
        description: analysis.title,
        tags: analysis.tags || []
      };
      newPhotos.push(photo);
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnimate = async (id: string) => {
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }

    setPhotos(prev => prev.map(p => p.id === id ? { ...p, isAnimating: true } : p));
    
    try {
      const target = photos.find(p => p.id === id);
      if (!target) return;

      const videoUrl = await gemini.animateImage(target.base64, target.mimeType, target.description);
      setPhotos(prev => {
        const updated = prev.map(p => p.id === id ? { ...p, videoUrl, isAnimating: false } : p);
        // If the animated photo is currently selected, update the modal as well
        if (selectedPhoto?.id === id) {
          setSelectedPhoto(updated.find(p => p.id === id) || null);
        }
        return updated;
      });
    } catch (error) {
      console.error("Animation failed", error);
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, isAnimating: false } : p));
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        await window.aistudio?.openSelectKey();
      }
    }
  };

  const filteredPhotos = useMemo(() => {
    return photos.filter(p => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        p.description.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [photos, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 glass px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <i className="fas fa-camera-retro text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight italic">LENSFLOW</h1>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">AI Motion Timeline</p>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4 relative hidden md:block">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xs"></i>
          <input 
            type="text" 
            placeholder="Search scenes, tags, or feelings..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 glass p-1 rounded-full">
          <button 
            onClick={() => setViewMode(ViewMode.TIMELINE)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === ViewMode.TIMELINE ? 'bg-white text-black' : 'hover:bg-white/5'}`}
          >
            <i className="fas fa-stream mr-2"></i>Timeline
          </button>
          <button 
            onClick={() => setViewMode(ViewMode.GALLERY)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${viewMode === ViewMode.GALLERY ? 'bg-white text-black' : 'hover:bg-white/5'}`}
          >
            <i className="fas fa-th-large mr-2"></i>Gallery
          </button>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {isUploading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-plus"></i>}
          {isUploading ? 'Analyzing...' : 'Upload'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileUpload}
        />
      </header>

      <div className="md:hidden px-6 pt-4">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xs"></i>
          <input 
            type="text" 
            placeholder="Search tags..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar py-6 px-6 border-b border-neutral-900">
        <div className="flex gap-3 min-w-max mx-auto max-w-5xl">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.id 
                ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50' 
                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <i className={`fas ${cat.icon}`}></i>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <main className="pb-24">
        {viewMode === ViewMode.TIMELINE ? (
          <Timeline 
            photos={filteredPhotos} 
            onAnimate={handleAnimate} 
            onPhotoClick={setSelectedPhoto}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6 max-w-7xl mx-auto">
            {filteredPhotos.map(photo => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onAnimate={handleAnimate} 
                onClick={setSelectedPhoto}
              />
            ))}
          </div>
        )}
        {filteredPhotos.length === 0 && !isUploading && (
          <div className="py-40 text-center opacity-30">
            <i className="fas fa-search text-4xl mb-4"></i>
            <p className="font-medium">No results found.</p>
          </div>
        )}
      </main>

      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 animate-in fade-in duration-300"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[90vh] glass rounded-2xl overflow-hidden flex flex-col md:flex-row"
            onClick={e => e.stopPropagation()}
          >
            <div className="md:w-2/3 h-[40vh] md:h-auto bg-black flex items-center justify-center overflow-hidden">
              {selectedPhoto.videoUrl ? (
                <video src={selectedPhoto.videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                <img src={selectedPhoto.url} alt={selectedPhoto.name} className="w-full h-full object-contain" />
              )}
            </div>
            <div className="md:w-1/3 p-8 flex flex-col justify-between overflow-y-auto">
              <div className="relative">
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute -top-4 -right-4 p-2 text-neutral-400 hover:text-white"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
                <div className="mb-6">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{selectedPhoto.category}</span>
                  <h2 className="text-2xl font-black mt-2 leading-tight">{selectedPhoto.description}</h2>
                  <p className="text-neutral-500 mt-1">{new Date(selectedPhoto.timestamp).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
                </div>

                <div className="mb-8">
                  <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3">AI Intelligence Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        onClick={() => {
                          setSearchQuery(tag);
                          setSelectedPhoto(null);
                        }}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-neutral-300 cursor-pointer transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <i className="fas fa-file-image w-5 text-center"></i>
                    <span>{selectedPhoto.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <i className="fas fa-magic w-5 text-center"></i>
                    <span>Status: {selectedPhoto.videoUrl ? 'Cinematic Flow Active' : 'Static Image'}</span>
                  </div>
                </div>
              </div>

              {!selectedPhoto.videoUrl && (
                <button 
                  onClick={() => handleAnimate(selectedPhoto.id)}
                  disabled={selectedPhoto.isAnimating}
                  className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-95 disabled:opacity-50"
                >
                  {selectedPhoto.isAnimating ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-wand-magic-sparkles"></i>
                  )}
                  {selectedPhoto.isAnimating ? 'Creating Magic...' : 'Animate Scene'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
