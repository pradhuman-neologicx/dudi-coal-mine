import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JwtService } from 'src/app/core/services/jwt.service';
import { FuelComponent } from '../fuel/fuel.component';
import { FuelStationsComponent } from '../fuel/fuel-stations/fuel-stations.component';
import { AuthGuard } from 'src/app/core/auth/auth-guard';
import { FuelManagementComponent } from '../fuel/fuel-management/fuel-management.component';

interface MenuItem {
  index: number;
  icon: string;
  label: string;
  route: string;
  subItems?: MenuItem[];
}

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  menuItems: MenuItem[] = [];
  @Input() collapsed: boolean = false;
  @Input() isMobile: boolean = false;
  @Output() closeSidenav = new EventEmitter<void>();

  constructor(
    private jwtService: JwtService,
    private router: Router,
  ) { }
  ProfilePicSizeClass(): string {
    return this.collapsed ? 'profile-pic-small' : 'profile-pic-large';
  }

  ShortnameB(): string {
    return this.collapsed ? 'shortname-small-b' : 'shortname-big-b';
  }

  Shortname(): string {
    return this.collapsed ? 'shortname-small' : 'shortname-big';
  }

  sideNavCollapsed(): boolean {
    return this.collapsed;
  }

  loginAS!: number;
  paneluserId!: String;
  roles: any;
  ngOnInit(): void {
    this.roles = this.jwtService.getadmiRole();
    this.menuItems = [];

    if (this.roles == 'admin') {
      this.menuItems = [
        {
          index: 1,
          icon: 'home',
          label: 'Dashboard',
          route: 'dashboard',
        },
        {
          index: 2,
          icon: 'widgets',
          label: 'Master',
          route: '/admin/master',
          subItems: [
            {
              index: 1,
              icon: 'inventory_2',
              label: 'Department',
              route: '/admin/master/department',
            },
            {
              index: 2,
              icon: 'badge',
              label: 'Designation',
              route: '/admin/master/designation',
            },
            {
              index: 3,
              icon: 'location_on',
              label: 'Site',
              route: '/admin/master/site',
            },
            {
              index: 4,
              icon: 'schedule',
              label: 'Shift',
              route: '/admin/master/shift',
            },
            {
              index: 5,
              icon: 'event_available',
              label: 'Leave Type',
              route: '/admin/master/leave-type',
            },
            {
              index: 6,
              icon: 'payments',
              label: 'Salary Structure',
              route: '/admin/master/salary-structure',
            },
            {
              index: 7,
              icon: 'celebration',
              label: 'Holiday',
              route: '/admin/master/holiday',
            },

            // {
            //   index: 7,
            //   icon: 'category',
            //   label: 'Safety Equipment',
            //   route: '/admin/master/equipment-category',
            // },
            {
              index: 8,
              icon: 'school',
              label: 'Training Type',
              route: '/admin/master/training-type',
            },
          ],
        },
        {
          index: 3,
          icon: 'people',
          label: 'Employee',
          route: '/admin/employee',
          subItems: [
            {
              index: 1,
              icon: 'manage_accounts',
              label: 'Employee Mgt.',
              route: '/admin/employee-management',
            },
            {
              index: 2,
              icon: 'account_balance_wallet',
              label: 'Employee Payroll',
              route: '/admin/employee-payroll',
            }
          ]
        },
        {
          index: 4,
          icon: 'calendar_month',
          label: 'Shift Rotation',
          route: '/admin/shift-management',
        },

        {
          index: 5,
          icon: 'business_center',
          label: 'Workforce Mgt.',
          route: '/admin/workforce',
          subItems: [
            {
              index: 1,
              icon: 'how_to_reg',
              label: 'Attendance Mgt.',
              route: '/admin/attendance-management',
            },
            {
              index: 2,
              icon: 'event_busy',
              label: 'Leave Mgt.',
              route: '/admin/leave-management',
            },
            {
              index: 3,
              icon: 'payments',
              label: 'Payroll Mgt.',
              route: '/admin/payroll-management',
            }
          ]
        },
        // {
        //   index: 8,
        //   icon: 'inventory',
        //   label: 'Equipment Mgt.',
        //   route: '/admin/equipment-management',
        // },
        {
          index: 9,
          icon: 'store',
          label: 'Inventory Mgt.',
          route: '/admin/inventory-management',
          subItems: [
            {
              index: 1,
              icon: 'category',
              label: 'Categories',
              route: '/admin/inventory-management/categories',
            },
            {
              index: 2,
              icon: 'inventory_2',
              label: 'Product Master',
              route: '/admin/inventory-management/product-master',
            },
            {
              index: 3,
              icon: 'storefront',
              label: 'Inventory',
              route: '/admin/inventory-management/inventory',
            }
          ]
        },
        {
          index: 10,
          icon: 'model_training',
          label: 'Training Mgt.',
          route: '/admin/training-management',
        },
        // {
        //   index: 10,
        //   icon: 'local_gas_station',
        //   label: 'Fuel',
        //   route: '/admin/fuel',
        //   subItems: [
        //     {
        //       index: 1,
        //       icon: 'ev_station',
        //       label: 'Fuel Stations',
        //       route: '/admin/fuel/fuel-stations',
        //     },
        //     {
        //       index: 2,
        //       icon: 'settings_input_component',
        //       label: 'Fuel Management',
        //       route: '/admin/fuel/fuel-management',
        //     },
        //     // {
        //     //   index: 3,
        //     //   icon: 'receipt_long',
        //     //   label: 'Fuel Report',
        //     //   route: '/admin/fuel/fuel-report',
        //     // }
        //   ]
        // },
        {
          index: 11,
          icon: 'local_shipping',
          label: 'Equipment Management',
          route: '/admin/vehicle-management',
          subItems: [
            {
              index: 1,
              icon: 'directions_car',
              label: 'Equipment Master',
              route: '/admin/vehicle-management/vehicle-master',
            },
            {
              index: 2,
              icon: 'local_taxi',
              label: 'Equipments',
              route: '/admin/vehicle-management/vehicles',
            },
            // {
            //   index: 3,
            //   icon: 'person_pin',
            //   label: 'Driver Mapping',
            //   route: '/admin/vehicle-management/driver-mapping',
            // },


          ]
        },



      ];
    } else if (this.roles == 'Engineer') {
      this.menuItems = [
        {
          index: 1,
          icon: 'home',
          label: 'Dashboard',
          route: 'dashboard',
        },
      ];
    }
  }

  removeDuplicateMenuItems(menuItems: any) {
    let uniqueItems: any;
    const seenRoutes = new Set();
    if (menuItems != undefined) {
      menuItems.forEach((item: any) => {
        if (item != undefined) {
          if (item.route != undefined) {
            if (!seenRoutes.has(item.route)) {
              uniqueItems.push(item);
              seenRoutes.add(item.route);
            }
          }
        }
      });
    }

    return uniqueItems;
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  closeSidebar() {
    this.collapsed = true;
  }
  ImageUrl!: String;

  name!: string;
  email!: string;

  getShortName(user: any) {
    if (this.name != undefined) {
      if (this.name != null) {
        return this.name.charAt(0);
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  isExpanded: boolean = false;

  // Function to toggle the expansion state
  toggleExpansion() {
    this.isExpanded = !this.isExpanded;
  }

  expandedSubmenu: string | null = null;

  isSubmenuExpanded(route: string): boolean {
    return this.expandedSubmenu === route;
  }

  toggleSubmenu(route: string): void {
    if (this.expandedSubmenu === route) {
      this.expandedSubmenu = null;
    } else {
      this.expandedSubmenu = route;
    }
  }
  closeSubmenu(): void {
    this.expandedSubmenu = null; // Close submenu
  }
}
