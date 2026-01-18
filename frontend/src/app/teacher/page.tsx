'use client';

import { useEffect, useState } from 'react';
import { useSocket, Poll } from '@/hooks/useSocket';
import { usePollTimer, formatTime } from '@/hooks/usePollTimer';
import { Plus, Loader2, Clock, X, AlertCircle, Sparkles, MessageCircle, Eye, ChevronDown } from 'lucide-react';

export default function TeacherPage() {
  const {
    isConnected,
    currentPoll,
    error,
    studentCount,
    pollHistory,
    connectedStudents,
    joinAsTeacher,
    createPoll,
    endPoll,
    getHistory,
    kickStudent,
    clearError
  } = useSocket();

  const [showCreateForm, setShowCreateForm] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
  const [duration, setDuration] = useState(60);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true); // keeping this open by default

  const { remainingTime, isExpired } = usePollTimer(
    currentPoll?.endTime || null,
    currentPoll?.duration || 0
  );

  // join room and get history when connected
  useEffect(() => {
    if (isConnected) {
      joinAsTeacher();
      getHistory();
    }
  }, [isConnected, joinAsTeacher, getHistory]);

  // switch to results when poll is active
  useEffect(() => {
    if (currentPoll) {
      setShowCreateForm(false);
    }
  }, [currentPoll]);

  const handleCreatePoll = () => {
    const validOptions = options.filter(o => o.text.trim() !== '').map(o => o.text);
    if (!question.trim() || validOptions.length < 2) {
      return;
    }
    createPoll(question.trim(), validOptions, duration);
    setQuestion('');
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]);
    setDuration(60);
  };

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const handleCorrectChange = (index: number, isCorrect: boolean) => {
    const newOptions = [...options];
    newOptions[index].isCorrect = isCorrect;
    setOptions(newOptions);
  };

  const handleNewQuestion = () => {
    setShowCreateForm(true);
  };

  const canCreatePoll = !currentPoll || !currentPoll.isActive;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 bg-[#7C3AED] text-white px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium text-sm">Intervue Poll</span>
        </div>
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-4" />
        <p className="text-gray-600">Connecting to server...</p>
      </div>
    );
  }

  // Poll History View
  if (showHistory) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl mb-8">
            View <span className="font-bold">Poll History</span>
          </h1>

          {pollHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No previous polls</p>
          ) : (
            <div className="space-y-8">
              {pollHistory.map((poll, pollIndex) => (
                <div key={poll.id}>
                  <h3 className="text-lg font-bold mb-4">Question {pollIndex + 1}</h3>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-[#4A4A5A] text-white px-6 py-4">
                      <p>{poll.question}</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {poll.options.map((option, index) => (
                        <div key={option.id} className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-3 p-3 w-full relative">
                            <span className="w-8 h-8 bg-[#7C3AED] text-white rounded-full flex items-center justify-center text-sm font-medium z-10">
                              {index + 1}
                            </span>
                            <span className="text-gray-700 z-10">{option.text}</span>
                            <span className="ml-auto text-gray-600 font-medium z-10">{option.percentage}%</span>
                            <div 
                              className="absolute left-0 top-0 h-full bg-[#7C3AED] opacity-30 transition-all duration-500"
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={() => setShowHistory(false)}
              className="px-6 py-2 text-[#7C3AED] border border-[#7C3AED] rounded-full hover:bg-purple-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Chat FAB */}
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#7C3AED] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#6D28D9] transition-colors">
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // Create Poll Form
  if (showCreateForm && canCreatePoll) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex">
        {/* Left sidebar */}
        <div className="w-16 bg-[#1a1a2e]" />

        {/* Main content */}
        <div className="flex-1 bg-white p-8">
          <div className="max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 bg-[#7C3AED] text-white px-4 py-2 rounded-full mb-4 w-fit">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium text-sm">Intervue Poll</span>
            </div>

            <h1 className="text-3xl mb-2">
              Let's <span className="font-bold">Get Started</span>
            </h1>
            <p className="text-gray-500 mb-8">
              you'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
            </p>

            {/* Error Toast */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
                <button onClick={clearError} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Question Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Enter your question
                </label>
                <div className="relative">
                  <select 
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                    <option value={90}>90 seconds</option>
                    <option value={120}>120 seconds</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
                  placeholder="Rahul Bajaj"
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:outline-none text-gray-800 min-h-[100px] resize-none"
                  maxLength={100}
                />
                <span className="absolute bottom-3 right-3 text-sm text-gray-400">
                  {question.length}/100
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Edit Options
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Is it Correct?
                </label>
              </div>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="w-8 h-8 bg-[#7C3AED] text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder="Rahul Bajaj"
                        className="flex-1 px-4 py-2 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-[#7C3AED] focus:outline-none text-gray-800"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={option.isCorrect}
                          onChange={() => handleCorrectChange(index, true)}
                          className="w-4 h-4 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <span className="text-sm text-gray-600">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={!option.isCorrect}
                          onChange={() => handleCorrectChange(index, false)}
                          className="w-4 h-4 text-[#7C3AED] focus:ring-[#7C3AED]"
                        />
                        <span className="text-sm text-gray-600">No</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddOption}
                className="mt-4 text-[#7C3AED] text-sm font-medium hover:underline"
              >
                + Add More option
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-16 right-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={handleCreatePoll}
            disabled={!question.trim() || options.filter(o => o.text.trim()).length < 2}
            className="px-8 py-3 bg-[#7C3AED] text-white rounded-full font-medium hover:bg-[#6D28D9] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Ask Question
          </button>
        </div>
      </div>
    );
  }

  // Results View (Live Poll)
  return (
    <div className="min-h-screen bg-white p-8 relative">
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

      {/* View Poll History Button */}
      <div className="flex justify-end mb-8">
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 px-6 py-2 bg-[#7C3AED] text-white rounded-full font-medium hover:bg-[#6D28D9] transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Poll history
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-bold mb-4">Question</h2>

        {/* Question Card */}
        {currentPoll && (
          <div className="rounded-lg overflow-hidden border border-gray-200 mb-6">
            <div className="bg-[#4A4A5A] text-white px-6 py-4">
              <p>{currentPoll.question}</p>
            </div>
            <div className="p-4 space-y-3">
              {currentPoll.options.map((option, index) => (
                <div key={option.id} className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 p-3 w-full relative">
                    <span className="w-8 h-8 bg-[#7C3AED] text-white rounded-full flex items-center justify-center text-sm font-medium z-10">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 z-10">{option.text}</span>
                    <span className="ml-auto text-gray-600 font-medium z-10">{option.percentage}%</span>
                    <div 
                      className="absolute left-0 top-0 h-full bg-[#7C3AED] opacity-30 transition-all duration-500"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask new question button */}
        {canCreatePoll && (
          <div className="flex justify-center">
            <button
              onClick={handleNewQuestion}
              className="flex items-center gap-2 px-8 py-3 bg-[#7C3AED] text-white rounded-full font-medium hover:bg-[#6D28D9] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ask a new question
            </button>
          </div>
        )}

        {/* Active poll timer */}
        {currentPoll && currentPoll.isActive && !isExpired && (
          <div className="flex items-center justify-center gap-2 mt-4 text-orange-600">
            <Clock className="w-5 h-5" />
            <span className="font-mono font-bold text-lg">{formatTime(remainingTime)}</span>
            <span className="text-gray-500">remaining</span>
          </div>
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
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wide mb-4">
                  <span>Name</span>
                  <span>Action</span>
                </div>
                <div className="space-y-3">
                  {connectedStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700">{student}</span>
                      <button
                        onClick={() => kickStudent(student)}
                        className="text-[#7C3AED] text-sm hover:underline"
                      >
                        Kick out
                      </button>
                    </div>
                  ))}
                  {connectedStudents.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No students connected</p>
                  )}
                </div>
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
