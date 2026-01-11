import {
    Component,
    signal,
    computed,
    ChangeDetectionStrategy,
    OnInit,
    OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, Subscription, debounceTime, distinctUntilChanged, takeUntil, forkJoin } from 'rxjs';
import { UserService, User, UserFormData, Role } from '../../services/user.service';
import { SkpdService, Skpd } from '../../services/skpd.service';

@Component({
    selector: 'app-users',
    imports: [
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        PasswordModule,
        SelectModule,
        ConfirmDialogModule,
        ToastModule,
        ToolbarModule,
        TagModule,
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './users.html',
    styleUrl: './users.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit, OnDestroy {
    protected readonly dialogVisible = signal(false);
    protected readonly submitted = signal(false);
    protected readonly searchQuery = signal('');
    protected readonly loading = signal(false);
    protected readonly validationErrors = signal<Record<string, string>>({});
    protected readonly sortBy = signal<string | undefined>(undefined);
    protected readonly sortOrder = signal<string | undefined>(undefined);

    // API data
    protected readonly data = signal<User[]>([]);
    protected readonly nextCursor = signal<string | null>(null);
    protected readonly prevCursor = signal<string | null>(null);
    protected readonly totalCount = signal<number>(0);

    // Dropdowns
    protected readonly roles = signal<Role[]>([]);
    protected readonly skpds = signal<Skpd[]>([]);

    protected readonly hasNextPage = computed(() => this.nextCursor() !== null);
    protected readonly hasPrevPage = computed(() => this.prevCursor() !== null);

    protected currentItem = signal<Partial<User> & { password?: string; selectedRole?: string }>({});
    protected isEditMode = signal(false);

    private readonly searchSubject = new Subject<string>();
    private readonly destroy$ = new Subject<void>();
    private loadSubscription?: Subscription;

    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private userService: UserService,
        private skpdService: SkpdService,
    ) { }

    ngOnInit(): void {
        this.loadDropdowns();

        this.searchSubject
            .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe((query) => {
                this.loadData(undefined, query);
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDropdowns(): void {
        forkJoin({
            roles: this.userService.getRoles(),
            skpds: this.skpdService.getAll(),
        }).subscribe({
            next: (result) => {
                this.roles.set(result.roles);
                this.skpds.set(result.skpds.data);
            },
            error: (error) => {
                console.error('Error loading dropdowns:', error);
            },
        });
    }

    loadData(cursor?: string, search?: string): void {
        if (this.loadSubscription) {
            this.loadSubscription.unsubscribe();
        }

        this.loading.set(true);
        const searchParam = search !== undefined ? search : this.searchQuery();
        const sortBy = this.sortBy();
        const sortOrder = this.sortOrder();

        this.loadSubscription = this.userService
            .getAll(cursor, searchParam, sortBy, sortOrder)
            .subscribe({
                next: (response) => {
                    this.data.set(response.data);
                    this.nextCursor.set(response.next_cursor);
                    this.prevCursor.set(response.prev_cursor);
                    this.totalCount.set(response.total);
                    this.loading.set(false);
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Gagal memuat data User',
                    });
                    this.loading.set(false);
                    console.error('Error loading User data:', error);
                },
            });
    }

    onSearch(query: string): void {
        this.searchQuery.set(query);
        this.searchSubject.next(query);
    }

    onLazyLoad(event: TableLazyLoadEvent): void {
        if (event.sortField) {
            this.sortBy.set(event.sortField as string);
            this.sortOrder.set(event.sortOrder === 1 ? 'asc' : 'desc');
        } else {
            this.sortBy.set(undefined);
            this.sortOrder.set(undefined);
        }
        this.loadData();
    }

    nextPage(): void {
        const cursor = this.nextCursor();
        if (cursor && !this.loading()) {
            this.loadData(cursor);
        }
    }

    prevPage(): void {
        const cursor = this.prevCursor();
        if (cursor && !this.loading()) {
            this.loadData(cursor);
        }
    }

    openNew(): void {
        this.currentItem.set({ selectedRole: '' });
        this.isEditMode.set(false);
        this.submitted.set(false);
        this.validationErrors.set({});
        this.dialogVisible.set(true);
    }

    editItem(item: User): void {
        this.loading.set(true);
        this.userService.get(item.uuid).subscribe({
            next: (data) => {
                this.currentItem.set({
                    ...data,
                    skpd_id: data.skpd?.uuid || null,
                    password: '',
                    selectedRole: data.roles[0]?.name || '',
                });
                this.isEditMode.set(true);
                this.submitted.set(false);
                this.validationErrors.set({});
                this.dialogVisible.set(true);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Gagal memuat detail User',
                });
                this.loading.set(false);
            },
        });
    }

    deleteItem(item: User): void {
        this.confirmationService.confirm({
            message: `Apakah Anda yakin ingin menghapus "${item.name}"?`,
            header: 'Konfirmasi Hapus',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ya, Hapus',
            rejectLabel: 'Batal',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.loading.set(true);
                this.userService.delete(item.uuid).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Berhasil',
                            detail: 'User berhasil dihapus',
                        });
                        this.loadData();
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Gagal menghapus User',
                        });
                        this.loading.set(false);
                        console.error('Error deleting User:', error);
                    },
                });
            },
        });
    }

    hideDialog(): void {
        this.dialogVisible.set(false);
        this.submitted.set(false);
    }

    saveItem(): void {
        if (this.loading()) return;

        this.submitted.set(true);
        this.validationErrors.set({});
        const current = this.currentItem();

        const formData: UserFormData = {
            name: current.name || '',
            username: current.username || '',
            skpd_id: current.skpd_id,
            role: current.selectedRole || '',
        };

        if (current.password) {
            formData.password = current.password;
        }

        this.loading.set(true);

        if (this.isEditMode() && current.uuid) {
            this.userService.update(current.uuid, formData).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Berhasil',
                        detail: 'User berhasil diperbarui',
                    });
                    this.dialogVisible.set(false);
                    this.loadData();
                },
                error: (error) => {
                    if (error?.status === 422 && error?.error?.errors) {
                        this.validationErrors.set(error.error.errors);
                    } else {
                        const errorMessage = error?.error?.message || 'Gagal memperbarui User';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: errorMessage,
                        });
                    }
                    this.loading.set(false);
                },
            });
        } else {
            this.userService.create(formData).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Berhasil',
                        detail: 'User berhasil ditambahkan',
                    });
                    this.dialogVisible.set(false);
                    this.loadData();
                },
                error: (error) => {
                    if (error?.status === 422 && error?.error?.errors) {
                        this.validationErrors.set(error.error.errors);
                    } else {
                        const errorMessage = error?.error?.message || 'Gagal menambahkan User';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: errorMessage,
                        });
                    }
                    this.loading.set(false);
                },
            });
        }
    }

    updateField(field: string, value: unknown): void {
        this.currentItem.update((item) => ({ ...item, [field]: value }));
    }

    getRoleName(user: User): string {
        return user.roles[0]?.name || '-';
    }

    isSkpdRequired(): boolean {
        return this.currentItem().selectedRole === 'pegawai';
    }
}
