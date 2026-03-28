import HeadSidebar from "./components/HeadSidebar.js";

export const metadata = {
  title: "Head PM",
  description: "Head PM layout",
};

export default function HeadPMLayout({ children }) {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <HeadSidebar/>
      {children}
    </div>
  );
}