import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  Heart, 
  Share2, 
  Download, 
  Play, 
  Pause, 
  Volume2,
  Settings,
  Bell,
  Search,
  Menu,
  ChevronRight,
  TrendingUp,
  Users,
  Award,
  Zap
} from 'lucide-react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/80 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600"></div>
              <span className="text-xl font-bold">Demo App</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
              Features
            </a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
              Pricing
            </a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
              About
            </a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-3 w-3 mr-1" />
            New Feature Available
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Build Something
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Amazing</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Create beautiful, responsive applications with our modern design system and powerful tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              Start Building
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-slate-600 dark:text-slate-300">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
              <div className="text-slate-600 dark:text-slate-300">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-slate-600 dark:text-slate-300">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Everything you need to build and scale your application
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Track your performance with detailed analytics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Work together seamlessly with your team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2">
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>CD</AvatarFallback>
                  </Avatar>
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white flex items-center justify-center text-xs font-medium">
                    +5
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Recognition</CardTitle>
                <CardDescription>
                  Get rewarded for your achievements and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300 ml-2">5.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 px-4 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Interactive Demo
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                Experience our platform with this interactive demonstration. 
                See how easy it is to get started and build amazing things.
              </p>
              <div className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  <Play className="mr-2 h-4 w-4" />
                  Start Interactive Tour
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Resources
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share with Team
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Demo Player</h3>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Pause className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Play className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Demo Video</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>0:00</span>
                  <div className="flex-1 mx-4">
                    <Progress value={30} className="h-1" />
                  </div>
                  <span>2:45</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already building amazing applications with our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900">
        <div className="container mx-auto py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <span className="text-xl font-bold">Demo App</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Building the future of web applications with modern design and powerful tools.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Pricing</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Documentation</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">About</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Blog</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Careers</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Help Center</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Community</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Status</a></li>
                <li><a href="#" className="hover:text-slate-900 dark:hover:text-slate-100">Security</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-600 dark:text-slate-300">
              © 2024 Demo App. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Privacy Policy
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TestPage;
