import React from "react";
import PropTypes from "prop-types";
import ListSubheader from "@material-ui/core/ListSubheader";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import AuthService from "../services/auth.service";
import ProjService from "../services/proj.service";

import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";

import Divider from "@material-ui/core/Divider";
import { withStyles } from "@material-ui/core/styles";
const user = AuthService.getCurrentUser();
const styles = theme => ({
    root: {
        width: "100%",
        maxWidth: 600,
        background: theme.palette.background.paper
    },
    nested: {
        paddingLeft: theme.spacing.unit * 4
    }
});
class NestedList extends React.Component {
	constructor(props){
		super(props);
	}
    state = {
		formvar: '',
	};
    handleClick = e => {
        this.setState({ [e]: !this.state[e] });
    };
	myChangeHandler = (event) => {
    this.setState({formvar: event.target.value});
  }	
    render() {
        const {items } = this.props;
        const { classes } = this.props;
		console.log(items);
        return (
            <div>
                {items.map(list => {
                    return (
                        <List
                            className={classes.root}
                            key={list.id}
                            subheader={
								<div>
								{(user.roles == "ROLE_EXECUTOR") &&
                                <ListSubheader>{list.name}</ListSubheader>
								}
								{(user.roles == "ROLE_BA") &&
                                <ListSubheader>{list.name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<form onSubmit={() => {ProjService.addTask(list.projectid,this.state.formvar)}}>
					<label>
						Nazwa zadania:<br/>
						<input type="text" onChange={this.myChangeHandler}/>
					</label>
						<input type="submit" value="Dodaj zadanie" />
					</form></ListSubheader>
								}
								{user.roles == "ROLE_MANAGER" &&
                                <ListSubheader>{list.name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button onClick={() => {ProjService.finishProject(list.projectid)}}>Zakończ projekt</button></ListSubheader>
								}
								</div>
                            }
                        >
                            {list.tasks.map(item => {
                                return (
                                    <div key={item.id}>
                                            <ListItem
                                                button
                                                onClick={this.handleClick.bind(
                                                    this,
                                                    item.name
                                                )}
                                                key={item.id}
                                            >
                                                <ListItemText
                                                    primary={item.name}
                                                />
                                                {item.dev_name != null &&
                                                <div>
                                                Wykonawca: {item.dev_name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                                </div>
                                                }
                                                {item.dev_name == null &&
                                                <div>
                                                Wykonawca: Brak
                                                </div>
                                                }
                                                Status: {item.status}
                                                {(user.roles == "ROLE_EXECUTOR" && item.status == "W trakcie") &&
                                                <button onClick={() => {ProjService.finishTask(item.taskid)}}>
                                                Zakończ zadanie
                                                </button>
                                                }
												{(user.roles == "ROLE_MANAGER" && item.status == "Nieprzyznane") &&
												<form onSubmit={() => {ProjService.addDev(item.taskid,this.state.formvar)}}>
													<label>
													ID wykonwacy:<br/>
													<input type="text" onChange={this.myChangeHandler}/>
													</label>
													<input type="submit" value="Dodaj wykonwace" />
												</form>
                                                }
                                            </ListItem>
                                    </div>
                                );
                            })}
                            <Divider key={list.id} absolute />
                        </List>
                    );
                })}
            </div>
        );
    }
}
NestedList.propTypes = {
    classes: PropTypes.object.isRequired
};
export default withStyles(styles)(NestedList);
