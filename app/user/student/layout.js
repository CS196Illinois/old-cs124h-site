import StudentSidebar from "./components/StudentSidebar.js";

export const metadata = {
  title: "Student",
  description: "Student layout",
};

export default function StudentLayout({ children }) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <StudentSidebar/>
      {children}
    </div>
  );
}