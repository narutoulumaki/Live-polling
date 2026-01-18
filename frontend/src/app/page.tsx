'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);

  // just redirect to the role page
  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* Dark header */}
      <div className="h-16 bg-[#1a1a2e]" />
      
      {/* Main content */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center px-4">
        {/* Intervue Poll Badge */}
        <div className="flex items-center gap-2 bg-[#7C3AED] text-white px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Intervue Poll</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl text-center mb-2">
          Welcome to the <span className="font-bold">Live Polling System</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-500 text-center mb-10 max-w-lg">
          Please select the role that best describes you to begin using the live polling system
        </p>

        {/* Role Selection Cards */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-xl">
          {/* Student Card */}
          <button
            onClick={() => setSelectedRole('student')}
            className={`flex-1 p-6 border-2 rounded-lg text-left transition-all ${
              selectedRole === 'student'
                ? 'border-[#7C3AED] bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="font-bold text-lg mb-1">I'm a Student</h3>
            <p className="text-gray-500 text-sm">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry
            </p>
          </button>

          {/* Teacher Card */}
          <button
            onClick={() => setSelectedRole('teacher')}
            className={`flex-1 p-6 border-2 rounded-lg text-left transition-all ${
              selectedRole === 'teacher'
                ? 'border-[#7C3AED] bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="font-bold text-lg mb-1">I'm a Teacher</h3>
            <p className="text-gray-500 text-sm">
              Submit answers and view live poll results in real-time.
            </p>
          </button>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedRole}
          className="px-12 py-3 bg-[#7C3AED] text-white rounded-full font-medium hover:bg-[#6D28D9] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
