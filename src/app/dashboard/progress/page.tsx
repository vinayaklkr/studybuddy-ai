"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Clock,
  FileText,
  MessageSquare,
  Zap,
  Calendar,
  Award,
  Target,
} from "lucide-react";

interface ProgressData {
  id: string;
  date: string;
  studyTime: number;
  documentsRead: number;
  questionsAnswered: number;
  focusSessions: number;
}

interface Stats {
  totalStudyTime: number;
  totalDocuments: number;
  totalQuestions: number;
  totalSessions: number;
  avgStudyTime: number;
  currentStreak: number;
}

interface StudySession {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  focusMode: boolean;
  completed: boolean;
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudyTime: 0,
    totalDocuments: 0,
    totalQuestions: 0,
    totalSessions: 0,
    avgStudyTime: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
    fetchStudySessions();
  }, []);

  async function fetchProgress() {
    try {
      const response = await fetch("/api/progress");
      if (response.ok) {
        const data = await response.json();
        setProgressData(data.progress || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudySessions() {
    try {
      const response = await fetch("/api/study-sessions");
      if (response.ok) {
        const data = await response.json();
        setStudySessions(data);
      }
    } catch (error) {
      console.error("Error fetching study sessions:", error);
    }
  }

  const last7Days = progressData.slice(0, 7).reverse();
  const last30Days = progressData.slice(0, 30).reverse();

  const StatCard = ({ icon: Icon, title, value, color, subtitle }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const DayProgressBar = ({ data }: { data: ProgressData }) => {
    const date = new Date(data.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const maxTime = Math.max(...last7Days.map((d) => d.studyTime), 60);
    const percentage = (data.studyTime / maxTime) * 100;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{dayName}</span>
          <span className="text-muted-foreground">
            {Math.floor(data.studyTime / 60)}h {data.studyTime % 60}m
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{data.documentsRead} docs</span>
          <span>•</span>
          <span>{data.questionsAnswered} questions</span>
          <span>•</span>
          <span>{data.focusSessions} sessions</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold tracking-tight">
              Study Progress
            </h2>
            <p className="text-sm text-muted-foreground">
              Track your learning journey
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Clock}
              title="Total Study Time"
              value={`${Math.floor(stats.totalStudyTime / 60)}h`}
              subtitle={`${stats.avgStudyTime} min/day avg`}
              color="bg-blue-500/10 text-blue-500"
            />
            <StatCard
              icon={FileText}
              title="Documents Read"
              value={stats.totalDocuments}
              subtitle="PDFs uploaded"
              color="bg-green-500/10 text-green-500"
            />
            <StatCard
              icon={MessageSquare}
              title="Questions Asked"
              value={stats.totalQuestions}
              subtitle="Chat interactions"
              color="bg-purple-500/10 text-purple-500"
            />
            <StatCard
              icon={Zap}
              title="Focus Sessions"
              value={stats.totalSessions}
              subtitle="Completed sessions"
              color="bg-amber-500/10 text-amber-500"
            />
          </div>

          {/* Streak & Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <CardTitle>Current Streak</CardTitle>
                </div>
                <CardDescription>Keep up the great work!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-6xl font-bold text-amber-500">
                    {stats.currentStreak}
                  </p>
                  <p className="text-lg text-muted-foreground mt-2">Days</p>
                  <div className="mt-6 p-4 bg-amber-500/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Study every day to maintain your streak!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <CardTitle>Today's Goal</CardTitle>
                </div>
                <CardDescription>Daily study target: 2 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progressData.length > 0 ? (
                    <>
                      <div className="text-center">
                        <p className="text-4xl font-bold">
                          {Math.floor(progressData[0].studyTime / 60)}h{" "}
                          {progressData[0].studyTime % 60}m
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          of 2h 0m
                        </p>
                      </div>
                      <Progress
                        value={(progressData[0].studyTime / 120) * 100}
                        className="h-3"
                      />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">
                            {progressData[0].documentsRead}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Documents
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {progressData[0].questionsAnswered}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Questions
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {progressData[0].focusSessions}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sessions
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No study activity today
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Study Sessions History */}
          <Card>
            <CardHeader>
              <CardTitle>Study Sessions</CardTitle>
              <CardDescription>All your study sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {studySessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No study sessions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {studySessions.map((session) => {
                    const startDate = new Date(session.startTime);
                    const isToday =
                      startDate.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={session.id}
                        className={`p-4 border rounded-lg space-y-2 ${
                          !session.completed
                            ? "border-amber-500/50 bg-amber-500/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">
                                {session.title}
                              </h4>
                              {session.focusMode && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30"
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  Strict
                                </Badge>
                              )}
                              {session.completed ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-500/10 text-green-500 border-green-500/30"
                                >
                                  Completed
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30"
                                >
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            {session.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {session.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            {session.completed && session.duration && (
                              <p className="text-lg font-bold">
                                {Math.floor(session.duration / 60)}h{" "}
                                {session.duration % 60}m
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {isToday ? "Today" : startDate.toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {startDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {session.endTime && session.completed && (
                              <>
                                {" - "}
                                {new Date(session.endTime).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly/Monthly Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Statistics</CardTitle>
              <CardDescription>Your study patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="week">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="week">Last 7 Days</TabsTrigger>
                  <TabsTrigger value="month">Last 30 Days</TabsTrigger>
                </TabsList>

                <TabsContent value="week" className="space-y-4 mt-6">
                  {last7Days.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No study activity in the last 7 days
                    </p>
                  ) : (
                    last7Days.map((data) => (
                      <DayProgressBar key={data.id} data={data} />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="month" className="space-y-4 mt-6">
                  {last30Days.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No study activity in the last 30 days
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {last30Days.map((data) => (
                        <div
                          key={data.id}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {new Date(data.date).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(data.studyTime / 60)}h{" "}
                              {data.studyTime % 60}m
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {data.documentsRead}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {data.questionsAnswered}
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {data.focusSessions}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
