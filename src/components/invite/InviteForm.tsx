
"use client";

import { useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { inviteAdminOrUserAction, inviteCounselorAction } from "@/actions/inviteActions";
import type { UserRole } from "@/lib/types";
import { Send, UserPlus, Briefcase } from "lucide-react";

const inviteUserSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  inviteType: z.enum(["adminOrUser", "counselor"], { required_error: "Please select an invitation type." }),
  role: z.enum(["admin", "user"]).optional(),
}).refine(data => {
  if (data.inviteType === "adminOrUser" && !data.role) {
    return false; // Role is required if inviteType is adminOrUser
  }
  return true;
}, {
  message: "Role selection is required for Admin/User invitations.",
  path: ["role"], // Point error to the role field
});

type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

export function InviteForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      name: "",
      inviteType: undefined, 
      role: undefined,
    },
  });

  const inviteType = form.watch("inviteType");

  const onSubmit: SubmitHandler<InviteUserFormValues> = async (data) => {
    startTransition(async () => {
      let result;
      if (data.inviteType === "adminOrUser") {
        if (!data.role) {
            toast({ title: "Error", description: "Role is required for admin/user invite.", variant: "destructive" });
            return;
        }
        result = await inviteAdminOrUserAction({ email: data.email, name: data.name, role: data.role });
      } else if (data.inviteType === "counselor") {
        result = await inviteCounselorAction({ email: data.email, name: data.name });
      } else {
        toast({ title: "Error", description: "Invalid invitation type.", variant: "destructive" });
        return;
      }

      if (result.success) {
        toast({ title: "Success", description: result.message, variant: "default" });
        form.reset();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inviteType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Invite As</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="adminOrUser" />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center">
                      <UserPlus className="mr-2 h-4 w-4 text-primary" /> Admin / User
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="counselor" />
                    </FormControl>
                    <FormLabel className="font-normal flex items-center">
                      <Briefcase className="mr-2 h-4 w-4 text-accent" /> Counselor
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {inviteType === "adminOrUser" && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Role (for Admin/User)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormDescription>
            {inviteType === "adminOrUser" && "Invited Admins/Users will need to register using the provided email to activate their account."}
            {inviteType === "counselor" && "Invited Counselors will appear in the counselor list with 'Invited' status and will need to complete their profile and registration process (typically via a separate counselor portal/app)."}
        </FormDescription>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Sending Invitation..." : (
            <>
              <Send className="mr-2 h-4 w-4" /> Send Invitation
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

