import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";
import { JwtService } from "./jwt.service";
import { BehaviorSubject, Observable } from "rxjs";
@Injectable({
  providedIn: "root",
})
export class AttendanceManagementService {
  private approvalStageMessage = new BehaviorSubject("");
  currentApprovalStageMessage = this.approvalStageMessage.asObservable();
  sessionId!: string;
  constructor(
    private http: HttpClient,
    private apiservice: ApiService,
    private jwtService: JwtService
  ) { }
 


  Getbatchassign(body:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.post("student-attendance/assigned-batches",body,headers);
  }

  // GetDailyAttendanceApi(body:any){
  //   const headers = { 'content-type': 'application/json' };
  //   console.log("student-attendance/get-students");
  //   return this.apiservice.post("student-attendance/get-students",body,headers);
  // }
  GetDailyAttendanceBatchApi(body:any,batchId:any,tableSize:any,page:any,searchText:any){
    const headers = { 'content-type': 'application/json' };
    var url='student-attendance/get-students?limit=' +tableSize+ "&page="+page;
    if(batchId!='all'){
      url=url+"&batchId="+batchId;
    }else{
      url=url;
    }

    if(searchText!=undefined){
      if(searchText.length>0){
        url=url+ "&search="+searchText;
      }
    }
    console.log(url);
    return this.apiservice.post(url,body,headers);
  }

  Getstudentattendancepagination(tableSize:any, page:any,body:any,searchText:any,batchId:any) {
    const headers = { 'content-type': 'application/json' };
    var url='student-attendance/get-students?limit=' +tableSize+ "&page="+page;
    if(searchText!=undefined){
      if(searchText.length>0){
        url=url+ "&search="+searchText;
      }
    }
    if(batchId!=undefined){
      if(batchId.length>0){
        if(batchId!='all'){
          url=url+"&batchId="+batchId;
        }else{
          url=url;
        }
      }
    }
    console.log(url);
    return this.apiservice.post(url,body,headers);
  }


  GetstudentattendanceSearch(tableSize:any, page:any,searchText:any ,body:any,batchId:any)  {
    const headers = { 'content-type': 'application/json' };
    var url='student-attendance/get-students?limit=' +tableSize+ "&page="+page;
    if(searchText!=undefined){
      if(searchText.length>0){
        url=url+ "&search="+searchText;
      }
    }
    if(batchId!=undefined){
      if(batchId.length>0){
        if(batchId!='all'){
          url=url+"&batchId="+batchId;
        }else{
          url=url;
        }
      }
    }

    console.log(url);
    return this.apiservice.post(url ,body,headers);
 
    // return this.apiservice.post('student-attendance/get-students/?limit=' +tableSize+ "&page=" +page+ "&search="+searchText ,body,headers);
 
  }

  
  MarkAttedanceApi(body: any) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.apiservice.post('student-attendance/mark-attendance', body, headers);
  }

  MarkAttendanceExcelApi(formData:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.postWithoutHeader("student-attendance/upload-attendance-file",formData);
  }


  GetDailyAttendanceroleemployeeApi(body:any,role_id:any){
    const headers = { 'content-type': 'application/json' };
    var url;
    if(role_id!='all'){
      url="student-attendance/get-employees?roleId="+role_id
    }else{
      url="student-attendance/get-employees"
    }
    console.log(url);
    return this.apiservice.postWithoutHeader(url,body);
  }



  GetMonthlyAttendacneRoleId(body:any,role_id:any){
    const headers = { 'content-type': 'application/json' };
    console.log("student-attendance/get-employees?roleId="+role_id);
    return this.apiservice.postWithoutHeader("student-attendance/get-students-monthly-attendance?roleId="+role_id,body);
  }


  // GetMonthlyAttendanceBatchApi(body:any,batchId:any){

  //   var url;
  //   if(batchId!='all'){
  //      url ="student-attendance/get-students-monthly-attendance?batchId="+batchId
  //   }else{
  //     url ="student-attendance/get-students-monthly-attendance"
  //   }
 
  //   console.log(url);
  //   // return this.apiservice.postWithoutHeader("student-attendance/get-employees-monthly-attendance="+role_id,body);
  
  //   const headers = { 'content-type': 'application/json' };

  //   return this.apiservice.post(url,body,headers);
  // }

  GetMonthlyAttendanceBatchApi(body:any,batchId:any,tableSize:any,page:any,searchText:any){
    const headers = { 'content-type': 'application/json' };
    var url='student-attendance/get-students-monthly-attendance?limit=' +tableSize+ "&page="+page;
    if(batchId!='all'){
      url=url+"&batchId="+batchId;
    }else{
      url=url;
    }

    if(searchText!=undefined){
      if(searchText.length>0){
        url=url+ "&search="+searchText;
      }
    }
    console.log(url);
    return this.apiservice.post(url,body,headers);
  }



  
  Getstudentattendancemonthlypagination(tableSize:any, page:any,body:any,searchText:any,batchId:any) {
    const headers = { 'content-type': 'application/json' };
    var url='student-attendance/get-students-monthly-attendance?limit=' +tableSize+ "&page="+page;
    if(searchText!=undefined){
      if(searchText.length>0){
        url=url+ "&search="+searchText;
      }
    }
    if(batchId!=undefined){
      if(batchId.length>0){
        if(batchId!='all'){
          url=url+"&batchId="+batchId;
        }else{
          url=url;
        }
      }
    }
    return this.apiservice.post(url,body,headers);
  }


  GetstudentattendancemonthlySearch(tableSize:any, page:any,searchText:any ,body:any,batchId:any)  {
    const headers = { 'content-type': 'application/json' };
    var url='student-attendance/get-students-monthly-attendance?limit=' +tableSize+ "&page="+page;
    if(searchText!=undefined){
      if(searchText.length>0){
        url=url+ "&search="+searchText;
      }
    }
    if(batchId!=undefined){
      if(batchId.length>0){
        if(batchId!='all'){
          url=url+"&batchId="+batchId;
        }else{
          url=url;
        }
      }
    }


    return this.apiservice.post(url ,body,headers);
 
    // return this.apiservice.post('student-attendance/get-students/?limit=' +tableSize+ "&page=" +page+ "&search="+searchText ,body,headers);
 
  }





  MarkAttedanceEmployeeApi(body: any) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.apiservice.post('student-attendance/mark-employeeAttendance', body, headers);
  }


  GetDailyAttendanceEmployeeApi(body:any){
    const headers = { 'content-type': 'application/json' };
    console.log("student-attendance/get-employees");
    return this.apiservice.post("student-attendance/get-employees",body,headers);
  }
  GetRoles(){
    const token = this.jwtService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.apiservice.get("auth/getUserManagementRoles", headers);
  }
  
  MarkAttendanceemployeeExcelApi(formData:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.postWithoutHeader("student-attendance/mark-employeeAttendance-file",formData);
  }



  
  GetemployeemonthlyAttendanceApi(body:any){
    const headers = { 'content-type': 'application/json' };
    // console.log("student-attendance/get-students");
    return this.apiservice.post("student-attendance/get-employees-monthly-attendance",body,headers);
  }
  GetemployeeAttendancemonthlywiseApi(body:any){
    const headers = { 'content-type': 'application/json' };
    // console.log("student-attendance/get-students");
    return this.apiservice.post("student-attendance/get-employee-attendance-mont-wise",body,headers);
  }




  // student monthly attendance

  GetstudentmonthlyAttendanceApi(body:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.post("student-attendance/get-students-monthly-attendance",body,headers);
  }


  GetStudentAttendancemonthlywiseApi(body:any){
    const headers = { 'content-type': 'application/json' };
    return this.apiservice.post("student-attendance/get-students-attendance-mont-wise",body,headers);
  }



  GetMonthlyAttendanceroleemployeeApi(body:any,role_id:any){
    // const headers = { 'content-type': 'application/json' };
    var url;
    if(role_id!='all'){
       url ="student-attendance/get-employees-monthly-attendance?roleId="+role_id
    }else{
      url ="student-attendance/get-employees-monthly-attendance"
    }
 
    console.log(url);
    // return this.apiservice.postWithoutHeader("student-attendance/get-employees-monthly-attendance="+role_id,body);
    return this.apiservice.postWithoutHeader(url,body);
  }
}
