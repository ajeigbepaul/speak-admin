'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { AnalyticsChart } from './AnalyticsChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlyData, ChatStatusData } from '@/lib/types';

const userGrowthConfig = {
  users:       { label: "Users",       color: "hsl(var(--chart-1))" },
  counsellors: { label: "Counsellors", color: "hsl(var(--chart-2))" },
};

const chatStatusConfig = {
  Pending:  { label: "Pending",  color: "hsl(var(--chart-1))" },
  Active:   { label: "Active",   color: "hsl(var(--chart-2))" },
  Resolved: { label: "Resolved", color: "hsl(var(--chart-3))" },
};

const TIME_RANGES = ['24h', '7d', '30d', '90d'] as const;
type TimeRange = typeof TIME_RANGES[number];

function getStartDate(range: TimeRange): Date {
  const d = new Date();
  if (range === '24h') d.setDate(d.getDate() - 1);
  else if (range === '7d') d.setDate(d.getDate() - 7);
  else if (range === '30d') d.setDate(d.getDate() - 30);
  else d.setDate(d.getDate() - 90);
  return d;
}

function dateKey(date: Date, range: TimeRange): string {
  if (range === '24h') return `${date.getHours()}:00`;
  if (range === '7d') return date.toISOString().split('T')[0];
  const month = date.toLocaleString('default', { month: 'short' });
  return range === '30d' ? `${month} ${date.getDate()}` : month;
}

export function RealTimeAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [userGrowthData, setUserGrowthData] = useState<MonthlyData[]>([]);
  const [chatStatusData, setChatStatusData] = useState<ChatStatusData[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);

  const growthRef = useRef<MonthlyData[]>([]);

  useEffect(() => {
    setIsLoading(true);
    setUserGrowthData([]);
    setChatStatusData([]);
    growthRef.current = [];

    const startTimestamp = Timestamp.fromDate(getStartDate(timeRange));
    const yesterday = Timestamp.fromDate(new Date(Date.now() - 86400_000));

    function mergeGrowth(docs: { data(): any }[], key: 'users' | 'counsellors') {
      const grouped: Record<string, number> = {};
      docs.forEach(doc => {
        const ts: Timestamp | undefined = doc.data().createdAt;
        if (!ts) return;
        const k = dateKey(ts.toDate(), timeRange);
        grouped[k] = (grouped[k] ?? 0) + 1;
      });

      const next = [...growthRef.current];
      Object.entries(grouped).forEach(([month, count]) => {
        const idx = next.findIndex(d => d.month === month);
        if (idx >= 0) {
          next[idx] = { ...next[idx], [key]: count };
        } else {
          next.push({ month, users: 0, counsellors: 0, [key]: count } as MonthlyData);
        }
      });
      next.sort((a, b) => a.month.localeCompare(b.month));
      growthRef.current = next;
      setUserGrowthData([...next]);
    }

    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), where('createdAt', '>=', startTimestamp), orderBy('createdAt', 'asc')),
      snap => mergeGrowth(snap.docs, 'users'),
      err => console.error('users snapshot:', err),
    );

    const unsubCounselors = onSnapshot(
      query(collection(db, 'counselors'), where('createdAt', '>=', startTimestamp), orderBy('createdAt', 'asc')),
      snap => mergeGrowth(snap.docs, 'counsellors'),
      err => console.error('counselors snapshot:', err),
    );

    const unsubActiveUsers = onSnapshot(
      query(collection(db, 'users'), where('lastActive', '>=', yesterday)),
      snap => setActiveUsers(snap.size),
      err => console.error('activeUsers snapshot:', err),
    );

    function updateChatStatus(status: 'Pending' | 'Active' | 'Resolved', count: number) {
      const fill = status === 'Pending' ? 'var(--color-chart-1)' :
                   status === 'Active'  ? 'var(--color-chart-2)' : 'var(--color-chart-3)';
      setChatStatusData(prev => {
        const next = [...prev];
        const idx = next.findIndex(d => d.name === status);
        if (idx >= 0) next[idx] = { ...next[idx], value: count, fill };
        else next.push({ name: status, value: count, fill });
        return next;
      });
    }

    const unsubPending  = onSnapshot(query(collection(db, 'posts'), where('status', '==', 'pending')),
      snap => updateChatStatus('Pending',  snap.size), err => console.error('pending:', err));
    const unsubActive   = onSnapshot(query(collection(db, 'posts'), where('status', '==', 'accepted')),
      snap => updateChatStatus('Active',   snap.size), err => console.error('active:', err));
    const unsubResolved = onSnapshot(query(collection(db, 'posts'), where('status', '==', 'completed')),
      snap => updateChatStatus('Resolved', snap.size), err => console.error('resolved:', err));

    setIsLoading(false);

    return () => {
      unsubUsers(); unsubCounselors(); unsubActiveUsers();
      unsubPending(); unsubActive(); unsubResolved();
    };
  }, [timeRange]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Real-Time Analytics</CardTitle>
            <CardDescription className="mt-1">Live data from your application</CardDescription>
          </div>
          <Tabs value={timeRange} onValueChange={v => setTimeRange(v as TimeRange)}>
            <TabsList className="grid grid-cols-4 w-[360px]">
              {TIME_RANGES.map(r => (
                <TabsTrigger key={r} value={r} className="text-sm">{r}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Growth chart — takes 2/3 width */}
          <div className="lg:col-span-2">
            {isLoading
              ? <Skeleton className="h-[440px] w-full rounded-xl" />
              : (
                <AnalyticsChart
                  title="User & Counsellor Growth"
                  description={`Registration trends (last ${timeRange})`}
                  data={userGrowthData}
                  chartType="line"
                  config={userGrowthConfig}
                  dataKeys={["users", "counsellors"]}
                  xAxisDataKey="month"
                  className="h-[440px]"
                />
              )
            }
          </div>

          {/* Right column — pie chart + active users */}
          <div className="flex flex-col gap-5">
            {isLoading
              ? <Skeleton className="h-[340px] w-full rounded-xl" />
              : (
                <AnalyticsChart
                  title="Chat Status Overview"
                  description="Current distribution of chats"
                  data={chatStatusData}
                  chartType="pie"
                  config={chatStatusConfig}
                  dataKeys={[{ name: "value" }]}
                  className="h-[340px]"
                />
              )
            }
            <div className="rounded-xl bg-muted px-6 py-5 flex-1 flex flex-col justify-center">
              <p className="text-sm font-medium text-muted-foreground">Active Users (24h)</p>
              <p className="text-5xl font-bold mt-2 tracking-tight">{activeUsers}</p>
              <p className="text-xs text-muted-foreground mt-2">Users active in the last 24 hours</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
