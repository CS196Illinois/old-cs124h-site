import WebSidebar from "./components/WebSidebar.js";

export const metadata = {
  title: "Web Dev",
  description: "Web Dev layout",
};

export default function WebDevLayout({ children }) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <WebSidebar/>
      {children}
    </div>
  );
}