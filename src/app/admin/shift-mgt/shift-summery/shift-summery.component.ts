import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-shift-summery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shift-summery.component.html',
  styleUrls: ['./shift-summery.component.scss']
})
export class ShiftSummeryComponent implements OnInit {

  selectedShift: any = {
    date: 'Oct 24, 2023',
    shiftCode: 'B',
    status: 'CLOSED'
  };

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.selectedShift.shiftCode = id;
    }
  }

  goBack() {
    this.router.navigate(['/admin/shift-mgt']);
  }
}
