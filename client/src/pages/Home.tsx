import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileTextIcon, FilePlus } from "lucide-react";
import { useModal } from "@/lib/utils/modals";
import UploadZone from "@/components/document/UploadZone";
import { fr } from "@/lib/i18n/french";

export default function Home() {
  const [, navigate] = useLocation();
  const { openModal } = useModal();
  
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
  });

  const handleCreateDocument = () => {
    openModal('import');
  };

  const handleOpenDocument = (id: string) => {
    navigate(`/document/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-primary">{fr.documents.title}</h1>
        <Button 
          onClick={handleCreateDocument}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          {fr.documents.new}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>{fr.common.loading}</p>
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc: any) => (
            <Card key={doc.id} className="bg-secondary hover:bg-secondary/90 cursor-pointer transition-colors" onClick={() => handleOpenDocument(doc.id)}>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <FileTextIcon className="h-10 w-10 text-primary mr-3" />
                  <div>
                    <h3 className="font-medium text-text-primary">{doc.name}</h3>
                    <p className="text-sm text-text-secondary">{doc.updatedAt}</p>
                  </div>
                </div>
                <div className="text-xs text-text-secondary truncate">
                  UID: {doc.uid}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-secondary">
          <CardContent className="p-8">
            <UploadZone onUploadComplete={() => {}} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
