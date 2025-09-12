import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Clock } from "lucide-react"

interface ActivityItem {
  id: string
  type: "visit" | "trail"
  description: string
  timestamp: string
  client?: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "visit":
        return <Users className="h-4 w-4" />
      case "trail":
        return <MapPin className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "visit":
        return "bg-primary text-primary-foreground"
      case "trail":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card className="neumorphic-card">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest visits and trails</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="neumorphic-inset p-6 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="neumorphic-inset p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`neumorphic-element p-3 rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.description}</p>
                    {activity.client && <p className="text-xs text-muted-foreground">Client: {activity.client}</p>}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
