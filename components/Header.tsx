"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glassmorphism">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-flow bg-flow-size animate-flow rounded-full"></div>
          
            <Image src="/logo.png" alt="logo" width={200} height={200} />
          
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
          <a href="#dashboard" className="text-white/80 hover:text-white transition-colors">Demo</a>
          <a href="#ai" className="text-white/80 hover:text-white transition-colors">AI Chat</a>
          <Link href="/account" className="text-white/80 hover:text-white transition-colors">
            {session ? "Account" : "Login"}
          </Link>
          <Link href={session ? "/dashboard" : "/account"}>
            <Button className="bg-gradient-flow bg-flow-size animate-flow text-white">
              {session ? "Dashboard" : "Launch App"}
            </Button>
          </Link>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden glassmorphism py-4 px-4">
          <nav className="flex flex-col space-y-4">
            <a 
              href="#features" 
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#dashboard" 
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Demo
            </a>
            <a 
              href="#ai" 
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              AI Chat
            </a>
            <Link 
              href="/account" 
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {session ? "Account" : "Login"}
            </Link>
            <Link 
              href={session ? "/dashboard" : "/account"} 
              onClick={() => setIsMenuOpen(false)}
            >
              <Button className="bg-gradient-flow bg-flow-size animate-flow text-white w-full">
                {session ? "Dashboard" : "Launch App"}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;