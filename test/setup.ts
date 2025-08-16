import 'reflect-metadata';
import '@nestjs/core';
import '@nestjs/common';
import '@nestjs/testing';
import { vi } from 'vitest';

// Global mocks
vi.mock('typeorm', async () => {
  const actual = await vi.importActual('typeorm');
  return {
    ...actual,
    DataSource: class MockDataSource {},
  };
});
