import { AfterViewInit, Component, Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Polyline from 'google-polyline';
import * as L from 'leaflet';
import { AntPath } from 'leaflet-ant-path';
import { CourseResponse } from '../models/course-response';
import { CourseService } from '../services/course.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
@Injectable()
export class MapComponent implements AfterViewInit {
  public start: string | undefined;
  public end: string | undefined;
  private startMarker: L.CircleMarker<any> | undefined;
  private endMarker: L.CircleMarker<any> | undefined;
  public duration = new FormControl('');
  public distance = new FormControl('');
  public steps = new FormControl('');
  private routeElements: any[] = [];
  private stepLine: any;
  private userLocalisation: L.CircleMarker | undefined;
  private routeData: CourseResponse | undefined;
  private buttons!: HTMLElement;
  private map!: L.Map;

  constructor(private courceService: CourseService) {}

  ngAfterViewInit() {
    this.initMap();
    let buttons = document.getElementById('steps');
    if (buttons === null) throw new Error();
    this.buttons = buttons;
  }

  private initMap() {
    this.map = L.map('map', {
      center: [49.43, 1.095],
      zoom: 12,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );
    tiles.addTo(this.map);

    this.map.on('click', (evt) => {
      let coords = evt.latlng.lng + ',' + evt.latlng.lat;
      this.start = this.end;
      this.end = coords;
      this.startMarker = this.endMarker;
      this.endMarker = L.circleMarker([evt.latlng.lat, evt.latlng.lng], {
        radius: 5,
        color: '#000',
        weight: 1,
        opacity: 0.5,
        fillColor: '#05F',
        fillOpacity: 1,
      });
      this.endMarker.addTo(this.map);
      this.routeElements.push(this.endMarker);
      if (this.start !== undefined && this.end !== undefined) this.drawRoute();
    });

    this.map.locate({ watch: true, enableHighAccuracy: true });

    this.map.on('locationfound', (evt) => this.updatePositition(evt));
  }

  public drawRoute(): void {
    if (this.start === undefined || this.end === undefined) throw new Error();
    if (this.startMarker === undefined || this.endMarker === undefined)
      throw new Error();

    this.courceService
      .getRoute(this.start, this.end, 'car')
      .subscribe((data) => {
        if (this.stepLine !== undefined) this.map.removeLayer(this.stepLine);

        this.routeData = data;
        let pathGeometry = Polyline.decode(data.geometry);

        pathGeometry.unshift([
          this.startMarker!.getLatLng().lat,
          this.startMarker!.getLatLng().lng,
        ]);
        pathGeometry.push([
          this.endMarker!.getLatLng().lat,
          this.endMarker!.getLatLng().lng,
        ]);

        let pathLine = new AntPath(pathGeometry, { delay: 600 });
        pathLine.addTo(this.map);
        this.routeElements.push(pathLine);
        this.duration.setValue(Number(data.duration).toFixed(2) + ' minutes');
        this.distance.setValue(Number(data.distance).toFixed(2) + ' mètres');
        data.portions.forEach((portion, portionIndex) => {
          portion.steps.forEach((step, stepIndex) => {
            let buttonText =
              step.instruction.type +
              (step.instruction.modifier === undefined
                ? ''
                : ' ' + step.instruction.modifier);
            let name = step.attributes.name;
            if (name.nom_1_gauche === name.nom_1_droite) {
              if (name.nom_1_gauche !== '')
                buttonText += ' (' + name.nom_1_gauche + ')';
            } else {
              buttonText +=
                ' (' +
                name.nom_1_gauche +
                (name.nom_1_gauche !== '' && name.nom_1_droite !== ''
                  ? ' / '
                  : '') +
                name.nom_1_droite;
            }
            let button = document.createElement('button');
            button.appendChild(document.createTextNode(buttonText));
            button.addEventListener('click', () =>
              this.showStep(stepIndex, portionIndex)
            );
            this.buttons!.appendChild(button);
          });
        });
      });
  }

  public updatePositition(e: L.LocationEvent) {
    this.courceService.updatePosition(123, e.latlng.lng + ',' + e.latlng.lat);
    if (this.userLocalisation !== undefined) {
      this.map.removeLayer(this.userLocalisation);
    } else {
      // première fois qu'on trouve la position
      this.map.setView(e.latlng, 13, { animate: true });
      if (this.start === undefined && this.end === undefined)
        this.end = e.latlng.lng + ',' + e.latlng.lat;
    }
    this.userLocalisation = L.circleMarker([e.latlng.lat, e.latlng.lng], {
      radius: 5,
      color: '#000',
      weight: 1,
      opacity: 0.5,
      fillColor: '#F00',
      fillOpacity: 1,
    });
    this.userLocalisation.addTo(this.map);
  }

  public async showStep(stepIndex: number, portionIndex: number) {
    if (this.routeData === undefined) return;
    let step = this.routeData.portions[portionIndex].steps[stepIndex];

    if (this.stepLine !== undefined) this.map.removeLayer(this.stepLine);
    this.stepLine = new AntPath(Polyline.decode(step.geometry), {
      color: 'red',
      delay: 800,
      opacity: 0.8,
      pulseColor: '#FCC',
    });

    this.stepLine.addTo(this.map);
    this.map.fitBounds(this.stepLine.getBounds());
  }

  public reset() {
    for (let pathline of this.routeElements) {
      this.map.removeLayer(pathline);
    }
    if (this.stepLine !== undefined) this.map.removeLayer(this.stepLine);
    this.buttons.replaceChildren();
    this.start = undefined;
    this.end = undefined;
  }
}
