import React, { Component } from "react";
import AuthService from "../services/auth.service";
import ProjService from "../services/proj.service";

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
	  if(user.roles[0] != "ROLE_EXECUTOR"){
		var projects = ProjService.getAllProjects().all_tasks;
	  }
	  if(user.roles[0] == "ROLE_EXECUTOR"){
		var projects = ProjService.getProjects().all_tasks;
	  }
	  const projects2 = 
	  [
		{"name":"projekt1",
		"tasks": [
			{"name":"zadanie1",
			"status":1,
			"dev_name":null},
			{"name":"zadanie2",
			"status":2,
			"dev_name":null},
			{"name":"zadanie3",
			"status":2,
			"dev_name":null}]},
		{"name":"projekt2",
		"tasks": [
			{"name":"zadaniea",
			"status":1,
			"dev_name":null},
			{"name":"zadanieb",
			"status":1,
			"dev_name":null}]},
		{"name":"projekt3",
		"tasks": [
			{"name":"zadanie1",
			"status":1,
			"dev_name":null},
			{"name":"zadanie2",
			"status":2,
			"dev_name":null},
			{"name":"zadanie3",
			"status":2,
			"dev_name":null}]
		}]
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
	  let nodes = projects.map(function(project) {
		  return (
			<Node node={project} children={project.tasks} />
			);
	  });
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
			Twoje projekty:<br/><br/>
			</header>
				{nodes}
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
						<input type="submit" value="Wyślij" />
					</form>
			<br/>
			<br/>
			</header>
			Twoje projekty:<br/><br/>
				{nodes}
			</div>
			);
		}
		if(user.roles == "ROLE_EXECUTOR"){
		  return (
			<div className="container">
			Twoje projekty:<br/><br/>
				{nodes}
			</div>
			);
		}
		}
		} else {
			return (
			<div>
			Nie bieżesz obecnie udziału w żadnym projekcie.
			</div>
			);
		}
  }
}

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.state = { formvar: '',
					idvar: ''};
  }
  myChangeHandler = (event) => {
    this.setState({formvar: event.target.value});
  }	
  mySubmitHandler2 = (event) => {
    event.preventDefault();
    ProjService.addDev(this.state.idvar,this.state.formvar);
  } 
  mySubmitHandler3 = (event) => {
    event.preventDefault();
    ProjService.addTask(this.state.idvar,this.state.formvar);
  }   

  render() {      
	const user = AuthService.getCurrentUser();
    let childnodes = null;
    // the Node component calls itself if there are children
    if(this.props.children) {      
      childnodes = this.props.children.map(function(childnode) {
       return (
         <Node node={childnode} children={childnode.tasks} />
       );
     });
    }

    // return our list element
    // display children if there are any
    return (
      <li key={this.props.node.name}>      
        <span>{this.props.node.name}	{this.props.node.status}
			{(user.roles == "ROLE_MANAGER" &&this.props.node.status == "Nieprzyznane") &&
					<form onSubmit={this.state.idvar=this.props.node.taskid,this.mySubmitHandler2}>
					<label>
						ID wykonwacy:<br/>
						<input type="text" onChange={this.myChangeHandler}/>
					</label>
						<input type="submit" value="Dodaj wykonwace" />
					</form>
			}
			{(user.roles == "ROLE_MANAGER" && this.props.node.tasks) &&
				<button onClick={() => {ProjService.finishProject(this.props.node.projectid)}}>
				Zakończ projekt
				</button>
			}
			{(user.roles == "ROLE_BA" && this.props.node.tasks) &&
				<form onSubmit={this.state.idvar=this.props.node.projectid,this.mySubmitHandler3}>
					<label>
						Nazwa zadania:<br/>
						<input type="text" onChange={this.myChangeHandler}/>
					</label>
						<input type="submit" value="Dodaj zadanie" />
					</form>
			}
			{(user.roles == "ROLE_EXECUTOR" && this.props.node.status == "W trakcie") &&
				<button onClick={() => {ProjService.finishTask(this.props.node.taskid)}}>
				Zakończ zadanie
				</button>	
			}				
		</span>
        { childnodes ?
          <ul>{childnodes}</ul>
        : null }
      </li>
    );
  }
}