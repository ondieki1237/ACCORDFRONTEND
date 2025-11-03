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
      {/* Mobile Header with safe area padding */}
      <div className="lg:hidden sticky top-0 z-40 bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0]">
        <div className="pt-safe">
          <div className="bg-white mx-4 mt-4 mb-2 p-4 rounded-2xl shadow-xl border-0"
            style={{ 
              boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)"
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] rounded-full p-2">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-[#00aeef]">ACCORD</h1>
              </div>
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full hover:bg-[#00aeef]/10 transition-all duration-300"
                  >
                    <Menu className="h-5 w-5 text-[#00aeef]" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col h-full">
                    <div className="py-4">
                      <h2 className="text-lg font-semibold text-[#00aeef]">ACCORD</h2>
                    </div>
                    <nav className="flex-1 space-y-2">
                      {navItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Button
                            key={item.id}
                            variant={currentPage === item.id ? "default" : "ghost"}
                            className={`w-full justify-start ${
                              currentPage === item.id 
                                ? "bg-gradient-to-r from-[#00aeef] to-[#0096d6] text-white" 
                                : "hover:bg-[#00aeef]/10"
                            }`}
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
                        className="w-full justify-start text-red-600 hover:bg-red-50"
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
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe">
        <div className="bg-white mx-2 mb-2 rounded-3xl shadow-xl border-0"
          style={{ 
            boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)"
          }}
        >
          <div className="grid grid-cols-4 gap-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={`flex flex-col h-auto py-3 px-1 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? "bg-gradient-to-r from-[#00aeef] to-[#0096d6] text-white shadow-lg" 
                      : "text-gray-600 hover:bg-[#00aeef]/10 hover:text-[#00aeef]"
                  }`}
                  onClick={() => onPageChange(item.id)}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
