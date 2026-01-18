import { Server, Socket } from 'socket.io';
import { pollService, PollWithResults } from '../services/PollService';
import { studentService } from '../services/StudentService';

interface ConnectedUser {
  socketId: string;
  sessionId: string;
  name: string;
  role: 'teacher' | 'student';
}

class PollSocketHandler {
  private io: Server;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private pollTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Teacher joins
      socket.on('teacher:join', async () => {
        this.connectedUsers.set(socket.id, {
          socketId: socket.id,
          sessionId: 'teacher',
          name: 'Teacher',
          role: 'teacher'
        });
        socket.join('teachers');
        
        // Send current state
        const activePoll = await pollService.getActivePoll();
        socket.emit('poll:state', { poll: activePoll });
        
        // Send connected students count and list
        const studentCount = this.getStudentCount();
        const studentList = this.getStudentList();
        socket.emit('students:count', { count: studentCount });
        socket.emit('students:list', { students: studentList });
        
        console.log('Teacher joined');
      });

      // Student joins with name
      socket.on('student:join', async (data: { sessionId: string; name: string }) => {
        try {
          const { sessionId, name } = data;
          
          // Register student in DB
          const student = await studentService.registerStudent(sessionId, name);
          
          this.connectedUsers.set(socket.id, {
            socketId: socket.id,
            sessionId,
            name,
            role: 'student'
          });
          socket.join('students');
          
          // Send current poll state (for late joiners / refresh)
          const activePoll = await pollService.getActivePoll();
          if (activePoll) {
            const hasVoted = await pollService.hasStudentVoted(activePoll.id, sessionId);
            socket.emit('poll:state', { poll: activePoll, hasVoted });
          } else {
            socket.emit('poll:state', { poll: null, hasVoted: false });
          }
          
          // Notify teachers of new student
          const studentCount = this.getStudentCount();
          const studentList = this.getStudentList();
          this.io.to('teachers').emit('students:count', { count: studentCount });
          this.io.to('teachers').emit('students:list', { students: studentList });
          this.io.to('teachers').emit('student:joined', { name, sessionId });
          
          console.log(`Student joined: ${name} (${sessionId})`);
        } catch (error) {
          console.error('Error joining student:', error);
          socket.emit('error', { message: 'Failed to join' });
        }
      });

      // Teacher creates a poll
      socket.on('poll:create', async (data: { question: string; options: string[]; duration: number }) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (user?.role !== 'teacher') {
            socket.emit('error', { message: 'Only teachers can create polls' });
            return;
          }

          const poll = await pollService.createPoll(data);
          
          // Start timer for auto-end
          this.startPollTimer(poll.id, poll.duration);
          
          // Broadcast to all clients
          this.io.emit('poll:new', { poll });
          
          console.log(`Poll created: ${poll.question}`);
        } catch (error: any) {
          console.error('Error creating poll:', error);
          socket.emit('error', { message: error.message || 'Failed to create poll' });
        }
      });

      // Student submits vote
      socket.on('poll:vote', async (data: { pollId: string; optionId: string }) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (!user || user.role !== 'student') {
            socket.emit('error', { message: 'Only students can vote' });
            return;
          }

          const { pollId, optionId } = data;
          const poll = await pollService.submitVote(pollId, optionId, user.sessionId, user.name);
          
          // Send confirmation to voter
          socket.emit('vote:confirmed', { poll });
          
          // Broadcast updated results to all
          this.io.emit('poll:results', { poll });
          
          console.log(`Vote received from ${user.name} for poll ${pollId}`);
        } catch (error: any) {
          console.error('Error submitting vote:', error);
          socket.emit('error', { message: error.message || 'Failed to submit vote' });
        }
      });

      // Teacher ends poll manually
      socket.on('poll:end', async (data: { pollId: string }) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (user?.role !== 'teacher') {
            socket.emit('error', { message: 'Only teachers can end polls' });
            return;
          }

          const poll = await pollService.endPoll(data.pollId);
          
          // Clear timer
          this.clearPollTimer(data.pollId);
          
          // Broadcast poll ended
          this.io.emit('poll:ended', { poll });
          
          console.log(`Poll ended: ${poll.question}`);
        } catch (error: any) {
          console.error('Error ending poll:', error);
          socket.emit('error', { message: error.message || 'Failed to end poll' });
        }
      });

      // Request current state (for reconnection)
      socket.on('poll:getState', async () => {
        try {
          const user = this.connectedUsers.get(socket.id);
          const activePoll = await pollService.getActivePoll();
          
          let hasVoted = false;
          if (activePoll && user?.role === 'student') {
            hasVoted = await pollService.hasStudentVoted(activePoll.id, user.sessionId);
          }
          
          socket.emit('poll:state', { poll: activePoll, hasVoted });
        } catch (error) {
          console.error('Error getting poll state:', error);
          socket.emit('error', { message: 'Failed to get poll state' });
        }
      });

      // Get poll history
      socket.on('poll:getHistory', async () => {
        try {
          const polls = await pollService.getPollHistory(20);
          socket.emit('poll:history', { polls });
        } catch (error) {
          console.error('Error getting poll history:', error);
          socket.emit('error', { message: 'Failed to get poll history' });
        }
      });

      // Teacher kicks a student (bonus feature)
      socket.on('student:kick', async (data: { sessionId: string }) => {
        try {
          const user = this.connectedUsers.get(socket.id);
          if (user?.role !== 'teacher') {
            return;
          }

          // Find and disconnect the student by name or sessionId
          for (const [socketId, connectedUser] of this.connectedUsers.entries()) {
            if (connectedUser.sessionId === data.sessionId || connectedUser.name === data.sessionId) {
              const studentSocket = this.io.sockets.sockets.get(socketId);
              if (studentSocket) {
                studentSocket.emit('kicked', { message: 'You have been removed by the teacher' });
                studentSocket.disconnect(true);
              }
              this.connectedUsers.delete(socketId);
              break;
            }
          }

          // Update count and list
          const studentCount = this.getStudentCount();
          const studentList = this.getStudentList();
          this.io.to('teachers').emit('students:count', { count: studentCount });
          this.io.to('teachers').emit('students:list', { students: studentList });
        } catch (error) {
          console.error('Error kicking student:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const user = this.connectedUsers.get(socket.id);
        if (user) {
          console.log(`${user.role} disconnected: ${user.name}`);
          this.connectedUsers.delete(socket.id);
          
          if (user.role === 'student') {
            const studentCount = this.getStudentCount();
            const studentList = this.getStudentList();
            this.io.to('teachers').emit('students:count', { count: studentCount });
            this.io.to('teachers').emit('students:list', { students: studentList });
            this.io.to('teachers').emit('student:left', { name: user.name, sessionId: user.sessionId });
          }
        }
      });
    });
  }

  private startPollTimer(pollId: string, duration: number) {
    // Clear existing timer if any
    this.clearPollTimer(pollId);

    const timer = setTimeout(async () => {
      try {
        const poll = await pollService.endPoll(pollId);
        this.io.emit('poll:ended', { poll });
        this.pollTimers.delete(pollId);
        console.log(`Poll auto-ended: ${pollId}`);
      } catch (error) {
        console.error('Error auto-ending poll:', error);
      }
    }, duration * 1000);

    this.pollTimers.set(pollId, timer);
  }

  private clearPollTimer(pollId: string) {
    const timer = this.pollTimers.get(pollId);
    if (timer) {
      clearTimeout(timer);
      this.pollTimers.delete(pollId);
    }
  }

  private getStudentCount(): number {
    let count = 0;
    for (const user of this.connectedUsers.values()) {
      if (user.role === 'student') {
        count++;
      }
    }
    return count;
  }

  private getStudentList(): string[] {
    const students: string[] = [];
    for (const user of this.connectedUsers.values()) {
      if (user.role === 'student') {
        students.push(user.name);
      }
    }
    return students;
  }
}

export function setupSocketHandlers(io: Server) {
  new PollSocketHandler(io);
}
