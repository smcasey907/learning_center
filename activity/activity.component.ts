import { Component, OnInit, AfterViewInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { fuseAnimations } from '@fuse/animations'
import { UsersDataSource } from '../admin-management/admin-data-source';
import { AdminService } from '../admin_services';
import { Router, ActivatedRoute } from '@angular/router';
import * as moment from 'moment';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
  animations: [
    fuseAnimations,
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class ActivityComponent implements AfterViewInit, OnInit {
  dataSource: UsersDataSource;
  displayedColumns = ['firstname', 'lastname', 'completion_pct']
  userData: any[];

  constructor(
    private rout: ActivatedRoute,
    private adminService: AdminService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.dataSource = new UsersDataSource(this.adminService);
    this.dataSource.loadUsers();
  }

  ngAfterViewInit() {
    // TODO: Handle Sort, pagination, and filter here.
  }

  loadUsersPage() {
    this.dataSource.loadUsers();
  }

  getUserTable(userUuid) {
    this.adminService.getUserForAdmin(userUuid).subscribe(
      response => {
        this.userData = [];
        for (let h of response['history']) {
          let newDate = moment(h.date, 'YYYY-MM-DD').format('L, LT');
          let numerator = parseInt(h.fraction_grade.split('/')[0], 10);
          let denominator = parseInt(h.fraction_grade.split('/')[1], 10);
          let sp = (numerator / denominator * 100);
          if (sp % 1 !== 0) {
            sp = Number(sp.toFixed(2))
          }
          let scorePercentage = sp.toString() + '%'
          this.userData.push({
            'date': newDate,
            'title': h.title,
            'fract': h.fraction_grade,
            'percentage': scorePercentage
          })
        }
        let config = new MatDialogConfig();
        const dialogRef = this.dialog.open(UserHistoryDialogComponent, config);
        dialogRef.componentInstance.dataSource = this.userData;
        dialogRef.componentInstance.user = response;
        dialogRef.afterClosed().subscribe(res => {

        })
      }
    )
  }

}

// TODO: format the modal so the table doesn't fill the whole screen and is scrollable

@Component({
  selector: 'user-history-dialog',
  template: `
  <div class="content p-24">
    <table mat-table [dataSource]="dataSource" class="mat-elevation-z8 history-table" style="width: 100%">
      <ng-container matColumnDef="date">
          <th mat-hader-cell *matHeaderCellDef> Date </th>
          <td mat-cell *matCellDef="let history">{{history.date}}</td>
      </ng-container>
      <ng-container matColumnDef="title">
          <th mat-hader-cell *matHeaderCellDef> Lesson Name </th>
          <td mat-cell *matCellDef="let history">{{history.title}}</td>
      </ng-container>
      <ng-container matColumnDef="fract">
          <th mat-hader-cell *matHeaderCellDef> Raw Score </th>
          <td mat-cell *matCellDef="let history">{{history.fract}}</td>
      </ng-container>
      <ng-container matColumnDef="percentage">
          <th mat-hader-cell *matHeaderCellDef> Percentage </th>
          <td mat-cell *matCellDef="let history">{{history.percentage}}</td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="dcForSecondChart; sticky: true"></tr>
      <tr mat-row *matRowDef="let row; columns: dcForSecondChart;"></tr>
    </table>
    <h5>By clicking the button below you will remove the current progress of this user, while still saving their history</h5>
    <button mat-raised-button color="primary" (click)="clearData()">Reset User</button>
  </div>
  `
})

export class UserHistoryDialogComponent {
  dataSource: any;
  user: any;
  dcForSecondChart = ['date', 'title', 'fract', 'percentage']

  constructor(
    public dialogRef: MatDialogRef<UserHistoryDialogComponent>,
    private adminService: AdminService
  ) { }

  clearData() {
    let user = this.user;
    user['grade'] = [];
    user['remedial_lesson'] = [];
    user['active_lessons'] = [];
    user['active_lessons'].push(1);
    this.adminService.adminUpdateUser(user).subscribe(
      response => {
        console.log(user.firstname + ' ' + user.lastname + ' has been cleared')
      }, (error) => {
        alert(error);
      }
    )
  }
}



