import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { AcademyCoursesService } from 'app/main/apps/academy/courses.service';
import * as _ from 'lodash';
import { Helper } from '../../../../helper';
import { Globals } from 'app/main/globals';
import { UserService } from 'app/main/pages/user_b.service';

@Component({
    selector   : 'proveit-courses-info',
    templateUrl: './courses.component.html',
    styleUrls  : ['./courses.component.scss'],
    animations : fuseAnimations,
})
export class AcademyCoursesComponent implements OnInit, OnDestroy
{
    access_token: string;
    sub: string;

    categories: any[];
    courses: any[];
    activeCourse: any[];
    toDoCourses: any[];
    doneCourses: any[];
    coursesFilteredByCategory: any[];
    filteredCourses: any[];
    currentCategory: string;
    searchTerm: string;
    courseCards: any[];
    u: any;


    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {AcademyCoursesService} _academyCoursesService
    */
    constructor(
        public _academyCoursesService: AcademyCoursesService,
        public helper: Helper,
        public globals: Globals,
        public us: UserService,
    ) {
        // Set the defaults
        this.currentCategory = 'all';
        this.searchTerm = '';

        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */

    ngOnInit(): void {
        this._academyCoursesService.onCoursesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(courseData => {
                this.u = this.us.user;
                this.courses = courseData
                this.setCompletionPct(this.us.user, courseData);
                if (!_.isEmpty(this.u['grade'])) {
                    this.setGrades();
                }
                this.setActiveCards();
                if (!_.isEmpty(this.u['remedial_lesson'])) {
                    let remCard = this.u['remedial_lesson'][0].remedial_lesson_card;
                    this.courses = this.courses.concat(remCard);
                }
            
                // TODO: provide generic uuid for question or media if absent

                this.sortCards(this.courses);
                this.filteredCourses = this.coursesFilteredByCategory = this.courses;
                
                this.toDoCourses = _.filter(this.courses, ['complete', false]);
                this.activeCourse = _.filter(this.toDoCourses, ['active', true]);
                this.toDoCourses = _.filter(this.toDoCourses, ['active', false]);
                this.doneCourses = _.filter(this.courses, ['complete', true]);
        });
    }

    saveCourse(course) {
        sessionStorage.setItem('currentCard', JSON.stringify(course))
    }


    setGrades() {
        for (let g of this.u['grade']) {
            for (let c of this.courses) {
                if (g.title === c.title) {
                    c.grade = g.grade + '%'
                    if (g.grade === 100) {
                        c.complete = true;
                    }
                    break;
                }
            }
        }
    }

    setCompletionPct(user, courses) {
        const totalCourses = courses.length;
        let completionNumber = 0;

        for (let g of this.u['grade']) {
            if (g.grade === 100) {
                completionNumber++;
            }
        }
        let completionPct = (Math.round((completionNumber / totalCourses) * 100)).toString();
        if (completionPct !== user.completion_pct) {
            this.us.updatePercentage(completionPct)
        }
    }

    setActiveCards() {
        // TODO: set active card to false if it spawns a remedial card
        let actives = this.u['active_lessons'];
        let remCheck = this.u['remedial_lesson'];
        let doRemedial = false
        if (remCheck.length !== 0) {
            doRemedial = true;
        }
        for (let a of actives) {
            for (let c of this.courses) {
                if (a === c.order) {
                    if (doRemedial) {
                        c.active = false
                    } else {
                        c.active = true
                    }
                }
            }
        }
    }

    sortCards(courses) {
        courses.sort(function(a, b) {
            return a.order - b.order
        })
    }

    getAllCategories(cd) {
        let cats = [];
        for (const allVals of cd['categories']) {
            if (allVals) {
                cats.push(allVals)
            }
        }

        this.categories = cats;
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Filter courses by category
     */

    // TODO: Still needs work
    filterCoursesByCategory(): void {
        this.courses = this.courseCards;
        // Filter
        if ( this.currentCategory === 'all' ) {
            this.coursesFilteredByCategory = this.courses;
            this.filteredCourses = this.courses;
        } else {
            this.coursesFilteredByCategory = [];
            for (let c of this.courses) {
                if (c['category'] === this.currentCategory) {
                    this.coursesFilteredByCategory.push(c);
                }
            }

            this.filteredCourses = [...this.coursesFilteredByCategory];

        }

        // Re-filter by search term
        this.filterCoursesByTerm();
    }

    /**
     * Filter courses by term
     */
    filterCoursesByTerm(): void {
        // let testVal = this._academyCoursesService.getCoursesResponse();
        // let testVal = this.categories;
        // console.log(testVal);
        // Set the searchable cards (may be affected by category search)
        let searchableCourses = this.coursesFilteredByCategory;

        const searchTerm = this.searchTerm.toLowerCase();

        // Search
        if ( searchTerm === '' ) {
            this.courses = this.filteredCourses = this.coursesFilteredByCategory;
        } else {
            this.courses = searchableCourses;
            this.filteredCourses = [];
            for (let c of this.courses) {
                let titleString = c['title'];
                if (titleString.search(searchTerm) !== -1) {
                    this.filteredCourses.push(c);
                    this.courses = this.filteredCourses;
                } else if (titleString.search(searchTerm) === -1 && this.filteredCourses.length === 0) {
                    this.filteredCourses = [];
                    this.courses = [];
                }
            }
        }
    }
}
