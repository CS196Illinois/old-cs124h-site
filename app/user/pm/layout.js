import PMSidebar from "./components/PMSidebar.js";

export const metadata = {
  title: "PM",
  description: "PM layout",
};

export default function PMLayout({ children }) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <PMSidebar/>
      {children}
    </div>
  );
}