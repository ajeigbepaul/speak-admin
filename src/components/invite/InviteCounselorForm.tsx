"use client";

import { useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "react-hot-toast";
import { inviteCounselorAction } from "@/actions/inviteActions";
import { Send } from "lucide-react";

const inviteCounselorSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type InviteCounselorFormValues = z.infer<typeof inviteCounselorSchema>;

export function InviteCounselorForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<InviteCounselorFormValues>({
    resolver: zodResolver(inviteCounselorSchema),
    defaultValues: { email: "" },
  });

  const onSubmit: SubmitHandler<InviteCounselorFormValues> = async (data) => {
    startTransition(async () => {
      const result = await inviteCounselorAction({ email: data.email });

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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="counselor@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormDescription>
          The counselor will receive an invitation link to set their password and complete their profile. Their name and details will be collected during that step.
        </FormDescription>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Sending Invitation..." : (
            <>
              <Send className="mr-2 h-4 w-4" /> Invite Counselor
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
