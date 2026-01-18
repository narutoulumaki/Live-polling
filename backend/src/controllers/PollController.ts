import { Request, Response } from 'express';
import { pollService } from '../services/PollService';

export class PollController {
  // Create a new poll (Teacher only)
  async createPoll(req: Request, res: Response) {
    try {
      const { question, options, duration } = req.body;

      if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'Question and at least 2 options are required' });
      }

      const durationSeconds = duration || 60; // Default 60 seconds

      const poll = await pollService.createPoll({
        question,
        options,
        duration: durationSeconds
      });

      res.status(201).json(poll);
    } catch (error: any) {
      console.error('Error creating poll:', error);
      res.status(400).json({ error: error.message || 'Failed to create poll' });
    }
  }

  // Get active poll
  async getActivePoll(req: Request, res: Response) {
    try {
      const poll = await pollService.getActivePoll();
      res.json({ poll });
    } catch (error: any) {
      console.error('Error getting active poll:', error);
      res.status(500).json({ error: 'Failed to get active poll' });
    }
  }

  // Get poll by ID
  async getPollById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const poll = await pollService.getPollById(id);

      if (!poll) {
        return res.status(404).json({ error: 'Poll not found' });
      }

      res.json(poll);
    } catch (error: any) {
      console.error('Error getting poll:', error);
      res.status(500).json({ error: 'Failed to get poll' });
    }
  }

  // Submit vote
  async submitVote(req: Request, res: Response) {
    try {
      const { pollId, optionId, studentId, studentName } = req.body;

      if (!pollId || !optionId || !studentId || !studentName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const poll = await pollService.submitVote(pollId, optionId, studentId, studentName);
      res.json(poll);
    } catch (error: any) {
      console.error('Error submitting vote:', error);
      res.status(400).json({ error: error.message || 'Failed to submit vote' });
    }
  }

  // Check if student voted
  async checkVote(req: Request, res: Response) {
    try {
      const { pollId, studentId } = req.params;
      const hasVoted = await pollService.hasStudentVoted(pollId, studentId);
      res.json({ hasVoted });
    } catch (error: any) {
      console.error('Error checking vote:', error);
      res.status(500).json({ error: 'Failed to check vote status' });
    }
  }

  // End poll
  async endPoll(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const poll = await pollService.endPoll(id);
      res.json(poll);
    } catch (error: any) {
      console.error('Error ending poll:', error);
      res.status(500).json({ error: 'Failed to end poll' });
    }
  }

  // Get poll history
  async getPollHistory(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const polls = await pollService.getPollHistory(limit);
      res.json({ polls });
    } catch (error: any) {
      console.error('Error getting poll history:', error);
      res.status(500).json({ error: 'Failed to get poll history' });
    }
  }
}

export const pollController = new PollController();
