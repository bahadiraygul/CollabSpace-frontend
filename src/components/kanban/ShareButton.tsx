'use client';

import { useState } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useBoardStore } from '@/store/board-store';
import { toast } from 'sonner';

export function ShareButton() {
  const { board, generateShareLink, disableSharing } = useBoardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const shareUrl = board?.shareToken
    ? `${window.location.origin}/board/shared/${board.shareToken}`
    : null;

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      await generateShareLink();
      toast.success('Paylaşım linki oluşturuldu!');
    } catch (error) {
      toast.error('Link oluşturulamadı');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link kopyalandı!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisableSharing = async () => {
    try {
      await disableSharing();
      toast.success('Paylaşım devre dışı bırakıldı');
    } catch (error) {
      toast.error('Paylaşım kapatılamadı');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Paylaş
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Board'u Paylaş</DialogTitle>
          <DialogDescription>
            Bu board'a erişebilmesi için link oluşturun
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {shareUrl ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <div className="flex items-center gap-2 rounded-md border bg-muted p-2">
                    <code className="flex-1 text-sm truncate">{shareUrl}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Bu linke sahip herkes board'u görüntüleyebilir
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisableSharing}
                >
                  <X className="h-4 w-4 mr-1" />
                  Paylaşımı Kapat
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Henüz bir paylaşım linki oluşturulmadı. Link oluşturduğunuzda,
                bunu alan herkes board'u görüntüleyebilir.
              </p>
              <Button
                onClick={handleGenerateLink}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Oluşturuluyor...' : 'Paylaşım Linki Oluştur'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
