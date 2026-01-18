import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
}

export interface Poll {
  id: string;
  question: string;
  duration: number;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  options: PollOption[];
  totalVotes: number;
  remainingTime: number;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  currentPoll: Poll | null;
  hasVoted: boolean;
  error: string | null;
  studentCount: number;
  pollHistory: Poll[];
  isKicked: boolean;
  connectedStudents: string[];
  
  // Actions
  joinAsTeacher: () => void;
  joinAsStudent: (sessionId: string, name: string) => void;
  createPoll: (question: string, options: string[], duration: number) => void;
  submitVote: (pollId: string, optionId: string) => void;
  endPoll: (pollId: string) => void;
  getHistory: () => void;
  kickStudent: (sessionId: string) => void;
  clearError: () => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [pollHistory, setPollHistory] = useState<Poll[]>([]);
  const [isKicked, setIsKicked] = useState(false);
  const [connectedStudents, setConnectedStudents] = useState<string[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server. Retrying...');
    });

    // Poll state (for initial load / reconnection)
    socket.on('poll:state', (data: { poll: Poll | null; hasVoted?: boolean }) => {
      setCurrentPoll(data.poll);
      if (data.hasVoted !== undefined) {
        setHasVoted(data.hasVoted);
      }
    });

    // New poll created
    socket.on('poll:new', (data: { poll: Poll }) => {
      setCurrentPoll(data.poll);
      setHasVoted(false);
    });

    // Poll results updated
    socket.on('poll:results', (data: { poll: Poll }) => {
      setCurrentPoll(data.poll);
    });

    // Poll ended
    socket.on('poll:ended', (data: { poll: Poll }) => {
      setCurrentPoll(data.poll);
    });

    // Vote confirmed
    socket.on('vote:confirmed', (data: { poll: Poll }) => {
      setCurrentPoll(data.poll);
      setHasVoted(true);
    });

    // Student count
    socket.on('students:count', (data: { count: number }) => {
      setStudentCount(data.count);
    });

    // Connected students list
    socket.on('students:list', (data: { students: string[] }) => {
      setConnectedStudents(data.students);
    });

    // Poll history
    socket.on('poll:history', (data: { polls: Poll[] }) => {
      setPollHistory(data.polls);
    });

    // Error handling
    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    // Kicked by teacher
    socket.on('kicked', (data: { message: string }) => {
      setIsKicked(true);
      setError(data.message);
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinAsTeacher = useCallback(() => {
    socketRef.current?.emit('teacher:join');
  }, []);

  const joinAsStudent = useCallback((sessionId: string, name: string) => {
    socketRef.current?.emit('student:join', { sessionId, name });
  }, []);

  const createPoll = useCallback((question: string, options: string[], duration: number) => {
    socketRef.current?.emit('poll:create', { question, options, duration });
  }, []);

  const submitVote = useCallback((pollId: string, optionId: string) => {
    socketRef.current?.emit('poll:vote', { pollId, optionId });
  }, []);

  const endPoll = useCallback((pollId: string) => {
    socketRef.current?.emit('poll:end', { pollId });
  }, []);

  const getHistory = useCallback(() => {
    socketRef.current?.emit('poll:getHistory');
  }, []);

  const kickStudent = useCallback((sessionId: string) => {
    socketRef.current?.emit('student:kick', { sessionId });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    currentPoll,
    hasVoted,
    error,
    studentCount,
    pollHistory,
    isKicked,
    connectedStudents,
    joinAsTeacher,
    joinAsStudent,
    createPoll,
    submitVote,
    endPoll,
    getHistory,
    kickStudent,
    clearError
  };
}
