import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useModal } from '@/lib/utils/modals';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { fr } from '@/lib/i18n/french';

type SharedUser = {
  id: number;
  name: string;
  email: string;
  initials: string;
  permission: string;
};

export default function ShareDocumentModal() {
  const { isOpen, closeModal, modalType, modalData } = useModal();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [message, setMessage] = useState('');
  
  // Query shared users
  const { data: sharedUsers = [], refetch } = useQuery<SharedUser[]>({
    queryKey: modalData?.documentId ? [`/api/documents/${modalData.documentId}/shares`] : null,
    enabled: isOpen && modalType === 'share' && !!modalData?.documentId,
  });

  // Add user mutation
  const addShareMutation = useMutation({
    mutationFn: async () => {
      if (!modalData?.documentId) throw new Error("Document ID is required");
      if (!email) throw new Error(fr.share.noEmail);
      
      return apiRequest('POST', `/api/documents/${modalData.documentId}/shares`, {
        email,
        permission,
        message
      });
    },
    onSuccess: async () => {
      toast({
        title: fr.share.success,
        description: fr.share.successDesc.replace('{email}', email),
      });
      setEmail('');
      refetch();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: fr.common.error,
        description: error.message,
      });
    }
  });

  // Remove user mutation
  const removeShareMutation = useMutation({
    mutationFn: async (userId: number) => {
      if (!modalData?.documentId) throw new Error("Document ID is required");
      
      return apiRequest('DELETE', `/api/documents/${modalData.documentId}/shares/${userId}`, {});
    },
    onSuccess: () => {
      toast({
        title: fr.share.removed,
        description: fr.share.removedDesc,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: fr.common.error,
        description: error.message,
      });
    }
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    addShareMutation.mutate();
  };

  const handleRemoveUser = (userId: number) => {
    removeShareMutation.mutate(userId);
  };

  // Translate permission to French
  const translatePermission = (perm: string): string => {
    const permMap: Record<string, string> = {
      'read': fr.share.readOnly,
      'write': fr.share.readWrite,
      'full': fr.share.fullAccess
    };
    
    return permMap[perm] || perm;
  };

  return (
    <Dialog open={isOpen && modalType === 'share'} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-lg bg-surface text-text-primary border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-primary">{fr.share.title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleAddUser} className="p-2">
          <div className="mb-4">
            <Label htmlFor="email" className="block text-text-primary font-medium mb-2">
              {fr.share.emailAddress}
            </Label>
            <div className="flex">
              <Input 
                id="email"
                type="email" 
                placeholder="email@exemple.com" 
                className="flex-grow rounded-l bg-background border border-gray-600 text-text-primary focus:ring-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                className="bg-primary text-white rounded-r hover:bg-primary/90"
                disabled={addShareMutation.isPending}
              >
                {addShareMutation.isPending ? fr.common.adding : fr.common.add}
              </Button>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-text-primary font-medium mb-2">{fr.share.permissions}</h4>
            <RadioGroup value={permission} onValueChange={setPermission} className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="read" id="permission-read" />
                <Label htmlFor="permission-read" className="text-text-primary cursor-pointer">
                  {fr.share.readOnly}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="write" id="permission-write" />
                <Label htmlFor="permission-write" className="text-text-primary cursor-pointer">
                  {fr.share.readWrite}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="permission-full" />
                <Label htmlFor="permission-full" className="text-text-primary cursor-pointer">
                  {fr.share.fullAccess}
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="message" className="block text-text-primary font-medium mb-2">
              {fr.share.messageOptional}
            </Label>
            <Textarea 
              id="message"
              className="w-full rounded bg-background border border-gray-600 text-text-primary focus:ring-primary" 
              rows={3} 
              placeholder={fr.share.messagePlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <h4 className="text-text-primary font-medium mb-2">{fr.share.usersWithAccess}</h4>
            <div className="bg-background rounded p-3 max-h-40 overflow-y-auto">
              {sharedUsers.length === 0 ? (
                <p className="text-text-secondary text-center py-2">{fr.share.noUsers}</p>
              ) : (
                sharedUsers.map((user) => (
                  <div key={user.id} className="flex justify-between items-center mb-2 last:mb-0">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white text-sm mr-3">
                        <span>{user.initials}</span>
                      </div>
                      <div>
                        <p className="text-text-primary">{user.name}</p>
                        <p className="text-text-secondary text-xs">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-text-secondary text-sm mr-2">
                        {translatePermission(user.permission)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-error hover:text-error/80 p-1 h-auto"
                        onClick={() => handleRemoveUser(user.id)}
                        disabled={removeShareMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </form>
        
        <DialogFooter className="border-t border-gray-700 pt-4">
          <Button 
            variant="outline" 
            onClick={closeModal} 
            className="bg-secondary text-text-primary hover:bg-secondary/80"
          >
            {fr.common.cancel}
          </Button>
          <Button onClick={closeModal} className="bg-primary text-white hover:bg-primary/90">
            {fr.common.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
