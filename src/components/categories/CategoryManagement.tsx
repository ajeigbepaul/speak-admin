"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export interface AdminCategory {
  id?: string;
  name: string;
  icon: string; // MaterialCommunityIcons name
  color: string; // hex
  description: string;
  order: number;
  isActive: boolean;
}

const emptyForm: AdminCategory = {
  name: "",
  icon: "home-heart",
  color: "#6B73FF",
  description: "",
  order: 0,
  isActive: true,
};

export function CategoryManagement() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<AdminCategory>({ ...emptyForm });
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    try {
      setIsLoading(true);
      const snap = await getDocs(query(collection(db, "categories"), orderBy("order")));
      setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch (e) {
      console.error("Load categories failed", e);
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createCategory = async () => {
    try {
      if (!form.name.trim()) {
        toast({ title: "Name required", description: "Please enter a category name" });
        return;
      }
      await addDoc(collection(db, "categories"), form);
      setForm({ ...emptyForm });
      await load();
      toast({ title: "Created", description: "Category created" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    }
  };

  const saveCategory = async (c: AdminCategory) => {
    try {
      await updateDoc(doc(db, "categories", c.id!), c as any);
      toast({ title: "Saved", description: `Saved ${c.name}` });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      setCategories((prev) => prev.filter((x) => x.id !== id));
      toast({ title: "Deleted", description: "Category removed" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create form */}
        <div className="grid gap-2 md:grid-cols-6 items-center">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Icon (MaterialCommunityIcons)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <Input placeholder="Color (#hex)" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })} />
          <div className="flex items-center gap-2">
            <span>Active</span>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
          <div>
            <Button onClick={createCategory}>Create</Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            <div>Loading...</div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-muted-foreground">No categories yet</div>
          ) : (
            categories.map((c) => (
              <div key={c.id} className="grid gap-2 md:grid-cols-7 items-center">
                <Input value={c.name} onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))} />
                <Input value={c.icon} onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, icon: e.target.value } : x)))} />
                <Input value={c.color} onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, color: e.target.value } : x)))} />
                <Input value={c.description} onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, description: e.target.value } : x)))} />
                <Input type="number" value={c.order} onChange={(e) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, order: Number(e.target.value) || 0 } : x)))} />
                <div className="flex items-center gap-2">
                  <span>Active</span>
                  <Switch checked={c.isActive} onCheckedChange={(v) => setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: v } : x)))} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => saveCategory(c)}>Save</Button>
                  <Button variant="destructive" onClick={() => removeCategory(c.id!)}>Delete</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}