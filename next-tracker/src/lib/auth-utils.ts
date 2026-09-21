import { auth } from "@/auth"

export async function requireManager() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in.")
  }

  if (session.user.role !== "MANAGER" && session.user.role !== "ADMIN") {
    throw new Error("Forbidden: You do not have permission to perform this action.")
  }

  return session.user
}

export async function requireAdmin() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in.")
  }

  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: You do not have permission to perform this action.")
  }

  return session.user
}

export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in.")
  }

  return session.user
}

// ----------------------------------------------------------------------------
// Advanced Authorization Helpers
// ----------------------------------------------------------------------------
import { prisma } from "@/lib/prisma"

/**
 * Returns a list of user IDs that the current user is allowed to manage.
 * ADMIN: Returns all active users.
 * MANAGER: Returns members of teams they manage.
 * EMPLOYEE: Returns empty list.
 */
export async function getAllowedTeamMembers(currentUser: any): Promise<string[]> {
  if (currentUser.role === "ADMIN") {
    const allUsers = await prisma.user.findMany({ select: { id: true }, where: { isActive: true } })
    return allUsers.map(u => u.id)
  }
  
  if (currentUser.role === "MANAGER") {
    const managedTeams = await prisma.teamMember.findMany({
      where: { userId: currentUser.id, isManager: true },
      select: { teamId: true }
    })
    const teamIds = managedTeams.map(t => t.teamId)
    const members = await prisma.teamMember.findMany({
      where: { teamId: { in: teamIds } },
      select: { userId: true }
    })
    return Array.from(new Set(members.map(m => m.userId)))
  }
  
  return [] // EMPLOYEE
}

/**
 * Verifies if the currentUser is allowed to manage the targetUserId.
 */
export async function canManageUser(currentUser: any, targetUserId: string): Promise<boolean> {
  if (currentUser.id === targetUserId) return true;
  if (currentUser.role === "EMPLOYEE") return false;
  
  const allowed = await getAllowedTeamMembers(currentUser);
  return allowed.includes(targetUserId);
}

/**
 * Verifies if the currentUser can modify the specified task ID.
 */
export async function canModifyTask(currentUser: any, taskId: string): Promise<boolean> {
  if (currentUser.role === "ADMIN") return true;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { userId: true }
  });

  if (!task) return false;
  if (task.userId === currentUser.id) return true;
  
  if (currentUser.role === "MANAGER") {
    return await canManageUser(currentUser, task.userId);
  }
  
  return false;
}
