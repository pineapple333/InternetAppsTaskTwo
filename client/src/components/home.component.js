import React, { Component } from "react";
import AuthService from "../services/auth.service";
import ProjService from "../services/proj.service";
import NestedList from "../components/NestedList";

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = { project_name: '' };
  }
  mySubmitHandler = (event) => {
    event.preventDefault();
    ProjService.addProject(this.state.project_name);
  }
  myChangeHandler = (event) => {
    this.setState({project_name: event.target.value});
  }

  render() {
	  const user = AuthService.getCurrentUser();
	  if(user){
	  if(user.roles[0] != "ROLE_EXECUTOR"){
		var projects = ProjService.getAllProjects().all_tasks;
	  }
	  if(user.roles[0] == "ROLE_EXECUTOR"){
		var projects = ProjService.getProjects().all_tasks;
	  }
		if(projects != undefined){
	  for(var i = 0; i < projects.length; i++) {
		  for(var j =0; j < projects[i].tasks.length; j++) {
			  if(projects[i].tasks[j].status == "created"){
				  projects[i].tasks[j].status = "Nieprzyznane"
			  }
			  if(projects[i].tasks[j].status == "assigned"){
				  projects[i].tasks[j].status = "W trakcie"
			  }
			  if(projects[i].tasks[j].status == "done"){
				  projects[i].tasks[j].status = "Wykonane"
			  }
		  }
	  }
		if(user.roles == 'ROLE_BA'){
			return (
			<div className="container">
			<header className="jumbotron">	
			Twoje projekty:<br/><br/>
			</header>
				<NestedList items={projects}/>
			</div>
			);
		}
		if(user.roles == "ROLE_MANAGER"){
		  return (
			<div className="container">
			<header className="jumbotron">	
				<br/>
				Dodaj nowy projekt:
				<br/>
				<form onSubmit={this.mySubmitHandler}>
					<label>
						Nazwa projektu:<br/>
						<input type="text" onChange={this.myChangeHandler}/>
					</label>
						<input type="submit" value="Dodaj projekt" />
					</form>
			<br/>
			<br/>
			</header>
			Twoje projekty:<br/><br/>
				<NestedList items={projects}/>
			</div>
			);
		}
		if(user.roles == "ROLE_EXECUTOR"){
		  return (
			<div className="container">
			Twoje projekty:<br/><br/>
				<NestedList items={projects}/>
			</div>
			);
		}
		} else {
					if(user.roles == "ROLE_MANAGER"){
		  return (
			<div className="container">
			<header className="jumbotron">	
				<br/>
				Dodaj nowy projekt:
				<br/>
				<form onSubmit={this.mySubmitHandler}>
					<label>
						Nazwa projektu:<br/>
						<input type="text" onChange={this.myChangeHandler}/>
					</label>
						<input type="submit" value="Dodaj projekt" />
					</form>
			</header>
			<br/>
			<br/>
			Nie bierzesz obecnie udziału w żadnym projekcie.
			</div>
			);
		}	else {
			return (
			<div>
			Nie bierzesz obecnie udziału w żadnym projekcie.
			</div>
			);
		}
		}
	  } else {
			return(
			<div>
			Witaj, aby zobaczyć dostępne projekty należy się zalogować!
			</div>
			);
	  }
  }
}
