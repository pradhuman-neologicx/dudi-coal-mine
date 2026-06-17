import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface QuickCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  bg: string;
}

interface ModuleSection {
  title: string;
  icon: string;
  color: string;
  items: { label: string; icon: string; route: string }[];
}

@Component({
  selector: 'app-dashboard-new1',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-new1.component.html',
  styleUrl: './dashboard-new1.component.scss'
})
export class DashboardNew1Component {

  today = new Date();
  todayStr = this.today.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

  constructor(private router: Router) { }

  quickCards: QuickCard[] = [
    {
      title: 'Mark Attendance',
      description: 'Record daily attendance for employees',
      icon: 'fa-solid fa-fingerprint',
      route: '/admin/attendance-management',
      color: '#fff',
      bg: 'linear-gradient(135deg, #468faf, #2c7da0)'
    },
    {
      title: 'Mark Leave',
      description: 'Apply or approve employee leaves',
      icon: 'fa-solid fa-calendar-xmark',
      route: '/admin/leave-management',
      color: '#fff',
      bg: 'linear-gradient(135deg, #52b788, #2d6a4f)'
    },
    {
      title: 'Payroll',
      description: 'Manage salaries and payments',
      icon: 'fa-solid fa-money-bill-wave',
      route: '/admin/payroll-management',
      color: '#fff',
      bg: 'linear-gradient(135deg, #e76f51, #c1440e)'
    },
    {
      title: 'New Shift Plan',
      description: 'Create and assign shift rotations',
      icon: 'fa-solid fa-calendar-plus',
      route: '/admin/shift-management',
      color: '#fff',
      bg: 'linear-gradient(135deg, #7b2d8b, #5a1f6b)'
    },
  ];

  modules: ModuleSection[] = [
    {
      title: 'Workforce Management',
      icon: 'fa-solid fa-users-gear',
      color: '#468faf',
      items: [
        { label: 'Attendance Management', icon: 'fa-solid fa-clock-rotate-left', route: '/admin/attendance-management' },
        { label: 'Leave Management', icon: 'fa-solid fa-calendar-minus', route: '/admin/leave-management' },
        { label: 'Payroll Management', icon: 'fa-solid fa-file-invoice-dollar', route: '/admin/payroll-management' },
      ]
    },
    {
      title: 'Operations',
      icon: 'fa-solid fa-gears',
      color: '#e76f51',
      items: [
        { label: 'Breakdown & Maintenance', icon: 'fa-solid fa-screwdriver-wrench', route: '/admin/breakdown-and-maintenance' },
        { label: 'Fuel Management', icon: 'fa-solid fa-gas-pump', route: '/admin/fuel-mgt' },
        { label: 'Delay Report', icon: 'fa-solid fa-triangle-exclamation', route: '/admin/delay-report' },
        { label: 'Shift Management', icon: 'fa-solid fa-stopwatch', route: '/admin/shift-mgt' },
        { label: 'Safety Management', icon: 'fa-solid fa-shield-halved', route: '/admin/safety-management' },
      ]
    },
    {
      title: 'Equipment Management',
      icon: 'fa-solid fa-truck',
      color: '#7b2d8b',
      items: [
        { label: 'Equipment Master', icon: 'fa-solid fa-layer-group', route: '/admin/equipment-management/equipment-master' },
        { label: 'Equipments', icon: 'fa-solid fa-truck-pickup', route: '/admin/equipment-management/equipments' },
      ]
    },
    {
      title: 'Employee',
      icon: 'fa-solid fa-user-tie',
      color: '#52b788',
      items: [
        { label: 'Employee Management', icon: 'fa-solid fa-id-card', route: '/admin/employee-management' },
        { label: 'Employee Payroll', icon: 'fa-solid fa-wallet', route: '/admin/employee-payroll' },
      ]
    },
    {
      title: 'Inventory Management',
      icon: 'fa-solid fa-boxes-stacked',
      color: '#f4a261',
      items: [
        { label: 'Categories', icon: 'fa-solid fa-tags', route: '/admin/inventory-management/categories' },
        { label: 'Product Master', icon: 'fa-solid fa-box', route: '/admin/inventory-management/product-master' },
        { label: 'Inventory', icon: 'fa-solid fa-warehouse', route: '/admin/inventory-management/inventory' },
      ]
    },
    {
      title: 'Training & Shift',
      icon: 'fa-solid fa-chalkboard-user',
      color: '#2c7da0',
      items: [
        { label: 'Training Management', icon: 'fa-solid fa-graduation-cap', route: '/admin/training-management' },
        { label: 'Shift Rotation', icon: 'fa-solid fa-rotate', route: '/admin/shift-management' },
      ]
    },
  ];

  navigate(route: string) {
    this.router.navigate([route]);
  }
}
