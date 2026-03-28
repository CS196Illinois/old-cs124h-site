import LeadSidebar from "./components/LeadSidebar.js";

export const metadata = {
  title: "Course Lead",
  description: "Course Lead layout",
};

export default function CourseLeadLayout({ children }) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <LeadSidebar/>
      {children}
    </div>
  );
}