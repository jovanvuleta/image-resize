import { Component } from '@angular/core';
import {HttpClient, HttpEventType, HttpParams} from '@angular/common/http';
import * as fileSaver from 'file-saver';

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
        console.log(event);
      });
    this.url = '../assets/resize.png';
    this.fileUploadedFlag = true;
  }

  // tslint:disable-next-line:ban-types typedef
  downloadFile(x: String) {
    // @ts-ignore
    const param = new HttpParams().set('filename', x);
    const options = {
      params: param
    };
    return this.http.get('http://localhost:3033/download', {...options, responseType: 'blob'})
      .subscribe(res => {
        if (res) {
          // const url = window.URL.createObjectURL(this.returnBlob(res));
          // window.open(url);
          fileSaver.saveAs(this.returnBlob(res), this.selectedFile);
        }
      });
  }

  returnBlob(res): Blob {
    console.log('File Downloaded!');
    return new Blob([res], {type: 'image/jpeg'});
  }
}
