'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from '@/hooks/useSession';
import { usePollTimer, formatTime } from '@/hooks/usePollTimer';
import { Loader2, Clock, X, AlertCircle, Sparkles, MessageCircle } from 'lucide-react';

export default function StudentPage() {
  const { sessionId, studentName, setStudentName } = useSession();
  const {
    isConnected,
    currentPoll,
    hasVoted,
    error,
    isKicked,
    connectedStudents,
    joinAsStudent,
    submitVote,
    clearError
  } = useSocket();

  const [name, setName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false); // not using this rn

  const { remainingTime, isExpired } = usePollTimer(
    currentPoll?.endTime || null,
    currentPoll?.duration || 0
  );

  // auto join if already entered name before (handles page refresh)
  useEffect(() => {
    if (isConnected && sessionId && studentName) {
      joinAsStudent(sessionId, studentName);
      setIsJoined(true);
    }
  }, [isConnected, sessionId, studentName, joinAsStudent]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && sessionId) {
      setStudentName(name.trim());
      joinAsStudent(sessionId, name.trim());
      setIsJoined(true);
    }
  };

  const handleVote = () => {
    if (selectedOption && currentPoll && !hasVoted && !isExpired) {
      setIsSubmitting(true);
      submitVote(currentPoll.id, selectedOption);
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  // Kicked out screen
  if (isKicked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="flex items-center gap-2 bg-[#7C3AED] text-white px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Intervue Poll</span>
        </div>
        <h1 className="text-3xl font-bold text-center mb-4">You've been Kicked out !</h1>
        <p className="text-gray-500 text-center max-w-md">
          Looks like the teacher had removed you from the poll system. Please Try again sometime.
        </p>
      </div>
    );
  }

  // Loading while connecting
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="flex items-center gap-2 bg-[#7C3AED] text-white px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Intervue Poll</span>
        </div>
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-gray-600">Connecting to server...</p>
      </div>
    );
  }

  // Name entry form
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
        <div className="h-16 bg-[#1a1a2e]" />
        <div className="flex-1 bg-white flex flex-col items-center justify-center px-4">
          <div className="flex items-center gap-2 bg-[#7C3AED] text-white px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium text-sm">Intervue Poll</span>
          </div>

          <h1 className="text-3xl md:text-4xl text-center mb-2">
            Let's <span className="font-bold">Get Started</span>
          </h1>
          
          <p className="text-gray-500 text-center mb-10 max-w-lg">
            If you're a student, you'll be able to <span className="font-semibold text-gray-700">submit your answers</span>, participate in live polls, and see how your responses compare with your classmates
          </p>

          <form onSubmit={handleJoin} className="w-full max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rahul Bajaj"
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:outline-none text-gray-800 mb-6"
              autoFocus
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3 bg-[#7C3AED] text-white rounded-full font-medium hover:bg-[#6D28D9] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </form>
        </div>

        {/* Chat FAB */}
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#7C3AED] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#6D28D9] transition-colors">
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // Waiting for poll
  if (!currentPoll) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        {/* Error Toast */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 z-50">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={clearError} className="ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 bg-[#7C3AED] text-white px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Intervue Poll</span>
        </div>
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Wait for the teacher to ask questions..
        </h2>

        {/* Chat FAB */}
        <button 
          onClick={() => setShowChatPanel(!showChatPanel)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#7C3AED] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#6D28D9] transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // Active poll view (voting or results)
  const showResults = hasVoted || isExpired || !currentPoll.isActive;
  const questionNumber = 1; // Could track this from backend

  return (
    <div className="min-h-screen bg-white p-6 relative">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 z-50">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={clearError} className="ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Question Header */}
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl font-bold">Question {questionNumber}</h2>
          {currentPoll.isActive && !isExpired && (
            <div className="flex items-center gap-1 text-red-500">
              <Clock className="w-5 h-5" />
              <span className="font-mono font-bold">{formatTime(remainingTime)}</span>
            </div>
          )}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 mb-6">
          {/* Question Header */}
          <div className="bg-[#4A4A5A] text-white px-6 py-4">
            <p className="text-lg">{currentPoll.question}</p>
          </div>

          {/* Options */}
          <div className="p-4 space-y-3">
            {currentPoll.options.map((option, index) => (
              <div key={option.id} className="relative">
                {showResults ? (
                  // Results view with progress bars
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-3 p-3 w-full relative">
                      <span className="w-8 h-8 bg-[#7C3AED] text-white rounded-full flex items-center justify-center text-sm font-medium z-10">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 z-10">{option.text}</span>
                      <span className="ml-auto text-gray-600 font-medium z-10">{option.percentage}%</span>
                      {/* Progress bar background */}
                      <div 
                        className="absolute left-0 top-0 h-full bg-[#7C3AED] opacity-30 transition-all duration-500"
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  // Voting view
                  <button
                    onClick={() => setSelectedOption(option.id)}
                    className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg transition-all ${
                      selectedOption === option.id
                        ? 'border-[#7C3AED] bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      selectedOption === option.id
                        ? 'bg-[#7C3AED] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{option.text}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button or Wait Message */}
        {!showResults ? (
          <div className="flex justify-center">
            <button
              onClick={handleVote}
              disabled={!selectedOption || isSubmitting}
              className="px-12 py-3 bg-[#7C3AED] text-white rounded-full font-medium hover:bg-[#6D28D9] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-700 font-medium">
            Wait for the teacher to ask a new question..
          </p>
        )}
      </div>

      {/* Chat/Participants Panel */}
      {showChatPanel && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setShowParticipants(false)}
              className={`flex-1 py-3 text-sm font-medium ${
                !showParticipants ? 'text-gray-800 border-b-2 border-[#7C3AED]' : 'text-gray-500'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setShowParticipants(true)}
              className={`flex-1 py-3 text-sm font-medium ${
                showParticipants ? 'text-gray-800 border-b-2 border-[#7C3AED]' : 'text-gray-500'
              }`}
            >
              Participants
            </button>
          </div>

          {/* Content */}
          <div className="h-80 overflow-y-auto p-4">
            {showParticipants ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Name</div>
                {connectedStudents.map((student, index) => (
                  <div key={index} className="text-gray-700">{student}</div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                Chat feature coming soon...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat FAB */}
      <button 
        onClick={() => setShowChatPanel(!showChatPanel)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#7C3AED] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#6D28D9] transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
