
import React from 'react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onAnimate: (id: string) => void;
  onClick: (photo: Photo) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onAnimate, onClick }) => {
  return (
    <div 
      className="group relative rounded-xl overflow-hidden glass transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl cursor-pointer aspect-[4/5] sm:aspect-square"
      onClick={() => onClick(photo)}
    >
      {/* Background Layer with Ken Burns Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {photo.videoUrl ? (
          <video 
            src={photo.videoUrl} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={photo.url} 
            alt={photo.name} 
            className="w-full h-full object-cover ken-burns" 
          />
        )}
      </div>

      {/* Tags Preview - Small indicator */}
      <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          {photo.tags.slice(0, 2).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-black/50 backdrop-blur-md rounded text-[9px] font-bold uppercase tracking-tighter border border-white/10">
              {tag}
            </span>
          ))}
          {photo.tags.length > 2 && (
            <span className="px-1 py-0.5 bg-black/50 backdrop-blur-md rounded text-[9px] font-bold border border-white/10">
              +{photo.tags.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-1">
              {photo.category}
            </p>
            <h3 className="text-sm font-bold truncate leading-tight">
              {photo.description || photo.name}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              {new Date(photo.timestamp).toLocaleDateString()}
            </p>
          </div>
          
          <button 
            disabled={photo.isAnimating}
            onClick={(e) => {
              e.stopPropagation();
              onAnimate(photo.id);
            }}
            className={`flex-shrink-0 p-2 rounded-full glass hover:bg-white/20 transition-colors ${photo.isAnimating ? 'animate-pulse' : ''}`}
            title="Animate with AI"
          >
            {photo.isAnimating ? (
              <i className="fas fa-spinner fa-spin text-xs"></i>
            ) : (
              <i className={`fas ${photo.videoUrl ? 'fa-play-circle text-blue-400' : 'fa-wand-magic-sparkles'} text-xs`}></i>
            )}
          </button>
        </div>
      </div>

      {/* Hover Status */}
      {photo.isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
          <div className="text-center">
            <div className="inline-block p-4 rounded-full bg-blue-500/20 mb-2">
              <i className="fas fa-magic text-2xl text-blue-400 animate-bounce"></i>
            </div>
            <p className="text-xs font-medium">Brewing Magic...</p>
          </div>
        </div>
      )}
    </div>
  );
};
