export const getUrlVars = () => {
	var vars = {};
	window.location.href.replace(
		/[?&]+([^=&]+)=([^&]*)/gi,
		function (m, key, value) {
			vars[key] = value;
		}
	);
	return vars;
};

export const getRPCErrorMessage = (err) => {
	let commString = "VM Exception while processing transaction: revert ";
	return err.toString().split(commString)[1].split('",')[0];
};

export const toIsoString = (date) => {
	var tzo = -date.getTimezoneOffset(),
		dif = tzo >= 0 ? "+" : "-",
		pad = function (num) {
			return (num < 10 ? "0" : "") + num;
		};

	return (
		date.getFullYear() +
		"-" +
		pad(date.getMonth() + 1) +
		"-" +
		pad(date.getDate()) +
		"T" +
		pad(date.getHours()) +
		":" +
		pad(date.getMinutes()) +
		":" +
		pad(date.getSeconds()) +
		dif +
		pad(Math.floor(Math.abs(tzo) / 60)) +
		":" +
		pad(Math.abs(tzo) % 60)
	);
};



export const num2alpha =  num => {
	
var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
var result = ""
    var charIndex = num % alphabet.length
    var quotient = num/alphabet.length
    if(charIndex-1 == -1){
        charIndex = alphabet.length
        quotient--;
    }
    result =  alphabet.charAt(charIndex-1) + result;
    if(quotient>=1){
        num2alpha(parseInt(quotient));
    }else{
       return result
	}
return result
}