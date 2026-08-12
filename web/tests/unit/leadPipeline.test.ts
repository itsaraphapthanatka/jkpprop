/* The pipeline's only rule, tested where it lives.
 *
 * The nine statuses were a literal inside the leads PATCH route, so nothing
 * else could see the order — which is why the spec's auto-advance was never
 * built: no other endpoint knew what "forward" meant. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PIPELINE, rank, isForward } from '../../src/lib/server/leadPipeline.ts';

describe('lead pipeline', () => {
  test('the nine statuses are in the order the spec draws them', () => {
    assert.deepEqual([...PIPELINE], [
      'new', 'qualified', 'profile_received', 'requirements_confirmed',
      'shortlisted', 'visit_scheduled', 'negotiating', 'won', 'lost',
    ]);
  });

  test('rank rejects anything not in the pipeline', () => {
    assert.equal(rank('new'), 0);
    assert.ok(rank('won') > rank('negotiating'));
    for (const bad of ['', 'NEW', 'closed', 'submitted']) assert.equal(rank(bad), -1);
  });

  test('forward is forward and nothing else is', () => {
    assert.ok(isForward('new', 'qualified'));
    assert.ok(isForward('new', 'won'));
    assert.equal(isForward('shortlisted', 'qualified'), false, 'backwards');
    assert.equal(isForward('qualified', 'qualified'), false, 'sideways');
    assert.equal(isForward('qualified', 'nonsense'), false, 'unknown target');
    assert.equal(isForward('nonsense', 'qualified'), false, 'unknown source');
  });

  /* The events the spec ties to statuses, checked as a set: each one must be
     a real status, and they must fire in the order the flows run. */
  test('the auto-advance targets exist and are ordered by flow', () => {
    const events = ['requirements_confirmed', 'shortlisted', 'visit_scheduled', 'negotiating'] as const;
    for (const e of events) assert.ok(rank(e) >= 0, `${e} is not a pipeline status`);
    for (let i = 1; i < events.length; i++) {
      assert.ok(isForward(events[i - 1], events[i]), `${events[i - 1]} should come before ${events[i]}`);
    }
  });

  test('won and lost are the last two — nothing auto-advances past them', () => {
    assert.equal(PIPELINE[PIPELINE.length - 2], 'won');
    assert.equal(PIPELINE[PIPELINE.length - 1], 'lost');
  });
});
