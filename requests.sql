-- get users with respective role names --
select user.name, role.name from user_role inner join user  on user.id = user_role.user_id inner join role on user_role.role_id = role.id;