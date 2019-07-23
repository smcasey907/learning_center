import { Component, OnInit } from '@angular/core';
import {LoginService} from '../authentication/login/login.service';
import {DoctorApiService} from '../authentication/login/doctorapi.service';
import {SettingsService} from '../authentication/login/settings.service';
import {LoggedInCallback, Callback, CognitoUtil } from '../authentication/login/cognito.service';
import {Router, ActivatedRoute} from '@angular/router';
import { UserService } from 'app/main/pages/user_b.service';
import { fuseAnimations } from '@fuse/animations';
import { FuseNavigationService } from '@fuse/components/navigation/navigation.service';
import * as _ from 'lodash';
import { _MatFormFieldMixinBase } from '@angular/material';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: fuseAnimations,
})
export class HomeComponent implements OnInit, LoggedInCallback {

  access_token: string;

  username: string;
  sub: string;
  docView: string;
  name: string;

  constructor(
    public router: Router,
    public r: ActivatedRoute,
    public loginService: LoginService,
    public settingsService: SettingsService,
    public cognitoUtil: CognitoUtil,
    public apiService: DoctorApiService,
    public userService: UserService,
    private _fuseNavigationService: FuseNavigationService
  ) {

  }

  ngOnInit() {
    this.loginService.isAuthenticated(this);
    this.docView = this.loginService.settingsService.getDoctorName();
    this.userService.createUser().then(
      resp => {
        let rbac = resp['rbac'];
        if (rbac.length === 0) {
          this._fuseNavigationService.updateNavigationItem('administration', {hidden: true});
        } else {
          this._fuseNavigationService.updateNavigationItem('administration', {hidden: false});
        }
        if (!rbac.includes('admin_management')) {
          this._fuseNavigationService.updateNavigationItem('admin', {hidden: true});
        } else {
          this._fuseNavigationService.updateNavigationItem('admin', {hidden: false});
        }
        if (!rbac.includes('billing_account_info')) {
          this._fuseNavigationService.updateNavigationItem('billing', {hidden: true});
        } else {
          this._fuseNavigationService.updateNavigationItem('billing', {hidden: false});
        }
        if (!rbac.includes('activity')) {
          this._fuseNavigationService.updateNavigationItem('activity', {hidden: true});
        } else {
          this._fuseNavigationService.updateNavigationItem('activity', {hidden: false});
        }
      }
    )
    this.name = sessionStorage.getItem('name');
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (!isLoggedIn) {
        this.router.navigate(['/pages/auth/login']);
    } else {
        try {
            let msgJson = JSON.parse(message);

            if (this.settingsService.isAdminMode() === true) {
                this.username = msgJson.email;
            } else {
                this.username = msgJson['cognito:username'];
            }

            this.sub = msgJson.sub;
            sessionStorage.setItem('sub', this.sub);
        } catch (e) {
            console.log('isLoggedIn receveived non-json message');
        }
        this.cognitoUtil.getAccessToken(new AccessTokenCallback(this))
        sessionStorage.setItem('access_token', this.access_token);
    }
  }

  goToAcademy() {
    this.router.navigate(['/apps/academy/courses'], {relativeTo: this.r});
  }

}

export class AccessTokenCallback implements Callback {
    constructor(public component: HomeComponent) {

    }

    callback() {

    }

    callbackWithParam(result) {
        this.component.access_token = result;
        this.component.apiService.setToken(result);
        // console.log(this.component.sub);
        // console.log(result);
        let data = {
            member_uuid: this.component.sub,
            token: result
        }
        // this.component.apiService.verifyEmail(data)
        //     .subscribe(
        //         (response) => {
        //             // console.log("VERIFY RESPONSE ", response);
        //         },
        //         (error) => {
        //             alert(error);
        //         }
        //     );
    }
}