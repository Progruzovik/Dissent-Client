CREATE TABLE texture(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL);

CREATE TABLE hull(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  actionPoints INT NOT NULL,
  strength INT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  textureId INT NOT NULL REFERENCES texture(id));

CREATE TABLE gunType(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL);

CREATE TABLE gun(
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  shotCost INT NOT NULL,
  damage INT NOT NULL,
  radius INT NOT NULL,
  gunTypeId INT NOT NULL REFERENCES gunType(id),
  textureId INT NOT NULL REFERENCES texture(id));

INSERT INTO texture(id, name) VALUES
  (1, 'hull-2-2'),
  (2, 'hull-3-1'),
  (3, 'hull-4-2'),
  (4, 'hull-7-1'),
  (5, 'gun-1'),
  (6, 'gun-2'),
  (7, 'gun-3'),
  (8, 'asteroid'),
  (9, 'cloud');

INSERT INTO hull(id, name, actionPoints, strength, width, height, textureId) VALUES
  (1, 'Trainhauler', 4, 4, 1, 1, 1),
  (2, 'Pointer', 4, 6, 1, 1, 2),
  (3, 'Catfish', 3, 9, 1, 1, 3),
  (4, 'Chrome', 5, 9, 2, 1, 4);

INSERT INTO gunType(id, name) VALUES
  (1, 'artillery'),
  (2, 'beam'),
  (3, 'shell');

INSERT INTO gun(id, name, shotCost, damage, radius, gunTypeId, textureId) VALUES
  (1, 'shrapnel', 1, 2, 6, 3, 5),
  (2, 'artillery', 2, 3, 12, 1, 6),
  (3, 'laser', 2, 3, 10, 2, 7);
