import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { useModal } from '@/lib/utils/modals';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { fr } from '@/lib/i18n/french';

export default function ImportDocumentModal() {
  const { isOpen, closeModal, modalType } = useModal();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [options, setOptions] = useState({
    generateNewUid: true,
    addToken: true,
    signAfterImport: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error(fr.upload.noFile);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('options', JSON.stringify(options));
      
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: fr.upload.success,
        description: fr.upload.successDesc,
      });
      closeModal();
      
      // Navigate to the document view
      if (data && data.id) {
        navigate(`/document/${data.id}`);
      }
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
    
    setSelectedFile(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const toggleOption = (option: keyof typeof options) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleImport = () => {
    uploadMutation.mutate();
  };

  return (
    <Dialog open={isOpen && modalType === 'import'} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-lg bg-surface text-text-primary border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-primary">{fr.import.title}</DialogTitle>
        </DialogHeader>
        
        <div className="p-2">
          <div 
            className={`upload-zone p-8 mb-6 ${
              isDragging ? 'border-primary bg-primary/5' : 'border-accent'
            } ${selectedFile ? 'border-success' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="text-center">
                <div className="bg-success/20 text-success inline-flex items-center px-3 py-1 rounded-full mb-2">
                  <span className="text-sm">{fr.import.fileSelected}</span>
                </div>
                <p className="text-text-primary mb-2 font-medium">{selectedFile.name}</p>
                <p className="text-text-secondary text-sm mb-3">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button variant="outline" onClick={() => setSelectedFile(null)} className="text-text-primary hover:text-error">
                  {fr.import.change}
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-accent mb-3" />
                <p className="text-text-primary mb-4">{fr.import.dropFiles}</p>
                <p className="text-text-secondary text-sm mb-4">{fr.common.or}</p>
                <Button 
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={handleBrowseClick}
                >
                  {fr.import.browse}
                </Button>
              </>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="text-text-primary font-medium mb-2">{fr.import.options}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="generateNewUid" 
                  checked={options.generateNewUid}
                  onCheckedChange={() => toggleOption('generateNewUid')}
                />
                <Label htmlFor="generateNewUid" className="text-text-primary cursor-pointer">
                  {fr.import.generateNewUid}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="addToken" 
                  checked={options.addToken}
                  onCheckedChange={() => toggleOption('addToken')}
                />
                <Label htmlFor="addToken" className="text-text-primary cursor-pointer">
                  {fr.import.addToken}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="signAfterImport" 
                  checked={options.signAfterImport}
                  onCheckedChange={() => toggleOption('signAfterImport')}
                />
                <Label htmlFor="signAfterImport" className="text-text-primary cursor-pointer">
                  {fr.import.signAfterImport}
                </Label>
              </div>
            </div>
          </div>
          
          <input 
            type="file" 
            accept=".pdf,application/pdf,application/vnd.google-apps.document" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileInputChange}
          />
        </div>
        
        <DialogFooter className="border-t border-gray-700 pt-4">
          <Button 
            variant="outline" 
            onClick={closeModal} 
            className="bg-secondary text-text-primary hover:bg-secondary/80"
          >
            {fr.common.cancel}
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || uploadMutation.isPending} 
            className="bg-primary text-white hover:bg-primary/90"
          >
            {uploadMutation.isPending ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                {fr.upload.importing}
              </span>
            ) : fr.import.import}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
