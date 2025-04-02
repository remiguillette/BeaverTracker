import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { useModal } from '@/lib/utils/modals';
import { fr } from '@/lib/i18n/french';
import { AuditLog } from '@shared/schema';
import { formatDateToFrench } from '@/lib/utils/document';

export default function AuditLogModal() {
  const { isOpen, closeModal, modalType, modalData } = useModal();
  
  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: modalData?.documentId ? [`/api/documents/${modalData.documentId}/auditlogs`] : null,
    enabled: isOpen && modalType === 'auditLog' && !!modalData?.documentId,
  });

  const handleExport = () => {
    if (!auditLogs) return;
    
    const logText = auditLogs.map(log => {
      const timestamp = formatDateToFrench(log.timestamp);
      return `${timestamp} - ${log.action}: ${log.details}\nUID: ${log.documentId}`;
    }).join('\n\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${modalData?.documentId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Map action names to French translations
  const translateAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      'create': fr.audit.create,
      'view': fr.audit.view,
      'edit': fr.audit.edit,
      'sign': fr.audit.sign,
      'share': fr.audit.share
    };
    
    return actionMap[action] || action;
  };

  return (
    <Dialog open={isOpen && modalType === 'auditLog'} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-3xl bg-surface text-text-primary border-gray-700">
        <DialogHeader className="border-b border-gray-700 pb-2">
          <DialogTitle className="text-xl font-medium text-primary">{fr.audit.title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-end mb-4">
            <Button variant="outline" className="bg-secondary text-text-primary flex items-center" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              {fr.audit.export}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>{fr.common.loading}</p>
            </div>
          ) : auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="bg-secondary p-3 rounded">
                  <div className="flex justify-between mb-2">
                    <span className="text-primary font-medium">{translateAction(log.action)}</span>
                    <span className="text-text-secondary text-sm">{formatDateToFrench(log.timestamp)}</span>
                  </div>
                  <p className="text-text-primary text-sm">{log.details}</p>
                  <div className="mt-2 text-xs text-text-secondary">
                    UID: {log.documentId}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-text-secondary">
              {fr.audit.noLogs}
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t border-gray-700 pt-2">
          <Button onClick={closeModal} className="bg-primary text-white hover:bg-primary/90">
            {fr.common.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
