"use client"

import { useState } from "react"
import { Home, MapPin, Users, User, Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface MobileNavProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function MobileNav({ currentPage, onPageChange }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "visits", label: "Visits", icon: Users },
    { id: "trails", label: "Trails", icon: MapPin },
    { id: "profile", label: "Profile", icon: User },
  ]

  const handleLogout = async () => {
    try {
      await authService.logout()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
      window.location.reload()
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden neumorphic-card mx-4 mt-4 mb-2 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">ACCORD</h1>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="neumorphic-button">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col h-full">
                <div className="py-4">
                  <h2 className="text-lg font-semibold text-primary">ACCORD</h2>
                </div>
                <nav className="flex-1 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Button
                        key={item.id}
                        variant={currentPage === item.id ? "default" : "ghost"}
                        className={`w-full justify-start ${currentPage === item.id ? "" : "neumorphic-button"}`}
                        onClick={() => {
                          onPageChange(item.id)
                          setIsOpen(false)
                        }}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    )
                  })}
                </nav>
                <div className="pt-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive neumorphic-button"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background">
        <div className="neumorphic-card mx-2 mb-2 rounded-t-lg">
          <div className="grid grid-cols-4 gap-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  size="sm"
                  className={`flex flex-col h-auto py-3 px-1 ${currentPage === item.id ? "" : "neumorphic-button"}`}
                  onClick={() => onPageChange(item.id)}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
