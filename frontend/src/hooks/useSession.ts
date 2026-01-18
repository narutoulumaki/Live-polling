import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'polling_session_id';
const NAME_KEY = 'polling_student_name';

interface UseSessionReturn {
  sessionId: string;
  studentName: string | null;
  setStudentName: (name: string) => void;
  clearSession: () => void;
}

export function useSession(): UseSessionReturn {
  const [sessionId, setSessionId] = useState<string>('');
  const [studentName, setStudentNameState] = useState<string | null>(null);

  useEffect(() => {
    // Get or create session ID (unique per tab)
    let storedSessionId = sessionStorage.getItem(SESSION_KEY);
    
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      sessionStorage.setItem(SESSION_KEY, storedSessionId);
    }
    
    setSessionId(storedSessionId);

    // Get stored name
    const storedName = sessionStorage.getItem(NAME_KEY);
    if (storedName) {
      setStudentNameState(storedName);
    }
  }, []);

  const setStudentName = (name: string) => {
    sessionStorage.setItem(NAME_KEY, name);
    setStudentNameState(name);
  };

  const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(NAME_KEY);
    setStudentNameState(null);
  };

  return {
    sessionId,
    studentName,
    setStudentName,
    clearSession
  };
}
