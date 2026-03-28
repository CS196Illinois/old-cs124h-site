import { supabase } from "../../lib/supbaseClient";

export async function getGroupPointsSummary() {
  // get all students with their group info
  const { data: students, error: studentsError } = await supabase
    .from("groups")
    .select("net_id, group_number, group_name")
    .eq("role", "STUDENT");

  if (studentsError) {
    console.error("Error fetching students:", studentsError);
    return [];
  }

  // get all attendance records
  const { data: attendance, error: attendanceError } = await supabase
    .from("attendance_sheet")
    .select("net_id, point_value");

  if (attendanceError) {
    console.error("Error fetching attendance:", attendanceError);
    return [];
  }

  // map net_id to point totals
  const pointsMap = {};
  for (const entry of attendance) {
    if (!pointsMap[entry.net_id]) {
      pointsMap[entry.net_id] = 0;
    }
    pointsMap[entry.net_id] += entry.point_value;
  }

  // group points by group_number
  const groupSummaryMap = {};
  for (const student of students) {
    const points = pointsMap[student.net_id] || 0;
    const groupNum = student.group_number;

    if (!groupSummaryMap[groupNum]) {
      groupSummaryMap[groupNum] = {
        group_number: groupNum,
        group_name: student.group_name,
        total_points: 0,
      };
    }

    groupSummaryMap[groupNum].total_points += points;
  }

  // Convert map to array and sort by total_points
  const sortedGroups = Object.values(groupSummaryMap).sort(
    (a, b) => b.total_points - a.total_points
  );

  // Add ranks
  const rankedGroups = sortedGroups.map((group, index) => ({
    ...group,
    rank: index + 1,
  }));

  return rankedGroups;
}
