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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subject, Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { KodePajakService, KodePajak, KodePajakFormData } from '../../services/kode-pajak.service';

const PAGE_SIZE = 10;

@Component({
    selector: 'app-kode-pajak',
    imports: [
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        ConfirmDialogModule,
        ToastModule,
        ToolbarModule,
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './kode-pajak.html',
    styleUrl: './kode-pajak.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KodePajakComponent implements OnInit, OnDestroy {
    protected readonly dialogVisible = signal(false);
    protected readonly submitted = signal(false);
    protected readonly searchQuery = signal('');
    protected readonly loading = signal(false);
    protected readonly validationErrors = signal<Record<string, string>>({});
    protected readonly sortBy = signal<string | undefined>(undefined);
    protected readonly sortOrder = signal<string | undefined>(undefined);

    // API data
    protected readonly data = signal<KodePajak[]>([]);
    protected readonly nextCursor = signal<string | null>(null);
    protected readonly prevCursor = signal<string | null>(null);
    protected readonly totalCount = signal<number>(0);

    protected readonly hasNextPage = computed(() => {
        return this.nextCursor() !== null;
    });

    protected readonly hasPrevPage = computed(() => {
        return this.prevCursor() !== null;
    });

    protected currentItem = signal<Partial<KodePajak>>({});
    protected isEditMode = signal(false);

    private readonly searchSubject = new Subject<string>();
    private readonly destroy$ = new Subject<void>();
    private loadSubscription?: Subscription;

    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private kodePajakService: KodePajakService,
    ) { }

    ngOnInit(): void {
        // Setup search debounce
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

    loadData(cursor?: string, search?: string): void {
        if (this.loadSubscription) {
            this.loadSubscription.unsubscribe();
        }

        this.loading.set(true);
        const searchParam = search !== undefined ? search : this.searchQuery();
        const sortBy = this.sortBy();
        const sortOrder = this.sortOrder();

        this.loadSubscription = this.kodePajakService
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
                        detail: 'Gagal memuat data Kode Pajak',
                    });
                    this.loading.set(false);
                    console.error('Error loading Kode Pajak data:', error);
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
        this.currentItem.set({});
        this.isEditMode.set(false);
        this.submitted.set(false);
        this.validationErrors.set({});
        this.dialogVisible.set(true);
    }

    editItem(item: KodePajak): void {
        this.loading.set(true);
        this.kodePajakService.get(item.uuid).subscribe({
            next: (data) => {
                this.currentItem.set(data);
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
                    detail: 'Gagal memuat detail Kode Pajak',
                });
                this.loading.set(false);
            },
        });
    }

    deleteItem(item: KodePajak): void {
        this.confirmationService.confirm({
            message: `Apakah Anda yakin ingin menghapus "${item.kode} - ${item.nama}"?`,
            header: 'Konfirmasi Hapus',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ya, Hapus',
            rejectLabel: 'Batal',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.loading.set(true);
                this.kodePajakService.delete(item.uuid).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Berhasil',
                            detail: 'Kode Pajak berhasil dihapus',
                        });
                        this.loadData();
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Gagal menghapus Kode Pajak',
                        });
                        this.loading.set(false);
                        console.error('Error deleting Kode Pajak:', error);
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

        const formData: KodePajakFormData = {
            kode: current.kode || '',
            nama: current.nama || '',
        };

        this.loading.set(true);

        if (this.isEditMode() && current.uuid) {
            this.kodePajakService.update(current.uuid, formData).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Berhasil',
                        detail: 'Kode Pajak berhasil diperbarui',
                    });
                    this.dialogVisible.set(false);
                    this.loadData();
                },
                error: (error) => {
                    if (error?.status === 422 && error?.error?.errors) {
                        this.validationErrors.set(error.error.errors);
                    } else {
                        const errorMessage = error?.error?.message || 'Gagal memperbarui Kode Pajak';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: errorMessage,
                        });
                    }
                    this.loading.set(false);
                    console.error('Error updating Kode Pajak:', error);
                },
            });
        } else {
            this.kodePajakService.create(formData).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Berhasil',
                        detail: 'Kode Pajak berhasil ditambahkan',
                    });
                    this.dialogVisible.set(false);
                    this.loadData();
                },
                error: (error) => {
                    if (error?.status === 422 && error?.error?.errors) {
                        this.validationErrors.set(error.error.errors);
                    } else {
                        const errorMessage = error?.error?.message || 'Gagal menambahkan Kode Pajak';
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: errorMessage,
                        });
                    }
                    this.loading.set(false);
                    console.error('Error creating Kode Pajak:', error);
                },
            });
        }
    }

    updateKode(value: string): void {
        this.currentItem.update((item) => ({ ...item, kode: value }));
    }

    updateNama(value: string): void {
        this.currentItem.update((item) => ({ ...item, nama: value }));
    }
}
