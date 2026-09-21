"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Lock, Mail, Activity, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isDevLogin, setIsDevLogin] = useState(false)

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/planner",
    })
  }

  const handleMicrosoftLogin = async () => {
    setLoading(true)
    await signIn("azure-ad", {
      callbackUrl: "/planner",
    })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md p-8 rounded-3xl bg-background/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_60px_-15px_rgba(0,0,0,0.5)] z-10 relative overflow-hidden"
      >
        {/* Decorative top gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-primary/20">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your workspace</p>
        </div>

        {!isDevLogin ? (
          <div className="space-y-4">
            <Button 
              onClick={handleMicrosoftLogin}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#2F2F2F] hover:bg-[#3F3F3F] text-white border border-white/10 shadow-lg transition-all duration-300 flex items-center justify-between px-6"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#f25022" d="M0 0h10v10H0z"/>
                  <path fill="#7fba00" d="M11 0h10v10H11z"/>
                  <path fill="#00a4ef" d="M0 11h10v10H0z"/>
                  <path fill="#ffb900" d="M11 11h10v10H11z"/>
                </svg>
                <span className="font-medium text-sm">Sign in with Microsoft 365</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </Button>
            
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background/80 backdrop-blur-md px-3 text-muted-foreground tracking-widest rounded-full">
                  Or
                </span>
              </div>
            </div>

            <Button 
              variant="outline"
              onClick={() => setIsDevLogin(true)}
              className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5 transition-all duration-300"
            >
              <Lock className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Developer Local Login</span>
            </Button>
          </div>
        ) : (
          <motion.form 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleDevLogin} 
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground ml-1">Email address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-11 rounded-xl bg-black/20 border-white/10 focus-visible:ring-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground ml-1">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-11 rounded-xl bg-black/20 border-white/10 focus-visible:ring-primary/50"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsDevLogin(false)}
                className="h-12 px-6 rounded-xl text-muted-foreground hover:text-white"
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all duration-300"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </motion.form>
        )}
        
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary/70" />
            Secure Enterprise Authentication
          </p>
        </div>
      </motion.div>
    </div>
  )
}
