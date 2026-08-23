"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { BlogPost } from "@/features/blog/blog-post";

export default function BlogPage() {
  useEffect(() => {
    document.title = "Aurix - Technical Blog | Intelligent Personal Finance";
  }, []);

  return <BlogPost />;
}