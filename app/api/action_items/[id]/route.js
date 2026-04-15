import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const netID = session?.user?.netID;

  if (!userRole || userRole === "error") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const body = await request.json();
  const updates = {};

  if (body.is_done !== undefined) {
    updates.is_done = body.is_done;
    updates.completion_date = body.is_done ? new Date().toISOString() : null;
  }

  // Content edits (title / description / due_date) require management authority
  const isContentEdit =
    body.title !== undefined ||
    body.description !== undefined ||
    body.due_date !== undefined;

  if (isContentEdit) {
    if (userRole === "student" || userRole === "web_dev") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const allowed = await canManageItem(userRole, netID, id);
    if (!allowed) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.due_date !== undefined) updates.due_date = body.due_date || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  let query = supabaseServer.from("action_items").update(updates).eq("id", id);
  // Students and web devs can only toggle their own items
  if (userRole === "student" || userRole === "web_dev") {
    query = query.eq("net_id", netID);
  }

  const { data, error } = await query.select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const netID = session?.user?.netID;

  if (!userRole || userRole === "student" || userRole === "web_dev" || userRole === "error") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const allowed = await canManageItem(userRole, netID, id);
  if (!allowed) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { error } = await supabaseServer.from("action_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── Authorization helper ─────────────────────────────────────────────────────

/**
 * Returns true if the requesting user has authority to edit/delete this item.
 *
 * course_lead  — can manage items for anyone
 * head_pm      — can manage items assigned to PMs or students
 * pm           — can manage items assigned to students in their own group
 */
async function canManageItem(userRole, netID, itemId) {
  if (userRole === "course_lead") return true;

  // Fetch the item to find the recipient
  const { data: item } = await supabaseServer
    .from("action_items")
    .select("net_id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) return false;

  // Fetch the recipient's role and group
  const { data: recipient } = await supabaseServer
    .from("user-testing")
    .select("role, group_number")
    .eq("net_id", item.net_id)
    .maybeSingle();
  if (!recipient) return false;

  if (userRole === "head_pm") {
    return ["PM", "STUDENT"].includes(recipient.role);
  }

  if (userRole === "pm") {
    if (recipient.role !== "STUDENT") return false;
    // Recipient must be in the PM's own group
    const { data: pmRecord } = await supabaseServer
      .from("user-testing")
      .select("group_number")
      .eq("net_id", netID)
      .maybeSingle();
    return (
      pmRecord?.group_number != null &&
      pmRecord.group_number === recipient.group_number
    );
  }

  return false;
}
