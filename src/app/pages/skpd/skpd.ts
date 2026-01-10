import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmationService, MessageService } from 'primeng/api';

interface Skpd {
  id: number;
  nama: string;
}

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
export class SkpdComponent {
  protected readonly dialogVisible = signal(false);
  protected readonly submitted = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);

  // Mock data SKPD
  protected readonly data = signal<Skpd[]>([
    { id: 1, nama: 'Dinas Pendidikan' },
    { id: 2, nama: 'Dinas Kesehatan' },
    { id: 3, nama: 'Dinas Pekerjaan Umum dan Penataan Ruang' },
    { id: 4, nama: 'Dinas Sosial' },
    { id: 5, nama: 'Dinas Perhubungan' },
    { id: 6, nama: 'Dinas Kependudukan dan Pencatatan Sipil' },
    { id: 7, nama: 'Dinas Lingkungan Hidup' },
    { id: 8, nama: 'Badan Perencanaan Pembangunan Daerah' },
    { id: 9, nama: 'Badan Kepegawaian Daerah' },
    { id: 10, nama: 'Inspektorat' },
    { id: 11, nama: 'Kecamatan Banguntapan' },
    { id: 12, nama: 'Kecamatan Sewon' },
    { id: 13, nama: 'Kecamatan Kasihan' },
    { id: 14, nama: 'Kecamatan Bantul' },
    { id: 15, nama: 'Dinas Pertanian' },
  ]);

  // Filtered data based on search
  protected readonly filteredData = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.data();
    return this.data().filter((d) => d.nama.toLowerCase().includes(query));
  });

  // Data to display (paginated)
  protected readonly displayData = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredData().slice(start, start + PAGE_SIZE);
  });

  protected readonly hasNextPage = computed(() => {
    return this.currentPage() * PAGE_SIZE < this.filteredData().length;
  });

  protected readonly hasPrevPage = computed(() => {
    return this.currentPage() > 1;
  });

  protected currentItem = signal<Partial<Skpd>>({});
  protected isEditMode = signal(false);

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page on search
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  prevPage(): void {
    if (this.hasPrevPage()) {
      this.currentPage.update((p) => p - 1);
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
        this.data.update((list) => list.filter((d) => d.id !== item.id));
        this.messageService.add({
          severity: 'success',
          summary: 'Berhasil',
          detail: 'SKPD berhasil dihapus',
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

    if (this.isEditMode()) {
      this.data.update((list) => list.map((d) => (d.id === current.id ? (current as Skpd) : d)));
      this.messageService.add({
        severity: 'success',
        summary: 'Berhasil',
        detail: 'SKPD berhasil diperbarui',
      });
    } else {
      const newId = Math.max(...this.data().map((d) => d.id), 0) + 1;
      this.data.update((list) => [...list, { id: newId, nama: current.nama! }]);
      this.messageService.add({
        severity: 'success',
        summary: 'Berhasil',
        detail: 'SKPD berhasil ditambahkan',
      });
    }

    this.dialogVisible.set(false);
  }

  updateNama(value: string): void {
    this.currentItem.update((item) => ({ ...item, nama: value }));
  }
}
