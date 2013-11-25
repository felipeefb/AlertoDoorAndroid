function validateFields() {
	if(document.form.name.value=="") {
		alert("O Campo nome eh obrigatorio!");
		return false;
	} else if(document.form.email.value=="") {
		alert("O Campo email eh obrigatorio!");
		return false;
	} else if(document.form.email2.value==""){
		alert("O Campo email Confirmar é obrigatorio!");
		return false;
	} else if(document.form.email.value != document.form.email2.value) {
		alert("Emails diferentes!");
		return false;
	} else if(document.form.login.value=="") {
		alert("O Campo Login eh obrigatorio!");
		return false;
	} else if(document.form.password.value=="") {
		alert("O Campo Senha é obrigatorio");
		return false;
	} else if(document.form.password2.value==""){
		alert("O Campo Senha Confirmar é obrigatorio");
		return false;
	} else if(document.form.password.value != document.form.password2.value) {
		alert("Senhas diferentes!");
		return false;
	} else if(document.form.server.value == "") {
		alert("O campo Servidor é obrigatório!");
		return false;
	}

	document.form.submit();
}
