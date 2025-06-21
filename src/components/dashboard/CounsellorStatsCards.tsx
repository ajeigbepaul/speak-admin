"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, UserPlus, Clock, CheckCircle, XCircle, Users } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";

interface CounsellorStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  invited: number;
  activeThisMonth: number;
}

export function CounsellorStatsCards() {
  const [stats, setStats] = useState<CounsellorStats>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    invited: 0,
    activeThisMonth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const counsellorsCol = collection(db, 'counselors');
    
    const unsubscribe = onSnapshot(counsellorsCol, (snapshot) => {
      const allCounsellors = snapshot.docs.map(doc => {
        const data = doc.data();
        let status: string = 'Pending';
        
        // Check status field first
        if (data.status && ["Pending", "Verified", "Rejected", "Invited"].includes(data.status)) {
          status = data.status;
        } else if (typeof data.isVerified === 'boolean') {
          // Fallback to isVerified field
          status = data.isVerified ? 'Verified' : 'Pending';
        }
        
        return { id: doc.id, status, data };
      });

      // Calculate stats
      const total = allCounsellors.length;
      const pending = allCounsellors.filter(c => c.status === 'Pending').length;
      const verified = allCounsellors.filter(c => c.status === 'Verified').length;
      const rejected = allCounsellors.filter(c => c.status === 'Rejected').length;
      const invited = allCounsellors.filter(c => c.status === 'Invited').length;

      // Calculate active this month
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const activeThisMonth = allCounsellors.filter(c => {
        const updatedAt = c.data.updatedAt;
        if (!updatedAt) return false;
        
        let updateDate: Date;
        if (updatedAt instanceof Timestamp) {
          updateDate = updatedAt.toDate();
        } else if (typeof updatedAt === 'string') {
          updateDate = new Date(updatedAt);
        } else {
          return false;
        }
        
        return updateDate >= oneMonthAgo && ['Pending', 'Verified'].includes(c.status);
      }).length;

      setStats({
        total,
        pending,
        verified,
        rejected,
        invited,
        activeThisMonth
      });
      setLoading(false);
    }, (error) => {
      console.error("Error listening to counsellors:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-muted rounded w-16 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-12"></div>
                </div>
                <div className="h-8 w-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold">{stats.verified}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Invited</p>
              <p className="text-2xl font-bold">{stats.invited}</p>
            </div>
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active This Month</p>
              <p className="text-2xl font-bold">{stats.activeThisMonth}</p>
            </div>
            <UserCheck className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 