import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
    uuid: string;
    name: string;
    username: string;
    email: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly apiUrl = 'http://localhost:8000/api/auth';

    private readonly _token = signal<string | null>(this.getStoredToken());
    private readonly _user = signal<User | null>(this.getStoredUser());

    readonly token = this._token.asReadonly();
    readonly user = this._user.asReadonly();
    readonly isAuthenticated = computed(() => !!this._token());

    login(credentials: LoginCredentials): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap((response) => {
                this.setToken(response.token);
                this.setUser(response.user);
            }),
        );
    }

    logout(): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(`${this.apiUrl}/logout`, {}).pipe(
            tap(() => {
                this.clearAuth();
            }),
        );
    }

    getMe(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/me`).pipe(
            tap((user) => {
                this.setUser(user);
            }),
        );
    }

    clearAuth(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        this._token.set(null);
        this._user.set(null);
    }

    redirectToLogin(): void {
        this.clearAuth();
        this.router.navigate(['/login']);
    }

    private setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        this._token.set(token);
    }

    private setUser(user: User): void {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._user.set(user);
    }

    private getStoredToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    private getStoredUser(): User | null {
        const stored = localStorage.getItem(USER_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return null;
            }
        }
        return null;
    }
}
