import { describe, it, expect } from 'vitest';
import { API_ENDPOINTS, DEFAULTS, SSE_MARKERS, HTTP_STATUS, CONTENT_TYPES } from './index.js';
import { MessageRole } from '../types/index.js';

describe('MessageRole', () => {
  it('should have correct role values', () => {
    expect(MessageRole.USER).toBe('user');
    expect(MessageRole.ASSISTANT).toBe('assistant');
    expect(MessageRole.SYSTEM).toBe('system');
  });

  it('should have all required roles', () => {
    expect(Object.keys(MessageRole)).toHaveLength(3);
    expect(Object.keys(MessageRole)).toContain('USER');
    expect(Object.keys(MessageRole)).toContain('ASSISTANT');
    expect(Object.keys(MessageRole)).toContain('SYSTEM');
  });
});

describe('API_ENDPOINTS', () => {
  it('should have correct endpoint paths', () => {
    expect(API_ENDPOINTS.CHAT).toBe('/api/chat');
    expect(API_ENDPOINTS.MODELS).toBe('/api/models');
  });

  it('should have all required endpoints', () => {
    expect(Object.keys(API_ENDPOINTS)).toHaveLength(2);
    expect(Object.keys(API_ENDPOINTS)).toContain('CHAT');
    expect(Object.keys(API_ENDPOINTS)).toContain('MODELS');
  });
});

describe('DEFAULTS', () => {
  it('should have correct default values', () => {
    expect(DEFAULTS.MODEL).toBe('openai/gpt-3.5-turbo');
    expect(DEFAULTS.MODEL_NAME).toBe('GPT-3.5 Turbo');
    expect(DEFAULTS.PORT).toBe(3000);
  });

  it('should have all required default values', () => {
    expect(Object.keys(DEFAULTS)).toHaveLength(3);
    expect(Object.keys(DEFAULTS)).toContain('MODEL');
    expect(Object.keys(DEFAULTS)).toContain('MODEL_NAME');
    expect(Object.keys(DEFAULTS)).toContain('PORT');
  });
});

describe('SSE_MARKERS', () => {
  it('should have correct SSE marker values', () => {
    expect(SSE_MARKERS.DONE).toBe('[DONE]');
    expect(SSE_MARKERS.DATA_PREFIX).toBe('data: ');
  });

  it('should have all required markers', () => {
    expect(Object.keys(SSE_MARKERS)).toHaveLength(2);
    expect(Object.keys(SSE_MARKERS)).toContain('DONE');
    expect(Object.keys(SSE_MARKERS)).toContain('DATA_PREFIX');
  });
});

describe('HTTP_STATUS', () => {
  it('should have correct HTTP status codes', () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });

  it('should have all required status codes', () => {
    expect(Object.keys(HTTP_STATUS)).toHaveLength(4);
  });
});

describe('CONTENT_TYPES', () => {
  it('should have correct content type values', () => {
    expect(CONTENT_TYPES.JSON).toBe('application/json');
    expect(CONTENT_TYPES.SSE).toBe('text/event-stream');
  });

  it('should have all required content types', () => {
    expect(Object.keys(CONTENT_TYPES)).toHaveLength(2);
    expect(Object.keys(CONTENT_TYPES)).toContain('JSON');
    expect(Object.keys(CONTENT_TYPES)).toContain('SSE');
  });
});
