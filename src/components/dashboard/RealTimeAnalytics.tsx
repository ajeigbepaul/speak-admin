'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy, limit } from 'firebase/firestore';
import { AnalyticsChart } from './AnalyticsChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlyData, ChatStatusData } from '@/lib/types';

// Chart configurations
const userGrowthConfig = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
  counsellors: { label: "Counsellors", color: "hsl(var(--chart-2))" },
};

const chatStatusConfig = {
  Pending: { label: "Pending", color: "hsl(var(--chart-1))" },
  Active: { label: "Active", color: "hsl(var(--chart-2))" },
  Resolved: { label: "Resolved", color: "hsl(var(--chart-3))" },
};

const timeRanges = ['24h', '7d', '30d', '90d'];

export function RealTimeAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [userGrowthData, setUserGrowthData] = useState<MonthlyData[]>([]);
  const [chatStatusData, setChatStatusData] = useState<ChatStatusData[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    
    // Calculate date range based on selected time range
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
    }
    
    const startTimestamp = Timestamp.fromDate(startDate);
    
    // Fetch user growth data
    const fetchUserGrowth = async () => {
      // Users collection listener
      const usersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', startTimestamp),
        orderBy('createdAt', 'asc')
      );
      
      // Counselors collection listener
      const counselorsQuery = query(
        collection(db, 'counselors'),
        where('createdAt', '>=', startTimestamp),
        orderBy('createdAt', 'asc')
      );
      
      // Active users (users with recent activity)
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('lastActive', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))),
        limit(1000)
      );
      
      // Chat status data
      const pendingChatsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'pending')
      );
      
      const activeChatsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'active')
      );
      
      const resolvedChatsQuery = query(
        collection(db, 'posts'),
        where('status', '==', 'resolved')
      );
      
      // Set up listeners
      const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        processUserData(snapshot.docs, 'users');
      }, (error) => {
        console.error("Error fetching users data:", error);
      });
      
      const unsubscribeCounselors = onSnapshot(counselorsQuery, (snapshot) => {
        processUserData(snapshot.docs, 'counsellors');
      }, (error) => {
        console.error("Error fetching counselors data:", error);
      });
      
      const unsubscribeActiveUsers = onSnapshot(activeUsersQuery, (snapshot) => {
        setActiveUsers(snapshot.size);
      }, (error) => {
        console.error("Error fetching active users:", error);
      });
      
      const unsubscribePendingChats = onSnapshot(pendingChatsQuery, (snapshot) => {
        updateChatStatusData('Pending', snapshot.size);
      }, (error) => {
        console.error("Error fetching pending chats:", error);
      });
      
      const unsubscribeActiveChats = onSnapshot(activeChatsQuery, (snapshot) => {
        updateChatStatusData('Active', snapshot.size);
      }, (error) => {
        console.error("Error fetching active chats:", error);
      });
      
      const unsubscribeResolvedChats = onSnapshot(resolvedChatsQuery, (snapshot) => {
        updateChatStatusData('Resolved', snapshot.size);
      }, (error) => {
        console.error("Error fetching resolved chats:", error);
      });
      
      setIsLoading(false);
      
      // Cleanup listeners on unmount or time range change
      return () => {
        unsubscribeUsers();
        unsubscribeCounselors();
        unsubscribeActiveUsers();
        unsubscribePendingChats();
        unsubscribeActiveChats();
        unsubscribeResolvedChats();
      };
    };
    
    fetchUserGrowth();
  }, [timeRange]);
  
  // Process user data for growth chart
  const processUserData = (docs: any[], userType: 'users' | 'counsellors') => {
    // Group by day, week, or month based on time range
    const groupedData: Record<string, number> = {};
    
    docs.forEach(doc => {
      const data = doc.data();
      if (data.createdAt) {
        const date = data.createdAt.toDate();
        let key = '';
        
        // Format the key based on time range
        if (timeRange === '24h') {
          key = `${date.getHours()}:00`;
        } else if (timeRange === '7d') {
          key = date.toISOString().split('T')[0];
        } else {
          // For 30d and 90d, group by week or month
          const month = date.toLocaleString('default', { month: 'short' });
          const day = date.getDate();
          key = timeRange === '30d' ? `${month} ${day}` : month;
        }
        
        if (!groupedData[key]) {
          groupedData[key] = 0;
        }
        groupedData[key]++;
      }
    });
    
    // Convert to array format for chart
    const chartData = Object.entries(groupedData).map(([key, value]) => ({
      month: key,
      [userType]: value
    }));
    
    // Merge with existing data
    setUserGrowthData(prevData => {
      const newData = [...prevData];
      
      chartData.forEach(item => {
        const existingIndex = newData.findIndex(d => d.month === item.month);
        if (existingIndex >= 0) {
          newData[existingIndex] = { ...newData[existingIndex], ...item };
        } else {
          newData.push({ 
            month: item.month, 
            users: userType === 'users' ? item.users : 0,
            counsellors: userType === 'counsellors' ? item.counsellors : 0
          } as MonthlyData);
        }
      });
      
      // Sort by date/time
      return newData.sort((a, b) => a.month.localeCompare(b.month));
    });
  };
  
  // Update chat status data for pie chart
  const updateChatStatusData = (status: 'Pending' | 'Active' | 'Resolved', count: number) => {
    setChatStatusData(prevData => {
      const newData = [...prevData];
      const existingIndex = newData.findIndex(d => d.name === status);
      
      if (existingIndex >= 0) {
        newData[existingIndex] = { 
          ...newData[existingIndex], 
          value: count,
          fill: status === 'Pending' ? 'var(--color-chart-1)' : 
                status === 'Active' ? 'var(--color-chart-2)' : 
                'var(--color-chart-3)'
        };
      } else {
        newData.push({ 
          name: status, 
          value: count,
          fill: status === 'Pending' ? 'var(--color-chart-1)' : 
                status === 'Active' ? 'var(--color-chart-2)' : 
                'var(--color-chart-3)'
        });
      }
      
      return newData;
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Real-Time Analytics</CardTitle>
        <CardDescription>Live data from your application</CardDescription>
        <Tabs defaultValue={timeRange} onValueChange={setTimeRange} className="w-full">
          <TabsList className="grid grid-cols-4 w-[400px]">
            {timeRanges.map(range => (
              <TabsTrigger key={range} value={range}>
                {range}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <AnalyticsChart
                title="User & Counsellor Growth"
                description={`Registration trends (last ${timeRange})`}
                data={userGrowthData}
                chartType="line"
                config={userGrowthConfig}
                dataKeys={["users", "counsellors"]}
                xAxisDataKey="month"
                className="h-[300px]"
              />
            )}
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <AnalyticsChart
                title="Chat Status Overview"
                description="Current distribution of chats"
                data={chatStatusData}
                chartType="pie"
                config={chatStatusConfig}
                dataKeys={[{name: "value"}]}
                className="h-[300px]"
              />
            )}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Active Users (24h)</h3>
              <p className="text-2xl font-bold">{activeUsers}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}