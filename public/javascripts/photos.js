let picturePerPage = 6;

async function renderPhotos() {
    try {

        let album = $('#album').val();


        let itemsData = localStorage.filter
            ? await fetch(`/api/v1/photos?album=${album}&filter=${localStorage.filter}&offset=${picturePerPage}`)
            : await fetch(`/api/v1/photos?album=${album}&offset=${picturePerPage}`);


        itemsData = await itemsData.json();

        itemsData.album = album;
        //перевірка чи альбом пустий
        if (itemsData.photos && itemsData.photos.length == 0) itemsData.empty = true;
        // якщо ми зробили запит на пошук
        if (itemsData.request) itemsData.search = true;
        //якщо пошук успішний
        if (itemsData.request && itemsData.photos && itemsData.photos.length !== 0) itemsData.found = true;


        let templateStr = await fetch("/templates/photos.mst");
        templateStr = await templateStr.text();

        const htmlStr = await Mustache.render(templateStr, itemsData);

        $('#photos').html(htmlStr);

    }

    catch (err) {
        console.error(err);
    }
}

async function searchByName() {

    localStorage.filter = $("#search").val();
    localStorage.page = 1;
    await renderPhotos();
}


window.onload = async function () {
    localStorage.page = 1;
    localStorage.filter = "";
    timeout();
    await renderPhotos();
};
function timeout() {
    setTimeout(showPage, 250);
}

function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("photos").style.display = "contents";
}

$(window).scroll(async function () {
    if ($(window).scrollTop() == $(document).height() - $(window).height()) {

        localStorage.page++;

        let album = $('#album').val();

        let itemsData = localStorage.filter
            ? await fetch(`/api/v1/photos/?page=${localStorage.page}&album=${album}&filter=${localStorage.filter}&offset=${picturePerPage}`)
            : await fetch(`/api/v1/photos/?page=${localStorage.page}&album=${album}&offset=${picturePerPage}`);

        itemsData = await itemsData.json();

        let templateStr = await fetch("/templates/photo.mst");
        templateStr = await templateStr.text();

        const htmlStr = await Mustache.render(templateStr, itemsData);

        if (itemsData.photos && itemsData.photos.length) {
            if (localStorage.filter) $("#galleryFiltered").append(htmlStr);
            else $("#gallery").append(htmlStr);
        }


    }
});