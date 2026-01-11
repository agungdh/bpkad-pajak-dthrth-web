import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Role {
    id: number;
    name: string;
}

export interface Skpd {
    uuid: string;
    nama: string;
}

export interface User {
    uuid: string;
    name: string;
    username: string;
    skpd_id: string | null;
    skpd: Skpd | null;
    roles: Role[];
}

export interface UserPaginationResponse {
    data: User[];
    path: string;
    per_page: number;
    next_cursor: string | null;
    next_page_url: string | null;
    prev_cursor: string | null;
    prev_page_url: string | null;
    total: number;
}

export interface UserFormData {
    name: string;
    username: string;
    password?: string;
    skpd_id?: string | null;
    role: string;
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8000/api/users';

    getAll(
        cursor?: string,
        search?: string,
        sortBy?: string,
        sortOrder?: string,
    ): Observable<UserPaginationResponse> {
        let url = this.apiUrl;
        const params: string[] = [];

        if (cursor) params.push(`cursor=${cursor}`);
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (sortBy) params.push(`sort_by=${sortBy}`);
        if (sortOrder) params.push(`sort_order=${sortOrder}`);

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        return this.http.get<UserPaginationResponse>(url);
    }

    get(uuid: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${uuid}`);
    }

    create(data: UserFormData): Observable<User> {
        return this.http.post<User>(this.apiUrl, data);
    }

    update(uuid: string, data: UserFormData): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${uuid}`, data);
    }

    delete(uuid: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${uuid}`);
    }

    getRoles(): Observable<Role[]> {
        return this.http.get<Role[]>(`${this.apiUrl}/roles`);
    }
}
