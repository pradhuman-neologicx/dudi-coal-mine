import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  constructor(private http: HttpClient) { }

  // admin panel

  getisLoggedIn(): boolean {
    return window.localStorage['dudi_isloggedIn'];
  }
  isLoggedIn(isloggedIn: boolean) {
    window.localStorage['dudi_isloggedIn'] =
      isloggedIn != undefined ? isloggedIn : false;
  }

  getLoginAs(): number {
    return window.localStorage['dudi_LoginAs'];
  }

  saveLoginAs(LoginAs: number) {
    window.localStorage['dudi_LoginAs'] = LoginAs;
  }

  saveRoles(roles: any) {
    localStorage.setItem('dudi_roles', JSON.stringify(roles));
  }

  getRoles() {
    return JSON.parse(localStorage.getItem('dudi_roles') || '[]');
  }

  getfirstLoggedIn(): boolean {
    return window.localStorage['dudi_isfirstlogin'];
  }
  firstLoggedIn(isfirstlogin: boolean) {
    window.localStorage['dudi_isfirstlogin'] =
      isfirstlogin != undefined ? isfirstlogin : false;
  }

  getSession(): string {
    return window.localStorage['dudi_Session'];
  }

  saveSession(Session: string) {
    window.localStorage['dudi_Session'] = Session;
  }
  getName(): string {
    return window.localStorage['dudi_name'];
  }

  saveName(name: string) {
    window.localStorage['dudi_name'] = name;
  }

  getSessionStartdate(): string {
    return window.localStorage['dudi_Sessionstartdate'];
  }

  saveSessionStartdate(Session: string) {
    window.localStorage['dudi_Sessionstartdate'] = Session;
  }

  getSessionEnddate(): string {
    return window.localStorage['dudi_SessionEnddate'];
  }

  saveSessionEnddate(Session: string) {
    window.localStorage['dudi_SessionEnddate'] = Session;
  }

  getpanelUserId(): Number {
    return window.localStorage['dudi_panel_user_id'];
  }

  savepanelUserId(userid: any) {
    window.localStorage['dudi_panel_user_id'] = userid;
  }
  getadminame(): String {
    return window.localStorage['dudi_adminname'];
  }

  saveadminame(adminname: string) {
    window.localStorage['dudi_adminname'] = adminname;
  }

  saveAdminToken(Token: String) {
    window.localStorage['dudi_Token'] = Token;
  }
  saveAdminRole(Role: String) {
    window.localStorage['dudi_Role'] = Role;
  }
  getadmiRole(): String {
    return window.localStorage['dudi_Role'];
  }
  getpanelPartyId(): Number {
    return window.localStorage['dudi_Party_id'];
  }

  savePartyId(Party_id: Number) {
    window.localStorage['dudi_Party_id'] = Party_id;
  }

  getType(): String {
    return window.localStorage['dudi_Type'];
  }

  saveType(Type: String) {
    window.localStorage['dudi_Type'] = Type;
  }

  getToken(): String {
    return window.localStorage['dudi_Token'];
  }

  saveToken(Token: String) {
    window.localStorage['dudi_Token'] = Token;
  }

  // Profile Image of
  getImageUrl(): String {
    return window.localStorage['dudi_ImageUrl'];
  }

  saveImageUrl(ImageUrl: String) {
    window.localStorage['dudi_ImageUrl'] = ImageUrl;
  }

  getUserId(): String {
    return window.localStorage['dudi_user_id'];
  }

  saveUserId(user_id: String) {
    window.localStorage['dudi_user_id'] = user_id;
  }

  ///call on logout
  clearStorage() {
    window.localStorage.removeItem('dudi_isloggedIn');
    window.localStorage.removeItem('dudi_panel_user_id');

    window.localStorage.removeItem('dudi_Token');
    window.localStorage.removeItem('dudi_Role');
    window.localStorage.removeItem('dudi_adminname');
    window.localStorage.removeItem('dudi_isfirstlogin');

    // window.localStorage.removeItem("isloggedStudent");
  }
}
