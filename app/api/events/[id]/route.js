import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseServer } from "../../../../lib/supabaseServer";

const STAFF_ROLES = ["course_lead", "head_pm", "pm", "web_dev"];

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const netID = session?.user?.netID;

  if (!STAFF_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const updates = {};

  if (body.check_in_open !== undefined) {
    updates.check_in_open = body.check_in_open;
    if (body.check_in_open) {
      updates.check_in_opened_at = new Date().toISOString();
    }
  }
  if (body.title      !== undefined) updates.title      = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.location   !== undefined) updates.location   = body.location;

  // Only the creator can modify, except course_lead can modify any
  let query = supabaseServer.from("events").update(updates).eq("id", id);
  if (userRole !== "course_lead") query = query.eq("created_by", netID);

  const { data, error } = await query.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const netID = session?.user?.netID;

  if (!STAFF_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;
  let query = supabaseServer.from("events").delete().eq("id", id);
  if (userRole !== "course_lead") query = query.eq("created_by", netID);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
