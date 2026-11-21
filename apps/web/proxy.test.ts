import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

describe('proxy protection guard', () => {
  it('redirects unauthenticated users trying to access /ingredientes to /iniciar-sesion', () => {
    const req = new NextRequest('http://localhost:3000/ingredientes');
    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/iniciar-sesion?redirect=%2Fingredientes');
  });

  it('redirects unauthenticated users trying to access /platos to /iniciar-sesion', () => {
    const req = new NextRequest('http://localhost:3000/platos');
    const res = proxy(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/iniciar-sesion?redirect=%2Fplatos');
  });

  it('allows access to protected routes when a session cookie is present', () => {
    const req = new NextRequest('http://localhost:3000/ingredientes');
    req.cookies.set('a_session_test', 'secret_token_123');

    const res = proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('leaves session validation and role redirection to the login page', () => {
    const req = new NextRequest('http://localhost:3000/iniciar-sesion');
    req.cookies.set('a_session_test', 'secret_token_123');

    const res = proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated users from the client space', () => {
    const res = proxy(new NextRequest('http://localhost:3000/clientes'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/iniciar-sesion?redirect=%2Fclientes');
  });

  it('allows unauthenticated users to access /iniciar-sesion without redirect', () => {
    const req = new NextRequest('http://localhost:3000/iniciar-sesion');
    const res = proxy(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
});
