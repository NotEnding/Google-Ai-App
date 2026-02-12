
import React from 'react';
import { Photo } from '../types';
import { PhotoCard } from './PhotoCard';

interface TimelineProps {
  photos: Photo[];
  onAnimate: (id: string) => void;
  onPhotoClick: (photo: Photo) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ photos, onAnimate, onPhotoClick }) => {
  // Group photos by Month/Year
  const sortedPhotos = [...photos].sort((a, b) => b.timestamp - a.timestamp);
  
  const grouped = sortedPhotos.reduce((acc, photo) => {
    const date = new Date(photo.timestamp);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(photo);
    return acc;
  }, {} as Record<string, Photo[]>);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="relative border-l-2 border-neutral-800 ml-4 sm:ml-8 pl-8 sm:pl-12 space-y-16">
        {/* Fix: Explicitly cast the entries array to avoid 'unknown' type issues with monthPhotos */}
        {(Object.entries(grouped) as [string, Photo[]][]).map(([month, monthPhotos]) => (
          <div key={month} className="relative">
            {/* Timeline Dot */}
            <div className="absolute -left-[41px] sm:-left-[57px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-neutral-950 z-10" />
            
            <h2 className="text-2xl font-bold text-neutral-300 mb-8 sticky top-24 bg-neutral-950/80 backdrop-blur-md py-2 z-20">
              {month}
              <span className="ml-3 text-sm font-normal text-neutral-500">
                {monthPhotos.length} photos
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {monthPhotos.map(photo => (
                <PhotoCard 
                  key={photo.id} 
                  photo={photo} 
                  onAnimate={onAnimate}
                  onClick={onPhotoClick}
                />
              ))}
            </div>
          </div>
        ))}
        
        {photos.length === 0 && (
          <div className="py-20 text-center text-neutral-500">
            <i className="fas fa-images text-4xl mb-4 opacity-20"></i>
            <p>No memories here yet. Start by uploading some photos!</p>
          </div>
        )}
      </div>
    </div>
  );
};
