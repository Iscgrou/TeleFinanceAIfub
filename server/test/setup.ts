import { afterAll, beforeAll, beforeEach, vi } from 'vitest';
import { config } from 'dotenv';

// Load environment variables
config();

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.GEMINI_API_KEY = 'test-gemini-key';

// Global test utilities
global.testUtils = {
  createAuthHeader: (adminId: number = 1) => ({
    'x-admin-id': adminId.toString()
  })
};

// Mock external services
vi.mock('../telegram/bot', () => ({
  bot: {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    sendPhoto: vi.fn().mockResolvedValue({ message_id: 2 }),
    on: vi.fn(),
    launch: vi.fn()
  }
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Mocked AI response'
        }
      })
    }))
  }))
}));

// Database connection management
beforeAll(async () => {
  // Setup database connection for tests
  console.log('Setting up test database...');
});

afterAll(async () => {
  // Clean up database connections
  console.log('Cleaning up test database...');
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});