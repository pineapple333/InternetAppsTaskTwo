CREATE TABLE `task` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `contents` varchar(255),
  `date_from` datetime,
  `date_to` datetime
);

CREATE TABLE `task_relationship` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `child_task` int,
  `parent_task` int
);

CREATE TABLE `log` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `task_id` int,
  `project_id` int,
  `action` varchar(255)
);

CREATE TABLE `_project` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255)
);

CREATE TABLE `project_task` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `project_id` int,
  `task_id` int
);

CREATE TABLE `role` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255)
);

CREATE TABLE `user` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255),
  `role` int
);

CREATE TABLE `task_user` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `task_id` int,
  `user_id` int
);

CREATE TABLE `user_login` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `user_id` int,
  `email` varchar(255),
  `pwd` varchar(255)
);

CREATE TABLE `status` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255)
);

CREATE TABLE `task_status` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `task_id` int,
  `status_id` int
);

ALTER TABLE `task_relationship` ADD FOREIGN KEY (`child_task`) REFERENCES `task` (`id`);

ALTER TABLE `task_relationship` ADD FOREIGN KEY (`parent_task`) REFERENCES `task` (`id`);

ALTER TABLE `log` ADD FOREIGN KEY (`task_id`) REFERENCES `task` (`id`);

ALTER TABLE `log` ADD FOREIGN KEY (`project_id`) REFERENCES `_project` (`id`);

ALTER TABLE `project_task` ADD FOREIGN KEY (`project_id`) REFERENCES `_project` (`id`);

ALTER TABLE `project_task` ADD FOREIGN KEY (`task_id`) REFERENCES `task` (`id`);

ALTER TABLE `user` ADD FOREIGN KEY (`role`) REFERENCES `role` (`id`);

ALTER TABLE `task_user` ADD FOREIGN KEY (`task_id`) REFERENCES `task` (`id`);

ALTER TABLE `task_user` ADD FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

ALTER TABLE `user_login` ADD FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

ALTER TABLE `task_status` ADD FOREIGN KEY (`status_id`) REFERENCES `status` (`id`);

ALTER TABLE `task_status` ADD FOREIGN KEY (`task_id`) REFERENCES `task` (`id`);
