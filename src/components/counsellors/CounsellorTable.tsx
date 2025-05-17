
"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import type { Counsellor } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerificationDialog } from "./VerificationDialog";
import { MoreHorizontal, Search, UserCheck, UserX, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams, useRouter } from 'next/navigation';

interface CounsellorTableProps {
  initialCounsellors: Counsellor[];
}

export function CounsellorTable({ initialCounsellors }: CounsellorTableProps) {
  const [counsellors, setCounsellors] = useState<Counsellor[]>(initialCounsellors);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<Counsellor["status"] | "All">("All");
  const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  
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
        // Clean up URL params
        router.replace('/counsellors', undefined);
      }
    }
  }, [searchParams, counsellors, router]);


  const filteredCounsellors = useMemo(() => {
    return counsellors.filter((counsellor) => {
      const matchesSearch =
        counsellor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        counsellor.email.toLowerCase().includes(searchTerm.toLowerCase());
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
  
  const getStatusBadgeVariant = (status: Counsellor["status"]) => {
    switch (status) {
      case "Verified": return "default";
      case "Pending": return "secondary";
      case "Rejected": return "destructive";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: Counsellor["status"]) => {
    switch (status) {
      case "Verified": return <UserCheck className="mr-2 h-4 w-4 text-green-600" />;
      case "Pending": return <Clock className="mr-2 h-4 w-4 text-yellow-600" />;
      case "Rejected": return <UserX className="mr-2 h-4 w-4 text-red-600" />;
      default: return null;
    }
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
        <div className="relative w-full sm:w-auto sm:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        <div className="flex gap-2">
          {(["All", "Pending", "Verified", "Rejected"] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
              size="sm"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Specialization</TableHead>
              <TableHead className="hidden lg:table-cell">Registered</TableHead>
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
                        <AvatarImage src={counsellor.profilePictureUrl} alt={counsellor.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{counsellor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{counsellor.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">{counsellor.specialization}</div>
                        <div className="text-xs text-muted-foreground hidden md:block">{counsellor.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{counsellor.specialization}</TableCell>
                  <TableCell className="hidden lg:table-cell">{new Date(counsellor.registrationDate).toLocaleDateString()}</TableCell>
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
                        {/* Add other actions like 'Edit Profile', 'Deactivate Account' */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No counsellors found.
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
