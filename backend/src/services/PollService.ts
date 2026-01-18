import prisma from '../prisma';

export interface CreatePollInput {
  question: string;
  options: string[];
  duration: number; // in seconds
}

export interface PollWithResults {
  id: string;
  question: string;
  duration: number;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
  options: {
    id: string;
    text: string;
    voteCount: number;
    percentage: number;
  }[];
  totalVotes: number;
  remainingTime: number;
}

class PollService {
  // Create a new poll
  async createPoll(input: CreatePollInput): Promise<PollWithResults> {
    const { question, options, duration } = input;
    
    // Check if there's an active poll
    const activePoll = await this.getActivePoll();
    if (activePoll) {
      throw new Error('Cannot create a new poll while one is active. Wait for all students to answer or for the timer to expire.');
    }

    const endTime = new Date(Date.now() + duration * 1000);

    const poll = await prisma.poll.create({
      data: {
        question,
        duration,
        endTime,
        isActive: true,
        options: {
          create: options.map(text => ({ text }))
        }
      },
      include: {
        options: true,
        votes: true
      }
    });

    return this.formatPollWithResults(poll);
  }

  // Get active poll
  async getActivePoll(): Promise<PollWithResults | null> {
    const poll = await prisma.poll.findFirst({
      where: {
        isActive: true,
        endTime: { gt: new Date() }
      },
      include: {
        options: {
          include: {
            votes: true
          }
        },
        votes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!poll) {
      // Check if there's a poll that just ended but still active flag
      const expiredPoll = await prisma.poll.findFirst({
        where: { isActive: true },
        include: {
          options: { include: { votes: true } },
          votes: true
        }
      });

      if (expiredPoll) {
        // Mark it as inactive
        await prisma.poll.update({
          where: { id: expiredPoll.id },
          data: { isActive: false }
        });
        return this.formatPollWithResults({ ...expiredPoll, isActive: false });
      }

      return null;
    }

    return this.formatPollWithResults(poll);
  }

  // Get poll by ID
  async getPollById(pollId: string): Promise<PollWithResults | null> {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            votes: true
          }
        },
        votes: true
      }
    });

    if (!poll) return null;
    return this.formatPollWithResults(poll);
  }

  // Submit a vote
  async submitVote(pollId: string, optionId: string, studentId: string, studentName: string): Promise<PollWithResults> {
    // Check if poll exists and is active
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (!poll.isActive || new Date() > poll.endTime) {
      throw new Error('Poll has ended');
    }

    // Check if option belongs to this poll
    const validOption = poll.options.find(o => o.id === optionId);
    if (!validOption) {
      throw new Error('Invalid option');
    }

    // Check if student already voted (race condition prevention)
    const existingVote = await prisma.vote.findUnique({
      where: {
        pollId_studentId: {
          pollId,
          studentId
        }
      }
    });

    if (existingVote) {
      throw new Error('You have already voted on this poll');
    }

    // Create vote
    await prisma.vote.create({
      data: {
        pollId,
        optionId,
        studentId,
        studentName
      }
    });

    // Return updated poll results
    return this.getPollById(pollId) as Promise<PollWithResults>;
  }

  // Check if student has voted
  async hasStudentVoted(pollId: string, studentId: string): Promise<boolean> {
    const vote = await prisma.vote.findUnique({
      where: {
        pollId_studentId: {
          pollId,
          studentId
        }
      }
    });
    return !!vote;
  }

  // End a poll manually
  async endPoll(pollId: string): Promise<PollWithResults> {
    const poll = await prisma.poll.update({
      where: { id: pollId },
      data: { isActive: false },
      include: {
        options: { include: { votes: true } },
        votes: true
      }
    });

    return this.formatPollWithResults(poll);
  }

  // Get poll history
  async getPollHistory(limit: number = 10): Promise<PollWithResults[]> {
    const polls = await prisma.poll.findMany({
      where: { isActive: false },
      include: {
        options: { include: { votes: true } },
        votes: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return polls.map(poll => this.formatPollWithResults(poll));
  }

  // Format poll with calculated results
  private formatPollWithResults(poll: any): PollWithResults {
    const totalVotes = poll.votes?.length || 0;
    const now = new Date();
    const remainingTime = Math.max(0, Math.floor((poll.endTime.getTime() - now.getTime()) / 1000));

    const options = poll.options.map((option: any) => {
      const voteCount = option.votes?.length || 0;
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      return {
        id: option.id,
        text: option.text,
        voteCount,
        percentage
      };
    });

    return {
      id: poll.id,
      question: poll.question,
      duration: poll.duration,
      endTime: poll.endTime,
      isActive: poll.isActive && remainingTime > 0,
      createdAt: poll.createdAt,
      options,
      totalVotes,
      remainingTime
    };
  }
}

export const pollService = new PollService();
