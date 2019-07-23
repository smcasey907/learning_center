import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AcademyCoursesService } from 'app/main/apps/academy/courses.service';
import { Helper } from 'app/helper'
import { environment } from 'environments/environment';
import { resolve } from 'path';

@Injectable()
export class AcademyCourseService {
    onCardChanged: BehaviorSubject<any>;

    private _unsubscribeAll: Subject<any>;
    public questionId: string;
    public mediaId: string;
    public courseSlug: string
    public courseDetails: any;

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     * @param {AcademyCoursesService} _academyCoursesService
     */
    constructor(
        private _httpClient: HttpClient,
        private _academyCoursesService: AcademyCoursesService,
        private helper: Helper
    )
    {
        // Set the defaults
        this.onCardChanged = new BehaviorSubject({});
        this._unsubscribeAll = new Subject();
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

        this.mediaId = route.params.mediaId;
        this.questionId = route.params.questionId;
        
        return new Promise((res, reject) => {

            Promise.all([
                this.getMediaContent(this.mediaId),
                this.getQuestionContent(this.questionId)
            ]).then((resp) => {
                this.courseDetails = resp[0].concat(resp[1]);
                res()
                }, reject)
        });
    }


    getMediaContent(id): Promise<any> {
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');

        return new Promise((res, reject) => {
            this._httpClient.get(environment.apiUrl + 'learningcenter/'
                    + sessionStorage.getItem('sub')
                    + '/learningplan?media='
                    + id, {headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'Authorization': authorization_value
                    })}
            ).subscribe((mval: any) => {
                this.onCardChanged.next(mval);
                res(mval);
            }, reject)
        })
    }

    getQuestionContent(id): Promise<any> {
        let authorization_value = 'Bearer ' + sessionStorage.getItem('access_token');

        return new Promise((res, reject) => {
            this._httpClient.get(environment.apiUrl + 'learningcenter/'
                    + sessionStorage.getItem('sub')
                    + '/learningplan?questions='
                    + id, {headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'Authorization': authorization_value
                    })}
            ).subscribe((qval: any) => {
                this.onCardChanged.next(qval);
                res(qval);
            }, reject)
        })
    }

    /**
     * Get course
     *
     * @param courseId
     * @param courseSlug
     * @returns {Promise<any>}
     */
    // getCourse(courseId, courseSlug): Promise<any> {
    //     return new Promise((resolve, reject) => {
    //         this._httpClient.get('api/academy-courses')
    //             .subscribe((response: any) => {
    //                 this.onCourseChanged.next(response);
    //                 resolve(response);
    //         });
    //     });
    // }

}
