
"use client";

import { useTransition } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Counsellor } from "@/lib/types";
import { updateCounsellorStatus } from "@/actions/counsellorActions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Phone } from "lucide-react";

interface VerificationDialogProps {
  counsellor: Counsellor | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStatusUpdate: (counsellorId: string, newStatus: Counsellor["status"]) => void;
}

export function VerificationDialog({ counsellor, isOpen, onOpenChange, onStatusUpdate }: VerificationDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
   console.log(counsellor,"Verify-Counsellor")
   console.log(counsellor?.id,"Counsellor")
  if (!counsellor) return null;

  const handleVerify = () => {
    console.log("handleVerify called. Counsellor ID:", counsellor?.id);
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

  const getStatusBadgeVariant = (status: Counsellor["status"]) => {
    switch (status) {
      case "Verified": return "default";
      case "Pending": return "secondary";
      case "Rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle>Counsellor Verification</DialogTitle>
          <DialogDescription>Review the counsellor's details before changing status.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-6 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={counsellor.profilePic} alt={counsellor.fullName} data-ai-hint="person avatar"/>
              <AvatarFallback>{counsellor.fullName?.charAt(0) || 'C'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{counsellor.fullName}</h3>
              <p className="text-sm text-muted-foreground">{counsellor.email}</p>
              {counsellor.phoneNumber && (
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <Phone className="h-3 w-3 mr-1.5" />
                  {counsellor.phoneNumber}
                </p>
              )}
              <Badge variant={getStatusBadgeVariant(counsellor.status)} className="mt-1 capitalize">
                {counsellor.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialization">Occupation/Specialization</Label>
              <Input id="specialization" value={counsellor.specialization || "Not provided"} readOnly />
            </div>
            <div>
              <Label htmlFor="registrationDate">Registration Date</Label>
              <Input id="registrationDate" value={new Date(counsellor.createdAt).toLocaleDateString()} readOnly />
            </div>
          </div>

        </div>

        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          {/* Reject Button: Show if status is Pending or Verified */}
          {(counsellor.status === "Pending" || counsellor.status === "Verified") && (
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {isPending ? "Rejecting..." : "Reject"}
            </Button>
          )}

          {/* Verify Button: Show if status is Pending or Rejected */}
          {(counsellor.status === "Pending" || counsellor.status === "Rejected") && (
            <Button 
              onClick={handleVerify} 
              disabled={isPending}
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
