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
import { HolidayService } from 'src/app/core/services/holiday.service';

@Component({
  selector: 'app-holiday',
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
  templateUrl: './holiday.component.html',
  styleUrl: './holiday.component.scss',
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
export class HolidayComponent implements OnInit {
  showreset: boolean = false; 
  searchbarform!: FormGroup;
  createHolidayForm!: FormGroup;
  updateHolidayForm!: FormGroup;
  viewHolidayForm!: FormGroup;
  
  tableSize: any = 10;
  tableSizes: any = [10, 20, 50, 100, 'all'];
  totalRecords: any;
  page: number = 1;
  
  createHolidayOpen: boolean = false;
  updateHolidayOpen: boolean = false;
  viewHolidayOpen: boolean = false;
  currentHolidayId: any;
  selectedHoliday: any = null;
  
  holidayList: any[] = [];
  
  table_heading = [
    {
      heading0: 'Serial No.',
      heading1: 'Holiday Name',
      heading2: 'Date',
      heading3: 'Site',
      heading4: 'Holiday Type',
      heading5: 'Status',
      heading6: 'Action',
    },
  ];

  sites: any[] = [];



  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private siteService: SiteService,
    private holidayService: HolidayService,
  ) {}

  ngOnInit(): void {
    this.searchbarform = this.formBuilder.group({
      searchbar: [''],
    });

    this.createHolidayForm = this.formBuilder.group({
      holidayName: ['', [Validators.required]],
      date: ['', [Validators.required]],
      site: ['', [Validators.required]],
      holidayType: ['', [Validators.required]],
    });

    this.updateHolidayForm = this.formBuilder.group({
      holidayName: ['', [Validators.required]],
      date: ['', [Validators.required]],
      site: ['', [Validators.required]],
      holidayType: ['', [Validators.required]],
    });

    this.viewHolidayForm = this.formBuilder.group({
      holidayName: [''],
      date: [''],
      site: [''],
      holidayType: [''],
    });
    
    this.loadSites();
    this.GetHolidayFun();
  }

  loadSites() {
    this.siteService.getSites('all', 1, '').subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.sites = response.data;
        }
      },
      error: (error: any) => {
        console.error('Error fetching sites:', error);
      }
    });
  }

  onTableSizeChange(event: any): void {
    this.tableSize = event.target.value;
    this.page = 1;
    this.GetHolidayFun();
  }

  onTableDataChange(event: any) {
    this.page = event;
    this.GetHolidayFun();
  }

  searchfun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';
    this.showreset = searchText.trim().length > 0;
    this.GetHolidayFun();
  }

  resetsearchbar() {
    this.searchbarform.get('searchbar')?.reset();
    this.showreset = false;
    this.page = 1;
    this.GetHolidayFun();
  }

  openAddModal() {
    this.createHolidayOpen = true;
  }

  closeModal() {
    this.updateHolidayOpen = false;
    this.createHolidayOpen = false;
    this.viewHolidayOpen = false;
    this.selectedHoliday = null;
    this.createHolidayForm.reset({ site: '', holidayType: 'Festival' });
  }

  OpenEditModal(holiday: any): void {
    this.currentHolidayId = holiday.id;
    this.updateHolidayOpen = true;
    this.GetupdateHolidaybyid(this.currentHolidayId);
  }

  openviewModal(holiday: any): void {
    this.viewHolidayOpen = true;
    this.currentHolidayId = holiday.id;
    this.selectedHoliday = null;

    this.holidayService.getHolidayById(holiday.id).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const resHoliday = response.data;
          this.selectedHoliday = {
            id: resHoliday.id,
            holidayName: resHoliday.holiday_name,
            date: resHoliday.holiday_date,
            site: resHoliday.site,
            holidayType: resHoliday.holiday_type,
            is_active: resHoliday.status !== undefined ? resHoliday.status : resHoliday.is_active
          };
        }
      },
      error: (error: any) => {
        console.error('Error fetching holiday details:', error);
      }
    });
  }

  formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  GetupdateHolidaybyid(holidayId: any) {
    this.holidayService.getHolidayById(holidayId).subscribe({
      next: (response: any) => {
        if (response.status === 200 && response.data) {
          const holiday = response.data;
          
          let siteIdVal = holiday.site;
          const foundSite = this.sites.find(s => s.name === holiday.site);
          if (foundSite) {
            siteIdVal = foundSite.id;
          }

          this.updateHolidayForm.patchValue({
            holidayName: holiday.holiday_name,
            date: this.formatDateForInput(holiday.holiday_date),
            site: siteIdVal,
            holidayType: holiday.holiday_type,
          });
        }
      },
      error: (error: any) => {
        console.error('Error fetching holiday for edit:', error);
      }
    });
  }

  createHoliday() {
    if (this.createHolidayForm.valid) {
      const holidayData = this.createHolidayForm.value;

      const formData = new FormData();
      formData.append('site_id', holidayData.site);
      formData.append('holiday_name', holidayData.holidayName);
      formData.append('holiday_date', holidayData.date);
      formData.append('holiday_type', holidayData.holidayType);

      this.holidayService.createHoliday(formData).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(
              response.message || 'Holiday created successfully',
              'success',
              3000,
            );
            
            this.GetHolidayFun();
          } else {
            this.notificationService.show(
              response.message || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Create Holiday failed:', error);
          let errorMsg = 'Something went wrong';
          if (error.error) {
            if (error.error.errors) {
              const errorKeys = Object.keys(error.error.errors);
              if (errorKeys.length > 0) {
                const firstKey = errorKeys[0];
                const messages = error.error.errors[firstKey];
                if (Array.isArray(messages) && messages.length > 0) {
                  errorMsg = messages[0];
                } else if (typeof messages === 'string') {
                  errorMsg = messages;
                }
              }
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          } else if (error.message) {
            errorMsg = error.message;
          } else if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    } else {
      this.createHolidayForm.markAllAsTouched();
    }
  }

  updateHoliday() {
    if (this.updateHolidayForm.valid) {
      const holidayData = this.updateHolidayForm.value;

      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('site_id', holidayData.site);
      formData.append('holiday_name', holidayData.holidayName);
      formData.append('holiday_date', holidayData.date);
      formData.append('holiday_type', holidayData.holidayType);

      this.holidayService.updateHoliday(this.currentHolidayId, formData).subscribe({
        next: (response: any) => {
          if (response.status === 200 || response.status === 201) {
            this.closeModal();
            this.notificationService.show(
              response.message || 'Holiday updated successfully',
              'success',
              3000,
            );
            
            this.GetHolidayFun();
          } else {
            this.notificationService.show(
              response.message || 'Something went wrong',
              'error',
              3000,
            );
          }
        },
        error: (error: any) => {
          console.error('Update Holiday failed:', error);
          let errorMsg = 'Something went wrong';
          if (error.error) {
            if (error.error.errors) {
              const errorKeys = Object.keys(error.error.errors);
              if (errorKeys.length > 0) {
                const firstKey = errorKeys[0];
                const messages = error.error.errors[firstKey];
                if (Array.isArray(messages) && messages.length > 0) {
                  errorMsg = messages[0];
                } else if (typeof messages === 'string') {
                  errorMsg = messages;
                }
              }
            } else if (error.error.message) {
              errorMsg = error.error.message;
            }
          } else if (error.message) {
            errorMsg = error.message;
          } else if (typeof error === 'string') {
            errorMsg = error.includes('Message:') ? error.split('Message:')[1].trim() : error;
          }
          this.notificationService.show(errorMsg, 'error', 3000);
        }
      });
    } else {
      this.updateHolidayForm.markAllAsTouched();
    }
  }

  GetHolidayFun() {
    const searchText = this.searchbarform.get('searchbar')?.value || '';

    this.holidayService.getHolidays(this.tableSize, this.page, searchText).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.holidayList = response.data.map((item: any) => {
            return {
              id: item.id,
              holidayName: item.holiday_name,
              date: item.holiday_date,
              site: item.site,
              holidayType: item.holiday_type,
              is_active: item.status !== undefined ? item.status : item.is_active
            };
          });
          this.totalRecords = response.pagination?.total || response.data.length;
        } else {
          console.error('Failed to fetch holidays:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error fetching holidays:', error);
      }
    });
  }

  async Status(id: string, status: any) {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    formData.append('status', status.toString());

    this.holidayService.updateHolidayStatus(id, formData).subscribe({
      next: (response: any) => {
        if (response.status === 200 || response.status === 201) {
          this.notificationService.show(
            response.message || `Holiday status updated successfully`,
            'success',
            3000
          );
          this.GetHolidayFun();
        } else {
          this.notificationService.show(
            response.message || 'Something went wrong',
            'error',
            3000
          );
        }
      },
      error: (error: any) => {
        console.error('Error updating status:', error);
        let errorMsg = 'Something went wrong';
        if (error.error && error.error.message) {
          errorMsg = error.error.message;
        } else if (error.message) {
          errorMsg = error.message;
        }
        this.notificationService.show(errorMsg, 'error', 3000);
      }
    });
  }
}
