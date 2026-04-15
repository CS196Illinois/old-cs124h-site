import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseServer } from "../../../../lib/supabaseServer";

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  if (!userRole || userRole === "error" || userRole === "student" || userRole === "web_dev") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { net_id } = params;
  const body = await request.json();
  const updates = {};

  if (body.role !== undefined) {
    if (userRole !== "course_lead") {
      return NextResponse.json({ error: "Only Course Leads can change roles" }, { status: 403 });
    }
    updates.role = body.role;
  }
  if (body.name !== undefined) updates.name = body.name;
  if (body.group_number !== undefined) updates.group_number = body.group_number || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("user-testing")
    .update(updates)
    .eq("net_id", net_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  if (userRole !== "course_lead") {
    return NextResponse.json({ error: "Only Course Leads can remove users" }, { status: 403 });
  }

  const { net_id } = params;
  const { error } = await supabaseServer
    .from("user-testing")
    .delete()
    .eq("net_id", net_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
