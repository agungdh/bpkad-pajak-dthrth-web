import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, CardModule, MessageModule],
    templateUrl: './login.html',
    styleUrl: './login.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    protected readonly username = signal('');
    protected readonly password = signal('');
    protected readonly loading = signal(false);
    protected readonly errorMessage = signal<string | null>(null);

    onSubmit(): void {
        if (this.loading()) return;

        this.loading.set(true);
        this.errorMessage.set(null);

        this.authService
            .login({
                username: this.username(),
                password: this.password(),
            })
            .subscribe({
                next: () => {
                    this.router.navigate(['/dashboard']);
                },
                error: (error) => {
                    if (error?.status === 422 && error?.error?.errors?.username) {
                        this.errorMessage.set(error.error.errors.username[0]);
                    } else if (error?.error?.message) {
                        this.errorMessage.set(error.error.message);
                    } else {
                        this.errorMessage.set('Terjadi kesalahan. Silakan coba lagi.');
                    }
                    this.loading.set(false);
                },
            });
    }

    updateUsername(value: string): void {
        this.username.set(value);
    }

    updatePassword(value: string): void {
        this.password.set(value);
    }
}
