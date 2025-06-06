import { createClient } from '@libsql/client';
import { Student } from '../types';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: string;
  correctAnswerId?: string;
  sampleAnswer?: string;
  image?: string;
  options: Option[];
}

export interface Option {
  id: string;
  text: string;
}

// Helper function to map database types back to frontend types
const mapQuestionTypeFromDB = (dbType: string): string => {
  switch (dbType) {
    case 'multiple_choice':
      return 'multiple-choice';
    case 'true_false':
      return 'true-false';
    case 'text':
      return 'subjective';
    default:
      return dbType;
  }
};

const client = createClient({
  url: 'libsql://quizmaster-ants.aws-ap-south-1.turso.io',
  authToken: import.meta.env.VITE_DB_AUTH_TOKEN
});

export async function initializeDatabase() {
  // First check if tables exist
  try {
    // Check if questions table exists and has the correct schema
    const tablesExist = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'");
    
    if (tablesExist.rows.length > 0) {
      // If table exists, check if it has the correct schema including image column
      const tableInfo = await client.execute("PRAGMA table_info(questions)");
      const hasIdColumn = tableInfo.rows.some((row: any) => row.name === 'id');
      const hasImageColumn = tableInfo.rows.some((row: any) => row.name === 'image');
      
      // If schema mismatch is detected (missing image column), add it
      if (hasIdColumn && !hasImageColumn) {
        console.log("Adding image column to questions table...");
        await client.execute("ALTER TABLE questions ADD COLUMN image TEXT");
        console.log("Image column added successfully");
        return;
      }
      
      // If basic schema mismatch is detected, backup and recreate tables
      if (!hasIdColumn) {
        console.log("Schema mismatch detected. Backing up and recreating database tables...");
        
        // Attempt to backup data (could extend this to actually migrate data if needed)
        await client.execute("CREATE TABLE IF NOT EXISTS backup_questions AS SELECT * FROM questions");
        
        // Drop tables in reverse order due to foreign key constraints
        await client.execute("DROP TABLE IF EXISTS responses");
        await client.execute("DROP TABLE IF EXISTS options");
        await client.execute("DROP TABLE IF EXISTS questions");
        await client.execute("DROP TABLE IF EXISTS quizzes");
        await client.execute("DROP TABLE IF EXISTS students");
      } else {
        console.log("Database schema is correct");
        return; // Everything is fine, return early
      }
    }
  } catch (err) {
    console.error("Error checking schema:", err);
    // If error occurs, we'll just proceed to create tables
  }

  console.log("Creating database tables...");
  
  // Create tables if they don't exist
  await client.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      google_id TEXT UNIQUE,
      profile_picture TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      text TEXT NOT NULL,
      type TEXT NOT NULL,
      correct_answer_id TEXT,
      sample_answer TEXT,
      image TEXT,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_option_id TEXT,
      text_answer TEXT,
      is_correct BOOLEAN NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);
  
  console.log("Database initialization complete");
}

export async function createStudent(studentData: { name: string; email?: string; googleId?: string; profilePicture?: string }) {
  const id = crypto.randomUUID();
  
  await client.execute({
    sql: 'INSERT INTO students (id, name, email, google_id, profile_picture) VALUES (?, ?, ?, ?, ?)',
    args: [id, studentData.name, studentData.email || null, studentData.googleId || null, studentData.profilePicture || null]
  });

  return id;
}

export async function saveQuiz(quiz: Quiz) {
  await client.execute({
    sql: 'INSERT INTO quizzes (id, title, description) VALUES (?, ?, ?)',
    args: [quiz.id, quiz.title, quiz.description || null]
  });

  for (const question of quiz.questions) {
    await client.execute({
      sql: 'INSERT INTO questions (id, quiz_id, text, type, correct_answer_id, sample_answer, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [question.id, quiz.id, question.text, question.type, question.correctAnswerId || null, question.sampleAnswer || null, question.image || null]
    });

    for (const option of question.options) {
      await client.execute({
        sql: 'INSERT INTO options (id, question_id, text) VALUES (?, ?, ?)',
        args: [option.id, question.id, option.text]
      });
    }
  }

  return quiz.id;
}

export async function saveQuizMetadata(quiz: { id: string; title: string; description?: string }) {
  await client.execute({
    sql: 'INSERT INTO quizzes (id, title, description) VALUES (?, ?, ?)',
    args: [quiz.id, quiz.title, quiz.description || null]
  });
  return quiz.id;
}

export async function updateQuizMetadata(quiz: { id: string; title: string; description?: string }) {
  await client.execute({
    sql: 'UPDATE quizzes SET title = ?, description = ? WHERE id = ?',
    args: [quiz.title, quiz.description || null, quiz.id]
  });
  return quiz.id;
}

export async function addQuestionToQuiz(quizId: string, question: Question) {
  await client.execute({
    sql: 'INSERT INTO questions (id, quiz_id, text, type, correct_answer_id, sample_answer, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [question.id, quizId, question.text, question.type, question.correctAnswerId || null, question.sampleAnswer || null, question.image || null]
  });

  for (const option of question.options) {
    await client.execute({
      sql: 'INSERT INTO options (id, question_id, text) VALUES (?, ?, ?)',
      args: [option.id, question.id, option.text]
    });
  }

  return question.id;
}

export async function getQuizMetadata(quizId: string) {
  const result = await client.execute({
    sql: 'SELECT * FROM quizzes WHERE id = ?',
    args: [quizId]
  });
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function getQuizzes() {
  const result = await client.execute('SELECT * FROM quizzes ORDER BY created_at DESC');
  return result.rows as any[];
}

export async function getQuizWithQuestions(quizId: string) {
  const quiz = await client.execute({
    sql: 'SELECT * FROM quizzes WHERE id = ?',
    args: [quizId]
  });

  if (!quiz.rows.length) return null;

  const questions = await client.execute({
    sql: `
      SELECT 
        q.*,
        o.id as option_id,
        o.text as option_text
      FROM questions q
      LEFT JOIN options o ON o.question_id = q.id
      WHERE q.quiz_id = ?
      ORDER BY q.id, o.id
    `,
    args: [quizId]
  });

  // Transform the flat results into nested structure
  const questionMap = new Map();
  questions.rows.forEach((row: any) => {
    if (!questionMap.has(row.id)) {
      questionMap.set(row.id, {
        id: row.id,
        text: row.text,
        type: mapQuestionTypeFromDB(row.type),
        correctAnswerId: row.correct_answer_id,
        sampleAnswer: row.sample_answer,
        image: row.image,
        options: []
      });
    }
    if (row.option_id) {
      questionMap.get(row.id).options.push({
        id: row.option_id,
        text: row.option_text
      });
    }
  });

  return {
    ...quiz.rows[0],
    questions: Array.from(questionMap.values())
  };
}

export async function saveStudentResponse(response: {
  studentId: string;
  quizId: string;
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  isCorrect: boolean;
}) {
  const responseId = crypto.randomUUID();
  
  await client.execute({
    sql: `
      INSERT INTO responses (
        id, student_id, quiz_id, question_id, 
        selected_option_id, text_answer, is_correct
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      responseId,
      response.studentId,
      response.quizId,
      response.questionId,
      response.selectedOptionId || null,
      response.textAnswer || null,
      response.isCorrect ? 1 : 0
    ]
  });

  return responseId;
}

export async function getStudentResults(studentId: string) {
  const results = await client.execute({
    sql: `
      SELECT 
        q.text as question_text,
        r.text_answer as student_answer,
        o.text as selected_option_text,
        co.text as correct_option_text,
        r.is_correct,
        r.created_at as timestamp
      FROM responses r
      JOIN questions q ON q.id = r.question_id
      LEFT JOIN options o ON o.id = r.selected_option_id
      LEFT JOIN options co ON co.id = q.correct_answer_id
      WHERE r.student_id = ?
      ORDER BY r.created_at
    `,
    args: [studentId]
  });

  return results.rows.map((row: any) => ({
    question_text: row.question_text,
    student_answer: row.student_answer || row.selected_option_text,
    correct_answer: row.correct_option_text,
    is_correct: row.is_correct,
    timestamp: row.timestamp
  }));
}

export async function getQuestions(quizId: string) {
  const questions = await client.execute({
    sql: `
      SELECT 
        q.*,
        o.id as option_id,
        o.text as option_text
      FROM questions q
      LEFT JOIN options o ON o.question_id = q.id
      WHERE q.quiz_id = ?
      ORDER BY q.id, o.id
    `,
    args: [quizId]
  });

  // Transform the flat results into nested structure
  const questionMap = new Map();
  questions.rows.forEach((row: any) => {
    if (!questionMap.has(row.id)) {
      questionMap.set(row.id, {
        id: row.id,
        text: row.text,
        type: mapQuestionTypeFromDB(row.type),
        correctAnswerId: row.correct_answer_id,
        sampleAnswer: row.sample_answer,
        image: row.image,
        options: []
      });
    }
    if (row.option_id) {
      questionMap.get(row.id).options.push({
        id: row.option_id,
        text: row.option_text
      });
    }
  });

  return Array.from(questionMap.values());
}

export const saveResponse = saveStudentResponse;

export async function getQuizResponses(quizId?: string) {
  let sql = `
    SELECT 
      r.quiz_id, 
      r.student_id, 
      r.question_id, 
      r.selected_option_id, 
      r.is_correct,
      r.created_at,
      q.id as question_id
    FROM responses r
    JOIN questions q ON r.question_id = q.id
  `;
  
  const args: any[] = [];
  
  if (quizId) {
    sql += ' WHERE r.quiz_id = ?';
    args.push(quizId);
  }
  
  sql += ' ORDER BY r.created_at DESC';
  
  const result = await client.execute({
    sql,
    args
  });
  
  // Process the results to group by student and quiz
  const responseMap = new Map();
  
  for (const row of result.rows as any[]) {
    const responseKey = `${row.quiz_id}_${row.student_id}`;
    
    if (!responseMap.has(responseKey)) {
      responseMap.set(responseKey, {
        quizId: row.quiz_id,
        userId: row.student_id,
        timestamp: row.created_at,
        answers: {},
        correctAnswers: 0,
        totalQuestions: 0
      });
    }
    
    const response = responseMap.get(responseKey);
    response.answers[row.question_id] = row.selected_option_id;
    response.totalQuestions++;
    if (row.is_correct) {
      response.correctAnswers++;
    }
  }
  
  // Calculate scores and format responses
  return Array.from(responseMap.values()).map(response => ({
    quizId: response.quizId,
    userId: response.userId,
    timestamp: response.timestamp,
    answers: response.answers,
    score: response.totalQuestions > 0 
      ? Math.round((response.correctAnswers / response.totalQuestions) * 100) 
      : 0
  }));
}

export async function deleteQuiz(quizId: string) {
  try {
    // First, get all questions to delete associated options and responses
    const questionResult = await client.execute({
      sql: 'SELECT id FROM questions WHERE quiz_id = ?',
      args: [quizId]
    });
    
    const questionIds = questionResult.rows.map((row: any) => row.id);
    
    // Use batch operations for atomic execution
    const statements = [
      // Delete responses for this quiz
      {
        sql: 'DELETE FROM responses WHERE quiz_id = ?',
        args: [quizId]
      }
    ];
    
    // Add delete statements for options for each question
    if (questionIds.length > 0) {
      for (const questionId of questionIds) {
        statements.push({
          sql: 'DELETE FROM options WHERE question_id = ?',
          args: [questionId]
        });
      }
    }
    
    // Add delete statements for questions and quiz
    statements.push(
      {
        sql: 'DELETE FROM questions WHERE quiz_id = ?',
        args: [quizId]
      },
      {
        sql: 'DELETE FROM quizzes WHERE id = ?',
        args: [quizId]
      }
    );
    
    // Execute all statements atomically
    await client.batch(statements, "write");
    
    return true;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
}

export async function getStudentById(studentId: string) {
  const result = await client.execute({
    sql: 'SELECT * FROM students WHERE id = ?',
    args: [studentId]
  });
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

export async function getStudentsByIds(studentIds: string[]) {
  if (!studentIds.length) return [];
  
  // Create placeholders for the IN clause
  const placeholders = studentIds.map(() => '?').join(',');
  
  const result = await client.execute({
    sql: `SELECT * FROM students WHERE id IN (${placeholders})`,
    args: studentIds
  });
  
  return result.rows;
}

export async function findStudentByGoogleId(googleId: string): Promise<Student | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM students WHERE google_id = ?',
    args: [googleId]
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as any;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    googleId: row.google_id,
    profilePicture: row.profile_picture,
    createdAt: row.created_at
  };
}

export async function findStudentByEmail(email: string): Promise<Student | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM students WHERE email = ?',
    args: [email]
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as any;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    googleId: row.google_id,
    profilePicture: row.profile_picture,
    createdAt: row.created_at
  };
}

export async function getStudentQuizResults(studentId: string, quizId: string) {
  const results = await client.execute({
    sql: `
      SELECT 
        q.text as question_text,
        r.text_answer as student_answer,
        o.text as selected_option_text,
        co.text as correct_option_text,
        r.is_correct,
        r.created_at as timestamp,
        qz.title as quiz_title,
        qz.description as quiz_description
      FROM responses r
      JOIN questions q ON q.id = r.question_id
      JOIN quizzes qz ON qz.id = r.quiz_id
      LEFT JOIN options o ON o.id = r.selected_option_id
      LEFT JOIN options co ON co.id = q.correct_answer_id
      WHERE r.student_id = ? AND r.quiz_id = ?
      ORDER BY r.created_at
    `,
    args: [studentId, quizId]
  });

  return {
    quiz: results.rows.length > 0 ? {
      title: (results.rows[0] as any).quiz_title,
      description: (results.rows[0] as any).quiz_description
    } : null,
    results: results.rows.map((row: any) => ({
      question_text: row.question_text,
      student_answer: row.student_answer || row.selected_option_text,
      correct_answer: row.correct_option_text,
      is_correct: row.is_correct,
      timestamp: row.timestamp
    }))
  };
}

export async function hasStudentCompletedQuiz(studentId: string, quizId: string): Promise<boolean> {
  const result = await client.execute({
    sql: 'SELECT COUNT(*) as count FROM responses WHERE student_id = ? AND quiz_id = ?',
    args: [studentId, quizId]
  });
  
  return (result.rows[0] as any).count > 0;
}

export async function getStudentQuizCompletion(studentId: string): Promise<string[]> {
  const result = await client.execute({
    sql: 'SELECT DISTINCT quiz_id FROM responses WHERE student_id = ?',
    args: [studentId]
  });
  
  return result.rows.map((row: any) => row.quiz_id);
}

export default client;