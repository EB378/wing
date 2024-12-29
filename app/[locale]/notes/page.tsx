import React from "react";
import NotesByDay from "@/components/NotesByDay";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const { locale } = resolvedParams; // Get locale from dynamic route parameter

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/${locale}/sign-in`);
  }

  return (
    <>
      <NotesByDay />
    </>
  );
}
