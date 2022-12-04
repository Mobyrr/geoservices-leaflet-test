import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  catchError,
  Observable,
  ObservableInput,
  retry,
  throwError,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { CourseResponse } from '../models/course-response';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  public getRoute(
    start: string,
    end: string,
    transportType: string = 'car'
  ): Observable<CourseResponse> {
    return this.http
      .post<CourseResponse>(
        this.baseUrl + '/course/route',
        {
          deliveryManCoordinates: start,
          dropOffCoordinates: end,
          transportType: transportType,
        },
        this.httpOptions
      )
      .pipe(retry(1), catchError(this.errorHandler));
  }

  public updatePosition(deliveryManId: number, position: string) {
    return this.http
      .patch(this.baseUrl + 'geolocalisation', {
        deliveryManId: deliveryManId,
        position: position,
      })
      .pipe(retry(1), catchError(this.errorHandler));
  }

  private errorHandler(error: any): ObservableInput<any> {
    console.log(error);
    return throwError(() => new Error(error));
  }
}
