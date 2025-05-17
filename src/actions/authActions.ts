
"use server";

import { mockAdminUser } from '@/lib/mockData';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Updated credentials for demo
  if (email === mockAdminUser.email && password === "paaje@2025") { 
    // In a real app, you'd set up a session or JWT here.
    // For this scaffold, client-side will handle auth state based on success.
    return { success: true, message: "Login successful" };
  } else {
    return { success: false, message: "Invalid email or password" };
  }
}
