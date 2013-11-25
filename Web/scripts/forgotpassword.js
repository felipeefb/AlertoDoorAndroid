function validateFields(){
	if(document.form.email.value==""){
		alert("O campo email é obrigatório.");
		return false;
	} else if(document.form.ddd.value==""){
		alert("O campo DDD é obrigatório.");
		return false;
	} else if(document.form.phone.value==""){
		alert("O campo telefone é obrigatório.");
		return false;
	}
	
	document.form.submit();
}
