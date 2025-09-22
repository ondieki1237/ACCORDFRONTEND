"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Calendar, ArrowLeft, Navigation, Route, Activity, Target, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Badge as BadgeComponent } from "@/components/ui/badge"

interface Trail {
  id: string
  date: string
  startTime: string
  endTime: string
  path: {
    coordinates: number[][]
  }
  stops: any[]
  deviceInfo: any
  elevationGain?: number
  maxSpeed?: number
  avgSpeed?: number
  difficulty?: string
}

interface TrailDetailProps {
  trail: Trail
  onBack: () => void
}

export function TrailDetail({ trail, onBack }: TrailDetailProps) {
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const calculateDistance = (coordinates: number[][]) => {
    if (!coordinates || coordinates.length < 2) return { distance: 0, unit: "km" }

    let totalDistance = 0
    for (let i = 1; i < coordinates.length; i++) {
      const [lat1, lon1] = coordinates[i - 1]
      const [lat2, lon2] = coordinates[i]

      const R = 6371 // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      totalDistance += R * c
    }

    return { distance: totalDistance, unit: "km" }
  }

  const getStartLocation = () => {
    if (!trail.path?.coordinates || trail.path.coordinates.length === 0) return "Unknown"
    const [lat, lon] = trail.path.coordinates[0]
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }

  const getEndLocation = () => {
    if (!trail.path?.coordinates || trail.path.coordinates.length === 0) return "Unknown"
    const [lat, lon] = trail.path.coordinates[trail.path.coordinates.length - 1]
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const { distance } = calculateDistance(trail.path?.coordinates || [])
  const duration = calculateDuration(trail.startTime, trail.endTime)
  
  // Calculate pace (min/km)
  const totalMinutes = new Date(trail.endTime).getTime() - new Date(trail.startTime).getTime()
  const paceMinutes = distance > 0 ? (totalMinutes / (1000 * 60)) / distance : 0

  const trailStats = [
    {
      label: "Distance",
      value: `${distance.toFixed(1)} km`,
      icon: Route,
      color: "from-blue-500 to-indigo-600"
    },
    {
      label: "Duration",
      value: duration,
      icon: Clock,
      color: "from-green-500 to-emerald-600"
    },
    {
      label: "Elevation Gain",
      value: trail.elevationGain ? `${trail.elevationGain.toFixed(0)} m` : "N/A",
      icon: Activity,
      color: "from-purple-500 to-violet-600"
    },
    {
      label: "Stops",
      value: `${trail.stops?.length || 0}`,
      icon: MapPin,
      color: "from-orange-500 to-red-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="neumorphism-card p-6 rounded-3xl">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onBack}
              className="neumorphism-button-sm group hover:scale-110 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 group-hover:translate-x-[-2px] transition-transform" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Trail {trail.id}
              </h1>
              <p className="text-gray-600 mt-1">Detailed trail analysis and statistics</p>
            </div>
            <div className="flex items-center gap-2">
              <BadgeComponent 
                variant="secondary" 
                className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200"
              >
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(trail.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </BadgeComponent>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Enhanced Trail Information Card */}
          <Card className="neumorphism-card overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Trail Timeline
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Complete journey timeline and key metrics
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-indigo-600"></div>
                
                <div className="space-y-6">
                  {/* Start Time */}
                  <div className="flex items-start gap-4 relative">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg z-10">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">Trail Started</h3>
                          <p className="text-sm text-gray-600">{getStartLocation()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-bold text-green-600">
                            {new Date(trail.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(trail.startTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="flex items-start gap-4 relative">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg z-10">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">Trail Completed</h3>
                          <p className="text-sm text-gray-600">{getEndLocation()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-bold text-red-600">
                            {new Date(trail.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(trail.endTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration Badge */}
              <div className="text-center">
                <BadgeComponent 
                  variant="outline" 
                  className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200 px-6 py-3 text-lg"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Total Duration: {duration}
                </BadgeComponent>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Route Statistics Card */}
          <Card className="neumorphism-card overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
                  <Route className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Route Analytics
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Performance metrics and trail insights
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {trailStats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div 
                      key={stat.label}
                      className="group cursor-default p-4 rounded-2xl bg-gradient-to-br from-white/60 to-gray-50/60 backdrop-blur-sm border border-white/40 hover:bg-white/80 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl group-hover:scale-110 transition-transform duration-200">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-800">{stat.value}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pace Card */}
              {paceMinutes > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Average Pace</h4>
                        <p className="text-sm text-gray-600">
                          {Math.round(paceMinutes)} min/km
                        </p>
                      </div>
                    </div>
                    <BadgeComponent 
                      variant="outline" 
                      className={`${getDifficultyColor(trail.difficulty)} text-xs`}
                    >
                      {trail.difficulty || 'Moderate'}
                    </BadgeComponent>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Location Details Card */}
        <Card className="neumorphism-card overflow-hidden group hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <Navigation className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">Location Coordinates</CardTitle>
                <CardDescription>Precise GPS coordinates for trail endpoints</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Start Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Starting Point</h3>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-inner">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Latitude</span>
                      <code className="text-sm font-mono text-green-700 bg-green-100/50 px-2 py-1 rounded-lg">
                        {trail.path?.coordinates?.[0]?.[0]?.toFixed(6) || 'N/A'}
                      </code>
                    </div>
                    <Separator className="bg-green-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Longitude</span>
                      <code className="text-sm font-mono text-green-700 bg-green-100/50 px-2 py-1 rounded-lg">
                        {trail.path?.coordinates?.[0]?.[1]?.toFixed(6) || 'N/A'}
                      </code>
                    </div>
                    <div className="pt-3">
                      <BadgeComponent 
                        variant="outline" 
                        className="bg-green-100 text-green-800 border-green-200 text-xs"
                      >
                        Trail Origin • {trail.path?.coordinates?.length || 0} GPS Points
                      </BadgeComponent>
                    </div>
                  </div>
                </div>
              </div>

              {/* End Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Ending Point</h3>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200 shadow-inner">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-800">Latitude</span>
                      <code className="text-sm font-mono text-red-700 bg-red-100/50 px-2 py-1 rounded-lg">
                        {trail.path?.coordinates?.[trail.path.coordinates.length - 1]?.[0]?.toFixed(6) || 'N/A'}
                      </code>
                    </div>
                    <Separator className="bg-red-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-800">Longitude</span>
                      <code className="text-sm font-mono text-red-700 bg-red-100/50 px-2 py-1 rounded-lg">
                        {trail.path?.coordinates?.[trail.path.coordinates.length - 1]?.[1]?.toFixed(6) || 'N/A'}
                      </code>
                    </div>
                    <div className="pt-3">
                      <BadgeComponent 
                        variant="outline" 
                        className="bg-red-100 text-red-800 border-red-200 text-xs"
                      >
                        Trail Destination
                      </BadgeComponent>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Trail Map Card */}
        {trail.path?.coordinates && trail.path.coordinates.length > 0 && (
          <Card className="neumorphism-card overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                  <Navigation className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">Interactive Trail Map</CardTitle>
                  <CardDescription>
                    Visualize your complete route with elevation profile
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Map Placeholder with Enhanced UI */}
              <div className="relative">
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                  {/* Map Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 opacity-20"></div>
                  
                  {/* Map Content */}
                  <div className="relative h-full flex flex-col justify-center items-center text-center p-8">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 mb-6">
                      <MapPin className="h-12 w-12 text-white mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">Map Coming Soon</h3>
                      <p className="text-blue-100">Interactive route visualization with elevation profile</p>
                    </div>
                    
                    {/* Route Stats Overlay */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                        <p className="text-sm text-gray-600">Total Distance</p>
                        <p className="text-xl font-bold text-gray-800">{distance.toFixed(1)}km</p>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                        <p className="text-sm text-gray-600">GPS Points</p>
                        <p className="text-xl font-bold text-gray-800">{trail.path.coordinates.length}</p>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                        <p className="text-sm text-gray-600">Stops</p>
                        <p className="text-xl font-bold text-gray-800">{trail.stops?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Elevation Profile Placeholder */}
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-800">Elevation Profile</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Start</span>
                      <span>{trail.elevationGain ? `${trail.elevationGain.toFixed(0)}m gain` : 'N/A'}</span>
                      <span>End</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-600 transition-all duration-700"
                        style={{ width: '75%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stops Summary */}
        {trail.stops && trail.stops.length > 0 && (
          <Card className="neumorphism-card overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-800">Trail Stops</CardTitle>
                  <CardDescription>Points of interest and breaks along your route</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trail.stops.slice(0, 6).map((stop, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mt-1">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm capitalize">
                          Stop {index + 1}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {stop.timestamp ? new Date(stop.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                        </p>
                        {stop.duration && (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            {Math.round(stop.duration / 60000)} min break
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {trail.stops.length > 6 && (
                <div className="text-center pt-4">
                  <BadgeComponent 
                    variant="outline" 
                    className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200 text-sm"
                  >
                    +{trail.stops.length - 6} more stops
                  </BadgeComponent>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Custom Neumorphism Styles */}
      <style jsx>{`
        .neumorphism-card {
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 
            12px 12px 24px #e1e5e9,
            -12px -12px 24px #ffffff,
            inset 1px 1px 4px rgba(255, 255, 255, 0.6);
          border: 1px solid #e9ecef;
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .neumorphism-card:hover {
          box-shadow: 
            16px 16px 32px #e1e5e9,
            -16px -16px 32px #ffffff,
            inset 1px 1px 4px rgba(255, 255, 255, 0.6);
          transform: translateY(-2px);
        }
        
        .neumorphism-button-sm {
          background: linear-gradient(145deg, #ffffff, #f0f0f0) !important;
          border: none !important;
          box-shadow: 
            4px 4px 8px #e1e5e9,
            -4px -4px 8px #ffffff,
            inset 1px 1px 2px rgba(255, 255, 255, 0.6) !important;
          border-radius: 12px !important;
          transition: all 0.2s ease !important;
        }
        
        .neumorphism-button-sm:hover {
          box-shadow: 
            2px 2px 4px #e1e5e9,
            -2px -2px 4px #ffffff,
            inset 1px 1px 2px rgba(255, 255, 255, 0.6) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}