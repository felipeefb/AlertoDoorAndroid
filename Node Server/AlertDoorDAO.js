var mysql = require('mysql');

function openConnection(callback) {
	var connection = mysql.createConnection({
		acesso: 'localhost:3306',
		user: 'root',
		password: '123456',
		database: 'alertdoor'
	});
	
	connection.connect(function (error) {
		callback(error, connection);
	});
}

function closeConnection(connection) {
	connection.end(function (error) {
		if(error){
			console.log("Couldn't disconnect from the database server");
			return false;
		}
	});
	
	return true;
}

module.exports = {
	addUser: function addUser(user, serverName, callback) {
		openConnection(function(error, connection) {
			var query = "INSERT INTO `usuario` (`login`,`senha`,`nome`,`email`) VALUES ('" + 
							user.login + "', '" + 
							user.password + "', '" + 
							user.name + "', '" + 
							user.email + "')";

			connection.query(query, function(error, result) {
				if (error) 
					callback("Couldn't add the user");
				else {
					addUserAccess(user.login, serverName, function(status) {
						callback(status);
					});
				}
			});
			closeConnection(connection);
		});
	},

	userHasAccessToServer: function userHasAccessToServer(userId, serverIP, callback) {
		getServerByName(serverName, function(server) {
			var query = "SELECT * FROM alertdoor.acesso WHERE `codusuario`="+ userid + " AND `codservidor`="+ server.idservidor;

			connection.query(query, function(error, result) {
				callback(result[0]);
			});
				
			closeConnection(connection);
		});
	},

	addUserAccess: function addUserAccess(userLogin, serverName, callback) {
		openConnection(function(error, connection) {
			var query = "INSERT INTO `acesso` (`codusuario`, `codservidor`) " + 
							"SELECT u.`idusuario`, s.`idservidor` " +
							"FROM `usuario` u, `servidor` s " +
							"WHERE u.`login`='"+userLogin+"' AND s.`nome`='"+serverName.trim()+"';";

			connection.query(query, function(error, result) {
				if (error) {
					console.log(error);
					callback("Couldn't add the user access");
				} else callback("registered");
			});

			closeConnection(connection);
		});
	},

	getUserByLogin: function getUserByLogin(login, callback) { 
		openConnection(function(error, connection) {
			if (!error) {
				var query = "SELECT * FROM alertdoor.usuario WHERE login = '"+ login + "'";

				connection.query(query, function(error, result) {
					callback(null, result[0]);
				});
				
				closeConnection(connection);
			}
		});
	},

	getServerByName: function getServerByName(serverName, callback) { 
		openConnection(function(error, connection) {
			if (!error) {
				var query = "SELECT * FROM alertdoor.servidor WHERE `nome`='"+ serverName + "'";

				connection.query(query, function(error, result) {
					callback(result[0]);
				});
				
				closeConnection(connection);
			}
		});
	},

	getSystemUsers: function getSystemUsers(callback){  	
		openConnection(function(error, connection) {
			var query = "SELECT * FROM `alertdoor`.`usuario`";
			connection.query(query, function(error, result) {
				callback(error, result);
			});
			
			closeConnection(connection);
		});
	},

	getSystemsOfUser: function getSystemsOfUser(user, callback){  	
		openConnection(function(error, connection) {
			var query = "SELECT `nome` FROM `servidor` s " +
							"WHERE s.`idservidor` " +
							"IN (SELECT a.`codservidor` " +
								"FROM `usuario` u, `acesso` a " +
								"WHERE u.`idusuario`=" + user.idusuario + " AND a.`codusuario`=u.`idusuario`)";
			connection.query(query, function(error, result) {
				callback(error, result);
			});
			
			closeConnection(connection);
		});
	},

	registerDevice: function registerDevice(userLogin, deviceId, callback) {
		if (openConnection()) {	
			var query = "UPDATE `alertdoor`.`usuarios` SET `gcmid`='" + deviceId +
					"' WHERE `usuarios`.login='" + userLogin + "';";
			connection.query(query, function(error, result) {
				callback(error);
			});
			 
			closeConnection();
		}
	},

	recoverPassword: function recoverPassword(email, phone, callback) {
		if (openConnection()) {	
			var query = "SELECT * FROM alertdoor.usuario us " +
					"WHERE us.email = '"+ email + "' AND us.telefone = '" + phone + "';";
			connection.query(query, function(error, result) {
				callback(error, result);
			});
			 
			closeConnection();
		}
	},

	changeUserPermition: function changeUserPermition(userLogin, newPermition, callback) {
		if (openConnection()) {	
			var query = "UPDATE `alertdoor`.`usuario` SET `admin`=" + newPermition +
					" WHERE `usuarios`.login='" + userLogin + "';";
			connection.query(query, function(error, result) {
				callback(error, "ok");
			});
			 
			closeConnection();
		}
	}
};