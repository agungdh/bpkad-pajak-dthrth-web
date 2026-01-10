import { Component, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmationService, MessageService } from 'primeng/api';
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
export class SkpdComponent implements OnInit {
  protected readonly dialogVisible = signal(false);
  protected readonly submitted = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly loading = signal(false);

  // API data
  protected readonly data = signal<Skpd[]>([]);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly prevCursor = signal<string | null>(null);

  // Filtered data based on search (client-side filtering)
  protected readonly filteredData = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.data();
    return this.data().filter((d) => d.nama.toLowerCase().includes(query));
  });

  protected readonly hasNextPage = computed(() => {
    return this.nextCursor() !== null;
  });

  protected readonly hasPrevPage = computed(() => {
    return this.prevCursor() !== null;
  });

  protected currentItem = signal<Partial<Skpd>>({});
  protected isEditMode = signal(false);

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private skpdService: SkpdService,
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(cursor?: string): void {
    this.loading.set(true);
    this.skpdService.getAll(cursor).subscribe({
      next: (response) => {
        this.data.set(response.data);
        this.nextCursor.set(response.next_cursor);
        this.prevCursor.set(response.prev_cursor);
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
  }

  nextPage(): void {
    const cursor = this.nextCursor();
    if (cursor) {
      this.loadData(cursor);
    }
  }

  prevPage(): void {
    const cursor = this.prevCursor();
    if (cursor) {
      this.loadData(cursor);
    }
  }

  openNew(): void {
    this.currentItem.set({});
    this.isEditMode.set(false);
    this.submitted.set(false);
    this.dialogVisible.set(true);
  }

  editItem(item: Skpd): void {
    this.currentItem.set({ ...item });
    this.isEditMode.set(true);
    this.submitted.set(false);
    this.dialogVisible.set(true);
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
    this.submitted.set(true);
    const current = this.currentItem();

    if (!current.nama?.trim()) {
      return;
    }

    const formData: SkpdFormData = {
      nama: current.nama,
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Gagal memperbarui SKPD',
          });
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Gagal menambahkan SKPD',
          });
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
