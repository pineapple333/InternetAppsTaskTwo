-- get users with respective role names --
select user.name, role.name from user_role inner join user  on user.id = user_role.user_id inner join role on user_role.role_id = role.id;

-- function for adding tasks and relationships from BA
delimiter //
create procedure insert_task 
    (in in_contents varchar(255), in in_project_id int) 
    begin 
        insert into task (contents) 
            values (in_contents); 
        SET @last_id = LAST_INSERT_ID(); 
        -- insert into task_relationship (child_task, parent_task) 
        --     values (@last_id, in_parent_id); 
        insert into project_task (project_id, task_id) 
            values (in_project_id, @last_id); 
    end;//
delimiter ;

-- function to insert a new user
delimiter //
create procedure insert_user 
    (in in_email varchar(255), in in_pwd varchar(255), in in_role int, in in_name varchar(255)) 
    begin
        IF ( SELECT NOT EXISTS (SELECT 1 FROM user_login WHERE email like in_email) ) THEN 
            insert into user (name) values (in_name); 
            SET @last_id = LAST_INSERT_ID(); 
            insert into user_login (user_id, email, pwd) 
                values (@last_id, in_email, in_pwd); 
            insert into user_role (user_id, role_id) 
                values (@last_id, in_role); 
        END IF; 
    end;//
delimiter ;