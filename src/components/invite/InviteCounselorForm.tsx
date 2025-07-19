
// "use client";

// import { useTransition } from "react";
// import { useForm, type SubmitHandler } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { useToast } from "@/hooks/use-toast";
// import { inviteAdminOrUserAction, inviteCounselorAction } from "@/actions/inviteActions";
// import type { UserRole } from "@/lib/types";
// import { Send, UserPlus, Briefcase } from "lucide-react";

// const inviteUserSchema = z.object({
//   email: z.string().email({ message: "Please enter a valid email address." }),
//   name: z.string().min(2, { message: "Name must be at least 2 characters." }),
//   inviteType: z.enum(["adminOrUser", "counselor"], { required_error: "Please select an invitation type." }),
//   role: z.enum(["admin", "user"]).optional(),
// }).refine(data => {
//   if (data.inviteType === "adminOrUser" && !data.role) {
//     return false; // Role is required if inviteType is adminOrUser
//   }
//   return true;
// }, {
//   message: "Role selection is required for Admin/User invitations.",
//   path: ["role"], // Point error to the role field
// });

// type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

// export function InviteCouselorForm() {
//   const [isPending, startTransition] = useTransition();
//   const { toast } = useToast();

//   const form = useForm<InviteUserFormValues>({
//     resolver: zodResolver(inviteUserSchema),
//     defaultValues: {
//       email: "",
//       name: "",
//       inviteType: 'counselor', 
//       role: undefined,
//     },
//   });

//   const inviteType = form.watch("inviteType");

//   const onSubmit: SubmitHandler<InviteUserFormValues> = async (data) => {
//     startTransition(async () => {
//       let result;
//       if (data.inviteType === "adminOrUser") {
//         if (!data.role) {
//             toast({ title: "Error", description: "Role is required for admin/user invite.", variant: "destructive" });
//             return;
//         }
//         result = await inviteAdminOrUserAction({ email: data.email, name: data.name, role: data.role });
//       } else if (data.inviteType === "counselor") {
//         result = await inviteCounselorAction({ email: data.email, name: data.name });
//       } else {
//         toast({ title: "Error", description: "Invalid invitation type.", variant: "destructive" });
//         return;
//       }

//       if (result.success) {
//         toast({ title: "Success", description: result.message, variant: "default" });
//         form.reset();
//       } else {
//         toast({ title: "Error", description: result.message, variant: "destructive" });
//       }
//     });
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//         <FormField
//           control={form.control}
//           name="name"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Full Name</FormLabel>
//               <FormControl>
//                 <Input placeholder="Enter full name" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <FormField
//           control={form.control}
//           name="email"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Email Address</FormLabel>
//               <FormControl>
//                 <Input type="email" placeholder="Enter email address" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <FormDescription>
//             {inviteType === "adminOrUser" && "Invited Admins/admins will need to register using the provided email to activate their account."}
//             {inviteType === "counselor" && "Invited Counselors will appear in the counselor list with 'Invited' status and will need to complete their profile and registration process (typically via a separate counselor portal/app)."}
//         </FormDescription>

//         <Button type="submit" disabled={isPending} className="w-full">
//           {isPending ? "Sending Invitation..." : (
//             <>
//               <Send className="mr-2 h-4 w-4" /> Invite
//             </>
//           )}
//         </Button>
//       </form>
//     </Form>
//   );
// }


"use client";

import { useTransition } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { inviteCounselorAction } from "@/actions/inviteActions";
import { Send } from "lucide-react";

const inviteCounselorSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

type InviteCounselorFormValues = z.infer<typeof inviteCounselorSchema>;

export function InviteCounselorForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<InviteCounselorFormValues>({
    resolver: zodResolver(inviteCounselorSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  const onSubmit: SubmitHandler<InviteCounselorFormValues> = async (data) => {
    startTransition(async () => {
      const result = await inviteCounselorAction({ email: data.email, name: data.name });

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

        <FormDescription>
          Invited Counselors will appear in the counselor list with 'Invited' status and will need to complete their profile and registration process (typically via a separate counselor portal/app).
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