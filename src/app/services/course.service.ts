import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, retry } from 'rxjs';
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
    fromCoordinates: string,
    toCoordinates: string,
    transportType: string = 'car'
  ): Observable<CourseResponse> {
    const args = [
      'deliveryManCoordinates=' + fromCoordinates,
      'dropOffCoordinates=' + toCoordinates,
      'transportType=' + transportType,
    ].join('&');
    return this.http
      .get<CourseResponse>(this.baseUrl + '/course/route?' + args)
      .pipe(retry(1));
  }

  public updatePosition(deliveryManId: number, position: string) {
    this.http
      .patch(
        this.baseUrl + '/geolocalisation',
        {
          deliveryManId: deliveryManId,
          position: position,
        },
        this.httpOptions
      )
      .pipe(retry(1))
      .subscribe();
  }
}
