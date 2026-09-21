import { getAllUsers } from "@/lib/actions/admin"
import { UserRoleClient } from "./user-role-client"
import { AddUserDialog } from "./add-user-dialog"
import { ShieldCheck } from "lucide-react"

export const metadata = {
  title: "Administration | WorkOrbit",
}

export default async function AdminPage() {
  const users = await getAllUsers()

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2 flex items-center gap-2">
            <ShieldCheck className="text-primary w-8 h-8" />
            Administration
          </h1>
          <p className="text-muted-foreground tracking-wide">
            Manage users, assign roles, and configure system access.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <AddUserDialog />
        </div>
      </header>

      <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/5">
            <tr>
              <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-xs">User</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-xs">Email</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-xs">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4">
                  <UserRoleClient userId={user.id} currentRole={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
