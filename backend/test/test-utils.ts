import { sendmailConfig } from '../src/config/sendmail.config';

export const testSendmailConfig = {
  transport: {
    host: 'smtp.test.com',
    port: 587,
    secure: false,
    auth: { user: 'test', pass: 'test' },
  },
  defaults: { from: 'test@example.com' },
  retry: { maxRetries: 1, delayMs: 0 },
};

export const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === sendmailConfig.KEY) {
      return testSendmailConfig;
    }
    return undefined;
  }),
};
