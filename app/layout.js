import "./global.css";
import AuthSessionProvider from "../components/AuthSessionProvider";
import Navbar from "../components/navbar.js";

export const metadata = {
  title: "CS124H",
  description: "CS 124H Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <Navbar />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
