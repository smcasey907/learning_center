import { Component, OnInit } from '@angular/core';
import { UserService } from './../../pages/user_b.service';
import { fuseAnimations } from '@fuse/animations';
import { FormControl } from '@angular/forms'
import * as moment from 'moment';
import { DataSource } from '@angular/cdk/table';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  animations: fuseAnimations,
})
export class UserDetailsComponent implements OnInit {

  u: any;
  firstName: string;
  lastName: string;
  date_of_birth: any;
  race: string;
  raceOpts = [' ', 'Prefer not to specify', 'American Indian or Alaskan Native',
              'Black or African Amewrican', 'Hispanic or Latino', 'Native Hawaiian or Other Pacific Islander',
              'White'];
  sex: string;
  sexOpts = [' ', 'Prefer not to specify', 'Male', 'Female'];
  submitted = false;
  displayedColumns = ['date', 'title', 'fract', 'percentage'];
  dataSource: any;

  constructor(
    public us: UserService
  ) { }

  ngOnInit() {
    this.u = this.us.user
    this.dataSource = [];
    this.firstName = this.u.first_name;
    this.lastName = this.u.last_name;
    this.date_of_birth = moment(this.u.date_of_birth, 'MM-DD-YYYY');
    if (this.us.user['race'] !== ' ') {
      this.race = this.us.user['race'];
    }
    if (this.us.user['sex'] !== ' ') {
      this.sex = this.us.user['sex'];
    }
    if (this.us.user['history']) {
      let hist = this.us.user['history'];
      for (let h of hist) {
        let newDate = moment(h.date, 'YYYY-MM-DD').format('L, LT');
        let numerator = parseInt(h.fraction_grade.split('/')[0], 10);
        let denominator = parseInt(h.fraction_grade.split('/')[1], 10);
        let sp = (numerator / denominator  * 100);
        if (sp % 1 !== 0) {
          sp = Number(sp.toFixed(2))
        }
        let scorePercentage = sp.toString() + '%'
        this.dataSource.push({
          'date': newDate,
          'title': h.title,
          'fract': h.fraction_grade,
          'percentage': scorePercentage
        })
      }
    }
  }

  updateUser(thisForm) {
    let d = thisForm.value.dob._i;
    d = (d.month + 1 + '/' + d.date + '/' + d.year).toString()
    this.us.user['first_name'] = thisForm.value.firstName;
    this.us.user['last_name'] = thisForm.value.lastName;
    this.us.user['date_of_birth'] = d;

    this.us.user['race'] = thisForm.value.ethnic;
    this.us.user['sex'] = thisForm.value.sexChoice;
    this.us.postUser();
  }


  clearUser() {
    this.us.clearHistory();
    sessionStorage.removeItem('createdCards');
    sessionStorage.removeItem('courseData');
  }

  onSubmit() {
    this.submitted = true;
  }

} 
export class UserDetailsModule {
}

