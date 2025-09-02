"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { format } from "date-fns";
import {
  Clock,
  CheckCircle,
  MessageSquare,
  Star,
  Users,
  Calendar,
} from "lucide-react";

interface CounselorStats {
  totalSessions: number;
  activeSessions: number;
  resolvedSessions: number;
  averageResponseTime: number; // in minutes
  averageSessionDuration: number; // in minutes
  averageRating: number;
  totalUsers: number;
  sessionsPerDay: { date: string; count: number }[];
  ratingsDistribution: { rating: number; count: number }[];
}

interface CounselorDetails {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  specialization?: string;
  joinedAt: string;
  status: string;
}

// Firestore document shapes used in this component
interface SessionDoc {
  status?: "active" | "resolved" | string;
  createdAt: any; // Firestore Timestamp
  firstResponseTime?: any; // Firestore Timestamp
  resolvedAt?: any; // Firestore Timestamp
  userId?: string;
}

interface RatingDoc {
  rating?: number;
  createdAt?: any; // Firestore Timestamp
}

export function CounselorPerformance({ counselorId }: { counselorId: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CounselorStats>({
    totalSessions: 0,
    activeSessions: 0,
    resolvedSessions: 0,
    averageResponseTime: 0,
    averageSessionDuration: 0,
    averageRating: 0,
    totalUsers: 0,
    sessionsPerDay: [],
    ratingsDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 0 },
    ],
  });
  const [counselor, setCounselor] = useState<CounselorDetails | null>(null);
  const [timeRange, setTimeRange] = useState("30d");

  // Chart configurations
  const sessionsChartConfig = {
    sessions: { label: "Sessions", color: "hsl(var(--chart-1))" },
  };

  const ratingsChartConfig = {
    count: { label: "Count", color: "hsl(var(--chart-2))" },
  };

  useEffect(() => {
    if (counselorId) {
      fetchCounselorDetails();
      fetchCounselorStats();
    }
  }, [counselorId, timeRange]);

  const fetchCounselorDetails = async () => {
    try {
      const counselorRef = doc(db, "counselors", counselorId);
      const counselorDoc = await getDoc(counselorRef);

      if (counselorDoc.exists()) {
        const data = counselorDoc.data();

        setCounselor({
          id: counselorDoc.id,
          name: data.personalInfo?.fullName || "Unknown",
          email: data.personalInfo?.email || "No email",
          avatar: data.personalInfo?.profilePic,
          specialization: data.professionalInfo?.occupation || "General",
          joinedAt: data.createdAt
            ? format(data.createdAt.toDate(), "PPP")
            : "Unknown",
          status: data.status || "Pending",
        });
      }
    } catch (error) {
      console.error("Error fetching counselor details:", error);
    }
  };

  const fetchCounselorStats = async () => {
    setIsLoading(true);

    try {
      // Calculate date range based on selected time range
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
        case "all":
          startDate = new Date(2000, 0, 1); // Far in the past to get all
          break;
      }

      // Fetch sessions data
      const sessionsQuery = query(
        collection(db, "posts"),
        where("counselorId", "==", counselorId),
        where("createdAt", ">=", startDate)
      );

      const sessionsSnapshot = await getDocs(sessionsQuery);

      // Fetch ratings data
      const ratingsQuery = query(
        collection(db, "ratings"),
        where("counselorId", "==", counselorId),
        where("createdAt", ">=", startDate)
      );

      const ratingsSnapshot = await getDocs(ratingsQuery);

      // Process sessions data with explicit typing
      const sessions: (SessionDoc & { id: string })[] =
        sessionsSnapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as SessionDoc),
        }));

      // Process ratings data with explicit typing
      const ratings: (RatingDoc & { id: string })[] = ratingsSnapshot.docs.map(
        (d) => ({
          id: d.id,
          ...(d.data() as RatingDoc),
        })
      );

      // Calculate statistics
      const activeSessions = sessions.filter(
        (s) => s.status === "active"
      ).length;
      const resolvedSessions = sessions.filter(
        (s) => s.status === "resolved"
      ).length;

      // Calculate average response time
      const responseTimes = sessions
        .filter((s) => s.firstResponseTime)
        .map((s) => {
          const createdAt = s.createdAt.toDate();
          const respondedAt = s.firstResponseTime.toDate();
          return (respondedAt.getTime() - createdAt.getTime()) / (1000 * 60); // Convert to minutes
        });

      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length
          : 0;

      // Calculate average session duration
      const sessionDurations = sessions
        .filter((s) => s.status === "resolved" && s.resolvedAt)
        .map((s) => {
          const createdAt = s.createdAt.toDate();
          const resolvedAt = s.resolvedAt.toDate();
          return (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60); // Convert to minutes
        });

      const avgSessionDuration =
        sessionDurations.length > 0
          ? sessionDurations.reduce((sum, duration) => sum + duration, 0) /
            sessionDurations.length
          : 0;

      // Calculate average rating
      const ratingValues = ratings.map((r) => r.rating || 0);
      const avgRating =
        ratingValues.length > 0
          ? ratingValues.reduce((sum, rating) => sum + rating, 0) /
            ratingValues.length
          : 0;

      // Count unique users
      const uniqueUsers = new Set(sessions.map((s) => s.userId));

      // Group sessions by day
      const sessionsByDay: Record<string, number> = {};
      sessions.forEach((session) => {
        const date = format(session.createdAt.toDate(), "yyyy-MM-dd");
        sessionsByDay[date] = (sessionsByDay[date] || 0) + 1;
      });

      const sessionsPerDay = Object.entries(sessionsByDay)
        .map(([date, count]) => ({
          date: format(new Date(date), "MMM d"),
          count,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      // Calculate ratings distribution
      const ratingsDistribution = [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        count: ratings.filter((r) => Math.round(r.rating || 0) === rating).length,
      }));

      // Update state with calculated stats
      setStats({
        totalSessions: sessions.length,
        activeSessions,
        resolvedSessions,
        averageResponseTime: Math.round(avgResponseTime),
        averageSessionDuration: Math.round(avgSessionDuration),
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalUsers: uniqueUsers.size,
        sessionsPerDay,
        ratingsDistribution,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching counselor stats:", error);
      setIsLoading(false);
    }
  };

  // Format the sessions per day data for the chart
  const sessionsChartData = stats.sessionsPerDay.map((item) => ({
    date: item.date,
    sessions: item.count,
  }));

  // Format the ratings distribution data for the chart
  const ratingsChartData = stats.ratingsDistribution.map((item) => ({
    rating: `${item.rating} Star${item.rating !== 1 ? "s" : ""}`,
    count: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Counselor Profile Card */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ) : counselor ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={counselor.avatar} />
                  <AvatarFallback>{counselor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{counselor.name}</h2>
                  <p className="text-muted-foreground">{counselor.email}</p>
                  <div className="flex items-center mt-1 space-x-2">
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
                    {counselor.specialization && (
                      <Badge variant="outline">
                        {counselor.specialization}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Joined: {counselor.joinedAt}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 text-amber-500 mr-1" />
                  <span className="font-medium">{stats.averageRating}</span>
                  <span className="text-sm text-muted-foreground ml-1">
                    (
                    {stats.ratingsDistribution.reduce(
                      (sum, r) => sum + r.count,
                      0
                    )}{" "}
                    ratings)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p>No counselor data found</p>
          )}
        </CardContent>
      </Card>

      {/* Time Range Selector */}
      <Tabs
        defaultValue={timeRange}
        onValueChange={setTimeRange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 w-full sm:w-[400px]">
          <TabsTrigger value="7d">7 Days</TabsTrigger>
          <TabsTrigger value="30d">30 Days</TabsTrigger>
          <TabsTrigger value="90d">90 Days</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeSessions} active, {stats.resolvedSessions} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.averageResponseTime < 60
                  ? `${stats.averageResponseTime} min`
                  : `${Math.floor(stats.averageResponseTime / 60)}h ${
                      stats.averageResponseTime % 60
                    }m`}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Average time to first response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-center">
                <div className="text-2xl font-bold mr-2">
                  {stats.averageRating}
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(stats.averageRating)
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            <Progress value={stats.averageRating * 20} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users Helped</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Unique users assisted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sessions Over Time</CardTitle>
            <CardDescription>Number of sessions per day</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : sessionsChartData.length > 0 ? (
              <AnalyticsChart
                data={sessionsChartData}
                chartType="bar"
                config={sessionsChartConfig}
                dataKeys={["sessions"]}
                xAxisDataKey="date"
                className="h-[300px]"
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No session data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of ratings received</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : ratingsChartData.some((item) => item.count > 0) ? (
              <AnalyticsChart
                data={ratingsChartData}
                chartType="bar"
                config={ratingsChartConfig}
                dataKeys={["count"]}
                xAxisDataKey="rating"
                className="h-[300px]"
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No rating data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
