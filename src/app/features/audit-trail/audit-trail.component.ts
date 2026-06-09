import { Component, ViewChild, AfterViewInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import {
  AuditTrailService,
  AuditEntry,
} from './services/audit-trail.service';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatChipsModule],
  templateUrl: './audit-trail.component.html',
  styleUrl: './audit-trail.component.scss'
})
export class AuditTrailComponent implements AfterViewInit {
  private auditService = inject(AuditTrailService);

  displayedColumns: string[] = ['timestamp', 'responsable', 'action', 'tableName', 'changes'];
  dataSource = new MatTableDataSource<AuditEntry>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor() {
    effect(() => {
      this.dataSource.data = [...this.auditService.allEntries()];
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-700';
      case 'UPDATE':
        return 'bg-sky-100 text-sky-700';
      case 'DELETE':
        return 'bg-rose-100 text-rose-700';
      case 'LOGIN':
        return 'bg-violet-100 text-violet-700';
      case 'LOGOUT':
        return 'bg-orange-100 text-orange-800';
      case 'PASSWORD_CHANGE':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }
}
