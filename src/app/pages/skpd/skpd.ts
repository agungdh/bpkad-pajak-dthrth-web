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
import { ConfirmationService, MessageService, SortEvent } from 'primeng/api';
import { Subject, Subscription, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SkpdService, Skpd, SkpdFormData } from '../../services/skpd.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-skpd',
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
  templateUrl: './skpd.html',
  styleUrl: './skpd.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkpdComponent implements OnInit, OnDestroy {
  protected readonly dialogVisible = signal(false);
  protected readonly submitted = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly loading = signal(false);
  protected readonly validationErrors = signal<Record<string, string>>({});
  protected readonly sortBy = signal<string | undefined>(undefined);
  protected readonly sortOrder = signal<string | undefined>(undefined);

  // API data
  protected readonly data = signal<Skpd[]>([]);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly prevCursor = signal<string | null>(null);
  protected readonly totalCount = signal<number>(0);

  protected readonly hasNextPage = computed(() => {
    return this.nextCursor() !== null;
  });

  protected readonly hasPrevPage = computed(() => {
    return this.prevCursor() !== null;
  });

  protected currentItem = signal<Partial<Skpd>>({});
  protected isEditMode = signal(false);

  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private loadSubscription?: Subscription;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private skpdService: SkpdService,
  ) {}

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

    this.loadSubscription = this.skpdService
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
            detail: 'Gagal memuat data SKPD',
          });
          this.loading.set(false);
          console.error('Error loading SKPD data:', error);
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

  editItem(item: Skpd): void {
    this.loading.set(true);
    this.skpdService.get(item.uuid).subscribe({
      next: (data) => {
        this.currentItem.set(data);
        this.isEditMode.set(true);
        this.submitted.set(false);
        this.validationErrors.set({});
        this.dialogVisible.set(true);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Gagal memuat detail SKPD',
        });
        this.loading.set(false);
      },
    });
  }

  deleteItem(item: Skpd): void {
    this.confirmationService.confirm({
      message: `Apakah Anda yakin ingin menghapus "${item.nama}"?`,
      header: 'Konfirmasi Hapus',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ya, Hapus',
      rejectLabel: 'Batal',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.loading.set(true);
        this.skpdService.delete(item.uuid).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Berhasil',
              detail: 'SKPD berhasil dihapus',
            });
            this.loadData(); // Reload data from first page
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Gagal menghapus SKPD',
            });
            this.loading.set(false);
            console.error('Error deleting SKPD:', error);
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

    const formData: SkpdFormData = {
      nama: current.nama || '',
    };

    this.loading.set(true);

    if (this.isEditMode() && current.uuid) {
      this.skpdService.update(current.uuid, formData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Berhasil',
            detail: 'SKPD berhasil diperbarui',
          });
          this.dialogVisible.set(false);
          this.loadData(); // Reload data
        },
        error: (error) => {
          if (error?.status === 422 && error?.error?.errors) {
            // Validation errors from backend
            this.validationErrors.set(error.error.errors);
          } else {
            // Other errors show as toast
            const errorMessage = error?.error?.message || 'Gagal memperbarui SKPD';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage,
            });
          }
          this.loading.set(false);
          console.error('Error updating SKPD:', error);
        },
      });
    } else {
      this.skpdService.create(formData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Berhasil',
            detail: 'SKPD berhasil ditambahkan',
          });
          this.dialogVisible.set(false);
          this.loadData(); // Reload data
        },
        error: (error) => {
          if (error?.status === 422 && error?.error?.errors) {
            // Validation errors from backend
            this.validationErrors.set(error.error.errors);
          } else {
            // Other errors show as toast
            const errorMessage = error?.error?.message || 'Gagal menambahkan SKPD';
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: errorMessage,
            });
          }
          this.loading.set(false);
          console.error('Error creating SKPD:', error);
        },
      });
    }
  }

  updateNama(value: string): void {
    this.currentItem.update((item) => ({ ...item, nama: value }));
  }
}
