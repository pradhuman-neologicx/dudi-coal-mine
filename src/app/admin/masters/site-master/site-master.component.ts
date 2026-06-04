import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxPaginationModule } from 'ngx-pagination';
import { NotificationService } from 'src/app/core/services/notificationnew.service';
import { SiteService } from 'src/app/core/services/site.service';

@Component({
  selector: 'app-site-master',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    NgxPaginationModule,
  ],
  templateUrl: './site-master.component.html',
  styleUrl: './site-master.component.scss',
  animations: [
    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'scale(0.5)', 
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            opacity: 1,
            transform: 'scale(1)', 
          }),
        ),
      ]),
    ]),
  ],
})
export class SiteMasterComponent implements OnInit {
  showreset: boolean = false; 
  searchbarform!: FormGroup;
  createSiteForm!: FormGroup;
  updateSiteForm!: FormGroup;
  viewSiteForm!: FormGroup;
  
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;
  
  createSiteOpen: boolean = false;
  updateSiteOpen: boolean = false;
  viewSiteOpen: boolean = false;
  currentSiteId: any;
  selectedSite: any = null;
  
  siteList: any[] = [];
  
  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Site Name',
      heading2: 'Address',
      heading3: 'Status',
      heading4: 'Action',
    },
  ];

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private siteService: SiteService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.createSiteForm = this.formBuilder.group({
      siteName: ['', [Validators.required]],
      address: ['', [Validators.required]],
    });

    this.updateSiteForm = this.formBuilder.group({
      siteName: ['', [Validators.required]],
      address: ['', [Validators.required]],
    });

    this.viewSiteForm = this.formBuilder.group({
      siteName: [''],
      address: [''],
    });
    
    this.GetSiteFun();
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value;
    this.page = 1;
    this.GetSiteFun();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.GetSiteFun();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetSiteFun();
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetSiteFun();
  }

  openAddModal() {
    this.createSiteOpen = true;
  }

  closeModal() {
    this.updateSiteOpen = false;
    this.createSiteOpen = false;
    this.viewSiteOpen = false;
    this.selectedSite = null;
    this.createSiteForm.reset();
  }

  OpenEditModal(site: any): void {
    this.currentSiteId = site.id;
    this.updateSiteOpen = true;
    this.GetupdateSitebyid(this.currentSiteId);
  }

  openviewModal(site: any): void {
    this.viewSiteOpen = true;
    this.currentSiteId = site.id;
    this.selectedSite = null;

    this.siteService.getSiteById(site.id).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          const resSite = response.data;
          this.selectedSite = {
            ...resSite,
            siteName: resSite.name,
            is_active: resSite.status !== undefined ? resSite.status : resSite.is_active
          };
          this.viewSiteForm.patchValue({ 
            siteName: resSite.name,
            address: resSite.address
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching site details:', error);
      }
    });
  }

  GetupdateSitebyid(siteId: any) {
    this.siteService.getSiteById(siteId).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          const site = response.data;
          this.updateSiteForm.patchValue({
            siteName: site.name,
            address: site.address
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching site details:', error);
      }
    });
  }

  errorMessage: any;
  createSite() {
    if (this.createSiteForm.valid) {
      const siteName = this.createSiteForm.get('siteName')?.value;
      const address = this.createSiteForm.get('address')?.value;

      const formData = new FormData();
      formData.append('name', siteName);
      formData.append('address', address);

      this.siteService.createSite(formData).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(response.message || 'Site created successfully', 'success', 3000);
            this.GetSiteFun();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error) => {
          console.error('Create Site failed:', error);
          let errorMsg = '';
          if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          } else {
            errorMsg = error.message || error.error?.message || 'Something went wrong';
          }
          this.errorMessage = errorMsg;
          this.notificationService.show(this.errorMessage, 'error', 3000);
        },
      });
    } else {
      this.createSiteForm.markAllAsTouched();
    }
  }

  updateSite() {
    if (this.updateSiteForm.valid) {
      const siteName = this.updateSiteForm.get('siteName')?.value;
      const address = this.updateSiteForm.get('address')?.value;

      const formData = new FormData();
      formData.append('name', siteName);
      formData.append('address', address);
      formData.append('_method', 'PUT');

      this.siteService.updateSite(this.currentSiteId, formData).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(response.message || 'Site updated successfully', 'success', 3000);
            this.GetSiteFun();
          } else {
            this.notificationService.show(
              response.message || response.error || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Update Site failed:', error);
          let errorMsg = '';
          if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          } else {
            errorMsg = error.message || error.error?.message || 'Something went wrong';
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    } else {
      this.updateSiteForm.markAllAsTouched();
    }
  }

  GetSiteFun() {
    const searchText = this.searchbarform?.get('searchbar')?.value || '';

    this.siteService
      .getSites(this.tableSize, this.page, searchText)
      .subscribe({
        next: (response: any) => {
          if (response.status === 200) {
            this.siteList = response.data.map((item: any) => ({
              ...item,
              siteName: item.name,
              is_active: item.status !== undefined ? item.status : item.is_active
            }));
            this.totalRecords = response.pagination?.total || response.data.length;
          } else {
            console.error('Failed to fetch sites:', response.message);
          }
        },
        error: (error: any) => {
          console.error('Error fetching sites:', error);
        }
      });
  }

  async Status(id: string, status: any) {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.siteService.updateSiteStatus(id, formData).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.notificationService.show(
            response.message || `Site status updated successfully`,
            'success',
            3000
          );
          this.GetSiteFun();
        } else {
          this.notificationService.show(
            response.message || response.error || 'Failed to update status',
            'error',
            3000
          );
        }
      },
      error: (error: any) => {
        console.error('Status update failed:', error);
        let errorMsg = '';
        if (typeof error === 'string') {
          errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
        } else {
          errorMsg = error.message || error.error?.message || 'Something went wrong';
        }
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }
}
