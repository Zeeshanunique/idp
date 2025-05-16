"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserButton, SignInButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

interface MainLayoutProps {
  children: React.ReactNode
  navItems: Array<{
    label: string
    href: string
  }>
}

export default function MainLayout({ children, navItems }: MainLayoutProps) {
  const { isSignedIn, user } = useUser();
  
  return (
    <>
      {/* Background animation elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          {/* Animated glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-2/3 left-1/3 w-[400px] h-[400px] bg-green-900/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(20,20,30,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,30,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"
          style={{ backgroundPosition: '-1px -1px' }}
        />
      </div>
      
      <header className="bg-gray-900/95 shadow-md border-b border-gray-800 backdrop-blur-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <motion.div 
                className="text-white text-xl font-bold flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-2xl mr-2">🔍</span> Document Intelligence
              </motion.div>
            </div>
            <div className="flex items-center space-x-1">
              {navItems.map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link
                    href={item.href} 
                    className="text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-md text-sm font-medium transition-colors relative group"
                  >
                    {item.label}
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </Link>
                </motion.div>
              ))}
              
              <div className="ml-4 flex items-center">
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500/10">
                      Sign In
                    </Button>
                  </SignInButton>
                ) : (
                  <div className="flex items-center gap-3">
                    {user?.fullName && (
                      <span className="text-sm text-gray-300">Hi, {user.fullName.split(' ')[0]}</span>
                    )}
                    <UserButton afterSignOutUrl="/" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
      
      {children}
      
      <footer className="bg-gray-900/95 text-gray-400 py-8 border-t border-gray-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p>© 2025 Autonomous Document Intelligence</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}