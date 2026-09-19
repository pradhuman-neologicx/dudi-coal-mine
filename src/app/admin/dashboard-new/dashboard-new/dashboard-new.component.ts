import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JwtService } from 'src/app/core/services/jwt.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

import { MatTabsModule } from '@angular/material/tabs';
import { Dashboard2Component } from '../../dashboard/dashboard-2/dashboard-2.component';
import { DashboardOverviewComponent } from '../dashboard-overview/dashboard-overview.component';

@Component({
  selector: 'app-dashboard-new',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatTabsModule, Dashboard2Component, DashboardOverviewComponent],
  templateUrl: './dashboard-new.component.html',
  styleUrl: './dashboard-new.component.scss',
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
            transform: 'translateX(0)',
            opacity: 1,
          }),
        ),
      ]),
    ]),
  ],
})
export class DashboardNewComponent implements OnInit {
  openSecondsuccess = false;
  firstlogin: boolean | undefined;
  selectedTabIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private jwtService: JwtService
  ) {
    this.route.queryParams.subscribe((params) => {
      this.firstlogin = this.jwtService.getfirstLoggedIn();
      if (this.firstlogin === false || this.firstlogin === undefined) {
        if (params['success'] === 'true') {
          this.openSecondsuccess = true;
          this.jwtService.firstLoggedIn(true);
          setTimeout(() => {
            this.openSecondsuccess = false;
          }, 1800);
        }
      }
      
      // Handle direct navigation to specific tabs
      if (params['tab'] === 'dumper-fleet') {
        this.selectedTabIndex = 1;
      } else if (params['tab'] === 'overview') {
        this.selectedTabIndex = 0;
      }
    });
  }

  ngOnInit(): void {
    // Shell component initialization logic (if any)
  }
}
