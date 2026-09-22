import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import AzureADProvider from "next-auth/providers/azure-ad"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID || "common"}/v2.0`,
    }),
    CredentialsProvider({
      name: "Developer Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        
        if (isValid) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            departmentId: user.departmentId
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "azure-ad") {
        // Log the profile to debug what Microsoft returns
        console.log("Azure AD Profile:", profile);
        
        // Azure AD often puts the email in preferred_username or upn
        const email = profile?.email || (profile as any)?.preferred_username || (profile as any)?.upn || user.email;
        
        if (!email) {
          console.error("SSO Login Failed: No email address found in Azure AD profile.");
          return false;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: email,
              name: user.name || "New User",
              role: "EMPLOYEE",
            }
          })
          user.id = newUser.id
          user.role = newUser.role
          user.departmentId = newUser.departmentId
        } else {
          user.id = existingUser.id
          user.role = existingUser.role
          user.departmentId = existingUser.departmentId
        }
        return true
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.departmentId = user.departmentId
      }
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.departmentId = token.departmentId as string | null
      }
      return session
    }
  }
})
