"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { toast } from '@/components/ui/use-toast';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flag,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";

// Types for content moderation
interface ContentItem {
  id: string;
  type: "post" | "chat";
  content: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  createdAt: Date;
  formattedDate: string;
  flaggedBy?: string[];
  flagReason?: string;
  status: "flagged" | "approved" | "rejected" | "pending";
}

export function ContentModeration() {
  const { toast } = useToast();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("flagged");
  const [searchTerm, setSearchTerm] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null
  );
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [moderationNote, setModerationNote] = useState("");
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 10;

  // Fetch initial content
  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  // Apply filters when search term or filters change
  useEffect(() => {
    applyFilters();
  }, [content, searchTerm, contentTypeFilter]);

  const fetchContent = async (isLoadMore = false) => {
    try {
      setIsLoading(!isLoadMore);

      // Determine which collection to query based on the active tab
      let contentQuery;
      let contentType: "post" | "chat" = "post";

      // Helper function to create query based on tab and content type
      const createQuery = (collectionName: string, statusField: string) => {
        if (isLoadMore && lastVisible) {
          return query(
            collection(db, collectionName),
            where(statusField, "==", activeTab),
            orderBy("createdAt", "desc"),
            startAfter(lastVisible),
            limit(ITEMS_PER_PAGE)
          );
        } else {
          return query(
            collection(db, collectionName),
            where(statusField, "==", activeTab),
            orderBy("createdAt", "desc"),
            limit(ITEMS_PER_PAGE)
          );
        }
      };

      // Fetch posts
      const postsQuery = createQuery("posts", "moderationStatus");
      const postsSnapshot = await getDocs(postsQuery);

      // Fetch chats/messages
      const chatsQuery = createQuery("messages", "moderationStatus");
      const chatsSnapshot = await getDocs(chatsQuery);

      if (postsSnapshot.empty && chatsSnapshot.empty) {
        setHasMore(false);
        setIsLoading(false);
        if (!isLoadMore) {
          setContent([]);
        }
        return;
      }

      // Process posts
      const posts = postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdDate =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt);

        return {
          id: doc.id,
          type: "post",
          content: data.content || data.text || "",
          userId: data.userId || data.authorId || "",
          userName: data.userName || data.authorName || "Unknown",
          userAvatar: data.userAvatar || data.authorAvatar || undefined,
          createdAt: createdDate,
          formattedDate: format(createdDate, "PPP"),
          flaggedBy: data.flaggedBy || [],
          flagReason: data.flagReason || "",
          status: data.moderationStatus || "pending",
        } as ContentItem;
      });

      // Process chats/messages
      const chats = chatsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdDate =
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt);

        return {
          id: doc.id,
          type: "chat",
          content: data.content || data.text || data.message || "",
          userId: data.userId || data.senderId || "",
          userName: data.userName || data.senderName || "Unknown",
          userAvatar: data.userAvatar || data.senderAvatar || undefined,
          createdAt: createdDate,
          formattedDate: format(createdDate, "PPP"),
          flaggedBy: data.flaggedBy || [],
          flagReason: data.flagReason || "",
          status: data.moderationStatus || "pending",
        } as ContentItem;
      });

      // Combine and sort by date
      const combinedContent = [...posts, ...chats].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      // Set last visible for pagination (using the last item's timestamp)
      if (combinedContent.length > 0) {
        setLastVisible(combinedContent[combinedContent.length - 1].createdAt);
      }

      setContent((prev) =>
        isLoadMore ? [...prev, ...combinedContent] : combinedContent
      );
      setHasMore(combinedContent.length === ITEMS_PER_PAGE);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast({
        title: "Error",
        description: "Failed to load content. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...content];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.content.toLowerCase().includes(term) ||
          item.userName?.toLowerCase().includes(term) ||
          item.userId.toLowerCase().includes(term)
      );
    }

    // Apply content type filter
    if (contentTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === contentTypeFilter);
    }

    setFilteredContent(filtered);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchContent(true);
    }
  };

  const handleViewContent = (item: ContentItem) => {
    setSelectedContent(item);
    setIsViewDialogOpen(true);
  };

  const handleApproveContent = async () => {
    if (!selectedContent) return;

    try {
      const contentRef = doc(
        db,
        selectedContent.type === "post" ? "posts" : "messages",
        selectedContent.id
      );
      await updateDoc(contentRef, {
        moderationStatus: "approved",
        moderatedAt: new Date(),
        moderationNote: moderationNote || "Content approved by admin",
      });

      // Update local state
      setContent((prev) =>
        prev.map((item) =>
          item.id === selectedContent.id
            ? { ...item, status: "approved" }
            : item
        )
      );

      toast({
        title: "Success",
        description: "Content approved successfully",
      });

      setIsViewDialogOpen(false);
      setModerationNote("");
    } catch (error) {
      console.error("Error approving content:", error);
      toast({
        title: "Error",
        description: "Failed to approve content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectContent = async () => {
    if (!selectedContent) return;

    try {
      const contentRef = doc(
        db,
        selectedContent.type === "post" ? "posts" : "messages",
        selectedContent.id
      );
      await updateDoc(contentRef, {
        moderationStatus: "rejected",
        moderatedAt: new Date(),
        moderationNote: moderationNote || "Content rejected by admin",
        isHidden: true,
      });

      // Update local state
      setContent((prev) =>
        prev.map((item) =>
          item.id === selectedContent.id
            ? { ...item, status: "rejected" }
            : item
        )
      );

      toast({
        title: "Success",
        description: "Content rejected successfully",
      });

      setIsViewDialogOpen(false);
      setModerationNote("");
    } catch (error) {
      console.error("Error rejecting content:", error);
      toast({
        title: "Error",
        description: "Failed to reject content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContent = async () => {
    if (!selectedContent) return;

    try {
      const contentRef = doc(
        db,
        selectedContent.type === "post" ? "posts" : "messages",
        selectedContent.id
      );
      await deleteDoc(contentRef);

      // Update local state
      setContent((prev) =>
        prev.filter((item) => item.id !== selectedContent.id)
      );

      toast({
        title: "Success",
        description: "Content deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setIsViewDialogOpen(false);
    } catch (error) {
      console.error("Error deleting content:", error);
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    setContent([]);
    setLastVisible(null);
    setHasMore(true);
    fetchContent();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Moderation</CardTitle>
            <CardDescription>
              Review and moderate user-generated content
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <Tabs
          defaultValue="flagged"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="flagged">
              <Flag className="mr-2 h-4 w-4" />
              Flagged
            </TabsTrigger>
            <TabsTrigger value="pending">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <XCircle className="mr-2 h-4 w-4" />
              Rejected
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            value={contentTypeFilter}
            onValueChange={setContentTypeFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="post">Posts</SelectItem>
              <SelectItem value="chat">Chat Messages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">
              No content found matching your criteria
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setContentTypeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContent.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={item.userAvatar} />
                        <AvatarFallback>
                          {item.userName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{item.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.formattedDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={item.type === "post" ? "default" : "secondary"}
                      >
                        {item.type === "post" ? "Post" : "Chat Message"}
                      </Badge>
                      <Badge
                        variant={
                          item.status === "flagged"
                            ? "destructive"
                            : item.status === "approved"
                            ? "secondary"
                            : item.status === "rejected"
                            ? "outline"
                            : "default"
                        }
                      >
                        {item.status.charAt(0).toUpperCase() +
                          item.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-md mb-2">
                    <p className="text-sm line-clamp-2">{item.content}</p>
                  </div>

                  {item.flagReason && (
                    <div className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium">Flag reason:</span>{" "}
                      {item.flagReason}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewContent(item)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        {hasMore && (
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        )}
      </CardFooter>

      {/* View Content Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Content</DialogTitle>
            <DialogDescription>
              Review and take action on this content.
            </DialogDescription>
          </DialogHeader>

          {selectedContent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={selectedContent.userAvatar} />
                  <AvatarFallback>
                    {selectedContent.userName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedContent.userName}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-muted-foreground">
                      {selectedContent.formattedDate}
                    </p>
                    <Badge
                      variant={
                        selectedContent.type === "post"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedContent.type === "post"
                        ? "Post"
                        : "Chat Message"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-md">
                <p className="whitespace-pre-wrap">{selectedContent.content}</p>
              </div>

              {selectedContent.flagReason && (
                <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Flag reason:
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {selectedContent.flagReason}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Moderation Note</label>
                <Textarea
                  placeholder="Add a note about your moderation decision..."
                  value={moderationNote}
                  onChange={(e) => setModerationNote(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setIsDeleteDialogOpen(true);
                }}
              >
                Delete
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleRejectContent}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={handleApproveContent}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Content Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this content? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContent}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
