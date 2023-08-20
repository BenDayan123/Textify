import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AUTH0_SECRET: string;
      AUTH0_ISSUER_BASE_URL: string;
      AUTH0_CLIENT_ID: string;
      AUTH0_CLIENT_SECRET: string;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      NEXTAUTH_SECRET: string;
      FACEBOOK_CLIENT_ID: string;
      FACEBOOK_CLIENT_SECRET: string;
      TWITTER_CLIENT_ID: string;
      TWITTER_CLIENT_SECRET: string;
    }
  }
}
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET } = process.env;
// const { AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_ISSUER } = process.env;
// const { FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET } = process.env;
// const { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET } = process.env;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60
  },
  adapter: PrismaAdapter(prisma as any) as any,
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      checks: ["none"]
    }),
    CredentialsProvider({
      type: "credentials",
      name: "Sign in",
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const { email } = credentials;
        const user = await prisma.user.findUnique({
          where: { email },
        });
        return user;
      },
      credentials: {
        email: { label: "Email", type: "text ", placeholder: "email" },
        password: { label: "Password", type: "password" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if(trigger === "update"){
        return { ...token, ...session }; 
      }
      return { ...token, ...user };
    },
    async session({ session, token }) {
      if(token && session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    },
  },
  jwt: {
    secret: NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60
  },
  secret: NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);

// Auth0Provider({
//   clientId: AUTH0_CLIENT_ID,
//   clientSecret: AUTH0_CLIENT_SECRET,
//   issuer: AUTH0_ISSUER,
// }),
// FacebookProvider({
//   clientId: FACEBOOK_CLIENT_ID,
//   clientSecret: FACEBOOK_CLIENT_SECRET,
// }),
// TwitterProvider({
//   clientId: TWITTER_CLIENT_ID,
//   clientSecret: TWITTER_CLIENT_SECRET,
//   version: "2.0",
// }),