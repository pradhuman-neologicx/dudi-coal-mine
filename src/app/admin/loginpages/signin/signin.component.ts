import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { JwtService } from 'src/app/core/services/jwt.service';
import { NotificationService } from 'src/app/core/services/notificationnew.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  animations: [
    trigger('succesfullyMesaage', [
      state(
        'void',
        style({
          transform: 'translateX(-30%)',
          opacity: 0,
        }),
      ),
      transition(':enter, :leave', [
        animate('0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)'),
      ]),
    ]),
    trigger('slideIn', [
      state(
        'void',
        style({
          transform: 'translateX(100%)',
          opacity: 0,
        }),
      ),
      transition(':enter', [
        animate(
          '0.5s ease-out',
          style({
            transform: 'translateX(0)', // Final position for slide-in effect
            opacity: 1, // Final opacity
          }),
        ),
      ]),
    ]),
  ],
})
export class SigninComponent implements OnInit {
  title = 'Login';
  signIn!: FormGroup;
  openSecondsuccess: boolean = false;
  successName: any = '';

  errorMessage: any;
  submitted: boolean = false;
  showPassword: boolean = false;

  email_pattern = '^[A-Za-z0-9_.]+@[a-zA-Z]+(\\.[a-zA-Z]{2,4})+$';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private jwtService: JwtService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.signIn = this.formBuilder.group({
      email: ['', [Validators.required, Validators.pattern(this.email_pattern)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  closeModal() {
    this.openSecondsuccess = false;
  }

  onSignIn() {
    this.errorMessage = '';
    this.submitted = true;

    if (this.signIn.valid) {
      const email = this.signIn.get('email')?.value;
      const password = this.signIn.get('password')?.value;

      // Mock Login Logic
      if (email === 'admin@demo.com' && password === '123456') {
        this.successName = 'Login';
        this.openSecondsuccess = true;
        
        // Mocking token and user data
        this.jwtService.savepanelUserId('1');
        this.jwtService.saveadminame('Admin User');
        this.jwtService.saveAdminToken('mock-token-123');
        this.jwtService.saveAdminRole('admin');
        this.jwtService.isLoggedIn(true);
        
        setTimeout(() => {
          this.openSecondsuccess = false;
          this.router.navigate(['admin/dashboard']);
        }, 1500);

      } else {
        this.errorMessage = 'Invalid email or password';
      }
    } else {
      this.errorMessage = 'Please fill out all required fields correctly';
      this.signIn.markAllAsTouched();
    }
  }

  forgotPassword() {
    this.router.navigate(['/forgot_password']);
  }
}
