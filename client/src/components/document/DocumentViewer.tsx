import { useState, useEffect, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document } from '@shared/schema';
import { fr } from '@/lib/i18n/french';

type DocumentViewerProps = {
  document: Document;
};

export default function DocumentViewer({ document }: DocumentViewerProps) {
  const [zoom, setZoom] = useState('100');
  const viewerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    const zoomValues = ['50', '75', '100', '125', '150'];
    const currentIndex = zoomValues.indexOf(zoom);
    if (currentIndex < zoomValues.length - 1) {
      setZoom(zoomValues[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const zoomValues = ['50', '75', '100', '125', '150'];
    const currentIndex = zoomValues.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomValues[currentIndex - 1]);
    }
  };

  const handleFullscreen = () => {
    if (viewerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        viewerRef.current.requestFullscreen();
      }
    }
  };

  // This would use PDF.js in a real implementation
  useEffect(() => {
    // Load PDF document
    if (document && document.contentType === 'application/pdf') {
      // In a real app, this would use PDF.js to render the PDF
    }
  }, [document]);

  return (
    <div className="flex-grow">
      <div className="bg-secondary rounded-lg shadow-lg p-4 h-full">
        {/* Document Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-primary">{document.name}</h2>
          
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              className="text-text-secondary hover:text-primary p-2 rounded transition-colors" 
              title={fr.document.zoomOut}
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Select value={zoom} onValueChange={setZoom}>
              <SelectTrigger className="bg-surface text-text-primary w-24">
                <SelectValue placeholder="100%" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="100">100%</SelectItem>
                <SelectItem value="125">125%</SelectItem>
                <SelectItem value="150">150%</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              className="text-text-secondary hover:text-primary p-2 rounded transition-colors" 
              title={fr.document.zoomIn}
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              className="text-text-secondary hover:text-primary p-2 rounded transition-colors" 
              title={fr.document.fullscreen}
              onClick={handleFullscreen}
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Document Content Area */}
        <div 
          ref={viewerRef}
          className="document-viewer h-[calc(100vh-240px)] overflow-auto bg-surface rounded p-6"
          style={{ transform: `scale(${parseInt(zoom) / 100})`, transformOrigin: 'top center' }}
        >
          <div className="document-page w-full max-w-[600px] h-[842px] bg-white relative mx-auto">
            {/* This would be replaced with actual document content from PDF.js */}
            <div className="text-black p-8">
              {document.content ? (
                <div dangerouslySetInnerHTML={{ __html: document.content }} />
              ) : (
                <div className="text-center text-gray-400 h-full flex flex-col justify-center">
                  <p>{fr.document.noContent}</p>
                </div>
              )}
            </div>
            
            {/* Token Watermark - Bottom of the document page */}
            <div className="absolute bottom-2 left-0 w-full text-center text-gray-400 text-opacity-50 text-xs">
              TOKEN: {document.token}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
