"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, KeyRound, Eye, EyeOff, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface SubmitButtonProps {
  pending: boolean;
}

function SubmitButton({ pending }: SubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Setting Password..." : "Set New Password"}
      {!pending && <KeyRound className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function SetInitialPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [tempPass, setTempPass] = useState(""); // For display or potential verification if enhanced later
  const [inviteType, setInviteType] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingParams, setLoadingParams] = useState(true);

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    const tempPassFromQuery = searchParams.get('tempPass');
    const typeFromQuery = searchParams.get('type');

    if (emailFromQuery) {
      setEmail(decodeURIComponent(emailFromQuery));
    } else {
      setError("Email not found in invitation link. Please use the link provided in your email.");
      toast({title: "Invalid Link", description: "Email parameter missing from invitation link.", variant: "destructive"});
    }
    if (tempPassFromQuery) {
      setTempPass(decodeURIComponent(tempPassFromQuery));
    }
    if (typeFromQuery) {
        setInviteType(typeFromQuery);
    }
    setLoadingParams(false);
  }, [searchParams, toast]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is missing. Cannot set password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
        setError("Password should be at least 6 characters.");
        return;
    }

    setIsLoading(true);
    try {
      // Create Firebase Auth user with the new password
      // The temporary password sent in the email is not directly used for Firebase Auth user creation here
      // Its presence in the link acts as a form of token.
      await createUserWithEmailAndPassword(auth, email, newPassword);
      
      toast({
        title: "Password Set Successfully!",
        description: "Your account has been created. You can now log in.",
        variant: "default",
      });

      // TODO: Redirect to profile completion for counselors, or login for admins/admins
      if (inviteType === 'counselor') {
        router.push(`/complete-profile?email=${encodeURIComponent(email)}`); // Redirect to profile completion for counselor
      } else {
        router.push('/login');
      }

    } catch (err: any) {
      let friendlyMessage = "An unexpected error occurred. Please try again.";
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            friendlyMessage = "This email address is already associated with an account. You can try logging in.";
            break;
          case 'auth/weak-password':
            friendlyMessage = "The password is too weak. Please choose a stronger password.";
            break;
          case 'auth/invalid-email':
            friendlyMessage = "The email address is not valid.";
            break;
          default:
            friendlyMessage = `Operation failed: ${err.message}`;
        }
      }
      setError(friendlyMessage);
      console.error("Set initial password failed:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loadingParams) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Preparing your invitation link...</div>
        </CardContent>
      </Card>
    );
  }

  if (!email && !isLoading && !loadingParams) { // Show error early if email is missing and not just loading params
    return (
         <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
                <CardTitle>Invalid Invitation Link</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || "This invitation link is invalid or has missing information. Please use the link provided in your email."}</AlertDescription>
                </Alert>
                 <Button onClick={() => router.push('/login')} className="w-full mt-4">
                    Go to Login
                </Button>
            </CardContent>
        </Card>
    )
  }


  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto p-2 bg-primary/10 rounded-full w-fit mb-4">
          <KeyRound className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Set Your Password</CardTitle>
        <CardDescription>Create a new password for your account: {email}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              readOnly
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton pending={isLoading || !email} /> 
           <Button variant="link" size="sm" onClick={() => router.push('/login')} className="w-full">
            Back to Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
