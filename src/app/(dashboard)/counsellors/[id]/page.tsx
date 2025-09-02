"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { VerificationDialog } from "@/components/counsellors/VerificationDialog";
// import { toast } from '@/components/ui/use-toast';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  BarChart,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface CounselorDetails {
  id: string;
  personalInfo: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    profilePic?: string;
  };
  professionalInfo?: {
    occupation?: string;
    experience?: string;
    education?: string;
    specialization?: string;
    bio?: string;
  };
  createdAt: string;
  updatedAt?: string;
  isVerified: boolean;
  status: string;
}

export default function CounselorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [counselor, setCounselor] = useState<CounselorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCounselorDetails();
  }, [params.id]);

  const fetchCounselorDetails = async () => {
    try {
      setIsLoading(true);
      const counselorRef = doc(db, "counselors", params.id);
      const counselorDoc = await getDoc(counselorRef);

      if (counselorDoc.exists()) {
        const data = counselorDoc.data();

        setCounselor({
          id: counselorDoc.id,
          personalInfo: {
            fullName: data.personalInfo?.fullName || "Unknown",
            email: data.personalInfo?.email || "No email",
            phoneNumber: data.personalInfo?.phoneNumber,
            profilePic: data.personalInfo?.profilePic,
          },
          professionalInfo: {
            occupation: data.professionalInfo?.occupation,
            experience: data.professionalInfo?.experience,
            education: data.professionalInfo?.education,
            specialization: data.professionalInfo?.specialization,
            bio: data.professionalInfo?.bio,
          },
          createdAt: data.createdAt
            ? format(data.createdAt.toDate(), "PPP")
            : "Unknown",
          updatedAt: data.updatedAt
            ? format(data.updatedAt.toDate(), "PPP")
            : undefined,
          isVerified: data.isVerified || false,
          status: data.status || "Pending",
        });
      } else {
        toast({
          title: "Error",
          description: "Counselor not found",
          variant: "destructive",
        });
        router.push("/counsellors");
      }
    } catch (error) {
      console.error("Error fetching counselor details:", error);
      toast({
        title: "Error",
        description: "Failed to load counselor details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/counsellors")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Counselors
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Counselor Details</h1>
        <p className="text-muted-foreground">
          View and manage counselor information.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : counselor ? (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={counselor.personalInfo.profilePic} />
                    <AvatarFallback>
                      {counselor.personalInfo.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {counselor.personalInfo.fullName}
                    </h2>
                    <p className="text-muted-foreground">
                      {counselor.professionalInfo?.occupation || "Counselor"}
                    </p>
                    <div className="flex items-center mt-2 space-x-2">
                      <Badge
                        variant={
                          counselor.status === "Verified"
                            ? "secondary"
                            : counselor.status === "Rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {counselor.status}
                      </Badge>
                      {counselor.professionalInfo?.specialization && (
                        <Badge variant="outline">
                          {counselor.professionalInfo.specialization}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 md:items-end">
                  <div className="flex space-x-2">
                    {counselor.status === "Pending" && (
                      <Button onClick={() => setIsVerificationDialogOpen(true)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify Counselor
                      </Button>
                    )}
                    <Link
                      href={`/counsellors/${params.id}/performance`}
                      passHref
                    >
                      <Button variant="outline">
                        <BarChart className="mr-2 h-4 w-4" />
                        View Performance
                      </Button>
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Joined: {counselor.createdAt}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="professional">Professional Info</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Basic details about the counselor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Full Name</p>
                        <p>{counselor.personalInfo.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p>{counselor.personalInfo.email}</p>
                      </div>
                    </div>
                    {counselor.personalInfo.phoneNumber && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p>{counselor.personalInfo.phoneNumber}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Joined</p>
                        <p>{counselor.createdAt}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="professional" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>
                    Professional details and qualifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {counselor.professionalInfo?.occupation && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Occupation</p>
                          <p>{counselor.professionalInfo.occupation}</p>
                        </div>
                      </div>
                    )}
                    {counselor.professionalInfo?.experience && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Experience</p>
                          <p>{counselor.professionalInfo.experience}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {counselor.professionalInfo?.education && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-1">Education</p>
                        <p className="text-sm">
                          {counselor.professionalInfo.education}
                        </p>
                      </div>
                    </>
                  )}

                  {counselor.professionalInfo?.bio && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-1">Bio</p>
                        <p className="text-sm whitespace-pre-wrap">
                          {counselor.professionalInfo.bio}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <VerificationDialog
            counsellor={{
              id: counselor.id,
              personalInfo: counselor.personalInfo,
              professionalInfo: counselor.professionalInfo,
              createdAt: counselor.createdAt,
              updatedAt: counselor.updatedAt,
              isVerified: counselor.isVerified,
              status: counselor.status as any,
              fullName: counselor.personalInfo.fullName,
              email: counselor.personalInfo.email,
              phoneNumber: counselor.personalInfo.phoneNumber,
              profilePic: counselor.personalInfo.profilePic,
              specialization: counselor.professionalInfo?.specialization,
            }}
            isOpen={isVerificationDialogOpen}
            onOpenChange={setIsVerificationDialogOpen}
            onStatusUpdate={(id, newStatus) => {
              setCounselor((prev) =>
                prev
                  ? {
                      ...prev,
                      status: newStatus,
                      isVerified: newStatus === "Verified",
                    }
                  : prev
              );
              fetchCounselorDetails();
            }}
          />
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Counselor not found</p>
            <Button
              variant="outline"
              onClick={() => router.push("/counsellors")}
              className="mt-4"
            >
              Back to Counselors
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
