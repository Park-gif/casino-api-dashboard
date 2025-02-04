"use client"

import { useState } from 'react';
import { 
  Book, 
  Code2, 
  Terminal, 
  Copy, 
  CheckCheck,
  Hash,
  Globe,
  Layers,
  ChevronRight,
  GamepadIcon,
  ListIcon,
  PlayIcon,
  Users,
  Wallet,
  Settings,
  Menu,
  X,
  Search,
  ArrowLeft,
  Github,
  ExternalLink
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
      <p className="mt-4 text-lg text-gray-600">
        Welcome to our API documentation. Here you'll find comprehensive guides and documentation to help you start working with our API as quickly as possible.
      </p>
      
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Getting Started</h2>
          <p className="mt-2 text-gray-600">Learn the basics and get started with our API integration.</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">API Reference</h2>
          <p className="mt-2 text-gray-600">Detailed documentation for all API endpoints and methods.</p>
        </div>
      </div>
    </div>
  );
} 