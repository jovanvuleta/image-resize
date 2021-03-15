import { Component } from '@angular/core';
import {HttpClient, HttpEventType, HttpHeaders} from '@angular/common/http';
import { saveAs } from 'file-saver';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  selectedFile: File = null;
  url = '../assets/resize.png';
  fileSelectedFlag = false;
  fileUploadedFlag = false;

  constructor(private http: HttpClient) {}


  // tslint:disable-next-line:typedef
  onFileSelected(event) {
    if (event.target.files){
      console.log(event.target.files[0].size);
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      // tslint:disable-next-line:no-shadowed-variable
      reader.onload = (event: any) => {
        this.url = event.target.result;
      };
      this.selectedFile = (event.target.files[0] as File);
      this.fileSelectedFlag = true;
    }
  }

  // tslint:disable-next-line:typedef
  onUpload(width: string, height: string) {
    if (this.selectedFile === null) {
      console.log('Image not picked!');
      return;
    }
    if (width === '' || height === '') {
      console.log('Please pick both width and height!');
      return;
    }
    console.log('Width:' + width);
    console.log('Height: ' + height);
    const fd = new FormData();
    fd.append('image', this.selectedFile, this.selectedFile.name);
    fd.append('width', width);
    fd.append('height', height);

    this.http.post('http://localhost:3033/upload', fd, {
      reportProgress: true,
      observe: 'events'
    })
      .subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          console.log('Upload Progress: ' + Math.round(event.loaded / event.total * 100) + '%');
        } else if (event.type === HttpEventType.Response) {
          console.log(event);
        }
      });
    this.url = '../assets/resize.png';
    this.fileUploadedFlag = true;
  }

  // tslint:disable-next-line:typedef
  download() {
    let filename = 'ResizedImage';
    this.downloadImage(filename).subscribe(
      data => {
        console.log(data);
        console.log(data.type);
        // this.fileDownloadedFlag = true;
        const type = data.type.substring(6);
        filename = filename + '.' + type;
        console.log(filename);
        saveAs(data, filename);
      },
      err => {
        alert('Problem while downloading the file.');
        console.error(err);
      }
    );
  }

  public downloadImage(file): Observable<any> {
    // Create url
    const url = 'http://localhost:3033/download';
    const body = { filename: file };
    console.log('File: ' + file);

    return this.http.post(url, body, {
      responseType: 'blob',
      headers: new HttpHeaders().append('Content-Type', 'application/json')
    });
  }
}
