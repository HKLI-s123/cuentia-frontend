import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** el token de backend */
      accessToken?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    token?: string; // agregamos token
  }
}
