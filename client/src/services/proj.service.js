import axios from "axios";
import AuthService from "../services/auth.service";
const API_URL = "http://localhost:8080/api/";

class ProjService {
  getProjects(){
	  const user = AuthService.getCurrentUser();
	  return axios.get(API_URL + "projects/" + user.id)
	  .then(response => {
        if (response.data.accessToken) {
          localStorage.setItem("projects", JSON.stringify(response.data));
        }

        return response.data;
      });
  }
  
  addProject(name, baid){
	  const user = AuthService.getCurrentUser();
	  const userid = user.id;
	  return axios.post(API_URL + "project", {
		  userid,
		  name,
		  baid
		  })
  }
  
  addTask (projid, name){
	  return axios.post(API_URL + "task", {
		  projid,
		  name
	  })
  }
  
  addDev (taskid, devid){
	  return axios.post(API_URL + "developer", {
		  taskid,
		  devid
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