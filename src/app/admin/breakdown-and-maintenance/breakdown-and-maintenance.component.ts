import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Ticket {
  ticketNo: string;
  machineId: string;
  machineType: string;
  breakdownTime: string;
  category: string;
  priority: string;
  status: string;
  shift: string;
}

@Component({
  selector: 'app-breakdown-and-maintenance',
  templateUrl: './breakdown-and-maintenance.component.html',
  styleUrls: ['./breakdown-and-maintenance.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class BreakdownAndMaintenanceComponent implements OnInit {

  tickets: Ticket[] = [
    {
      ticketNo: '#BKD-2023-081',
      machineId: 'EXC-105',
      machineType: 'excavator',
      breakdownTime: 'Oct 24, 08:30 AM',
      category: 'HYDRAULIC',
      priority: 'CRITICAL',
      status: 'OPEN',
      shift: 'A (Day)'
    },
    {
      ticketNo: '#BKD-2023-079',
      machineId: 'DMP-012',
      machineType: 'dump-truck',
      breakdownTime: 'Oct 24, 06:15 AM',
      category: 'MECHANICAL',
      priority: 'MEDIUM',
      status: 'IN PROGRESS',
      shift: 'B (Night)'
    },
    {
      ticketNo: '#BKD-2023-075',
      machineId: 'DZR-044',
      machineType: 'dozer',
      breakdownTime: 'Oct 23, 11:45 PM',
      category: 'ELECTRICAL',
      priority: 'HIGH',
      status: 'CLOSED',
      shift: 'C (Swing)'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  isFilterOpen = false;
  isModalOpen = false;
  editingTicketNo: string | null = null;

  selectedCategory: string = '';
  selectedPriority: string = '';
  selectedStatus: string = '';
  selectedShift: string = '';

  toggleFilter() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  openModal(ticket?: Ticket) {
    this.editingTicketNo = ticket ? ticket.ticketNo : null;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingTicketNo = null;
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedPriority = '';
    this.selectedStatus = '';
    this.selectedShift = '';
  }

  get filteredTickets(): Ticket[] {
    let result = this.tickets;

    if (this.selectedCategory) {
      result = result.filter(t => t.category === this.selectedCategory);
    }
    if (this.selectedPriority) {
      result = result.filter(t => t.priority === this.selectedPriority);
    }
    if (this.selectedStatus) {
      result = result.filter(t => t.status === this.selectedStatus);
    }
    if (this.selectedShift) {
      result = result.filter(t => t.shift === this.selectedShift);
    }

    return result;
  }
}
