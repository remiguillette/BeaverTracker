import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { fr } from '@/lib/i18n/french';

type UploadZoneProps = {
  onUploadComplete: () => void;
};

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: fr.upload.success,
        description: fr.upload.successDesc,
      });
      onUploadComplete();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: fr.common.error,
        description: error.message,
      });
    }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.google-apps.document'];
    
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      toast({
        variant: "destructive",
        title: fr.upload.invalidType,
        description: fr.upload.invalidTypeDesc,
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`upload-zone h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-all ${
        isDragging ? 'border-primary bg-primary/5' : 'border-accent'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="h-16 w-16 text-accent mb-4" />
      <h3 className="text-lg font-medium text-text-primary mb-2">{fr.upload.title}</h3>
      <p className="text-text-secondary mb-6 max-w-md text-center">{fr.upload.description}</p>
      <Button 
        className="bg-primary text-white hover:bg-primary/90"
        onClick={handleBrowseClick}
        disabled={uploadMutation.isPending}
      >
        {uploadMutation.isPending ? (
          <span className="flex items-center">
            <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            {fr.upload.uploading}
          </span>
        ) : fr.upload.browse}
      </Button>
      <input 
        type="file" 
        accept=".pdf,application/pdf,application/vnd.google-apps.document" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileInputChange}
      />
      <p className="text-text-secondary mt-4 text-sm">{fr.upload.supportedFormats}</p>
    </div>
  );
}
