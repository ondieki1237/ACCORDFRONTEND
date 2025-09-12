import type { User } from "./auth"

export const hasAdminAccess = (user: User | null): boolean => {
  return user?.role === "admin"
}

export const hasManagerAccess = (user: User | null): boolean => {
  return user?.role === "admin" || user?.role === "manager"
}

export const canViewHeatmap = (user: User | null): boolean => {
  return hasAdminAccess(user)
}

export const canDeleteRecords = (user: User | null): boolean => {
  return hasAdminAccess(user)
}

export const canEditRecords = (user: User | null): boolean => {
  return hasAdminAccess(user)
}

export const canViewAllRecords = (user: User | null): boolean => {
  return hasAdminAccess(user)
}

export const canAccessSuperUserFeatures = (user: User | null): boolean => {
  return hasAdminAccess(user)
}
