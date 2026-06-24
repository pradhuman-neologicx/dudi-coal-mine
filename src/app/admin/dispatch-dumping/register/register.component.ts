import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {

  trips = [
    { ref: 'TRP-2026-001248', date: '18 Jun 2026', shift: 'A', dumper: 'DMP-09', driver: 'John Doe', excavator: 'EXC-102', loadPoint: 'Block 4 West', dumpPoint: 'Dump 2', start: '10:15 AM', end: '10:28 AM', cycle: '13', quantity: 105, status: 'LOGGED' },
    { ref: 'TRP-2026-001247', date: '18 Jun 2026', shift: 'A', dumper: 'DMP-03', driver: 'Vikram Mehta', excavator: 'EXC-102', loadPoint: 'Block 4 West', dumpPoint: 'Dump 2', start: '09:50 AM', end: '10:02 AM', cycle: '12', quantity: 110, status: 'COMPLETED' },
    { ref: 'TRP-2026-001246', date: '18 Jun 2026', shift: 'A', dumper: 'DMP-12', driver: 'David Richards', excavator: 'EXC-101', loadPoint: 'Block 2 North', dumpPoint: 'Dump 1', start: '09:30 AM', end: '09:41 AM', cycle: '11', quantity: 115, status: 'COMPLETED' },
    { ref: 'TRP-2026-001245', date: '18 Jun 2026', shift: 'A', dumper: 'DMP-07', driver: 'Arjun Singh', excavator: 'EXC-101', loadPoint: 'Block 2 North', dumpPoint: 'Dump 1', start: '09:10 AM', end: '09:20 AM', cycle: '10', quantity: 120, status: 'COMPLETED' }
  ];

  showLogModal = false;
  showEditModal = false;

  newTrip: any = {
    dumper: '',
    driver: '',
    excavator: '',
    loadPoint: '',
    dumpPoint: '',
    start: '',
    end: '',
    quantity: null,
    distance: null
  };

  selectedTrip: any = null;

  constructor() {}

  ngOnInit(): void {}

  openLogModal() {
    this.newTrip = { dumper: '', driver: '', excavator: '', loadPoint: '', dumpPoint: '', start: '', end: '', quantity: null, distance: null };
    this.showLogModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeLogModal() {
    this.showLogModal = false;
    document.body.style.overflow = '';
  }

  saveTrip() {
    if (this.newTrip.dumper && this.newTrip.quantity) {
      this.trips.unshift({
        ref: 'TRP-2026-001249',
        date: '18 Jun 2026',
        shift: 'A',
        dumper: this.newTrip.dumper,
        driver: this.newTrip.driver || 'Unknown Driver',
        excavator: this.newTrip.excavator,
        loadPoint: this.newTrip.loadPoint,
        dumpPoint: this.newTrip.dumpPoint,
        start: this.newTrip.start || '10:30 AM',
        end: this.newTrip.end || '10:45 AM',
        cycle: '15',
        quantity: this.newTrip.quantity,
        status: 'LOGGED'
      });
    }
    this.closeLogModal();
  }

  openEditModal(trip: any) {
    this.selectedTrip = { ...trip };
    this.showEditModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedTrip = null;
    document.body.style.overflow = '';
  }
}
