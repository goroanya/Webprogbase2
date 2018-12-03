const usersPerPage = 2;

async function renderUsers() {
    try {

        let itemsData = await fetch(`/api/v1/users?page=${localStorage.page}&offset=${usersPerPage}`);
        itemsData = await itemsData.json();

        let templateStr = await fetch("/templates/users.mst");
        templateStr = await templateStr.text();

        if ($('#adminRole').val() == "true") itemsData.adminRole = true;

        const htmlStr = await Mustache.render(String(templateStr), itemsData);
        $('#users').html(htmlStr);

    }
    catch (err) {
        console.error(err);
    }
}


async function goToPage(page) {
    localStorage.page = parseInt(page);
    await renderUsers();
}
window.onload = async function () {
    localStorage.page = 1;
    await renderUsers();
};

