
"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, LogIn, Eye, EyeOff, UserPlus } from "lucide-react"; // Added UserPlus
import { mockAdminUser } from '@/lib/mockData'; 

interface SubmitButtonProps {
  pending: boolean;
}

function SubmitButton({ pending }: SubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing In..." : "Sign In"}
      {!pending && <LogIn className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const { login, user, isLoading: authIsLoading } = useAuth(); // Renamed isLoading to authIsLoading
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Changed from isLoading to isSubmitting
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authIsLoading && user) { // Check authIsLoading from useAuth
      router.replace('/'); 
    }
  }, [user, authIsLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      // Successful login will trigger useEffect above to redirect
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
        setError("Invalid email or password.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Login failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const superAdminEmail = process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL;

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto p-2 bg-primary/10 rounded-full w-fit mb-4">
         <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.99.58 3.832 1.595 5.405L2 22l4.595-1.595A9.905 9.905 0 0 0 12 22z"></path>
            <path d="M8 10h.01"></path>
            <path d="M12 10h.01"></path>
            <path d="M16 10h.01"></path>
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold">Speak Admin Dashboard</CardTitle>
        <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder={'Enter your email'} // Use superAdminEmail as placeholder
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
                placeholder="Enter your password" 
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
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton pending={isSubmitting} />
          {/* {superAdminEmail && ( // Only show signup link if superAdminEmail is configured
            <Button variant="link" size="sm" onClick={() => router.push('/signup')} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Superadmin Account (Initial Setup)
            </Button>
          )} */}
        </CardFooter>
      </form>
    </Card>
  );
}
