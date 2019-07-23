import { Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { FormControl, Validators, FormBuilder } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations'
import { AdminService } from '../admin_services'
import { Router, ActivatedRoute } from '@angular/router';
import { UsersDataSource } from './admin-data-source'
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig } from '@angular/material';
import { Users } from './users';

@Component({
  selector: 'app-admin-management',
  templateUrl: './admin-management.component.html',
  styleUrls: ['./admin-management.component.scss'],
  animations: [
    fuseAnimations,
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', visibility: 'hidden'})),
      state('expanded', style({height: '*', visibility: 'visible'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})

export class AdminManagementComponent implements AfterViewInit, OnInit {
  dataSource: UsersDataSource;
  displayedColumns = ['firstname', 'lastname', 'username', 'trash'];

  expandedElement: Users;

  rbacValue: any;
  adminAccess: boolean;
  billingAccess: boolean;
  activityAccess: boolean;

  user: {};

  isExpansionDetailRow = (i: number, row: Object) => row.hasOwnProperty('detailRow');

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    public dialog: MatDialog
  ) {
    this.adminAccess = false;
    this.billingAccess = false;
    this.activityAccess = false;
  }

  ngOnInit() {
    this.dataSource = new UsersDataSource(this.adminService);
    this.dataSource.loadUsers();

    // TODO: Need to add count for total number of users for pagination
  }

  ngAfterViewInit() {
    // TODO: Handle Sort, Pagination, and Filter here
  }

  loadUsersPage() {
    this.dataSource.loadUsers();
  }

  expandRow(userUuid) {
    this.adminAccess = false;
    this.billingAccess = false;
    this.activityAccess = false;
    this.adminService.getUserForAdmin(userUuid)
    .subscribe(
      response => {
        this.user = response;
        if (response['rbac']) {
          this.rbacValue = response['rbac']
            if (this.rbacValue.includes('admin_management')) {
              this.adminAccess = true;
            }
            if (this.rbacValue.includes('billing_account_info')) {
              this.billingAccess = true;
            }
            if (this.rbacValue.includes('activity')) {
              this.activityAccess = true;
            }
        } else {
          this.rbacValue = undefined
        }
      }
    )
  }

  saveUserChanges() {
    let newRbacVal = [];
    if (this.adminAccess === true) {
      newRbacVal.push('admin_management');
    }
    if (this.billingAccess === true) {
      newRbacVal.push('billing_account_info');
    }
    if (this.activityAccess === true) {
      newRbacVal.push('activity');
    }
    if (newRbacVal.length >= 1) {
      newRbacVal.push('member_management');
    }

    this.user['rbac'] = newRbacVal;

    console.log(this.user);

    this.adminService.adminUpdateUser(this.user).subscribe(
      (result) => {
      }, (error) => {
          alert(error)
      }
    );

  }

  deleteUser(userUuid) {
    this.adminService.adminDeleteUser(userUuid).subscribe(
      (reslut) => {
        this.dataSource.loadUsers();
      }, (error) => {
        alert(error)
      }
    )
  }

  addUserModal() {
    let config = new MatDialogConfig();
    const dialogRef = this.dialog.open(AddUserDialogComponent, config);
    dialogRef.afterClosed().subscribe(result => {
      this.dataSource.loadUsers();
    })
  }

}

@Component({
  selector: 'add-user-dialog',
  template: `
    <h2><b><span color="primary">Add a new user</span></b></h2>
    <mat-form-field appearance="outline">
      <mat-label>First Name</mat-label>
      <input matInput placeholder="First Name" [formControl]="firstname" required>
    </mat-form-field>
    <br>
    <mat-form-field appearance="outline">
      <mat-label>Last Name</mat-label>
      <input matInput placeholder="Last Name" [formControl]="lastname" required>
    </mat-form-field>
    <br>
    <mat-form-field appearance="outline">
      <mat-label>Email</mat-label>
      <input matInput placeholder="Email" [formControl]="email" required>
      <mat-error *ngIf="email.invalid">{{getErrorMessage()}}</mat-error>
    </mat-form-field>
    <mat-grid-list cols="2">
      <mat-grid-tile [colspan]="1">
        <button mat-raised-button color="primary"
          class="btn btn-success"
          [disabled]="!(firstname.valid && lastname.valid && email.valid)"
          (click)="onSave()">Save</button>
      </mat-grid-tile>
      <mat-grid-tile [colspan]="1">
        <button mat-raised-button class="btn" (click)="onCancel()">Cancel</button>
      </mat-grid-tile>
    </mat-grid-list>
  `
})
export class AddUserDialogComponent {
  firstname = new FormControl('', [Validators.required, Validators.minLength(1)])
  lastname = new FormControl('', [Validators.required, Validators.minLength(1)]);
  email = new FormControl('', [Validators.required, Validators.email]);

  constructor(
    public dialogRef: MatDialogRef<AddUserDialogComponent>,
    private adminService: AdminService
    ) {
    }

    getErrorMessage() {
      return this.email.hasError('required') ? 'You must enter a value' :
        this.email.hasError('email') ? 'Not a valid email' :
          '';
    }

    onSave(): void {
      let user = {
        'firstname': this.firstname.value,
        'lastname': this.lastname.value,
        'email': this.email.value
      }
      this.adminService.postNewUser(user).subscribe(
        resp => {
          console.log('Added ' + this.firstname.value + ' ' + this.lastname.value)
        }, (error) => {
            alert(error);
          }
      )
      // Send data to backend
      this.dialogRef.close();
    }

    onCancel(): void {
      this.dialogRef.close();
    }
}
