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
    private loginService: LoginService
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
  ngOnInit() {
    this.userId = this.jwtService.getpanelUserId();
    // this.router.events.subscribe(event => {
    //   if (event instanceof NavigationEnd) {
    //     this.closeMenu();
    //   }
    // });
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
