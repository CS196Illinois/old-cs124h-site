import NextAuth from "next-auth";
import { supabase } from "../../../../lib/supbaseClient";

export const authOptions = {
  session: { strategy: "jwt" },

  providers: [
    {
      id: "cilogon",
      name: "CILogon",
      type: "oauth",
      wellKnown:
        process.env.CILOGON_ISSUER ??
        "https://cilogon.org/.well-known/openid-configuration",
      clientId: process.env.CILOGON_CLIENT_ID,
      clientSecret: process.env.CILOGON_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile org.cilogon.userinfo",
          skin: "illinois",
          idphint: "urn:mace:incommon:uiuc.edu",
          selected_idp: "urn:mace:incommon:uiuc.edu",
          initialidp: "urn:mace:incommon:uiuc.edu",
        },
      },
      idToken: true,
      checks: ["pkce", "state"],
      profile(profile) {
        console.log("User logged in", { userId: profile.sub });
        console.log("Profile:", profile);
        return {
          id: profile.sub,
          username: profile.sub?.toLowerCase(),
          name:
            `${profile.given_name || ""} ${profile.family_name || ""}`.trim() ||
            profile.name ||
            profile.sub,
          email: profile.email,
        };
      },
    },
  ],

  pages: {
    signIn: "/user",
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },

    async jwt({ token, user }) {
      if (user) {
        const netID = user.email.split("@")[0].toLowerCase();
        const sub = user.sub;

        token.netID = netID;
        token.sub = sub;

        await supabase
          .from("user-testing")
          .update({ sub })
          .eq("net_id", netID)
          .is("sub", null);

        token.role = await fetchRole(netID, sub);
        console.log("Role assigned:", token.role);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.netID = token.netID;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

async function fetchRole(netID) {
  const { data, error } = await supabase
    .from("user-testing")
    .select("role")
    .eq("sub", sub)
    .eq("net_id", netID)
    .single();

  console.log("Role:", data);

  switch (data.role) {
    case "LEAD":
      return "course_lead";
    case "HEAD":
      return "head_pm";
    case "PM":
      return "pm";
    case "WEB":
      return "web_dev";
    case "STUDENT":
      return "student";
    default:
      return "error";
  }
}
