import prisma from '../prisma';

class StudentService {
  // register student or update name if exists
  async registerStudent(sessionId: string, name: string): Promise<{ id: string; sessionId: string; name: string }> {
    // Check if student with this session already exists
    const existing = await prisma.student.findUnique({
      where: { sessionId }
    });

    if (existing) {
      // Update name if different
      if (existing.name !== name) {
        const updated = await prisma.student.update({
          where: { sessionId },
          data: { name }
        });
        return { id: updated.id, sessionId: updated.sessionId, name: updated.name };
      }
      return { id: existing.id, sessionId: existing.sessionId, name: existing.name };
    }

    // Create new student
    const student = await prisma.student.create({
      data: { sessionId, name }
    });

    return { id: student.id, sessionId: student.sessionId, name: student.name };
  }

  // Get student by session ID
  async getStudentBySession(sessionId: string): Promise<{ id: string; sessionId: string; name: string } | null> {
    const student = await prisma.student.findUnique({
      where: { sessionId }
    });

    if (!student) return null;
    return { id: student.id, sessionId: student.sessionId, name: student.name };
  }

  // Get all connected students (for teacher view)
  async getAllStudents(): Promise<{ id: string; name: string }[]> {
    const students = await prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return students.map(s => ({ id: s.id, name: s.name }));
  }

  // Remove student
  async removeStudent(studentId: string): Promise<void> {
    await prisma.student.delete({
      where: { id: studentId }
    }).catch(() => {
      // Ignore if not found
    });
  }
}

export const studentService = new StudentService();
