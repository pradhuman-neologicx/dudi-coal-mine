import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
  Input,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { JwtService } from 'src/app/core/services/jwt.service';
import { LoginService } from 'src/app/core/services/login.service';
import { InventoryService } from 'src/app/core/services/inventory.service';
// import { JwtService } from 'src/app/core/services/jwt.service';

@Component({
  selector: 'app-sidenav-header',
  templateUrl: './sidenav-header.component.html',
  styleUrl: './sidenav-header.component.scss',
})
export class SidenavHeaderComponent implements OnInit {
  @Input() isMobile: boolean = false;
  @Output() toggleCollapsed = new EventEmitter<void>();
  searchQuery: string = '';

  constructor(
    private elementRef: ElementRef,
    private router: Router,
    private jwtService: JwtService,
    private loginService: LoginService,
    private inventoryService: InventoryService
  ) {}

  clearSearch(): void {
    this.searchQuery = '';
  }

  onInputChange(): void {
    // Add any additional logic if needed
  }

  isMenuOpen: boolean = false;
  isProfileOpen: boolean = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isProfileOpen = false; // Close profile if menu is opened
    }
  }

  profile() {
    this.isProfileOpen = !this.isProfileOpen;
    if (this.isProfileOpen) {
      this.isMenuOpen = false; // Close menu if profile is opened
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.isProfileOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }
  userId: any;
  alerts: any[] = [];
  alertCount: number = 0;

  ngOnInit() {
    this.userId = this.jwtService.getpanelUserId();
    this.fetchAlerts();
    // this.router.events.subscribe(event => {
    //   if (event instanceof NavigationEnd) {
    //     this.closeMenu();
    //   }
    // });
  }

  fetchAlerts() {
    this.inventoryService.getInventoryAlerts().subscribe({
      next: (res: any) => {
        if (res && res.status === 200 && res.data) {
          this.alerts = res.data;
          this.alertCount = res.pagination?.total || this.alerts.length || 0;
        }
      },
      error: (err) => console.error('Error fetching alerts', err)
    });
  }

  markAsRead(alert: any) {
    if (!alert.id) return;
    this.inventoryService.markAlertAsRead(alert.id).subscribe({
      next: (res: any) => {
        // Remove the alert from the list instantly for snappy UX
        this.alerts = this.alerts.filter(a => a.id !== alert.id);
        this.alertCount = Math.max(0, this.alertCount - 1);

        // Redirect to inventory management with filters
        if (alert.store_id || alert.product_id) {
          this.router.navigate(['/admin/inventory-management/inventory'], {
            queryParams: { store_id: alert.store_id, product_id: alert.product_id }
          });
          this.closeMenu();
        }
      },
      error: (err) => console.error('Error marking alert as read', err)
    });
  }

  markAllAsRead() {
    if (this.alerts.length === 0) return;
    this.inventoryService.markAllAlertsAsRead().subscribe({
      next: (res: any) => {
        this.alerts = [];
        this.alertCount = 0;
      },
      error: (err) => console.error('Error marking all alerts as read', err)
    });
  }

  getAlertType(alert: any): 'danger' | 'success' | 'info' {
    const text = ((alert.title || '') + ' ' + (alert.message || '')).toLowerCase();
    if (text.includes('out of stock') || text.includes('low stock') || text.includes('error') || text.includes('fail')) {
      return 'danger';
    } else if (text.includes('add') || text.includes('replenish') || text.includes('success') || text.includes('restock')) {
      return 'success';
    }
    return 'info';
  }

  getAlertIcon(alert: any): string {
    const type = this.getAlertType(alert);
    if (type === 'danger') return 'fa-triangle-exclamation';
    if (type === 'success') return 'fa-check-circle';
    return 'fa-bell';
  }

  // logout() {
  //   this.jwtService.clearStorage();
  //   this.router.navigate(["/sign_in"]);
  // }
  errorMessage: any;
  showErrorMessage: boolean = false;
  submitted!: boolean;
  openSecondsuccess: boolean = false;
  successName: any = '';

  logout() {
    this.loginService.Adminlogout().subscribe({
      next: (response: any) => {
        this.errorMessage = response.message;
        if (response.status === 200) {
          this.jwtService.clearStorage();
          this.router.navigate(['/sign_in']);
        } else {
          this.submitted = false;
          // Unconditional local logout on failure response to avoid user getting stuck
          this.jwtService.clearStorage();
          this.router.navigate(['/sign_in']);
        }
      },
      error: (error: any) => {
        console.error('Logout API failed, performing local logout:', error);
        this.jwtService.clearStorage();
        this.router.navigate(['/sign_in']);
      }
    });
  }
}
