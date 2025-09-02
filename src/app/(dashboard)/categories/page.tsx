"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { CategoryManagement } from "@/components/categories/CategoryManagement";

export default function CategoriesPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;
  if (!['admin','superadmin'].includes(user.role)) {
    return <div className="p-6">Unauthorized</div>;
  }

  return (
    <div className="space-y-6">
      <CategoryManagement />
    </div>
  );
}