import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, UserPlus, Printer, Save, FilePlus, FolderOpen, FileUp, FileText, CheckCircle, Download } from 'lucide-react';
import { useModal } from '@/lib/utils/modals';
import { fr } from '@/lib/i18n/french';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import beaverLogo from '@/assets/beaver.png';

export default function Header() {
  const { openModal } = useModal();
  const [location] = useLocation();
  
  const isDocumentView = location.startsWith('/document/');

  const handleNewDocument = () => {
    openModal('import');
  };

  const handleOpenDocument = () => {
    // Functionality would be handled in a real application
  };

  const handleSaveDocument = () => {
    // Functionality would be handled in a real application
  };
  
  const handleDownloadDocument = () => {
    const documentId = location.split('/')[2]; // Extraire l'ID du document de l'URL
    if (documentId) {
      window.location.href = `/api/documents/${documentId}/download`;
    }
  };

  const handleImportPDF = () => {
    openModal('import');
  };

  const handleImportGoogleDoc = () => {
    openModal('import');
  };

  const handleShareDocument = () => {
    openModal('share');
  };

  const handlePrintDocument = () => {
    window.print();
  };
  
  const { toast } = useToast();
  
  const signDocument = useMutation({
    mutationFn: async () => {
      const documentId = location.split('/')[2];
      if (!documentId) throw new Error("ID de document manquant");
      return apiRequest('POST', `/api/documents/${documentId}/sign`, {});
    },
    onSuccess: () => {
      const documentId = location.split('/')[2];
      if (documentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}`] });
        toast({
          title: fr.document.signSuccess,
          description: fr.document.signSuccessDesc,
        });
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

  return (
    <header className="bg-secondary shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
                <img 
                  src={beaverLogo}
                  alt="Beaver Logo" 
                  className="h-14 w-14 mr-4 object-contain"
                />
                <h1 className="text-primary text-2xl font-bold">BeaverDoc</h1>
            </Link>
          </div>
          
          {/* Main Navigation */}
          <nav className="flex items-center space-x-6">
            {/* File Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center text-text-primary hover:text-primary transition-colors text-lg px-4 py-2">
                  {fr.nav.file}
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-secondary border-gray-700 text-text-primary">
                <DropdownMenuItem onClick={handleNewDocument} className="hover:bg-surface hover:text-primary">
                  <FilePlus className="mr-2 h-4 w-4" />
                  {fr.nav.new}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenDocument} className="hover:bg-surface hover:text-primary">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {fr.nav.open}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveDocument} className="hover:bg-surface hover:text-primary">
                  <Save className="mr-2 h-4 w-4" />
                  {fr.nav.save}
                </DropdownMenuItem>
                <DropdownMenuItem className="border-t border-gray-700" />
                <DropdownMenuItem onClick={handleImportPDF} className="hover:bg-surface hover:text-primary">
                  <FileUp className="mr-2 h-4 w-4" />
                  {fr.nav.importPDF}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportGoogleDoc} className="hover:bg-surface hover:text-primary">
                  <FileText className="mr-2 h-4 w-4" />
                  {fr.nav.importGoogleDoc}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Share Button - Only show when viewing a document */}
            {isDocumentView && (
              <Button 
                variant="ghost" 
                className="flex items-center text-text-primary hover:text-primary transition-colors text-lg px-4 py-2"
                onClick={handleShareDocument}
              >
                <UserPlus className="mr-2 h-5 w-5" />
                {fr.nav.share}
              </Button>
            )}
            
            {/* Print Button - Only show when viewing a document */}
            {isDocumentView && (
              <Button 
                variant="ghost" 
                className="flex items-center text-text-primary hover:text-primary transition-colors text-lg px-4 py-2"
                onClick={handlePrintDocument}
              >
                <Printer className="mr-2 h-5 w-5" />
                {fr.nav.print}
              </Button>
            )}
            
            {/* Save Button - Only show when viewing a document */}
            {isDocumentView && (
              <Button 
                variant="ghost" 
                className="flex items-center text-text-primary hover:text-primary transition-colors text-lg px-4 py-2"
                onClick={handleSaveDocument}
              >
                <Save className="mr-2 h-5 w-5" />
                {fr.nav.save}
              </Button>
            )}
            
            {/* Download Button - Only show when viewing a document */}
            {isDocumentView && (
              <Button 
                variant="ghost" 
                className="flex items-center text-text-primary hover:text-primary transition-colors text-lg px-4 py-2"
                onClick={handleDownloadDocument}
              >
                <Download className="mr-2 h-5 w-5" />
                {fr.nav.download}
              </Button>
            )}
          </nav>
          
          {/* User Section */}
          <div className="flex items-center">
            {isDocumentView && (
              <Button 
                className="bg-primary text-white mr-5 hover:bg-primary/90 text-lg px-5 py-2 h-auto"
                onClick={() => signDocument.mutate()}
                disabled={signDocument.isPending}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                {signDocument.isPending ? fr.common.signing : fr.document.sign}
              </Button>
            )}
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white text-base font-medium">
                RG
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
