-- get users with respective role names --
select user.name, role.name from user_role inner join user  on user.id = user_role.user_id inner join role on user_role.role_id = role.id;

-- function for adding tasks and relationships from BA
delimiter //
create procedure insert_task 
    (in in_contents varchar(255), in in_date_from datetime, 
    in in_date_to datetime, in in_parent_id int, in in_project_id int) 
    begin 
        insert into task (contents, date_from, date_to) 
            values (in_contents, in_date_from, in_date_to); 
        SET @last_id = LAST_INSERT_ID(); 
        insert into task_relationship (child_task, parent_task) 
            values (@last_id, in_parent_id); 
        insert into project_task (project_id, task_id) 
            values (in_project_id, @last_id); 
    end;//
delimiter ;