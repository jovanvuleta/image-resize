import { Component } from '@angular/core';
import {HttpClient, HttpEventType} from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  selectedFile: File = null;
  url = '../assets/resize.png';

  constructor(private http: HttpClient) {}


  // tslint:disable-next-line:typedef
  onFileSelected(event) {
    if (event.target.files){
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = (event: any) => {
        this.url = event.target.result;
      };
      this.selectedFile = (event.target.files[0] as File);
    }
  }

  // tslint:disable-next-line:typedef
  onUpload() {
    if (this.selectedFile.name === null) {
      console.log('bad');
      return;
    }
    const fd = new FormData();
    fd.append('image', this.selectedFile, this.selectedFile.name);
    this.http.post('http://localhost:3000/upload', fd, {
      reportProgress: true,
      observe: 'events'
    })
      .subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          console.log('Upload Progress: ' + Math.round(event.loaded / event.total * 100) + '%');
        } else if (event.type === HttpEventType.Response) {
          console.log(event);
        }
        console.log(event);
      });
  }
}
