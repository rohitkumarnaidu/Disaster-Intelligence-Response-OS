import { describe, it, expect } from 'vitest';
import { VALID_CASE_TRANSITIONS } from './case-state-machine';
import { VALID_TASK_TRANSITIONS } from './task-state-machine';
import { calculatePriority } from '../lib/priority';

describe('Case State Machine Transitions', () => {
  it('should only allow valid transitions from DETECTED', () => {
    expect(VALID_CASE_TRANSITIONS['DETECTED']).toEqual(['NEEDS_REVIEW']);
  });

  it('should allow triage decisions from NEEDS_REVIEW', () => {
    expect(VALID_CASE_TRANSITIONS['NEEDS_REVIEW']).toEqual(['CONFIRMED', 'REJECTED', 'UNCERTAIN']);
  });

  it('should not allow transitions from CLOSED', () => {
    expect(VALID_CASE_TRANSITIONS['CLOSED']).toEqual([]);
  });
});

describe('Task State Machine Transitions', () => {
  it('should only allow ASSIGNED from UNASSIGNED', () => {
    expect(VALID_TASK_TRANSITIONS['UNASSIGNED']).toEqual(['ASSIGNED']);
  });

  it('should allow field completion and verification transitions', () => {
    expect(VALID_TASK_TRANSITIONS['IN_PROGRESS']).toContain('COMPLETED');
    expect(VALID_TASK_TRANSITIONS['IN_PROGRESS']).toContain('VERIFIED');
    expect(VALID_TASK_TRANSITIONS['IN_PROGRESS']).toContain('BLOCKED');
  });
});

describe('Deterministic Priority Scoring', () => {
  it('should score maximum severity and criticality near 100', () => {
    const result = calculatePriority('Destroyed', 'Hospital', 'High', 1, false, 0.95);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.breakdown).toHaveLength(5);
  });

  it('should score minor residential damage low', () => {
    const result = calculatePriority('Minor', 'Residential', 'Low', 50, false, 0.4);
    expect(result.score).toBeLessThan(40);
  });
});
