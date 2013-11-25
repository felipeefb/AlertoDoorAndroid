/*
	Federal University of Campina Grande
	Embedded Lab.
	Sony Project
	Alert Door

	This code was developed as part of the Project 'Alert Door'.
 */

var dao = require('./AlertDoorDAO.js');
var express = require('express');
var requester = require('request');
var gcm = require('node-gcm-service');
var server = express();
server.configure(function() {
	server.set('views', './../Web/views');
	server.set('view engine', 'ejs');
	server.set('view options', {layout: false});
	server.use(express.static('./../Web/files'));
	server.use(express.static('./../Web/scripts'));
	server.use(express.bodyParser());
	server.use(express.methodOverride());
	server.use(express.cookieParser());
	server.use(express.session({secret: 'alertdoor123456'}));
});

// ***************************** Utils
function sendNotification(registered_ids, door_number) {
	var message = new gcm.Message({
		collapse_key: "regular_update",
	    data: {message: "Porta " + door_number + " foi aberta!"},
	});

	var sender = new gcm.Sender();
	sender.setAPIKey('AIzaSyDbmcPYdF-J_xH6x8tnLkawQFqcMc4oCtk');
	sender.sendMessage(message.toJSON(), registered_ids, true, function(error, data) {
	    if (!error) return true;
	    return false;
	});
}

function isAndroidApplication(request) {
	return request.body.clientType == "android_application";
}

// ***************************** Pages Servers
server.get('/', function(request, response) {
	request.session.messageFromServer=null;
	dao.getSystemUsers(function(error, users) {
		if (users.length == 0) {
			response.render('signup', {message: "First Use. Sign Up!"});
		} else if (request.session.loggedUser == null) {
			response.render('login', {loggedUser: null, messageFromServer: null});
		} else {
			response.redirect('home');
		}
	});
});

server.get('/home', function(request, response) {
	if (request.session.loggedUser) {
		dao.getSystemsOfUser(request.session.loggedUser, function(error, systems) {
			if (!error) {
				request.session.systems = systems;
				response.render('home', request.session);
			} else response.send(500);
		});
	} else response.render('login', {loggedUser: null, messageFromServer: "Please, log in first."});
});

server.get('/changeuserspermitions', function(request, response) {
	dao.getSystemUsers(function (error, users) {
		if (!error) {
			request.session.users = users;
			response.render('changeuserspermitions', request.session);	
		} else response.send(500);
	});
});

server.get('/signup', function(request, response) {
	response.render('signup', {loggedUser: null, messageFromServer: null});
});

server.get('/forgotpassword', function(request, response) {
	response.render('forgotpassword', {loggedUser: null, messageFromServer: null});
});

server.get('/doGetDoorsStatus2', function(request, response) { // REMEMBER TO EXCLUDE THIS METHOD ON THE FINAL VERSION
	if (request.session.loggedUser != null) {
		var body = "101110210031104010" 
		var data = {
			system: body[0],
			alarm: body[1],
			doors: []
		}
		var i = 2;
		while (i < 18) {
			var door = {
				number: body[i++],
				active: body[i++],
				watch: body[i++],
				open: body[i++]
			}
			data.doors.push(door);
		}
		response.json(200, data);
	} else response.send(403);
});

// ***************************** Services
server.post('/doLogin', function (request, response) {
	if (!request.session.loggedUser) {
		var login = request.body.login;
		var password = request.body.password;

		if (login && password) {
			dao.getUserByLogin(login, function(error, userFromDB) {
				if (!error) {
					if (userFromDB != null) {
						if (userFromDB.ver == 0) {
							response.send(403);
						} else if (userFromDB.senha != password) {
							if (isAndroidApplication(request)) response.json(200, {login: "invalid password"});
							else {
								request.session.messageFromServer = "Senha inválida";
								response.render('login', request.session);
							}
						} else {
							request.session.loggedUser = userFromDB;
							request.session.messageFromServer = null;
							if (isAndroidApplication(request)) response.json(200, {login: "success"});
							else response.redirect('home');
						}
					} else response.json(200, {login: "invalid login"});
				} else response.send(500); // Internal Server Error
			});
		} else response.json(200, {login: "invalid parameters"});
	} else response.json(200, {login: "user already logged"});
});

server.get('/doLogout', function (request, response) {
	request.session.loggedUser = null;
	if (isAndroidApplication(request)) response.send(200);
	else response.render('login', {loggedUser: null, messageFromServer: null});
});

server.post('/doSignUp', function (request, response) {
	var user = {
		login: request.body.login,
		password: request.body.password,
		email: request.body.email,
		name: request.body.name
	}
	var serverName = request.body.server.trim();

	dao.getServerByName(serverName, function(server) {
		if (server) {
			dao.getUserByLogin(user.login, function(error, userFromDB) {
				if (!error) {
					if (userFromDB == null) {
						dao.addUser(user, server.nome, function(status) {
							if (isAndroidApplication(request)) 
								response.json(200, {signup: status});
							else {
								request.session.messageFromServer = "Usuário cadastrado com sucesso!";
								response.redirect('/');
							}
						});
					} else {
						if (isAndroidApplication(request)) 
							response.json(200, {signup: "already registered"});
						else {
							request.session.messageFromServer = "Usuário já cadastrado!";
							response.redirect('signup', request.session);
						}
					}
				} else response.send(500);
			});
		} else {
			if (isAndroidApplication(request)) 
				response.json(200, {signup: "invalid server"});
			else {
				request.session.messageFromServer = "Servidor inválido";
				response.render('signup', request.session);
			}
		}
	});
});

server.post('/doAddServer', function (request, response) {
	if (request.session.loggedUser != null) {
		var userLogin = request.body.login;
		var serverName = request.body.server.trim();

		dao.getServerByName(serverName, function(server) {
			if (server) {
				dao.addUserAccess(userLogin, serverName, function(status) {
					if (status == "registered") {
						if (isAndroidApplication(request)) 
							response.json(200, {addServer: "success"});
						else {
							request.session.messageFromServer = "Servidor adicionado com sucesso";
							response.redirect('/');
						}	
					} else response.send(500);
				});
			} else {
				if (isAndroidApplication(request)) 
					response.json(200, {addServer: "invalid server"});
				else {
					request.session.messageFromServer = "Servidor inválido";
					response.render('addserver', request.session);
				}
			}
		});
	} else response.send(403);
});

server.get('/doGetDoorsStatus', function(request, response) {
	var arduinoIP = request.body.arduinoIP;
	if (request.session.loggedUser != null) {
		dao.userHasAccessToServer(request.session.loggedUser.idusuario, arduinoIP, function(access) {
			if (access) {
				requester("http://" + arduinoIP + ":8082/1", function (error, responseOfRequester, body) {
					if (!error) {
						var i = 0;
						var data = {
							system: body[i++],
							alarm: body[i++],
							doors: []
						}
						while (i < 18) {
							var door = {
								number: body[i++],
								active: body[i++],
								watch: body[i++],
								open: body[i++]
							}
							data.doors.push(door);
						}
						data.getServerStatus = "ok";
						response.json(200, data);
					} else {
						response.send(500); // Internal Server Error
					}
				});
			} else response.json(200, {getServerStatus: "denied"});
		});
	} else response.send(403); // Forbidden
});

server.post('/doComunicateToArduino', function(request, response) {
	var command = request.body.command;
	var door = request.body.door;
	var arduinoIP = request.body.arduinoIP;
	var url = "http://" + arduinoIP + ":8082/" + command;
	
	if (door != null) url += ('/' + door);
	requester(url, function(error, responseFromRequester, body) {
		response.send(200); // OK
	});
});

server.post('/doRegisterDevice', function(request, response) {
	var userLogin = request.body.login;
	var deviceId = request.body.deviceId;

	dao.registerDevice(userLogin, deviceId, function(error) {
		if (error) response.send(500);
		else response.send(200);
	});
});

// From this poing, still to review.
server.post('/doChangeUserPermition', function(request, response) {
	if (request.body.loggedUser != null && request.body.loggedUser.admin == 1) {
		var newPermition = "NULL";
		if (request.params.permition == 'true') newPermition = '1';
		dao.changeUsersPermitions(request.params.login, newPermition, function(status) {
			response.send(200); // Ok
		});
	} else response.send(403); // Forbidden
});

server.post('/doRetrievePassword', function (request, response) { // How's this gonna be?
	if (response.statusCode == 200) {
		getSenhaDoUsuarioPeloEmailTelefone(request.body.email, (request.body.ddd+request.body.telefone), function(error, senha) {
			if (!error) {
				if (response.statusCode == 200 && senha != null) {
					var sms = { 
						body: "Senha de acesso: " + senha,
						to: "+55" + request.body.ddd + request.body.telefone,
						from: "+17857564963"
					}
					enviaSMS(sms, request, response);
				} else if (senha == null) {
					request.session.messageFromServer = "Não existe um usuário com este email ou telefone.";
					pageDispatcher("forgotPassword", null, request, response);
				}
				
			} else {
				request.session.messageFromServer = "Ocorreu um erro. Por favor, tente novamente.";
				pageDispatcher("forgotPassword", null, request, response);
			}			
		});
	}
});

server.get('/doAlertOpenDoor/:server/:doorNum', function (request, response) {
	getUsersGCMIDsFromServer(request.param.server, function(error, GCMIDs) {
		sendNotification(GCMIDs, request.param.doorNum);
	});
});

var server = server.listen(8081);
console.log('   - Express server running on port %s', server.address().port);