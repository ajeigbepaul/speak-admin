
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, UserPlus, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setSuperAdminRole } from '@/actions/userActions';

interface SubmitButtonProps {
  pending: boolean;
}

function SubmitButton({ pending }: SubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing Up..." : "Sign Up"}
      {!pending && <UserPlus className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const superAdminEmail = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;

  if (!superAdminEmail) {
    return (
       <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle>Configuration Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Setup Incomplete</AlertTitle>
            <AlertDescription>
              The superadmin email is not configured. Please contact system support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      toast({
        title: "Signup Restricted",
        description: "This signup form is for the initial superadmin only. Please contact the admin for an invite.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        // Call server action to set role in Firestore
        const roleResult = await setSuperAdminRole(firebaseUser.uid, firebaseUser.email || email);
        if (roleResult.success) {
          toast({
            title: "Signup Successful",
            description: "Superadmin account created and configured.",
            variant: "default",
          });
          router.push('/dashboard'); // Redirect directly to dashboard
        } else {
          // Role setting failed. This is a critical issue.
          // Ideally, you might want to delete the Firebase Auth user here or provide manual cleanup instructions.
          setError(roleResult.message || "Failed to set superadmin role in database. Please contact support.");
          toast({
            title: "Configuration Error",
            description: roleResult.message || "Failed to set superadmin role. Please contact support.",
            variant: "destructive",
          });
          // Consider signing out the partially created user: await auth.signOut();
        }
      }
    } catch (err: any) {
      let friendlyMessage = "An unexpected error occurred. Please try again.";
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            friendlyMessage = "This email address is already in use.";
            break;
          case 'auth/weak-password':
            friendlyMessage = "The password is too weak. Please choose a stronger password.";
            break;
          case 'auth/invalid-email':
            friendlyMessage = "The email address is not valid.";
            break;
          default:
            friendlyMessage = `Signup failed: ${err.message}`;
        }
      }
      setError(friendlyMessage);
      console.error("Signup failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto p-2 bg-primary/10 rounded-full w-fit mb-4">
          <UserPlus className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Create Superadmin Account</CardTitle>
        <CardDescription>This form is for initial superadmin setup only.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="superadmin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
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
              <AlertTitle>Signup Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton pending={isLoading} />
           <Button variant="link" size="sm" onClick={() => router.push('/login')} className="w-full">
            Already have an account? Sign In
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
