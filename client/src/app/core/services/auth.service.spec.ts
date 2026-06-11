import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

@Component({ template: '' })
class LoginStubComponent {}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: LoginStubComponent }]),
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts logged out', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.isAdmin()).toBe(false);
  });

  it('logout clears session', () => {
    localStorage.setItem('luna_park_token', 'token');
    localStorage.setItem(
      'luna_park_user',
      JSON.stringify({
        _id: '1',
        name: 'Test',
        email: 'test@example.com',
        role: 'customer',
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', component: LoginStubComponent }]),
      ],
    });

    const authed = TestBed.inject(AuthService);
    expect(authed.isAuthenticated()).toBe(true);

    authed.logout();
    expect(authed.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('luna_park_token')).toBeNull();
  });
});
