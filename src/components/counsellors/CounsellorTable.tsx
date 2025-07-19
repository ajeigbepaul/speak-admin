"use client";

import React, { useState, useTransition, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Counsellor } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerificationDialog } from "./VerificationDialog";
import { MoreHorizontal, Search, Filter, UserCheck, Clock, UserX, UserPlus, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams, useRouter } from 'next/navigation';
import { deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";

interface CounsellorTableProps {
  initialCounsellors: Counsellor[];
}

export function CounsellorTable({ initialCounsellors }: CounsellorTableProps) {
  const [counsellors, setCounsellors] = useState<Counsellor[]>(initialCounsellors);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<Counsellor["status"] | "All">("All");
  const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    if (action === 'verify' && id) {
      const counsellorToVerify = counsellors.find(c => c.id === id);
      if (counsellorToVerify) {
        setSelectedCounsellor(counsellorToVerify);
        setIsVerificationDialogOpen(true);
        router.replace('/counsellors', undefined);
      }
    }
  }, [searchParams, counsellors, router]);

  // Filter counsellors based on search and status
  const filteredCounsellors = useMemo(() => {
    return counsellors.filter((counsellor) => {
      const matchesSearch =
        counsellor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        counsellor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (counsellor.specialization || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || counsellor.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [counsellors, searchTerm, filterStatus]);

  const handleOpenVerificationDialog = (counsellor: Counsellor) => {
    setSelectedCounsellor(counsellor);
    setIsVerificationDialogOpen(true);
  };

  const handleStatusUpdate = (counsellorId: string, newStatus: Counsellor["status"]) => {
    setCounsellors(prev => prev.map(c => c.id === counsellorId ? { ...c, status: newStatus } : c));
  };

  const handleDelete = async (counsellorId: string) => {
    if (!window.confirm("Are you sure you want to delete this counsellor? This action cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteDoc(doc(db, "counselors", counsellorId));
        setCounsellors(prev => prev.filter(c => c.id !== counsellorId));
        toast({ title: "Deleted", description: "Counsellor deleted successfully.", variant: "default" });
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete counsellor.", variant: "destructive" });
      }
    });
  };
  
  const getStatusBadgeVariant = (status: Counsellor["status"]) => {
    switch (status) {
      case "Verified": return "default";
      case "Pending": return "secondary";
      case "Rejected": return "destructive";
      case "Invited": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: Counsellor["status"]) => {
    switch (status) {
      case "Verified": return <UserCheck className="mr-2 h-4 w-4 text-green-600" />;
      case "Pending": return <Clock className="mr-2 h-4 w-4 text-yellow-600" />;
      case "Rejected": return <UserX className="mr-2 h-4 w-4 text-red-600" />;
      case "Invited": return <UserPlus className="mr-2 h-4 w-4 text-blue-600" />;
      default: return null;
    }
  }

  // Update counsellors state if initialCounsellors prop changes
  useEffect(() => {
    setCounsellors(initialCounsellors);
  }, [initialCounsellors]);

  if (counsellors.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No counsellors found</h3>
        <p className="text-muted-foreground mb-4">Get started by inviting your first counsellor.</p>
        <Button onClick={() => router.push('/invite?userType=counselor')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Counsellor
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as Counsellor["status"] | "All")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Invited">Invited</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Verified">Verified</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden lg:table-cell">Specialization</TableHead>
              <TableHead className="hidden md:table-cell">Registered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCounsellors.length > 0 ? (
              filteredCounsellors.map((counsellor) => (
                <TableRow key={counsellor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={counsellor.profilePic} alt={counsellor.fullName} data-ai-hint="person avatar" />
                        <AvatarFallback>{counsellor.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{counsellor.fullName}</div>
                        <div className="text-xs text-muted-foreground hidden md:block">{counsellor.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {counsellor.specialization || 'Not specified'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(counsellor.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(counsellor.status)} className="capitalize">
                      {getStatusIcon(counsellor.status)}
                      {counsellor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenVerificationDialog(counsellor)}>
                          View Details / Verify
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(counsellor.id)} 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          disabled={isPending}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="text-muted-foreground">
                    {searchTerm || filterStatus !== "All" 
                      ? "No counsellors match your search criteria." 
                      : "No counsellors found in the system."
                    }
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <VerificationDialog
        counsellor={selectedCounsellor}
        isOpen={isVerificationDialogOpen}
        onOpenChange={setIsVerificationDialogOpen}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
