import React, { Component } from "react";
import AuthService from "../services/auth.service";
import ProjService from "../services/proj.service";

export default class Home extends Component {
  

  render() {
	  const user = AuthService.getCurrentUser();
	  const projects = ProjService.getProjects();
		if(!user){
			return(
			<div>
			Witaj, aby zobaczyć dostępne projekty należy się zalogować!
			</div>
			);
		}else{
		if(user.roles == 'ROLE_BA'){
			return (
			<div className="container">
			<header className="jumbotron">	
				<h3>Witaj, Analityk</h3>
			</header>
			</div>
			);
		}
		if(user.roles == "ROLE_MANAGER"){
		  return (
			<div className="container">
			<header className="jumbotron">	
				<h3>Witaj, Menadżer</h3>
			</header>
			</div>
			);
		}
		if(user.roles == "ROLE_EXECUTOR"){
		  return (
			<div className="container">
			<header className="jumbotron">	
				<h3>Witaj, Wykonawca</h3>
			</header>
			</div>
			);
		}
		}
  }
}
