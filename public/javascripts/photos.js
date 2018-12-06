let picturePerPage = 6;
let owner = $('#owner').val();

async function renderPhotos() {
    try {

        let albumId = $('#albumId').val();


        let itemsData = localStorage.filter
            ? await fetch(`/api/v1/photos?albumId=${albumId}&offset=${picturePerPage}&owner=${owner}&filter=${localStorage.filter}`)
            : await fetch(`/api/v1/photos?albumId=${albumId}&offset=${picturePerPage}&owner=${owner}`);


        itemsData = await itemsData.json();

        // itemsData.album = album;

        //перевірка чи альбом пустий
        if (itemsData.photos && itemsData.photos.length == 0) itemsData.empty = true;

        // якщо ми зробили запит на пошук
        if (itemsData.request) itemsData.search = true;
        else $('#search-result').html('');

        //якщо пошук успішний
        if (itemsData.request && itemsData.photos && itemsData.photos.length !== 0)
            $('#search-result').html(`Found pictures by request : ${itemsData.request}`);
        
        else if(itemsData.request && ( ! itemsData.photos || itemsData.photos.length == 0 ))
             $('#search-result').html(`Nothing  found by request : ${itemsData.request}`);


        let templateStr = await fetch("/templates/photos.mst");
        templateStr = await templateStr.text();

        const htmlStr = await Mustache.render(templateStr, itemsData);

        $('#photos').html(htmlStr);

    }

    catch (err) {
        console.error(err);
    }
}

$('#search').keyup(async function () {
    localStorage.filter = $("#search").val();
    localStorage.page = 1;
    await renderPhotos();
});



window.onload = async function () {
    localStorage.page = 1;
    localStorage.filter = "";
    await renderPhotos();
};


$(window).scroll(async function () {
    if ($(window).scrollTop() == $(document).height() - $(window).height()) {

        localStorage.page++;

        let albumId = $('#albumId').val();

        let itemsData = localStorage.filter
            ? await fetch(`/api/v1/photos/?page=${localStorage.page}&albumId=${albumId}&offset=${picturePerPage}&owner=${owner}&filter=${localStorage.filter}`)
            : await fetch(`/api/v1/photos/?page=${localStorage.page}&albumId=${albumId}&offset=${picturePerPage}&owner=${owner}`);

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