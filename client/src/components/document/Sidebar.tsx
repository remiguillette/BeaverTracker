import { Clock, CheckCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document } from '@shared/schema';
import { fr } from '@/lib/i18n/french';
import { useModal } from '@/lib/utils/modals';
import { formatDateToFrench } from '@/lib/utils/document';

type SidebarProps = {
  document: Document;
  onSignDocument: () => void;
};

export default function Sidebar({ document, onSignDocument }: SidebarProps) {
  const { openModal } = useModal();
  
  const handleViewAuditLog = () => {
    openModal('auditLog', { documentId: document.id });
  };

  // Format the dates
  const creationDate = formatDateToFrench(document.createdAt);
  const lastModified = formatDateToFrench(document.updatedAt);

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-secondary rounded-lg shadow-lg p-4">
        <h2 className="text-lg font-medium text-primary mb-4">{fr.sidebar.title}</h2>
        
        <div className="space-y-4">
          {/* Document UID */}
          <div>
            <h3 className="text-sm text-text-secondary mb-1">{fr.sidebar.uid}</h3>
            <div className="bg-surface p-2 rounded text-xs break-all font-mono">
              {document.uid}
            </div>
          </div>
          
          {/* Document Properties */}
          <div>
            <h3 className="text-sm text-text-secondary mb-1">{fr.sidebar.creationDate}</h3>
            <p className="text-text-primary">{creationDate}</p>
          </div>
          
          <div>
            <h3 className="text-sm text-text-secondary mb-1">{fr.sidebar.lastModified}</h3>
            <p className="text-text-primary">{lastModified}</p>
          </div>
          
          <div>
            <h3 className="text-sm text-text-secondary mb-1">{fr.sidebar.size}</h3>
            <p className="text-text-primary">{document.size || fr.sidebar.unknown}</p>
          </div>
          
          <div>
            <h3 className="text-sm text-text-secondary mb-1">{fr.sidebar.createdBy}</h3>
            <div className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-white text-xs mr-2">
                JD
              </div>
              <p className="text-text-primary">Jean Dupont</p>
            </div>
          </div>
          
          {/* Signature Status */}
          <div>
            <h3 className="text-sm text-text-secondary mb-1">{fr.sidebar.signatureStatus}</h3>
            <div className="flex items-center">
              {document.isSigned ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success mr-1" />
                  <p className="text-success">{fr.sidebar.signed}</p>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 text-warning mr-1" />
                  <p className="text-warning">{fr.sidebar.notSigned}</p>
                </>
              )}
            </div>
          </div>
          
          {/* Audit Log Button */}
          <Button 
            variant="outline"
            className="w-full mt-2 bg-surface hover:bg-surface/80 text-text-primary py-2 px-4 rounded flex items-center justify-center transition-colors"
            onClick={handleViewAuditLog}
          >
            <History className="mr-2 h-4 w-4" />
            {fr.sidebar.auditLog}
          </Button>
          
          {/* Sign Button (conditionally visible) */}
          {!document.isSigned && (
            <Button 
              className="w-full mt-2 bg-primary text-white hover:bg-primary/90"
              onClick={onSignDocument}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {fr.document.sign}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
