import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { Globals } from 'app/main/globals';
import { Http, RequestOptions, Headers } from '@angular/http';

@Injectable()
export class AcademyCoursesService implements Resolve<any>
{
    onCategoriesChanged: BehaviorSubject<any>;
    onCoursesChanged: BehaviorSubject<any>;
    private loadingSubject = new BehaviorSubject<boolean>(false);
    public loading$ = this.loadingSubject.asObservable();

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(
        private _httpClient: HttpClient,
        private globals: Globals,
        private http: Http
    )
    {
        // Set the defaults
        this.onCategoriesChanged = new BehaviorSubject({});
        this.onCoursesChanged = new BehaviorSubject({});
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return new Promise((resolve, reject) => {

            Promise.all([
                // this.getCategories(),
                this.getCards()
            ]).then(
                () => {
                    resolve();
                },
                reject
            );
        });
    }

    getCards(): Promise<any> {
        this.loadingSubject.next(true);
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');

        return new Promise((resolve, reject) => {
            this._httpClient.get(environment.apiUrl + 'learningcenter/'
                    + sessionStorage.getItem('sub')
                    + '/learningplan?cards=1', {headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'Authorization': authorization_value
                    })}
            ).pipe(
                finalize(() => this.loadingSubject.next(false))
            ).subscribe((response: any) => {
                this.onCoursesChanged.next(response);
                resolve(response);
            }, reject)
        })
    }

    /**
     * Get categories
     *
     * @returns {Promise<any>}
     */
    getCategories(): Promise<any> {
        let headers = new Headers({'Content-Type': 'application/json'});
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');
        headers.append('Authorization', authorization_value);

        return new Promise((resolve, reject) => {
            this._httpClient.get(environment.apiUrl + 'learningcenter/'
                    + sessionStorage.getItem('sub') +
                    '/learningplan?lessons_module_map=1')
                .subscribe((response: any) => {
                    this.onCategoriesChanged.next(response);
                    resolve(response);
                }, reject);
        });
    };

    /**
     * Get courses
     *
     * @returns {Promise<any>}
     */
     getCourses(): Promise<any> {
        let headers = new Headers({'Content-Type': 'application/json'});
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');
        headers.append('Authorization', authorization_value);
        let options = new RequestOptions({headers: headers});

        return new Promise((resolve, reject) => {
            this.http.get(environment.apiUrl + 'learningcenter/'
                    + sessionStorage.getItem('sub')
                    + '/learningplan?lessons_module_map=1', options)
                .subscribe((response: any) => {
                    this.onCoursesChanged.next(response);
                    resolve(response);
                }, reject);
        });
    };

}
