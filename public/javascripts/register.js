let loginRegExpr = /[A-Za-z0-9_.]{4,15}/;
let passwordRegExpr = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/;


$('#inputLogin').on('input', async () => {

    let login = $('#inputLogin').val();

    let test = loginRegExpr.test(login);

    if (login.length === 0) $('#errorLogin').html("Empty field!");

    else if (login.length < 4 || login.length > 15) $('#errorLogin').html("Login should contain at least 4 characters but no more than 15 characters");

    else if (!test) {
        $('#errorLogin').html("Invalid login");
    }
    else {
        let data = await fetch(`/api/v1/isunique/${login}`);
        data = await data.json();

        if (!data.unique) $('#errorLogin').html("sorry, this login is already taken");
        else $('#errorLogin').html("");
    }
});

$('#inputPassword').on('input', () => {

    let confirmPassword = $('#inputConfirmPassword').val();
    let password = $('#inputPassword').val();

    let test = passwordRegExpr.test(password);

    if (password.length === 0) $('#errorPassword').html("Empty field!");
     else if (password.length < 3 || password.length > 15) $('#errorPassword').html("Password should contain at least 8 characters");
    else if (!test) {
        $('#errorPassword').html("Invalid password");
    } else {
        $('#errorPassword').html("");
        if (confirmPassword.length !== 0 && password !== confirmPassword) {
            $('#errorConfirmPassword').html("Password doesn't match!");
        }
        else {
            $('#errorPassword').html("");
        }
    }
});
$('#inputConfirmPassword').on('input', () => {

    let confirmPassword = $('#inputConfirmPassword').val();
    let password = $('#inputPassword').val();


    if (confirmPassword.length === 0) $('#errorConfirmPassword').html("Empty field!");
    else {
        $('#errorConfirmPassword').html("");
        if (password.length !== 0 && password !== confirmPassword) {
            $('#errorConfirmPassword').html("Password doesn't match!");
        }
        else {
            $('#errorConfirmPassword').html("");
        }
    }
});

$('#signup').submit(function (e) {
    let errorLogin = $('#errorLogin').html();
    let errorPassword = $('#errorPassword').html();
    let errorConfirmPassword = $('#errorConfirmPassword').html();


    if (errorLogin === "" && errorPassword === "" && errorConfirmPassword === "") $('#signup').submit();
    else {

        e.preventDefault();
    }
});  
