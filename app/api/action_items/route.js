import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseServer } from "../../../lib/supabaseServer";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const netID = session?.user?.netID;

  if (!userRole || userRole === "error") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  // scope=mine (default): items assigned to me OR assigned by me
  // scope=all: full management scope (students/web_devs are always "mine" regardless)
  const scope = searchParams.get("scope") || "mine";

  let query = supabaseServer
    .from("action_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (userRole === "student" || userRole === "web_dev") {
    // Always own items only, regardless of scope
    query = query.eq("net_id", netID);
  } else if (scope === "mine") {
    // Items assigned to me OR that I assigned to others
    query = query.or(`net_id.eq.${netID},assigned_by.eq.${netID}`);
  }
  // scope=all for management: no additional filter (returns everything)

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const assignerNetID = session?.user?.netID;

  if (!userRole || userRole === "student" || userRole === "web_dev" || userRole === "error") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, due_date, target_type, target_net_id, target_group } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let targetNetIds = [];

  if (target_type === "individual") {
    if (!target_net_id) return NextResponse.json({ error: "target_net_id required" }, { status: 400 });
    targetNetIds = [target_net_id.trim().toLowerCase()];
  } else if (target_type.startsWith("role_")) {
    const role = target_type.replace("role_", "");

    // Enforce hierarchy
    if (userRole === "head_pm" && !["PM", "STUDENT"].includes(role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    if (userRole === "pm" && role !== "STUDENT") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { data: roleUsers, error: roleErr } = await supabaseServer
      .from("user-testing")
      .select("net_id")
      .eq("role", role);

    if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 500 });
    targetNetIds = (roleUsers || []).map((u) => u.net_id);
  } else if (target_type === "group") {
    if (!target_group) return NextResponse.json({ error: "target_group required" }, { status: 400 });

    const { data: groupUsers, error: groupErr } = await supabaseServer
      .from("user-testing")
      .select("net_id")
      .eq("group_number", Number(target_group))
      .eq("role", "STUDENT");

    if (groupErr) return NextResponse.json({ error: groupErr.message }, { status: 500 });
    targetNetIds = (groupUsers || []).map((u) => u.net_id);
  }

  if (targetNetIds.length === 0) {
    return NextResponse.json({ error: "No matching users found for target" }, { status: 400 });
  }

  const records = targetNetIds.map((net_id) => ({
    net_id,
    assigned_by: assignerNetID,
    title: title.trim(),
    description: description?.trim() || null,
    due_date: due_date || null,
    additional_info: { assigned_by: assignerNetID }, // keep for backward compat
  }));

  const { data, error } = await supabaseServer.from("action_items").insert(records).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: targetNetIds.length, data }, { status: 201 });
}
