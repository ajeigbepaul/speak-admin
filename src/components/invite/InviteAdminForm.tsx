
"use client";

import { useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "react-hot-toast";
import { inviteAdminOrUserAction } from "@/actions/inviteActions";
import { Send } from "lucide-react";

const inviteUserSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  inviteType: z.enum(["adminOrUser", "counselor"], { required_error: "Please select an invitation type." }),
  role: z.enum(["admin", "user"], { required_error: "Please select a role." }),
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

export function InviteAdminForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      name: "",
      inviteType: 'adminOrUser',
      role: undefined,
    },
  });

  const onSubmit: SubmitHandler<InviteUserFormValues> = async (data) => {
    startTransition(async () => {
      let result;

      if (!data.role) {
        toast.error("Role is required for admin/user invite.");
        return;
      }
      result = await inviteAdminOrUserAction({ email: data.email, name: data.name, role: data.role });

      if (result.success) {
        toast.success(result.message);
        form.reset();
      } else {
        toast.error(result.message);
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
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">Observer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormDescription>
          {"Invited Admins/admins will need to register using the provided email to activate their account."}
        </FormDescription>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Sending Invitation..." : (
            <>
              <Send className="mr-2 h-4 w-4" /> Invite
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}