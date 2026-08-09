/* RBAC rules — the table that decides who can do what.
   These are the checks a misconfigured role would otherwise slip past. */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ROLES, PRIVILEGES, DEFAULT_PRIVS, FORBIDDEN_PRIVS, privAllowed, initialPrivs, MATRIX, type RoleKey, type PrivKey } from '../../src/lib/rbac.ts';

const ALL_ROLES = ROLES.map((r) => r.key);

describe('RBAC role table', () => {
  test('has the seven roles the system was designed around', () => {
    assert.deepEqual(ALL_ROLES, ['owner', 'manager', 'agent', 'co_agent', 'ops', 'marketing', 'translator']);
  });

  test('owner and co_agent have their scope locked', () => {
    assert.equal(ROLES.find((r) => r.key === 'owner')?.scopeLocked, true);
    assert.equal(ROLES.find((r) => r.key === 'co_agent')?.scopeLocked, true);
  });

  test('co_agent is the only external role, so it is the only one needing an expiry', () => {
    const external = ROLES.filter((r) => r.external).map((r) => r.key);
    assert.deepEqual(external, ['co_agent']);
  });
});

describe('privilege guards', () => {
  test('export is owner-only — every other role is refused', () => {
    for (const role of ALL_ROLES) {
      assert.equal(privAllowed(role, 'export'), role === 'owner', `export should be ${role === 'owner' ? 'allowed' : 'refused'} for ${role}`);
    }
  });

  test('co_agent and translator are refused every privilege', () => {
    for (const role of ['co_agent', 'translator'] as RoleKey[]) {
      for (const p of PRIVILEGES.map((x) => x.key)) {
        assert.equal(privAllowed(role, p), false, `${role} must not be grantable ${p}`);
      }
    }
  });

  test('deal_unlock stays with owner and manager', () => {
    const allowed = ALL_ROLES.filter((r) => privAllowed(r, 'deal_unlock'));
    assert.deepEqual(allowed, ['owner', 'manager']);
  });

  test('audit log access stays with owner and manager', () => {
    const allowed = ALL_ROLES.filter((r) => privAllowed(r, 'audit'));
    assert.deepEqual(allowed, ['owner', 'manager']);
  });

  test('marketing and translator can never be granted PII', () => {
    assert.equal(privAllowed('marketing', 'pii'), false);
    assert.equal(privAllowed('translator', 'pii'), false);
  });

  test('defaults never contain a privilege the role is forbidden', () => {
    for (const role of ALL_ROLES) {
      for (const p of initialPrivs(role)) {
        assert.ok(privAllowed(role, p), `${role} defaults to forbidden priv ${p}`);
      }
    }
  });

  test('DEFAULT_PRIVS may list a forbidden priv, but initialPrivs filters it out', () => {
    // guards against a future edit that adds a default without updating the guard
    for (const role of ALL_ROLES) {
      const raw = DEFAULT_PRIVS[role];
      const filtered = initialPrivs(role);
      const dropped = raw.filter((p: PrivKey) => !filtered.includes(p));
      for (const p of dropped) {
        assert.ok((FORBIDDEN_PRIVS[role] ?? []).includes(p));
      }
    }
  });
});

describe('permission matrix', () => {
  test('every cell is one of the five known values', () => {
    const valid = new Set(['yes', 'scope', 'read', 'priv', 'no']);
    for (const group of MATRIX) {
      for (const row of group.rows) {
        for (const role of ALL_ROLES) {
          assert.ok(valid.has(row.cells[role]), `${group.group} / ${row.action} / ${role} = ${row.cells[role]}`);
        }
      }
    }
  });

  test('every row defines a cell for all seven roles (deny-by-default)', () => {
    for (const group of MATRIX) {
      for (const row of group.rows) {
        assert.deepEqual(Object.keys(row.cells).sort(), [...ALL_ROLES].sort(), `${row.action} is missing a role`);
      }
    }
  });

  test('CSV export is owner-only in the matrix too, matching the privilege guard', () => {
    const row = MATRIX.flatMap((g) => g.rows).find((r) => r.action.includes('ส่งออกข้อมูล'));
    assert.ok(row, 'export row must exist');
    for (const role of ALL_ROLES) {
      assert.equal(row!.cells[role], role === 'owner' ? 'yes' : 'no');
    }
  });
});
