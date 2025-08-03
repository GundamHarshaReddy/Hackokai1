import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Brain, Zap, Building2, UserCheck, Target, Sparkles, Heart, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 text-sm px-4 py-2">
                August Fest 2025
              </Badge>
              <span className="text-gray-400">•</span>
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 text-sm px-4 py-2">
                AI Career Matching
              </Badge>
            </div>

            <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Connect with Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Dream Opportunity
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Revolutionary career platform that bridges students and employers using smart QR technology, comprehensive
              assessments, and intelligent compatibility matching.
            </p>

            <div className="flex justify-center space-x-6">
              <Link href="/student/assessment">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-4 text-lg"
                >
                  <QrCode className="mr-2 h-5 w-5" />
                  Explore Jobs
                </Button>
              </Link>
              <Link href="/company/post-job">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg border-2 hover:bg-gray-50 bg-transparent"
                >
                  <Building2 className="mr-2 h-5 w-5" />
                  Hire Talent
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Banner */}
      <div className="bg-white py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center space-x-12 text-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Festival Ready</p>
                <p className="text-sm text-gray-600">August 2025</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Intelligent Pairing</p>
                <p className="text-sm text-gray-600">AI-Driven</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Quick Results</p>
                <p className="text-sm text-gray-600">Live Scoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple Three-Step Journey</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of recruitment with our streamlined process that transforms how talent meets
              opportunity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="text-center bg-white hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  1
                </div>
                <CardTitle className="text-xl">Employers Create</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Organizations publish their openings using our intuitive platform and generate custom QR codes for the
                  recruitment showcase
                </CardDescription>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="text-center bg-white hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  2
                </div>
                <CardTitle className="text-xl">Candidates Connect</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Job seekers scan codes to access positions and complete their profile with academic background and
                  career preferences
                </CardDescription>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="text-center bg-white hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  3
                </div>
                <CardTitle className="text-xl">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  Advanced algorithms evaluate compatibility between candidates and roles, providing instant match
                  percentages and insights
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Why Choose Kaizen Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Kaizen Advantage</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Engineered for August Fest 2025 with innovative features that redefine career discovery
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <QrCode className="h-12 w-12 mx-auto text-indigo-600 mb-4" />
                <CardTitle className="text-lg">Scan Technology</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Seamless job discovery through innovative QR code integration</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Brain className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <CardTitle className="text-lg">Precision Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Advanced AI algorithms analyze skills, values, and career aspirations</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 mx-auto text-emerald-600 mb-4" />
                <CardTitle className="text-lg">Real-time Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Immediate compatibility scores and detailed matching explanations</CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Sparkles className="h-12 w-12 mx-auto text-amber-600 mb-4" />
                <CardTitle className="text-lg">Festival Special</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Exclusively crafted for August Fest 2025 career fair experience</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Begin Your Career Journey Today</h2>
          <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
            Join the growing community of students and employers revolutionizing recruitment at August Fest 2025
          </p>
          <div className="flex justify-center space-x-6">
            <Link href="/student/assessment">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                <UserCheck className="mr-2 h-5 w-5" />
                Join as Student
              </Button>
            </Link>
            <Link href="/company/post-job">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-4 text-lg font-semibold bg-transparent"
              >
                <Building2 className="mr-2 h-5 w-5" />
                Recruit Talent
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">The Kaizen Project</h3>
            <p className="text-gray-400 mb-4">Intelligent career matching for August Fest 2025</p>
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <span>Crafted with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>to bridge talent and opportunity</span>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex justify-center space-x-8">
              <Link href="/student/assessment" className="text-gray-400 hover:text-white transition-colors">
                Student Hub
              </Link>
              <Link href="/company/post-job" className="text-gray-400 hover:text-white transition-colors">
                Employer Portal
              </Link>
              <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
