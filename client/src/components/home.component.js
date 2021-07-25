/* eslint-disable */
import React, { Component } from "react";
import AuthService from "../services/auth.service";

import UserService from "../services/user.service";

export default class Home extends Component {
constructor(props) {
    super(props);

    this.state = {
      currentUser: AuthService.getCurrentUser()
    };
  }

  render() {
	  const { currentUser } = this.state;
	if(!currentUser){
    return (
      <div className="container">
        <header className="jumbotron">
          <h3>Witaj, aby uzyskać dostęp do projektów należy się zalogować</h3>
        </header>
      </div>
	
    );
	}
	if(currentUser){
		if(currentUser.role = 1){
			return (
				<div className="container">
				<header className="jumbotron">
					<h3>Witaj, menedżer</h3>
				</header>
				</div>
			);
		}
		if(currentUser.role = 2){
			return (
				<div className="container">
				<header className="jumbotron">
					<h3>Witaj, analityk</h3>
				</header>
				</div>
			);
		}
		if(currentUser.role = 3){
			return (
				<div className="container">
				<header className="jumbotron">
					<h3>Witaj, programista</h3>
				</header>
				</div>
			);
		}
    }
  }
}