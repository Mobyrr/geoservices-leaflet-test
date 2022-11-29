import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Polyline from 'google-polyline';
import * as L from 'leaflet';
import { AntPath } from 'leaflet-ant-path';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
@Injectable()
export class MapComponent implements AfterViewInit {
  public start = new FormControl('');
  public end = new FormControl('');

  constructor(private http: HttpClient) {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  private map: L.Map | undefined;

  private initMap(): void {
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
      this.start.setValue(this.end.value);
      this.end.setValue(coords);
      if (this.start.value !== '' && this.end.value !== '') this.drawRoute();
    });
  }

  public drawRoute(): void {
    console.log(this.start.value);
    console.log(this.end.value);
    const baseurl =
      'https://wxs.ign.fr/calcul/geoportail/itineraire/rest/1.0.0/route?';
    const resource = 'resource=bdtopo-osrm';
    const start = 'start=' + this.start.value;
    const end = 'end=' + this.end.value;
    const geometryFormat = 'geometryFormat=' + 'polyline';
    const args = [resource, start, end, geometryFormat].join('&');
    console.log(args);
    this.http.get<any>(baseurl + args).subscribe((data) => {
      //console.log(data.geometry);
      let antPolyline = new AntPath(Polyline.decode(data.geometry));
      antPolyline.addTo(this.map);
    });
  }
}
