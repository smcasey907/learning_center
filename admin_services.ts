import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/observable';
import { map, filter, finalize, catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';
import * as _ from 'lodash';
import { Users } from './admin-management/users'
import { BehaviorSubject } from 'rxjs';

@Injectable ({
    providedIn: 'root'
})

export class AdminService {

    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    BLANK_UUID = '00000000-0000-0000-0000-000000000000'

    constructor(
        private http: HttpClient
    ) {}

    getAllUsers(): Observable<Users[]> {
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');
        let sub = sessionStorage.getItem('sub')

        return this.http.get<Users[]>(environment.apiUrl + 'learningcenter/'
                + sub + '/admin/' + this.BLANK_UUID
                + '?action=member_management',
                {headers: new HttpHeaders({
                    'Content-Type': 'application/json',
                    'Authorization': authorization_value
                })}
        ).pipe<Users[]>(
            map(response => {
                const rows = [];
                // The dataSource requires detailRow to provide notice to the table that the
                // row expands. That information is injected here.
                response.forEach(user => rows.push(user, {detailRow: true, user}));
                response.forEach(user => user.completion_pct = parseInt(user.completion_pct, 10));

                return rows;
            }),
            catchError( error => {
                return Observable.throw(error);
            })
        )
    }

    getUserForAdmin(selectedUuid) {
        this.loadingSubject.next(true);
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');

        return this.http.get(environment.apiUrl + 'learningcenter/'
                + sessionStorage.getItem('sub')
                + '/admin/'
                + selectedUuid
                + '?action=member_management',
                    {headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'Authorization': authorization_value
                    })})
                    .pipe(
                        finalize(() => this.loadingSubject.next(false))
                    )
    }

    adminUpdateUser(user) {
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');
        let selectedSub = user.memberprofile_uuid;

        return this.http.post(environment.apiUrl + 'learningcenter/'
                + sessionStorage.getItem('sub')
                + '/admin/'
                + selectedSub
                + '?action=admin_management', user,
                    {headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'Authorization': authorization_value
                    })})
    }

    adminDeleteUser(selectedUuid) {
        this.loadingSubject.next(true);
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');

        return this.http.delete(environment.apiUrl + 'learningcenter/'
                + sessionStorage.getItem('sub')
                + '/admin/'
                + selectedUuid
                + '?action=member_management',
                    {headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'Authorization': authorization_value
                    })})
                    .pipe(
                        finalize(() => this.loadingSubject.next(false))
                    )
    }

    postNewUser(user) {
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');

        return this.http.post(environment.apiUrl + 'learningcenter/'
                + sessionStorage.getItem('sub')
                + '/admin/'
                + this.BLANK_UUID
                + '?action=member_management', user,
                    {headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'Authorization': authorization_value
                    })})
    }
}
