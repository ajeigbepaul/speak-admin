
"use client";

import { useActionState, useEffect, useState } from 'react'; // Changed useFormState to useActionState and imported from 'react'
import { useFormStatus } from "react-dom";
import { useRouter } from 'next/navigation';
import { loginAction } from '@/actions/authActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, LogIn, Eye, EyeOff } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing In..." : "Sign In"}
      {!pending && <LogIn className="ml-2 h-4 w-4" />}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, { success: false, message: "" }); // Changed useFormState to useActionState
  const router = useRouter();
  const { login } = useAuth(); // Using client-side login to set user context
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.success) {
      // The server action confirmed credentials. Now update client-side auth state.
      // This is a simplified flow. In a real app, server action might return a token.
      const formData = new FormData(document.querySelector('form') as HTMLFormElement);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      login(email, password).then((loggedIn) => {
        if(loggedIn) router.push('/'); // Redirect to dashboard, which will be handled by src/app/page.tsx
      });
    }
  }, [state, router, login]);

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
        <CardTitle className="text-2xl font-bold">Speak Admin Center</CardTitle>
        <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
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
          {state.message && !state.success && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
