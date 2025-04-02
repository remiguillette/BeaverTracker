import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import DocumentViewer from "@/components/document/DocumentViewer";
import Sidebar from "@/components/document/Sidebar";
import { fr } from "@/lib/i18n/french";
import { Document } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DocumentView() {
  const { id } = useParams();
  const { toast } = useToast();
  
  const { data: document, isLoading } = useQuery<Document>({
    queryKey: [`/api/documents/${id}`],
  });

  const signDocument = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/documents/${id}/sign`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${id}`] });
      toast({
        title: fr.document.signSuccess,
        description: fr.document.signSuccessDesc,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: fr.common.error,
        description: error.message,
      });
    }
  });

  // Create an audit log entry for document view
  useEffect(() => {
    if (document) {
      apiRequest('POST', '/api/auditlogs', {
        documentId: document.id,
        userId: 1, // In a real app, this would be the current user's ID
        action: 'view',
        details: 'Document viewed'
      });
    }
  }, [document]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-[calc(100vh-64px)]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-medium text-primary mb-2">{fr.document.notFound}</h2>
          <p className="text-text-secondary">{fr.document.notFoundDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <Sidebar document={document} onSignDocument={signDocument.mutate} />
        <DocumentViewer document={document} />
      </div>
    </div>
  );
}
