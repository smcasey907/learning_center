import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatButton } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';
import { FusePerfectScrollbarDirective } from '@fuse/directives/fuse-perfect-scrollbar/fuse-perfect-scrollbar.directive';
import { FuseSidebarService } from '@fuse/components/sidebar/sidebar.service';
import { AcademyCourseService } from 'app/main/apps/academy/course.service';
import { Helper } from 'app/helper';
import { Globals } from 'app/main/globals';
import { UserService } from 'app/main/pages/user_b.service'
import * as _ from 'lodash';
import { checkNoChangesView } from '@angular/core/src/view/view';

@Component({
    selector     : 'academy-course',
    templateUrl  : './course.component.html',
    styleUrls    : ['./course.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})

export class AcademyCourseComponent implements OnInit, OnDestroy, AfterViewInit {
    animationDirection: 'left' | 'right' | 'none';
    course: any;
    courseStepContent: any;
    currentStep: number;
    selectedChoice: any;
    currentCorrectAnswer: any;
    currentCorrectAnswerGuide: any;
    numCorrect: number;
    numQuestions: number;
    wrongQuestions: any[];
    currentQuestionContent: any[];
    buttonDisabled: boolean;
    finalGrade: number;
    remedialCardData: any[];
    u: any;
    cardInfo: any;
    thisCard: any;
    checkboxData = [];

    mediaUrl: string;

    @ViewChildren(FusePerfectScrollbarDirective)
    fuseScrollbarDirectives: QueryList<FusePerfectScrollbarDirective>;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {AcademyCourseService} _academyCourseService
     * @param {ChangeDetectorRef} _changeDetectorRef
     * @param {FuseSidebarService} _fuseSidebarService
     */
    constructor(
        private _academyCourseService: AcademyCourseService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseSidebarService: FuseSidebarService,
        private helper: Helper,
        private globals: Globals,
        private r: ActivatedRoute,
        private router: Router,

        public dialog: MatDialog,
        public us: UserService
    ) {
        // Set the defaults
        this.animationDirection = 'none';
        this.currentStep = 0;

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

        this.u = this.us.user;

        if (sessionStorage.getItem('currentCard') !== null) {
            this.cardInfo = JSON.parse(sessionStorage.getItem('currentCard'))
        }

        // Check if this is a remedial lesson
        if (this.us.user['remedial_lesson'].length !== 0
                && this.us.user['remedial_lesson'][0]['remedial_lesson_data'].length !== 0) {
            this.createCourse(this.u['remedial_lesson'][0].remedial_lesson_data)
        } else {
            this.thisCard = JSON.parse(sessionStorage.getItem('currentCard'));
            this._academyCourseService.onCardChanged
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe(cardData => {
                        let courseDetails = this._academyCourseService.courseDetails;
                        this.createCourse(courseDetails);
            })
        }

        // At some point I need to store the media URL in a variable
        // to create remedial card.
        this.remedialCardData = [];
        this.numCorrect = 0;
        this.numQuestions = 0;
        this.wrongQuestions = [];
    }

    createCourse(cd) {
         // Set Media Content:
         let theLesson = [];
         let noOfSteps = 0;
         let questionNumber = 0;
         for (let q of cd) {
            if (q['question_type'] === 'video') {
                this.mediaUrl = q['question_url'];
                theLesson.push({
                'title': 'Introduction',
                'contentType': q['question_type'],
                'question': undefined,
                'correctAnswer': undefined,
                'answerGuide': undefined,
                'answers': undefined,
                'video': q['question_url'],
                'content': ''
                })
                noOfSteps++
            }
             // WATCH: if we add other types of question types in the
            // future, this will need to be updated.
            if (q['question_type'] !== 'video') {
                questionNumber++;
                theLesson.push({
                    'title': questionNumber,
                    'contentType': q['question_type'],
                    'question': q['question_text'],
                    'correctAnswer': q['question_answer'],
                    'answerGuide': q['question_guide'],
                    'answers': q['question_choices'],
                    'video': undefined,
                    'content': ''
                })
                noOfSteps++;
            }
        }
        let courseCard = {
            'id' : this.cardInfo.slug,
            'title': this.cardInfo.title,
            'totalSteps': noOfSteps,
            'steps': theLesson
        }

        this.course = courseCard;
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void {
        this.courseStepContent = this.fuseScrollbarDirectives.find((fuseScrollbarDirective) => {
            return fuseScrollbarDirective.elementRef.nativeElement.id === 'course-step-content';
        });
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
     * Go to step
     *
     * @param step
     */
    gotoStep(step): void {
        // Decide the animation direction
        this.animationDirection = this.currentStep < step ? 'left' : 'right';

        // Run change detection so the change
        // in the animation direction registered
        this._changeDetectorRef.detectChanges();

        // Set the current step
        this.currentStep = step;
    }

    onChoiceSelection(qData) {
        // qData has all Data for current question. This is what should be used
        // when creating remedial card.
        this.currentCorrectAnswer = qData.correctAnswer;
        this.currentCorrectAnswerGuide = qData.answerGuide
        this.currentQuestionContent = qData;
        this.buttonDisabled = false;
    }

    onCheckboxSelection(qData, selection, $event) {
        if ($event.checked === true) {
            this.checkboxData.push(selection)
        } else if ($event.checked === false) {
            this.checkboxData.splice(this.checkboxData.indexOf(selection), 1);
        }
        console.log(this.checkboxData)
        this.currentCorrectAnswer = qData.correctAnswer;
        this.currentCorrectAnswerGuide = qData.answerGuide
        this.currentQuestionContent = qData;
        this.buttonDisabled = false;
    }

    /**
     * Go to next step
     */
    gotoNextStep(): void {
        if ( this.currentStep === this.course.totalSteps - 1 ) {
            return;
        }

        // Grade answer
        if (this.currentCorrectAnswer !== undefined) {
            let isCorrect = false;
            let answerValue: any;
            if (this.selectedChoice !== undefined) {
                isCorrect = this.gradeAnswers(this.currentCorrectAnswer, this.selectedChoice, 'radio')
                answerValue = this.selectedChoice;
            } else if (this.checkboxData.length > 0) {
                isCorrect = this.gradeAnswers(this.currentCorrectAnswer, this.checkboxData, 'checkbox');
                answerValue = this.checkboxData
            }
            if (isCorrect) {
                this.numCorrect++;
                this.numQuestions++;
                this.selectedChoice = undefined;
                this.checkboxData = [];
                this.buttonDisabled = true;
                this.goNext();
            } else {
                // Store wrong questions for remedial card
                this.wrongQuestions.push(this.currentQuestionContent);

                this.numQuestions++;

                // Display correct answer dialog
                let config = new MatDialogConfig();
                let dialogRef: MatDialogRef<CorrectAnswerDialogComponent> = this.dialog.open(CorrectAnswerDialogComponent, config);
                dialogRef.componentInstance.answer = this.currentCorrectAnswerGuide;
                dialogRef.componentInstance.choice = answerValue;
                dialogRef.afterClosed().subscribe(result => {
                    this.selectedChoice = undefined;
                    this.checkboxData = [];
                    this.buttonDisabled = true;
                    this.goNext();
                })
            }
        } else {
            this.buttonDisabled = true;
            this.goNext();
        }
    }

    goNext() {
        // Set the animation direction
        this.animationDirection = 'left';

        // Run change detection so the change
        // in the animation direction registered
        this._changeDetectorRef.detectChanges();

        // Increase the current step
        this.currentStep++;
    }

    gradeAnswers(ans, choice, type) {
        if (type === 'radio') {
            if (ans.includes(choice) || ans.includes('Any of the choices')) {
                return true;
            } else {
                return false;
            }
        } else if (type === 'checkbox') {
            let isCorrect = false;
            if (ans.includes('Any of the choices')) {
                return true;
            } else if (ans.length === choice.length) {
                for (let c of choice) {
                    isCorrect = ans.includes(c)
                    if (isCorrect === false) {
                        return false
                    }
                }
            }
            return isCorrect;
        }
    }

    endLesson() {
        if (this.currentCorrectAnswer !== undefined) {
            let isCorrect: boolean;
            if (this.selectedChoice !== undefined) {
                isCorrect = this.gradeAnswers(this.currentCorrectAnswer, this.selectedChoice, 'radio')
            } else if (this.checkboxData.length > 0) {
                isCorrect = this.gradeAnswers(this.currentCorrectAnswer, this.checkboxData, 'checkbox');
            }
            let gradeTitle = this.course.title;
            if (gradeTitle.includes('REMEDIAL')) {
                while (gradeTitle.includes('REMEDIAL')) {
                    gradeTitle = gradeTitle.replace('REMEDIAL ' , '');
                }
            }
            if (isCorrect) {
                this.numCorrect++;
                this.numQuestions++;
                this.selectedChoice = undefined;
                this.finalGrade = ((this.numCorrect / this.numQuestions) * 100);
                if (this.finalGrade === 100) {
                    this.activateNextCard(gradeTitle);
                }
                let fract = this.numCorrect.toString() + '/' + this.numQuestions.toString();
                let totalGrade = this.us.setUserGrade(gradeTitle, this.finalGrade, fract);
                // this.setCurrentGrade(gradeTitle, totalGrade);
                this.setHistory(fract)
                this.createRemedialCard();

                if (this.finalGrade === 100 && this.course.id.includes('remedial')) {
                    this.removeRemedialCard();
                }

                this.us.postUser();

                // Clear current card from cache
                sessionStorage.removeItem('currentCard');

                // Show Grade
                if (this.finalGrade % 1 !== 0) {
                    this.finalGrade = Number(this.finalGrade.toFixed(2))
                }
                let config = new MatDialogConfig();
                let gradeRef: MatDialogRef<FinalGradeDialogComponent> = this.dialog.open(FinalGradeDialogComponent, config);
                gradeRef.componentInstance.grade = this.finalGrade;
                gradeRef.afterClosed().subscribe(result => {
                    this.router.navigate(['/apps/academy/courses'], {relativeTo: this.r});
                })
            } else {
                // Store wrong questions for remedial card
                this.wrongQuestions.push(this.currentQuestionContent);

                this.numQuestions++;
                this.finalGrade = (this.numCorrect / this.numQuestions) * 100;
                let fract = this.numCorrect.toString() + '/' + this.numQuestions.toString();
                let totalGrade = this.us.setUserGrade(gradeTitle, this.finalGrade, fract);
                // this.setCurrentGrade(gradeTitle, totalGrade)
                this.setHistory(fract)
                this.createRemedialCard();

                this.us.postUser();

                sessionStorage.removeItem('currentCard');

                // Display correct answer dialog
                if (this.finalGrade % 1 !== 0) {
                    this.finalGrade = Number(this.finalGrade.toFixed(2))
                }
                let config = new MatDialogConfig();
                let dialogRef: MatDialogRef<CorrectAnswerDialogComponent> = this.dialog.open(CorrectAnswerDialogComponent, config);
                dialogRef.componentInstance.answer = this.currentCorrectAnswer;
                dialogRef.componentInstance.choice = this.selectedChoice;
                dialogRef.afterClosed().subscribe(result => {
                    this.selectedChoice = undefined;
                    let config2 = new MatDialogConfig();
                    let gradeRef: MatDialogRef<FinalGradeDialogComponent> = this.dialog.open(FinalGradeDialogComponent, config2);
                    gradeRef.componentInstance.grade = this.finalGrade;
                    gradeRef.afterClosed().subscribe(res => {
                        this.router.navigate(['/apps/academy/courses'], {relativeTo: this.r});
                    })
                })
            }
        }
    }

    createRemedialCard() {
        if (this.finalGrade !== 100) {
            let uuid = 'remedial_' + this.course.id;
            let title = 'REMEDIAL ' + this.course.title;
            let slug = 'remedial-' + this.helper.convertToKebab(this.course.title);
            let category = 'remedial';
            let length = (this.wrongQuestions.length).toString() || '5';
            let description = 'Retake ' + this.course.title + ' lesson to fully grasp the topic.'
            let order = 0;
            let questionNumber = 1;

            let remCard = ({
                'title': title,
                'slug': slug,
                'category': category,
                'length:': length,
                'description': description,
                'active': true,
                'grade': ' ',
                'order': order,
                'complete': false,
                'media_lesson_uuid': '11111111-1111-1111-1111-111111111111',
                'questions_lesson_uuid': '00000000-0000-0000-0000-000000000000'
            });

            // Create the lesson to go with the card
            if (this.mediaUrl) {
                this.remedialCardData.push({
                    'title': 'Introduction',
                    'question_type': 'video',
                    'question_text': ' ',
                    'question_answer': ' ',
                    'question_guide': ' ',
                    'question_choices': ' ',
                    'question_url': this.mediaUrl,
                    'content': ' ',
                })

            }
            for (let q of this.wrongQuestions) {
                if (q.content.length < 1) {
                    q.content = ' ';
                }
                this.remedialCardData.push({
                    'title': questionNumber,
                    'question_type': q.contentType,
                    'question_text': q.question,
                    'question_answer': q.correctAnswer,
                    'question_guide': q.answerGuide,
                    'question_choices': q.answers,
                    'question_url': ' ',
                    'content': q.content,
                })
                questionNumber++;
            }
            this.us.addRemedialLesson(this.remedialCardData, remCard);
        }
    }

    removeRemedialCard() {
        this.us.removeRemedialLessons();
    }

    setHistory(f_grade) {
        // TODO: add time to date
        let date = new Date();
        this.us.updateHistory(date, this.course.title, this.course.id, f_grade);
    }

    activateNextCard(title) {
        let nextCourseNumber = 1 + this.u['active_lessons'].length
        this.us.addLesson(nextCourseNumber)
    }

    /**
     * Toggle the sidebar
     *
     * @param name
     */
    toggleSidebar(name): void {
        this._fuseSidebarService.getSidebar(name).toggleOpen();
    }
}

@Component({
    selector: 'correct-answer-dialog',
    template: `
        <h2><b><span style="color:#FF4500">You selected: <span [innerHTML]="choice"></span>.</span></b></h2>
        <h2><span [innerHTML]="answer | safe: 'html'"></span></h2>
        <button mat-button color="primary" (click)="dialogRef.close('yes')">Ok</button>
    `
})
export class CorrectAnswerDialogComponent {
    choice: any;
    answer: any;

    constructor(
        public dialogRef: MatDialogRef<CorrectAnswerDialogComponent>,
    ) {}
}

@Component({
    selector: 'final-grade-dialog',
    template: `
        <h2>Congratulations, you have completed this lesson</h2>
        <h2>Your final grade is: {{grade}}%</h2>
        <button mat-button color="primary" (click)="gradeRef.close('yes')">Ok!</button>
    `
})
export class FinalGradeDialogComponent {
    grade: any;

    constructor(
        public gradeRef: MatDialogRef<FinalGradeDialogComponent>,
    ) {}
}


