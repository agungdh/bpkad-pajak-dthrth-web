import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

interface WajibPajak {
    id: number;
    npwpd: string;
    nama: string;
    alamat: string;
    jenisPajak: string;
    status: 'aktif' | 'tidak aktif';
}

@Component({
    selector: 'app-sample-crud',
    imports: [
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        ConfirmDialogModule,
        ToastModule,
        ToolbarModule,
        TagModule,
        SelectModule,
    ],
    providers: [ConfirmationService, MessageService],
    templateUrl: './sample-crud.html',
    styleUrl: './sample-crud.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SampleCrudComponent {
    protected readonly dialogVisible = signal(false);
    protected readonly submitted = signal(false);

    protected readonly data = signal<WajibPajak[]>([
        { id: 1, npwpd: 'WP-001', nama: 'PT Maju Jaya', alamat: 'Jl. Sudirman No. 1', jenisPajak: 'Restoran', status: 'aktif' },
        { id: 2, npwpd: 'WP-002', nama: 'CV Berkah Abadi', alamat: 'Jl. Gatot Subroto No. 5', jenisPajak: 'Hotel', status: 'aktif' },
        { id: 3, npwpd: 'WP-003', nama: 'Toko Makmur', alamat: 'Jl. Ahmad Yani No. 10', jenisPajak: 'Reklame', status: 'tidak aktif' },
        { id: 4, npwpd: 'WP-004', nama: 'RM Sederhana', alamat: 'Jl. Diponegoro No. 15', jenisPajak: 'Restoran', status: 'aktif' },
        { id: 5, npwpd: 'WP-005', nama: 'Hotel Melati', alamat: 'Jl. Pahlawan No. 20', jenisPajak: 'Hotel', status: 'aktif' },
        { id: 6, npwpd: 'WP-006', nama: 'Cafe Santai', alamat: 'Jl. Veteran No. 8', jenisPajak: 'Restoran', status: 'tidak aktif' },
        { id: 7, npwpd: 'WP-007', nama: 'PT Sukses Mandiri', alamat: 'Jl. Merdeka No. 25', jenisPajak: 'Parkir', status: 'aktif' },
        { id: 8, npwpd: 'WP-008', nama: 'Bengkel Motor Jaya', alamat: 'Jl. Kartini No. 12', jenisPajak: 'Reklame', status: 'aktif' },
    ]);

    protected selectedItems = signal<WajibPajak[]>([]);
    protected currentItem = signal<Partial<WajibPajak>>({});
    protected isEditMode = signal(false);

    protected readonly statusOptions = [
        { label: 'Aktif', value: 'aktif' },
        { label: 'Tidak Aktif', value: 'tidak aktif' },
    ];

    protected readonly jenisPajakOptions = [
        { label: 'Restoran', value: 'Restoran' },
        { label: 'Hotel', value: 'Hotel' },
        { label: 'Reklame', value: 'Reklame' },
        { label: 'Parkir', value: 'Parkir' },
        { label: 'Hiburan', value: 'Hiburan' },
    ];

    constructor(
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
    ) { }

    openNew(): void {
        this.currentItem.set({});
        this.isEditMode.set(false);
        this.submitted.set(false);
        this.dialogVisible.set(true);
    }

    editItem(item: WajibPajak): void {
        this.currentItem.set({ ...item });
        this.isEditMode.set(true);
        this.submitted.set(false);
        this.dialogVisible.set(true);
    }

    deleteItem(item: WajibPajak): void {
        this.confirmationService.confirm({
            message: `Apakah Anda yakin ingin menghapus "${item.nama}"?`,
            header: 'Konfirmasi Hapus',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ya, Hapus',
            rejectLabel: 'Batal',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.data.update((list) => list.filter((d) => d.id !== item.id));
                this.messageService.add({ severity: 'success', summary: 'Berhasil', detail: 'Data berhasil dihapus' });
            },
        });
    }

    deleteSelected(): void {
        this.confirmationService.confirm({
            message: `Apakah Anda yakin ingin menghapus ${this.selectedItems().length} data terpilih?`,
            header: 'Konfirmasi Hapus',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ya, Hapus',
            rejectLabel: 'Batal',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                const selectedIds = new Set(this.selectedItems().map((s) => s.id));
                this.data.update((list) => list.filter((d) => !selectedIds.has(d.id)));
                this.selectedItems.set([]);
                this.messageService.add({ severity: 'success', summary: 'Berhasil', detail: 'Data terpilih berhasil dihapus' });
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

        if (!current.nama?.trim() || !current.npwpd?.trim()) {
            return;
        }

        if (this.isEditMode()) {
            this.data.update((list) =>
                list.map((d) => (d.id === current.id ? (current as WajibPajak) : d))
            );
            this.messageService.add({ severity: 'success', summary: 'Berhasil', detail: 'Data berhasil diperbarui' });
        } else {
            const newId = Math.max(...this.data().map((d) => d.id)) + 1;
            this.data.update((list) => [
                ...list,
                { ...current, id: newId, status: current.status ?? 'aktif' } as WajibPajak,
            ]);
            this.messageService.add({ severity: 'success', summary: 'Berhasil', detail: 'Data berhasil ditambahkan' });
        }

        this.dialogVisible.set(false);
    }

    updateCurrentItem(field: keyof WajibPajak, value: string): void {
        this.currentItem.update((item) => ({ ...item, [field]: value }));
    }

    getStatusSeverity(status: string): 'success' | 'danger' {
        return status === 'aktif' ? 'success' : 'danger';
    }
}
