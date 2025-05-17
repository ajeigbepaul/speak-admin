
"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Counsellor } from "@/lib/types";
import { updateCounsellorStatus } from "@/actions/counsellorActions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, ExternalLink } from "lucide-react";

interface VerificationDialogProps {
  counsellor: Counsellor | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStatusUpdate: (counsellorId: string, newStatus: Counsellor["status"]) => void;
}

export function VerificationDialog({ counsellor, isOpen, onOpenChange, onStatusUpdate }: VerificationDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  if (!counsellor) return null;

  const handleVerify = () => {
    startTransition(async () => {
      const result = await updateCounsellorStatus(counsellor.id, "Verified");
      if (result.success) {
        toast({ title: "Success", description: result.message, variant: "default" });
        onStatusUpdate(counsellor.id, "Verified");
        onOpenChange(false);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await updateCounsellorStatus(counsellor.id, "Rejected");
      if (result.success) {
        toast({ title: "Success", description: result.message, variant: "default" });
        onStatusUpdate(counsellor.id, "Rejected");
        onOpenChange(false);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Counsellor Verification</DialogTitle>
          <DialogDescription>Review the counsellor's details and documents before verifying.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-6 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={counsellor.profilePictureUrl} alt={counsellor.name} data-ai-hint="person avatar" />
              <AvatarFallback>{counsellor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{counsellor.name}</h3>
              <p className="text-sm text-muted-foreground">{counsellor.email}</p>
              <Badge variant={counsellor.status === "Verified" ? "default" : counsellor.status === "Pending" ? "secondary" : "destructive"} className="mt-1">
                {counsellor.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input id="specialization" value={counsellor.specialization} readOnly />
            </div>
            <div>
              <Label htmlFor="registrationDate">Registration Date</Label>
              <Input id="registrationDate" value={new Date(counsellor.registrationDate).toLocaleDateString()} readOnly />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Biography</Label>
            <Textarea id="bio" value={counsellor.bio || "Not provided"} readOnly className="min-h-[100px]" />
          </div>

          {counsellor.verificationDocuments && counsellor.verificationDocuments.length > 0 && (
            <div>
              <Label>Verification Documents</Label>
              <ul className="mt-1 space-y-2 rounded-md border p-3">
                {counsellor.verificationDocuments.map((doc, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{doc.name}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        View <ExternalLink className="ml-1.5 h-3 w-3" />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          {counsellor.status !== "Rejected" && (
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isPending || counsellor.status === 'Rejected'}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {isPending ? "Rejecting..." : "Reject"}
            </Button>
          )}
          {counsellor.status !== "Verified" && (
            <Button 
              onClick={handleVerify} 
              disabled={isPending || counsellor.status === 'Verified'}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPending ? "Verifying..." : "Verify"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
