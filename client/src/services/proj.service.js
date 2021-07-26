import axios from "axios";
import AuthService from "../services/auth.service";
const API_URL = "http://localhost:8080/api/";

class ProjService {
  getProjects(){
	  const user = AuthService.getCurrentUser();
	  axios.get(API_URL + "tasks/" + user.id)
	  .then(response => {
          localStorage.setItem("projects", JSON.stringify(response.data));

        return response.data;
      });
	  var wynik = JSON.parse(localStorage.getItem("projects"));
	  return wynik;
  }
  
  getAllProjects(){
	  axios.get(API_URL + "tasks")
	  .then(response => {
          localStorage.setItem("projects", JSON.stringify(response.data));

        return response.data;
      });
	  var wynik = JSON.parse(localStorage.getItem("projects"));
	  return wynik;
  }
  
  addProject(name){
	  return axios.post(API_URL + "project", {
		  name: name
		  })
  }
  
  addTask (projid, name){
	  return axios.post(API_URL + "task", {
		  proj_id: projid,
		  name: name
	  })
  }
  
  addDev (taskid, devid){
	  return axios.post(API_URL + "developer", {
		  task_id: taskid,
		  user_id: devid
	  })
  }
  
  finishTask (taskid){
	  return axios.put(API_URL + "task/" + taskid)
  }
  
  finishProject (projid){
	  return axios.delete(API_URL + "project/" + projid)
  }
}

export default new ProjService();