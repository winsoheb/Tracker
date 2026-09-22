import { requireAuth } from "@/lib/auth-utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Briefcase, Clock, ShieldCheck, User as UserIcon } from "lucide-react"
import { SignOutButton } from "@/components/auth/signout-button"

export default async function ProfilePage() {
  const session = await requireAuth()
  const { user } = session

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">My Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your account details and view your system role.</p>
        </div>
        <SignOutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <Card className="col-span-1 p-8 flex flex-col items-center text-center space-y-6 border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-3xl">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-inner">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name || "User"} className="w-full h-full rounded-full object-cover" />
              ) : (
                <UserIcon className="w-16 h-16 text-primary/50" />
              )}
            </div>
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-muted-foreground mt-1">{user.email}</p>
          </div>

          <Badge variant="secondary" className="px-4 py-1 text-sm rounded-full capitalize">
            {user.role.toLowerCase()}
          </Badge>
        </Card>

        {/* Right Column: Detailed Info */}
        <Card className="col-span-1 md:col-span-2 p-8 border-none shadow-lg bg-white dark:bg-slate-900 rounded-3xl space-y-8">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Account Details
          </h3>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Mail className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email Address</p>
                <p className="text-base text-slate-900 dark:text-slate-100 mt-1">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Briefcase className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">System Role</p>
                <p className="text-base text-slate-900 dark:text-slate-100 mt-1 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Clock className="w-5 h-5 text-slate-400 mt-1" />
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Timezone</p>
                <p className="text-base text-slate-900 dark:text-slate-100 mt-1">{user.timezone || "System Default"}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
