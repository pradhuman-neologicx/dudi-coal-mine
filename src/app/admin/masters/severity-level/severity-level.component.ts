import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

@Component({
  selector: 'app-severity-level',
  templateUrl: './severity-level.component.html',
  styleUrl: './severity-level.component.scss',
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'scale(0.5)' })),
      transition(':enter', [animate('0.5s ease-out', style({ opacity: 1, transform: 'scale(1)' }))]),
    ]),
  ],
})
export class SeverityLevelComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  showreset: boolean = false;
  searchbarform!: FormGroup;
  createForm!: FormGroup;
  updateForm!: FormGroup;
  viewForm!: FormGroup;
  
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;
  
  createModalOpen: boolean = false;
  updateModalOpen: boolean = false;
  viewModalOpen: boolean = false;
  selectedItem: any = null;
  currentId: any;

  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Severity Level',
      heading2: 'Status',
      heading3: 'Action',
    },
  ];

  // MOCK DATA
  masterList: any[] = [
    { id: 1, name: 'Low', is_active: 1 },
    { id: 2, name: 'Medium', is_active: 1 },
    { id: 3, name: 'High', is_active: 1 },
    { id: 4, name: 'Critical', is_active: 1 },
  ];
  filteredList: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.createForm = this.formBuilder.group({
      Name: ['', [Validators.required]],
    });

    this.updateForm = this.formBuilder.group({
      Name: ['', [Validators.required, Validators.minLength(2)]],
    });

    this.viewForm = this.formBuilder.group({
      Name: [''],
    });
    
    this.GetListFun();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value;
    this.page = 1;
    this.GetListFun();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.GetListFun();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetListFun();
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetListFun();
  }

  GetListFun() {
    const searchText = (this.searchbarform?.get('searchbar')?.value || '').toLowerCase();
    
    if (searchText) {
      this.filteredList = this.masterList.filter(item => item.name.toLowerCase().includes(searchText));
    } else {
      this.filteredList = [...this.masterList];
    }
    this.totalRecords = this.filteredList.length;
  }

  openAddModal() {
    this.createModalOpen = true;
    this.createForm.reset();
  }

  closeModal() {
    this.updateModalOpen = false;
    this.createModalOpen = false;
    this.viewModalOpen = false;
    this.selectedItem = null;
    this.createForm.reset();
    this.updateForm.reset();
  }

  OpenEditModal(user: any): void {
    this.currentId = user.id;
    this.updateModalOpen = true;
    this.updateForm.patchValue({ Name: user.name });
  }

  openviewModal(user: any): void {
    this.viewModalOpen = true;
    this.currentId = user.id;
    this.selectedItem = user;
    this.viewForm.patchValue({ Name: user.name });
  }

  createItem() {
    if (this.createForm.valid) {
      const name = this.createForm.get('Name')?.value;
      const newId = this.masterList.length > 0 ? Math.max(...this.masterList.map(i => i.id)) + 1 : 1;
      this.masterList.unshift({ id: newId, name: name, is_active: 1 });
      this.notificationService.show('Severity Level created successfully (Mock)', 'success', 3000);
      this.closeModal();
      this.GetListFun();
    } else {
      this.createForm.markAllAsTouched();
    }
  }

  updateItem() {
    if (this.updateForm.valid) {
      const name = this.updateForm.get('Name')?.value;
      const index = this.masterList.findIndex(i => i.id === this.currentId);
      if (index !== -1) {
        this.masterList[index].name = name;
        this.notificationService.show('Severity Level updated successfully (Mock)', 'success', 3000);
        this.closeModal();
        this.GetListFun();
      }
    } else {
      this.updateForm.markAllAsTouched();
    }
  }

  Status(id: number, status: any) {
    const index = this.masterList.findIndex(i => i.id === id);
    if (index !== -1) {
      this.masterList[index].is_active = status;
      this.notificationService.show('Status updated successfully (Mock)', 'success', 3000);
      this.GetListFun();
    }
  }
}
