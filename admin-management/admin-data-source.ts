import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, Observable } from 'rxjs';
import { Users } from './users'
import { AdminService } from '../admin_services';
import { catchError, finalize, subscribeOn } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';
import { tap, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';

@Injectable()

export class UsersDataSource implements DataSource<Users> {

    private usersSubject = new BehaviorSubject<Users[]>([]);

    private loadingSubject = new BehaviorSubject<boolean>(false);

    public loading$ = this.loadingSubject.asObservable();

    constructor(
        private adminService: AdminService
    ) {}

    loadUsers() {
        this.loadingSubject.next(true);

        this.adminService.getAllUsers().pipe(
            catchError((val) => of([])),
            finalize(() => this.loadingSubject.next(false)),
        ).subscribe(users => this.usersSubject.next(users))
    }

    connect(collectionViewer: CollectionViewer): Observable<Users[]> {
        return this.usersSubject.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
        this.usersSubject.complete();
        this.loadingSubject.complete();
    }
}
